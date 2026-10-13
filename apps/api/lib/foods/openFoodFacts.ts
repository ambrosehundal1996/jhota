import type { NormalizedFood } from '@steady/domain';
import { HttpError, optionalEnv } from '../env.js';
import { isPlausible, normalizeBarcode, round1, type FoodProvider } from './types.js';

export interface OffProduct {
  code?: string;
  product_name?: string;
  brands?: string;
  serving_size?: string;
  serving_quantity?: number | string;
  nutriments?: Record<string, number | string | undefined>;
}

const num = (value: unknown): number | null => {
  const n = typeof value === 'string' ? Number(value) : value;
  return typeof n === 'number' && Number.isFinite(n) ? n : null;
};

export function normalizeOffProduct(product: OffProduct): NormalizedFood | null {
  const name = product.product_name?.trim();
  const code = product.code ? normalizeBarcode(product.code) : null;
  if (!name || !code) return null;
  const n = product.nutriments ?? {};
  const servingGrams = num(product.serving_quantity);
  const per100 = {
    protein: num(n.proteins_100g),
    energy: num(n['energy-kcal_100g']),
    carbs: num(n.carbohydrates_100g),
    fat: num(n.fat_100g),
  };
  if (per100.protein !== null && per100.protein > 100) return null;

  const hasServing = servingGrams !== null && servingGrams > 0;
  const grams = hasServing ? servingGrams : 100;
  const fromServing = (servingKey: string, per100Value: number | null) => {
    const direct = hasServing ? num(n[servingKey]) : null;
    if (direct !== null) return round1(direct);
    return per100Value === null ? null : round1((per100Value * grams) / 100);
  };

  const protein = fromServing('proteins_serving', per100.protein);
  if (protein === null) return null;

  const food: NormalizedFood = {
    id: code,
    provider: 'off',
    name,
    brand: product.brands?.split(',')[0]?.trim() || null,
    servingDescription: hasServing ? product.serving_size?.trim() || `${Math.round(grams)}g` : '100g',
    servingQuantity: hasServing ? 1 : 100,
    servingUnit: hasServing ? product.serving_size?.trim() || 'serving' : 'g',
    servingGrams: grams,
    proteinG: protein,
    caloriesKcal: fromServing('energy-kcal_serving', per100.energy),
    carbsG: fromServing('carbohydrates_serving', per100.carbs),
    fatG: fromServing('fat_serving', per100.fat),
    barcode: code,
  };
  return isPlausible(food) ? food : null;
}

async function fetchProduct(code: string): Promise<OffProduct | null> {
  const url = `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(code)}?fields=code,product_name,brands,serving_size,serving_quantity,nutriments`;
  const response = await fetch(url, {
    headers: { 'User-Agent': optionalEnv('OPEN_FOOD_FACTS_USER_AGENT', 'Steady/0.1 (support@steady.app)') },
    signal: AbortSignal.timeout(8000),
  });
  if (response.status === 404) return null;
  if (!response.ok) throw new HttpError(502, 'provider_unavailable', 'Barcode lookup is temporarily unavailable.');
  const body = (await response.json()) as { status?: number; product?: OffProduct };
  return body.status === 1 && body.product ? body.product : null;
}

/** Open Food Facts (ODbL). Used for barcodes; text search stays on USDA for quality. */
export const openFoodFactsProvider: FoodProvider = {
  id: 'off',
  async searchFoods() {
    return [];
  },
  async getFoodDetails(id) {
    const product = await fetchProduct(normalizeBarcode(id));
    return product ? normalizeOffProduct(product) : null;
  },
  async lookupBarcode(barcode) {
    const code = normalizeBarcode(barcode);
    if (code.length < 8) return null;
    const product = await fetchProduct(code);
    return product ? normalizeOffProduct(product) : null;
  },
};
