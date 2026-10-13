import { z } from 'zod';

export const aiConfidenceSchema = z.enum(['low', 'medium', 'high']);

export const aiEstimateItemSchema = z.object({
  name: z.string().min(1).max(80),
  portion: z.string().max(80),
  protein_g: z.number().min(0).max(300),
  confidence: aiConfidenceSchema,
});

export const aiEstimateSchema = z.object({
  is_food: z.boolean(),
  items: z.array(aiEstimateItemSchema).max(12),
  total_protein_g: z.number().min(0).max(600),
  notes: z.string().max(240),
});

export type AiEstimateItem = z.infer<typeof aiEstimateItemSchema>;
export type AiEstimate = z.infer<typeof aiEstimateSchema>;

/** JSON Schema for OpenAI structured outputs (strict mode requires every key listed). */
export const aiEstimateJsonSchema = {
  name: 'protein_estimate',
  strict: true,
  schema: {
    type: 'object',
    additionalProperties: false,
    required: ['is_food', 'items', 'total_protein_g', 'notes'],
    properties: {
      is_food: { type: 'boolean', description: 'False when the photo does not show food.' },
      items: {
        type: 'array',
        items: {
          type: 'object',
          additionalProperties: false,
          required: ['name', 'portion', 'protein_g', 'confidence'],
          properties: {
            name: { type: 'string', description: 'Short food name, e.g. "Grilled chicken breast".' },
            portion: { type: 'string', description: 'Estimated portion, e.g. "about 6 oz".' },
            protein_g: { type: 'number', description: 'Estimated grams of protein for this portion.' },
            confidence: { type: 'string', enum: ['low', 'medium', 'high'] },
          },
        },
      },
      total_protein_g: { type: 'number' },
      notes: { type: 'string', description: 'One short sentence on assumptions. Empty if none.' },
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
