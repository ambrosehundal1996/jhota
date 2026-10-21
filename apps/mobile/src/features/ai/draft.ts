import { wasAiEstimateEdited, type AiConfidence, type AiEstimate, type LocalDate } from '@jota/domain';
import { analytics } from '../../analytics';
import { ApiError } from '../../services/api/client';
import { analyzeMealPhoto, uploadMealPhoto } from '../../services/ai/photoAnalysis';
import { ensureSession } from '../../services/supabase/auth';
import { getState, LOCAL_USER_ID, setState } from '../../state/appStore';
import { enqueueUpdate } from '../../state/outbox';
import type { AiDraft, AiDraftItem, FoodLog } from '../../types/models';
import { nowIso, uuid } from '../../utils/id';
import { addFoodLogs } from '../logging/actions';

export const NOT_FOOD = 'not_food';

const round1 = (v: number) => Math.round(v * 10) / 10;

function patchDraft(patch: Partial<AiDraft>): void {
  setState(s => (s.aiDraft ? { aiDraft: { ...s.aiDraft, ...patch } } : {}));
}

export function startDraft(photoUri: string, date: LocalDate): void {
  setState({
    aiDraft: {
      id: uuid(),
      date,
      photoUri,
      storagePath: null,
      context: '',
      status: 'picked',
      error: null,
      analysisId: null,
      rawItems: null,
      rawTotal: null,
      items: [],
      overallConfidence: null,
      reviewNotes: [],
      clarificationQuestion: null,
      analyzedContext: null,
      createdAt: nowIso(),
    },
  });
}

export const setDraftContext = (context: string) => patchDraft({ context });

function toDraftItems(estimate: AiEstimate): AiDraftItem[] {
  return estimate.items.map(item => ({
    key: uuid(),
    name: item.name,
    portion: item.portion_description,
    protein_g: round1(item.protein_g),
    original_protein_g: round1(item.protein_g),
    original_name: item.name,
    confidence: item.confidence,
    uncertainty_reasons: item.uncertainty_reasons,
  }));
}

function confidenceProps(estimate: AiEstimate) {
  return {
    overall_confidence: estimate.overall_confidence,
    item_count: estimate.items.length,
    low_confidence_items: estimate.items.filter(i => i.confidence === 'low').length,
    needs_clarification: estimate.needs_clarification,
  };
}

/** True when the user has typed something new since the last analysis. */
export function hasNewContext(draft: Pick<AiDraft, 'context' | 'analyzedContext'>): boolean {
  return draft.context.trim() !== (draft.analyzedContext ?? '').trim();
}

/** Uploads (once) and analyzes the draft photo. Safe to call again to retry. */
export async function runAnalysis(): Promise<void> {
  const draft = getState().aiDraft;
  if (!draft?.photoUri) return;
  const clarifying = draft.status === 'clarify';
  // A clarification retry needs new information; re-asking the model the same thing won't help.
  if (clarifying && !hasNewContext(draft)) return;
  const previousAnalysisId = draft.analysisId;
  const context = draft.context.trim();
  const started = Date.now();
  analytics.track('ai_photo_started', { retry: draft.status === 'failed' || clarifying, has_context: !!context });
  try {
    let storagePath = draft.storagePath;
    if (!storagePath) {
      patchDraft({ status: 'uploading', error: null });
      let userId = getState().userId;
      if (userId === LOCAL_USER_ID) userId = (await ensureSession()) ?? LOCAL_USER_ID;
      if (userId === LOCAL_USER_ID) throw new ApiError(0, 'offline', 'Photo estimates need a connection.');
      storagePath = await uploadMealPhoto(draft.photoUri, userId);
      patchDraft({ storagePath });
    }
    patchDraft({ status: 'analyzing', error: null });
    const { analysisId, estimate } = await analyzeMealPhoto(storagePath, context);
    if (previousAnalysisId && previousAnalysisId !== analysisId) {
      enqueueUpdate('ai_photo_analyses', previousAnalysisId, { status: 'discarded' });
    }
    const result = {
      analysisId,
      analyzedContext: context,
      rawItems: estimate.items.map(i => ({ name: i.name, protein_g: i.protein_g })),
      rawTotal: estimate.total_protein_g,
      items: toDraftItems(estimate),
      overallConfidence: estimate.overall_confidence,
      reviewNotes: estimate.review_notes,
      clarificationQuestion: estimate.clarification_question,
    };

    if (estimate.needs_clarification) {
      patchDraft({ ...result, status: 'clarify' });
      analytics.track('ai_clarification_requested', { ...confidenceProps(estimate), repeat: clarifying });
      return;
    }
    if (!estimate.is_food || estimate.items.length === 0) {
      patchDraft({ ...result, status: 'failed', error: NOT_FOOD });
      analytics.track('ai_photo_failed', { code: NOT_FOOD });
      return;
    }
    patchDraft({ ...result, status: 'ready' });
    analytics.track('ai_photo_completed', {
      item_count: estimate.items.length,
      total_g: Math.round(estimate.total_protein_g),
      duration_ms: Date.now() - started,
    });
    analytics.track('ai_analysis_confidence_assigned', confidenceProps(estimate));
    if (estimate.overall_confidence === 'low') analytics.track('ai_low_confidence_result', confidenceProps(estimate));
    if (clarifying) {
      analytics.track('ai_clarification_completed', { outcome: 'reanalyzed', overall_confidence: estimate.overall_confidence });
    }
  } catch (error) {
    const apiError = error instanceof ApiError ? error : null;
    patchDraft({ status: clarifying ? 'clarify' : 'failed', error: apiError?.message ?? 'Something went wrong. Please try again.' });
    analytics.track('ai_photo_failed', { code: apiError?.code ?? 'unknown', status: apiError?.status ?? 0 });
  }
}

/** From a clarification request, keep the defensible items the model did return. */
export function acceptRoughEstimate(): void {
  const draft = getState().aiDraft;
  if (draft?.status !== 'clarify' || !draft.items.length) return;
  patchDraft({ status: 'ready', error: null });
  analytics.track('ai_clarification_completed', { outcome: 'kept_estimate', overall_confidence: draft.overallConfidence ?? null });
}

/** The user chose to enter protein themselves instead of answering. */
export function abandonClarification(): void {
  const draft = getState().aiDraft;
  if (draft?.status === 'clarify') analytics.track('ai_clarification_completed', { outcome: 'manual_entry' });
  discardDraft();
}

export type ItemConfidenceTag = AiConfidence | 'user_adjusted' | 'user_added' | null;

/**
 * What to show for an item's confidence. Once the user changes an item, the AI's rating no
 * longer describes it, so it is labelled as theirs instead.
 */
export function itemConfidenceTag(item: AiDraftItem): ItemConfidenceTag {
  if (item.original_protein_g === null) return 'user_added';
  const nameChanged = item.original_name != null && item.name.trim() !== item.original_name.trim();
  if (nameChanged || round1(item.protein_g) !== round1(item.original_protein_g)) return 'user_adjusted';
  return item.confidence ?? null;
}

export function isDraftEdited(draft: Pick<AiDraft, 'items' | 'rawItems'>): boolean {
  return (
    draft.items.length !== (draft.rawItems?.length ?? 0) ||
    draft.items.some(i => {
      const tag = itemConfidenceTag(i);
      return tag === 'user_adjusted' || tag === 'user_added';
    })
  );
}

export const draftTotal = (items: AiDraftItem[]) => round1(items.reduce((sum, i) => sum + (i.protein_g || 0), 0));

export function updateDraftItem(key: string, patch: Partial<Pick<AiDraftItem, 'name' | 'protein_g'>>): void {
  const draft = getState().aiDraft;
  if (!draft) return;
  patchDraft({ items: draft.items.map(i => (i.key === key ? { ...i, ...patch } : i)) });
}

export function removeDraftItem(key: string): void {
  const draft = getState().aiDraft;
  if (!draft) return;
  patchDraft({ items: draft.items.filter(i => i.key !== key) });
}

export function addDraftItem(): void {
  const draft = getState().aiDraft;
  if (!draft) return;
  patchDraft({ items: [...draft.items, { key: uuid(), name: '', portion: '', protein_g: 0, original_protein_g: null }] });
}

/**
 * Editing the total rescales every item proportionally so the per-item logs still add up.
 * With no non-zero items, the whole amount goes to the first item.
 */
export function rescaleDraftTotal(nextTotal: number): void {
  const draft = getState().aiDraft;
  if (!draft || !draft.items.length) return;
  const current = draftTotal(draft.items);
  let items: AiDraftItem[];
  if (current <= 0) {
    items = draft.items.map((i, idx) => ({ ...i, protein_g: idx === 0 ? round1(nextTotal) : 0 }));
  } else {
    const factor = nextTotal / current;
    items = draft.items.map(i => ({ ...i, protein_g: round1(i.protein_g * factor) }));
    // Put rounding drift on the largest item so the sum matches what the user typed.
    const drift = round1(nextTotal - draftTotal(items));
    if (drift !== 0) {
      const largest = items.reduce((a, b) => (b.protein_g > a.protein_g ? b : a));
      largest.protein_g = round1(largest.protein_g + drift);
    }
  }
  patchDraft({ items });
}

/** Logs the confirmed items. Nothing from AI is ever logged without this explicit step. */
export function confirmDraft(): FoodLog[] {
  const draft = getState().aiDraft;
  if (!draft || draft.status !== 'ready') return [];
  const items = draft.items
    .map(i => ({ ...i, name: i.name.trim() || 'Meal item' }))
    .filter(i => i.protein_g > 0);
  const total = draftTotal(items);
  const wasEdited = draft.rawItems
    ? wasAiEstimateEdited(
        { items: draft.rawItems, total_protein_g: draft.rawTotal ?? 0 },
        { items: items.map(i => ({ name: i.name, protein_g: i.protein_g })), total_protein_g: total },
      )
    : true;

  const logs = addFoodLogs(
    items.map(item => ({
      food: {
        food_name: item.name,
        brand: null,
        serving_quantity: null,
        serving_unit: item.portion || null,
        serving_description: item.portion,
        serving_grams: null,
        protein_g: item.protein_g,
        calories: null,
        carbs_g: null,
        fat_g: null,
        external_provider: null,
        external_food_id: null,
        custom_food_id: null,
        barcode: null,
      },
      date: draft.date,
      source: 'ai_photo' as const,
      ai: {
        analysisId: draft.analysisId,
        originalProteinG: item.original_protein_g,
        wasEdited: item.original_protein_g === null || Math.round(item.original_protein_g) !== Math.round(item.protein_g),
      },
    })),
  );

  if (draft.analysisId) {
    enqueueUpdate('ai_photo_analyses', draft.analysisId, {
      status: 'confirmed',
      final_total_g: total,
      final_items: items.map(i => ({
        name: i.name,
        protein_g: i.protein_g,
        original_protein_g: i.original_protein_g,
        confidence: i.confidence ?? null,
        user_adjusted: itemConfidenceTag(i) === 'user_adjusted' || itemConfidenceTag(i) === 'user_added',
      })),
      was_edited: wasEdited,
    });
  }
  if (wasEdited) {
    analytics.track('ai_estimate_edited', {
      raw_total_g: Math.round(draft.rawTotal ?? 0),
      final_total_g: Math.round(total),
      item_count_raw: draft.rawItems?.length ?? 0,
      item_count_final: items.length,
      overall_confidence: draft.overallConfidence ?? null,
    });
  }
  analytics.track('ai_estimate_confirmed', {
    item_count: items.length,
    total_g: Math.round(total),
    edited: wasEdited,
    overall_confidence: draft.overallConfidence ?? null,
    low_confidence_items: items.filter(i => i.confidence === 'low').length,
  });
  setState({ aiDraft: null });
  return logs;
}

export function discardDraft(): void {
  const draft = getState().aiDraft;
  if (draft?.analysisId) enqueueUpdate('ai_photo_analyses', draft.analysisId, { status: 'discarded' });
  setState({ aiDraft: null });
}
