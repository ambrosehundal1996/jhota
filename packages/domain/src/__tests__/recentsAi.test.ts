import { describe, expect, it } from 'vitest';
import { defaultMealForTime, deriveRecentFoods, wasAiEstimateEdited, type FoodLog } from '..';

const base: FoodLog = {
  id: '1',
  user_id: 'u',
  log_date: '2026-10-09',
  logged_at: '2026-10-09T12:00:00Z',
  meal_type: 'lunch',
  food_name: 'Chicken Bowl',
  brand: null,
  serving_quantity: 1,
  serving_unit: 'bowl',
  protein_g: 42,
  calories: null,
  carbs_g: null,
  fat_g: null,
  source: 'search',
  external_provider: null,
  external_food_id: null,
  custom_food_id: null,
  ai_analysis_id: null,
  ai_original_protein_g: null,
  ai_was_edited: null,
  created_at: '',
  updated_at: '',
  deleted_at: null,
};

describe('deriveRecentFoods', () => {
  it('dedupes by food, keeping the most recent serving and meal', () => {
    const recents = deriveRecentFoods([
      { ...base, id: 'a', logged_at: '2026-10-07T12:00:00Z', serving_quantity: 2, protein_g: 84 },
      { ...base, id: 'b', logged_at: '2026-10-08T19:00:00Z', meal_type: 'dinner' },
      { ...base, id: 'c', food_name: 'Eggs', logged_at: '2026-10-06T08:00:00Z', protein_g: 12 },
    ]);
    expect(recents.map(r => r.food_name)).toEqual(['Chicken Bowl', 'Eggs']);
    expect(recents[0]).toMatchObject({ serving_quantity: 1, protein_g: 42, lastMeal: 'dinner', timesLogged: 2 });
  });

  it('skips deleted logs and unnamed quick adds', () => {
    const recents = deriveRecentFoods([
      { ...base, deleted_at: 'x' },
      { ...base, id: 'q', food_name: 'Quick add', source: 'quick_add' },
    ]);
    expect(recents).toEqual([]);
  });
});

describe('defaultMealForTime', () => {
  it('maps time of day to a meal', () => {
    expect(defaultMealForTime(new Date(2026, 9, 9, 8))).toBe('breakfast');
    expect(defaultMealForTime(new Date(2026, 9, 9, 12))).toBe('lunch');
    expect(defaultMealForTime(new Date(2026, 9, 9, 16))).toBe('snack');
    expect(defaultMealForTime(new Date(2026, 9, 9, 19))).toBe('dinner');
  });
});

describe('wasAiEstimateEdited', () => {
  const raw = { items: [{ name: 'Eggs', protein_g: 18 }, { name: 'Toast', protein_g: 13 }], total_protein_g: 31 };
  it('false when unchanged', () => {
    expect(wasAiEstimateEdited(raw as never, raw)).toBe(false);
  });
  it('true when the total changes (31g → 28g)', () => {
    expect(wasAiEstimateEdited(raw as never, { ...raw, total_protein_g: 28 })).toBe(true);
  });
  it('true when items are removed or renamed', () => {
    expect(wasAiEstimateEdited(raw as never, { items: raw.items.slice(0, 1), total_protein_g: 31 })).toBe(true);
    expect(
      wasAiEstimateEdited(raw as never, { items: [{ name: 'Egg whites', protein_g: 18 }, raw.items[1]!], total_protein_g: 31 }),
    ).toBe(true);
  });
});
