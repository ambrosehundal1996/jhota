import type { FoodLog, MealType } from './types';

export interface RecentFood {
  key: string;
  food_name: string;
  brand: string | null;
  serving_quantity: number | null;
  serving_unit: string | null;
  protein_g: number;
  calories: number | null;
  carbs_g: number | null;
  fat_g: number | null;
  external_provider: FoodLog['external_provider'];
  external_food_id: string | null;
  custom_food_id: string | null;
  lastMeal: MealType | null;
  lastLoggedAt: string;
  timesLogged: number;
}

export function recentFoodKey(
  log: Pick<FoodLog, 'external_provider' | 'external_food_id' | 'custom_food_id' | 'food_name' | 'brand'>,
): string {
  if (log.external_provider && log.external_food_id) {
    return `${log.external_provider}:${log.external_food_id}`;
  }
  if (log.custom_food_id) return `custom:${log.custom_food_id}`;
  return `name:${log.food_name.trim().toLowerCase()}|${(log.brand ?? '').trim().toLowerCase()}`;
}

const isNamed = (log: FoodLog) => log.food_name.trim().length > 0 && log.food_name !== 'Quick add';

/**
 * Recents use the most recently logged serving and meal for each distinct food,
 * ordered by recency. Unnamed quick adds are excluded.
 */
export function deriveRecentFoods(logs: readonly FoodLog[], limit = 20): RecentFood[] {
  const sorted = [...logs]
    .filter(log => !log.deleted_at && isNamed(log))
    .sort((a, b) => (a.logged_at < b.logged_at ? 1 : -1));
  const byKey = new Map<string, RecentFood>();
  for (const log of sorted) {
    const key = recentFoodKey(log);
    const existing = byKey.get(key);
    if (existing) {
      existing.timesLogged += 1;
      continue;
    }
    byKey.set(key, {
      key,
      food_name: log.food_name,
      brand: log.brand,
      serving_quantity: log.serving_quantity,
      serving_unit: log.serving_unit,
      protein_g: log.protein_g,
      calories: log.calories,
      carbs_g: log.carbs_g,
      fat_g: log.fat_g,
      external_provider: log.external_provider,
      external_food_id: log.external_food_id,
      custom_food_id: log.custom_food_id,
      lastMeal: log.meal_type,
      lastLoggedAt: log.logged_at,
      timesLogged: 1,
    });
  }
  return [...byKey.values()].slice(0, limit);
}
