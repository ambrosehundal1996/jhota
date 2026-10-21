import type { NormalizedFood } from '@jota/domain';

/**
 * Server-side food data source. The app only ever sees NormalizedFood, so providers can be
 * swapped (FatSecret, Nutritionix, …) without UI changes.
 */
export interface FoodProvider {
  readonly id: NormalizedFood['provider'];
  searchFoods(query: string, options?: { limit?: number }): Promise<NormalizedFood[]>;
  getFoodDetails(id: string): Promise<NormalizedFood | null>;
  lookupBarcode(barcode: string): Promise<NormalizedFood | null>;
}

export const round1 = (value: number) => Math.round(value * 10) / 10;

export function isPlausible(food: NormalizedFood): boolean {
  if (!Number.isFinite(food.proteinG) || food.proteinG < 0 || food.proteinG > 300) return false;
  if (food.servingGrams !== null && food.servingGrams > 0 && food.proteinG > food.servingGrams) return false;
  return food.name.trim().length > 0;
}

export function titleCase(value: string): string {
  return value
    .toLowerCase()
    .replace(/\b([a-z])/g, (_, c: string) => c.toUpperCase())
    .replace(/\s+/g, ' ')
    .trim();
}

export function normalizeBarcode(code: string): string {
  return code.replace(/\D/g, '');
}
