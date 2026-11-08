import type { NormalizedFood } from '@jota/domain';
import { HttpError, requireEnv } from '../env.js';
import { isPlausible, normalizeBarcode, round1, titleCase, type FoodProvider } from './types.js';

const BASE = 'https://api.nal.usda.gov/fdc/v1';

const NUTRIENT = { protein: 1003, energy: 1008, carbs: 1005, fat: 1004 } as const;
const NUTRIENT_NUMBER = { protein: '203', energy: '208', carbs: '205', fat: '204' } as const;

type DataType = 'Foundation' | 'SR Legacy' | 'Survey (FNDDS)' | 'Branded' | string;

export interface UsdaSearchNutrient {
  nutrientId?: number;
  nutrientNumber?: string;
  value?: number;
  amount?: number;
  unitName?: string;
  nutrient?: { id?: number; number?: string };
}

export interface UsdaFoodMeasure {
  disseminationText?: string;
  gramWeight?: number;
  rank?: number;
}

export interface UsdaSearchFood {
  fdcId: number;
  description: string;
  dataType: DataType;
  brandOwner?: string;
  brandName?: string;
  gtinUpc?: string;
  servingSize?: number;
  servingSizeUnit?: string;
  householdServingFullText?: string;
  foodNutrients?: UsdaSearchNutrient[];
  foodMeasures?: UsdaFoodMeasure[];
}

export interface UsdaDetailNutrient {
  nutrient?: { id?: number; number?: string };
  amount?: number;
}

export interface UsdaDetailFood {
  fdcId: number;
  description: string;
  dataType: DataType;
  brandOwner?: string;
  brandName?: string;
  gtinUpc?: string;
  servingSize?: number;
  servingSizeUnit?: string;
  householdServingFullText?: string;
  foodNutrients?: UsdaDetailNutrient[];
  labelNutrients?: Partial<Record<'protein' | 'calories' | 'carbohydrates' | 'fat', { value?: number }>>;
  foodPortions?: {
    gramWeight?: number;
    amount?: number;
    modifier?: string;
    portionDescription?: string;
    measureUnit?: { name?: string };
  }[];
}

interface Per100 {
  protein: number | null;
  energy: number | null;
  carbs: number | null;
  fat: number | null;
}

function per100FromSearch(nutrients: UsdaSearchNutrient[] = []): Per100 {
  const find = (key: keyof typeof NUTRIENT) => {
    const hit = nutrients.find(n => {
      const id = n.nutrientId ?? n.nutrient?.id;
      const num = n.nutrientNumber ?? n.nutrient?.number;
      return id === NUTRIENT[key] || num === NUTRIENT_NUMBER[key];
    });
    const value = hit?.value ?? hit?.amount;
    return typeof value === 'number' ? value : null;
  };
  return { protein: find('protein'), energy: find('energy'), carbs: find('carbs'), fat: find('fat') };
}

function per100FromDetail(nutrients: UsdaDetailNutrient[] = []): Per100 {
  const find = (key: keyof typeof NUTRIENT) => {
    const hit = nutrients.find(
      n => n.nutrient?.id === NUTRIENT[key] || n.nutrient?.number === NUTRIENT_NUMBER[key],
    );
    return typeof hit?.amount === 'number' ? hit.amount : null;
  };
  return { protein: find('protein'), energy: find('energy'), carbs: find('carbs'), fat: find('fat') };
}

const isMetricUnit = (unit?: string) => !!unit && ['g', 'gm', 'grm', 'ml', 'mlt'].includes(unit.toLowerCase());

interface Serving {
  description: string;
  quantity: number;
  unit: string;
  grams: number;
}

function pickServing(food: UsdaSearchFood | UsdaDetailFood): Serving {
  if (food.servingSize && isMetricUnit(food.servingSizeUnit)) {
    const unit = food.servingSizeUnit!.toLowerCase().startsWith('m') ? 'ml' : 'g';
    const grams = food.servingSize;
    const household = food.householdServingFullText?.trim();
    return {
      description: household ? `${household} (${Math.round(grams)}${unit})` : `${Math.round(grams)}${unit}`,
      quantity: 1,
      unit: household || `${Math.round(grams)}${unit}`,
      grams,
    };
  }
  if ('foodMeasures' in food && food.foodMeasures?.length) {
    const measure = [...food.foodMeasures]
      .filter(m => m.gramWeight && m.disseminationText && !/quantity not specified/i.test(m.disseminationText))
      .sort((a, b) => (a.rank ?? 99) - (b.rank ?? 99))[0];
    if (measure?.gramWeight && measure.disseminationText) {
      return {
        description: `${measure.disseminationText} (${Math.round(measure.gramWeight)}g)`,
        quantity: 1,
        unit: measure.disseminationText,
        grams: measure.gramWeight,
      };
    }
  }
  if ('foodPortions' in food && food.foodPortions?.length) {
    const portion = food.foodPortions.find(p => p.gramWeight);
    if (portion?.gramWeight) {
      const label =
        portion.portionDescription && !/quantity not specified/i.test(portion.portionDescription)
          ? portion.portionDescription
          : [portion.amount, portion.modifier || portion.measureUnit?.name].filter(Boolean).join(' ');
      if (label) {
        return {
          description: `${label} (${Math.round(portion.gramWeight)}g)`,
          quantity: 1,
          unit: label,
          grams: portion.gramWeight,
        };
      }
    }
  }
  return { description: '100g', quantity: 100, unit: 'g', grams: 100 };
}

function toNormalized(
  food: UsdaSearchFood | UsdaDetailFood,
  per100: Per100,
  labelPerServing?: UsdaDetailFood['labelNutrients'],
): NormalizedFood | null {
  if (per100.protein === null && labelPerServing?.protein?.value === undefined) return null;
  const serving = pickServing(food);
  const factor = serving.grams / 100;
  const scale = (v: number | null) => (v === null ? null : round1(v * factor));
  const label = (key: 'protein' | 'calories' | 'carbohydrates' | 'fat') =>
    typeof labelPerServing?.[key]?.value === 'number' ? round1(labelPerServing[key]!.value!) : null;
  const brand = food.brandName || food.brandOwner || null;
  const normalized: NormalizedFood = {
    id: String(food.fdcId),
    provider: 'usda',
    name: food.dataType === 'Branded' ? titleCase(food.description) : cleanGenericName(food.description),
    brand: brand ? titleCase(brand) : null,
    servingDescription: serving.description,
    servingQuantity: serving.quantity,
    servingUnit: serving.unit,
    servingGrams: serving.grams,
    proteinG: label('protein') ?? scale(per100.protein) ?? 0,
    caloriesKcal: label('calories') ?? scale(per100.energy),
    carbsG: label('carbohydrates') ?? scale(per100.carbs),
    fatG: label('fat') ?? scale(per100.fat),
    barcode: food.gtinUpc ? normalizeBarcode(food.gtinUpc) : null,
  };
  return isPlausible(normalized) ? normalized : null;
}

/** USDA generic names are often ALL CAPS or Title Case; normalize to sentence case. */
export function cleanGenericName(description: string): string {
  const trimmed = description.replace(/\s+/g, ' ').trim();
  const lower = trimmed.toLowerCase();
  return lower.charAt(0).toUpperCase() + lower.slice(1);
}

export function normalizeUsdaSearchFood(food: UsdaSearchFood): NormalizedFood | null {
  return toNormalized(food, per100FromSearch(food.foodNutrients));
}

export function normalizeUsdaDetailFood(food: UsdaDetailFood): NormalizedFood | null {
  const per100 = per100FromDetail(food.foodNutrients);
  return toNormalized(food, per100, food.dataType === 'Branded' ? food.labelNutrients : undefined);
}

const DATA_TYPE_PRIORITY: Record<string, number> = {
  'Survey (FNDDS)': 0,
  Foundation: 1,
  'SR Legacy': 2,
  Branded: 3,
};

/** Rank generic, well-matched foods first; branded items follow. */
export function rankUsdaResults(query: string, foods: UsdaSearchFood[]): UsdaSearchFood[] {
  const q = query.trim().toLowerCase();
  const score = (food: UsdaSearchFood) => {
    const name = food.description.toLowerCase();
    let s = (DATA_TYPE_PRIORITY[food.dataType] ?? 4) * 10;
    if (name === q) s -= 30;
    else if (name.startsWith(q)) s -= 15;
    else if (name.includes(q)) s -= 8;
    s += Math.min(name.length, 80) / 20;
    return s;
  };
  return foods
    .map((food, index) => ({ food, index, s: score(food) }))
    .sort((a, b) => a.s - b.s || a.index - b.index)
    .map(x => x.food);
}

const SEARCH_DATA_TYPES = ['Survey (FNDDS)', 'Foundation', 'SR Legacy', 'Branded'] as const;

function throwUsda(response: Response, detail: string): never {
  console.warn(`[usda] ${response.status} ${response.url.replace(/api_key=[^&]+/, 'api_key=***')}`, detail.slice(0, 200));
  if (response.status === 404) throw new HttpError(404, 'not_found', 'Food not found.');
  if (response.status === 429) throw new HttpError(429, 'provider_rate_limited', 'Food search is busy. Try again in a moment.');
  throw new HttpError(502, 'provider_unavailable', 'Food search is temporarily unavailable.');
}

async function usdaFetch<T>(path: string, params: Record<string, string> = {}): Promise<T> {
  const url = new URL(`${BASE}${path}`);
  url.searchParams.set('api_key', requireEnv('USDA_API_KEY'));
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  const response = await fetch(url, { signal: AbortSignal.timeout(8000) });
  if (!response.ok) throwUsda(response, await response.text().catch(() => ''));
  return (await response.json()) as T;
}

/** POST search — GET with `Survey (FNDDS)` in the query string is rejected as 400 by USDA's gateway. */
async function usdaSearch(query: string, pageSize: number, dataType: readonly string[]): Promise<{ foods?: UsdaSearchFood[] }> {
  const url = new URL(`${BASE}/foods/search`);
  url.searchParams.set('api_key', requireEnv('USDA_API_KEY'));
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ query, pageSize, dataType }),
    signal: AbortSignal.timeout(8000),
  });
  if (!response.ok) throwUsda(response, await response.text().catch(() => ''));
  return (await response.json()) as { foods?: UsdaSearchFood[] };
}

export const usdaProvider: FoodProvider = {
  id: 'usda',

  async searchFoods(query, options) {
    const limit = options?.limit ?? 25;
    const data = await usdaSearch(query, 50, SEARCH_DATA_TYPES);
    const seen = new Set<string>();
    const results: NormalizedFood[] = [];
    for (const food of rankUsdaResults(query, data.foods ?? [])) {
      const normalized = normalizeUsdaSearchFood(food);
      if (!normalized) continue;
      const key = `${normalized.name.toLowerCase()}|${(normalized.brand ?? '').toLowerCase()}`;
      if (seen.has(key)) continue;
      seen.add(key);
      results.push(normalized);
      if (results.length >= limit) break;
    }
    return results;
  },

  async getFoodDetails(id) {
    if (!/^\d+$/.test(id)) return null;
    const food = await usdaFetch<UsdaDetailFood>(`/food/${id}`, {});
    return normalizeUsdaDetailFood(food);
  },

  async lookupBarcode(barcode) {
    const code = normalizeBarcode(barcode);
    if (!code) return null;
    const data = await usdaSearch(code, 10, ['Branded']);
    const strip = (v: string) => v.replace(/^0+/, '');
    const match = (data.foods ?? []).find(f => f.gtinUpc && strip(normalizeBarcode(f.gtinUpc)) === strip(code));
    return match ? normalizeUsdaSearchFood(match) : null;
  },
};
