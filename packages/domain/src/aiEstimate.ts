import { z } from 'zod';

export const AI_CONFIDENCE_LEVELS = ['high', 'medium', 'low'] as const;
export type AiConfidence = (typeof AI_CONFIDENCE_LEVELS)[number];
export const aiConfidenceSchema = z.enum(AI_CONFIDENCE_LEVELS);

export const UNCERTAINTY_REASONS = [
  'unclear_food_identity',
  'uncertain_portion',
  'hidden_ingredients',
  'uncertain_preparation',
  'variable_nutrition',
  'poor_image_quality',
  'conflicting_context',
] as const;
export type UncertaintyReason = (typeof UNCERTAINTY_REASONS)[number];

export interface AiEstimateItem {
  name: string;
  portion_description: string;
  estimated_weight_g: number | null;
  protein_g: number;
  /** Null when the model did not return a usable rating. */
  confidence: AiConfidence | null;
  uncertainty_reasons: UncertaintyReason[];
}

export interface AiEstimate {
  is_food: boolean;
  items: AiEstimateItem[];
  total_protein_g: number;
  overall_confidence: AiConfidence | null;
  review_notes: string[];
  needs_clarification: boolean;
  clarification_question: string | null;
}

export const MAX_AI_ITEMS = 8;
export const MAX_REVIEW_NOTES = 2;
const DEFAULT_CLARIFICATION_QUESTION = 'What’s in this meal? A short description helps us estimate the protein.';

/**
 * Model output is parsed leniently: a missing or invalid confidence field degrades to
 * "unrated" instead of failing the whole estimate.
 */
const modelItemSchema = z.object({
  name: z.string().catch(''),
  portion_description: z.string().catch(''),
  estimated_weight_g: z.number().nullable().catch(null),
  protein_g: z.number().catch(Number.NaN),
  confidence: aiConfidenceSchema.nullable().catch(null),
  uncertainty_reasons: z.array(z.unknown()).catch([]),
});

const modelOutputSchema = z.object({
  is_food: z.boolean(),
  items: z.array(z.unknown()).catch([]),
  review_notes: z.union([z.array(z.unknown()), z.string()]).catch([]),
  needs_clarification: z.boolean().catch(false),
  clarification_question: z.string().nullable().catch(null),
});

const RANK: Record<AiConfidence, number> = { low: 0, medium: 1, high: 2 };

/**
 * Items carrying at least this share of the meal's protein are material to the total.
 * This is a share of grams, not a probability.
 */
export const MATERIAL_PROTEIN_SHARE = 0.25;

/**
 * Overall confidence follows the items that carry the protein: a low-confidence garnish
 * doesn't drag down a clear chicken breast, but an uncertain main dish does. Unrated items
 * count as medium, since a missing rating can't support high confidence.
 */
export function computeOverallConfidence(
  items: readonly { protein_g: number; confidence: AiConfidence | null }[],
): AiConfidence | null {
  if (!items.length) return null;
  const level = (c: AiConfidence | null): AiConfidence => c ?? 'medium';
  const total = items.reduce((sum, i) => sum + Math.max(0, i.protein_g), 0);
  if (total <= 0) {
    return items.map(i => level(i.confidence)).reduce((a, b) => (RANK[b] < RANK[a] ? b : a));
  }
  const shareAtOrBelow = (max: AiConfidence) =>
    items.filter(i => RANK[level(i.confidence)] <= RANK[max]).reduce((sum, i) => sum + Math.max(0, i.protein_g), 0) / total;
  if (shareAtOrBelow('low') >= MATERIAL_PROTEIN_SHARE) return 'low';
  if (shareAtOrBelow('medium') >= MATERIAL_PROTEIN_SHARE) return 'medium';
  return 'high';
}

function normalizeItem(raw: unknown): AiEstimateItem | null {
  const parsed = modelItemSchema.safeParse(raw);
  if (!parsed.success) return null;
  const item = parsed.data;
  const name = item.name.trim().slice(0, 80);
  if (!name || !Number.isFinite(item.protein_g) || item.protein_g < 0) return null;
  const reasons = [
    ...new Set(item.uncertainty_reasons.filter((r): r is UncertaintyReason => UNCERTAINTY_REASONS.includes(r as UncertaintyReason))),
  ];
  const weight = item.estimated_weight_g;
  return {
    name,
    portion_description: item.portion_description.trim().slice(0, 120),
    estimated_weight_g: weight !== null && Number.isFinite(weight) && weight > 0 ? Math.round(weight) : null,
    protein_g: Math.min(300, Math.round(item.protein_g)),
    confidence: item.confidence,
    uncertainty_reasons: reasons,
  };
}

function normalizeNotes(raw: unknown[] | string): string[] {
  const list = typeof raw === 'string' ? [raw] : raw;
  const seen = new Set<string>();
  const notes: string[] = [];
  for (const note of list) {
    if (typeof note !== 'string') continue;
    const text = note.trim().slice(0, 160);
    if (!text || seen.has(text.toLowerCase())) continue;
    seen.add(text.toLowerCase());
    notes.push(text);
  }
  return notes.slice(0, MAX_REVIEW_NOTES);
}

/**
 * Turns raw model JSON into a consistent estimate. The total is always the sum of the
 * rounded items and overall confidence is recomputed here rather than trusted from the model.
 * Returns null when the output isn't an estimate at all.
 */
export function normalizeAiEstimate(raw: unknown): AiEstimate | null {
  const parsed = modelOutputSchema.safeParse(raw);
  if (!parsed.success) return null;
  const out = parsed.data;
  const needsClarification = out.needs_clarification;
  const question = needsClarification ? out.clarification_question?.trim().slice(0, 160) || DEFAULT_CLARIFICATION_QUESTION : null;

  if (!out.is_food) {
    return {
      is_food: false,
      items: [],
      total_protein_g: 0,
      overall_confidence: null,
      review_notes: [],
      needs_clarification: needsClarification,
      clarification_question: question,
    };
  }

  const items = out.items
    .map(normalizeItem)
    .filter((i): i is AiEstimateItem => i !== null)
    .slice(0, MAX_AI_ITEMS);
  return {
    is_food: true,
    items,
    total_protein_g: items.reduce((sum, i) => sum + i.protein_g, 0),
    overall_confidence: computeOverallConfidence(items),
    review_notes: normalizeNotes(out.review_notes),
    needs_clarification: needsClarification,
    clarification_question: question,
  };
}
