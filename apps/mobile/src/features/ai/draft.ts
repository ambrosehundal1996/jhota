import { wasAiEstimateEdited, type LocalDate, type MealType } from '@steady/domain';
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

export function startDraft(photoUri: string, date: LocalDate, meal: MealType): void {
  setState({
    aiDraft: {
      id: uuid(),
      date,
      meal,
      photoUri,
      storagePath: null,
      context: '',
      status: 'picked',
      error: null,
      analysisId: null,
      rawItems: null,
      rawTotal: null,
      items: [],
      notes: null,
      createdAt: nowIso(),
    },
  });
}

export const setDraftContext = (context: string) => patchDraft({ context });
export const setDraftMeal = (meal: MealType) => patchDraft({ meal });

/** Uploads (once) and analyzes the draft photo. Safe to call again to retry. */
export async function runAnalysis(): Promise<void> {
  const draft = getState().aiDraft;
  if (!draft?.photoUri) return;
  const started = Date.now();
  analytics.track('ai_photo_started', { retry: draft.status === 'failed', has_context: !!draft.context.trim() });
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
    const { analysisId, estimate } = await analyzeMealPhoto(storagePath, draft.context);
    if (!estimate.is_food || estimate.items.length === 0) {
      patchDraft({ status: 'failed', error: NOT_FOOD, analysisId });
      analytics.track('ai_photo_failed', { code: NOT_FOOD });
      return;
    }
    const items: AiDraftItem[] = estimate.items.map(item => ({
      key: uuid(),
      name: item.name,
      portion: item.portion,
      protein_g: round1(item.protein_g),
      original_protein_g: round1(item.protein_g),
    }));
    patchDraft({
      status: 'ready',
      analysisId,
      rawItems: estimate.items.map(i => ({ name: i.name, protein_g: i.protein_g })),
      rawTotal: estimate.total_protein_g,
      items,
      notes: estimate.notes || null,
    });
    analytics.track('ai_photo_completed', {
      item_count: items.length,
      total_g: Math.round(estimate.total_protein_g),
      duration_ms: Date.now() - started,
    });
  } catch (error) {
    const apiError = error instanceof ApiError ? error : null;
    patchDraft({ status: 'failed', error: apiError?.message ?? 'Something went wrong. Please try again.' });
    analytics.track('ai_photo_failed', { code: apiError?.code ?? 'unknown', status: apiError?.status ?? 0 });
  }
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
      meal: draft.meal,
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
      final_items: items.map(i => ({ name: i.name, protein_g: i.protein_g, original_protein_g: i.original_protein_g })),
      was_edited: wasEdited,
    });
  }
  if (wasEdited) {
    analytics.track('ai_estimate_edited', {
      raw_total_g: Math.round(draft.rawTotal ?? 0),
      final_total_g: Math.round(total),
      item_count_raw: draft.rawItems?.length ?? 0,
      item_count_final: items.length,
    });
  }
  analytics.track('ai_estimate_confirmed', { item_count: items.length, total_g: Math.round(total), edited: wasEdited });
  setState({ aiDraft: null });
  return logs;
}

export function discardDraft(): void {
  const draft = getState().aiDraft;
  if (draft?.analysisId) enqueueUpdate('ai_photo_analyses', draft.analysisId, { status: 'discarded' });
  setState({ aiDraft: null });
}
