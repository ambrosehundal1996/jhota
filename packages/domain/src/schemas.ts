import { z } from 'zod';
import { UNCERTAINTY_REASONS, type AiEstimate } from './aiEstimate';

const confidenceEnum = ['high', 'medium', 'low'] as const;

/** JSON Schema for OpenAI structured outputs (strict mode requires every key listed). */
export const aiEstimateJsonSchema = {
  name: 'protein_estimate',
  strict: true,
  schema: {
    type: 'object',
    additionalProperties: false,
    required: ['is_food', 'items', 'total_protein_g', 'overall_confidence', 'review_notes', 'needs_clarification', 'clarification_question'],
    properties: {
      is_food: { type: 'boolean', description: 'False when the photo does not show food or drink.' },
      items: {
        type: 'array',
        items: {
          type: 'object',
          additionalProperties: false,
          required: ['name', 'portion_description', 'estimated_weight_g', 'protein_g', 'confidence', 'uncertainty_reasons'],
          properties: {
            name: { type: 'string', description: 'Short food name, e.g. "Grilled chicken breast".' },
            portion_description: { type: 'string', description: 'Estimated portion, e.g. "about 150g cooked".' },
            estimated_weight_g: {
              type: ['number', 'null'],
              description: 'Estimated edible weight in grams, or null when not supported by the evidence.',
            },
            protein_g: { type: 'integer', description: 'Estimated grams of protein for this portion.' },
            confidence: { type: 'string', enum: confidenceEnum },
            uncertainty_reasons: {
              type: 'array',
              description: 'Only uncertainties that materially affect this protein estimate. Empty when none.',
              items: { type: 'string', enum: UNCERTAINTY_REASONS },
            },
          },
        },
      },
      total_protein_g: { type: 'integer', description: 'Exact sum of item protein_g.' },
      overall_confidence: {
        type: ['string', 'null'],
        enum: [...confidenceEnum, null],
        description: 'Null when is_food is false.',
      },
      review_notes: {
        type: 'array',
        description: 'Up to two short sentences on what the user should verify. Empty for straightforward meals.',
        items: { type: 'string' },
      },
      needs_clarification: {
        type: 'boolean',
        description: 'True only when a meaningful protein estimate is not possible without more information.',
      },
      clarification_question: {
        type: ['string', 'null'],
        description: 'One short question for the user when needs_clarification is true, otherwise null.',
      },
    },
  },
} as const;

export const analyzePhotoRequestSchema = z.object({
  storagePath: z.string().min(1).max(300),
  userContext: z.string().max(300).optional(),
});

export type AnalyzePhotoRequest = z.infer<typeof analyzePhotoRequestSchema>;

export interface AnalyzePhotoResponse {
  analysisId: string;
  estimate: AiEstimate;
  model: string;
}

export const normalizedFoodSchema = z.object({
  id: z.string(),
  provider: z.enum(['usda', 'off', 'custom']),
  name: z.string(),
  brand: z.string().nullable(),
  servingDescription: z.string(),
  servingQuantity: z.number(),
  servingUnit: z.string(),
  servingGrams: z.number().nullable(),
  proteinG: z.number(),
  caloriesKcal: z.number().nullable(),
  carbsG: z.number().nullable(),
  fatG: z.number().nullable(),
  barcode: z.string().nullable(),
});

export type NormalizedFood = z.infer<typeof normalizedFoodSchema>;

export interface FoodSearchResponse {
  query: string;
  results: NormalizedFood[];
}

/** True when the user changed anything about the AI estimate before saving. */
export function wasAiEstimateEdited(
  raw: { items: { name: string; protein_g: number }[]; total_protein_g: number },
  final: { items: { name: string; protein_g: number }[]; total_protein_g: number },
): boolean {
  if (Math.round(raw.total_protein_g) !== Math.round(final.total_protein_g)) return true;
  if (raw.items.length !== final.items.length) return true;
  return raw.items.some((item, i) => {
    const other = final.items[i];
    return !other || other.name.trim() !== item.name.trim() || Math.round(other.protein_g) !== Math.round(item.protein_g);
  });
}

/** Scale a food's nutrients from one serving to a number of servings. */
export function scaleServing(food: NormalizedFood, servings: number) {
  const s = Math.max(0, servings);
  const scale = (v: number | null) => (v === null ? null : Math.round(v * s * 10) / 10);
  return {
    protein_g: Math.round(food.proteinG * s * 10) / 10,
    calories: scale(food.caloriesKcal),
    carbs_g: scale(food.carbsG),
    fat_g: scale(food.fatG),
  };
}
