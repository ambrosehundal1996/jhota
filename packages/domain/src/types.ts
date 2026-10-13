export type GoalType = 'build_muscle' | 'lose_fat' | 'maintain_health' | 'eat_more_protein';

export const GOAL_TYPES: readonly GoalType[] = [
  'build_muscle',
  'lose_fat',
  'maintain_health',
  'eat_more_protein',
];

export type WeightUnit = 'lb' | 'kg';

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export const MEAL_TYPES: readonly MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];

export type LogSource =
  | 'search'
  | 'barcode'
  | 'recent'
  | 'favorite'
  | 'custom'
  | 'quick_add'
  | 'ai_photo'
  | 'saved_meal'
  | 'copy';

export type FoodProviderId = 'usda' | 'off' | 'custom';

/** Local calendar date in the user's timezone, formatted YYYY-MM-DD. */
export type LocalDate = string;

export interface ProteinRange {
  min: number;
  max: number;
}

export interface FoodLog {
  id: string;
  user_id: string;
  log_date: LocalDate;
  logged_at: string;
  meal_type: MealType | null;
  food_name: string;
  brand: string | null;
  serving_quantity: number | null;
  serving_unit: string | null;
  protein_g: number;
  calories: number | null;
  carbs_g: number | null;
  fat_g: number | null;
  source: LogSource;
  external_provider: FoodProviderId | null;
  external_food_id: string | null;
  custom_food_id: string | null;
  ai_analysis_id: string | null;
  ai_original_protein_g: number | null;
  ai_was_edited: boolean | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface DailyOverride {
  id: string;
  user_id: string;
  log_date: LocalDate;
  protein_total_g: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}
