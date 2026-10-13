import type { FoodSearchResponse, NormalizedFood } from '@steady/domain';
import type { CustomFood, LoggableFood } from '../../types/models';
import { apiFetch, ApiError } from '../api/client';

/**
 * Client-side food data contract. Screens depend only on this interface; the default
 * implementation proxies to the Steady API, which owns third-party provider keys.
 */
export interface FoodProvider {
  searchFoods(query: string, signal?: AbortSignal): Promise<NormalizedFood[]>;
  getFoodDetails(provider: NormalizedFood['provider'], id: string): Promise<NormalizedFood | null>;
  lookupBarcode(barcode: string): Promise<NormalizedFood | null>;
}

export const remoteFoodProvider: FoodProvider = {
  async searchFoods(query, signal) {
    const data = await apiFetch<FoodSearchResponse>(`/api/foods/search?q=${encodeURIComponent(query)}`, { signal });
    return data.results;
  },
  async getFoodDetails(provider, id) {
    try {
      const data = await apiFetch<{ food: NormalizedFood }>(
        `/api/foods/details?provider=${encodeURIComponent(provider)}&id=${encodeURIComponent(id)}`,
      );
      return data.food;
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) return null;
      throw error;
    }
  },
  async lookupBarcode(barcode) {
    try {
      const data = await apiFetch<{ food: NormalizedFood }>(`/api/foods/barcode?code=${encodeURIComponent(barcode)}`);
      return data.food;
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) return null;
      throw error;
    }
  },
};

export const foodProvider: FoodProvider = remoteFoodProvider;

export function loggableFromNormalized(food: NormalizedFood): LoggableFood {
  return {
    food_name: food.name,
    brand: food.brand,
    serving_quantity: food.servingQuantity,
    serving_unit: food.servingUnit,
    serving_description: food.servingDescription,
    serving_grams: food.servingGrams,
    protein_g: food.proteinG,
    calories: food.caloriesKcal,
    carbs_g: food.carbsG,
    fat_g: food.fatG,
    external_provider: food.provider === 'custom' ? null : food.provider,
    external_food_id: food.provider === 'custom' ? null : food.id,
    custom_food_id: food.provider === 'custom' ? food.id : null,
    barcode: food.barcode,
  };
}

export function loggableFromCustom(food: CustomFood): LoggableFood {
  return {
    food_name: food.food_name,
    brand: null,
    serving_quantity: 1,
    serving_unit: food.serving_description,
    serving_description: food.serving_description,
    serving_grams: null,
    protein_g: food.protein_g,
    calories: food.calories,
    carbs_g: food.carbs_g,
    fat_g: food.fat_g,
    external_provider: null,
    external_food_id: null,
    custom_food_id: food.id,
    barcode: null,
  };
}

/** Local search across the user's own foods; works offline. */
export function searchCustomFoods(foods: CustomFood[], query: string): CustomFood[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return foods.filter(f => f.food_name.toLowerCase().includes(q)).slice(0, 5);
}
