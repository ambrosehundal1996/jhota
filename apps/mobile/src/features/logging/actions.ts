import type { LocalDate, LogSource, MealType, RecentFood } from '@steady/domain';
import { analytics } from '../../analytics';
import { getState, setState } from '../../state/appStore';
import { enqueueUpsert } from '../../state/outbox';
import { findFavorite, logsForDate, overrideForDate } from '../../state/selectors';
import type {
  CustomFood,
  DailyOverride,
  Favorite,
  FoodLog,
  LoggableFood,
  SavedMeal,
  SavedMealItem,
} from '../../types/models';
import { nowIso, uuid } from '../../utils/id';

const round1 = (value: number) => Math.round(value * 10) / 10;

function persistLog(log: FoodLog): void {
  setState(state => ({ logs: { ...state.logs, [log.id]: log } }));
  enqueueUpsert('food_logs', log.id, { ...log });
}

export interface NewLogInput {
  food: LoggableFood;
  /** Multiplier of the food's serving. */
  servings?: number;
  meal: MealType | null;
  date: LocalDate;
  source: LogSource;
  ai?: { analysisId: string | null; originalProteinG: number | null; wasEdited: boolean };
}

export function buildLog(input: NewLogInput, userId: string, now = nowIso()): FoodLog {
  const servings = input.servings ?? 1;
  const scale = (v: number | null) => (v === null ? null : round1(v * servings));
  return {
    id: uuid(),
    user_id: userId,
    log_date: input.date,
    logged_at: now,
    meal_type: input.meal,
    food_name: input.food.food_name.trim() || 'Quick add',
    brand: input.food.brand,
    serving_quantity: input.food.serving_quantity === null ? null : round1(input.food.serving_quantity * servings),
    serving_unit: input.food.serving_unit,
    protein_g: round1(input.food.protein_g * servings),
    calories: scale(input.food.calories),
    carbs_g: scale(input.food.carbs_g),
    fat_g: scale(input.food.fat_g),
    source: input.source,
    external_provider: input.food.external_provider,
    external_food_id: input.food.external_food_id,
    custom_food_id: input.food.custom_food_id,
    ai_analysis_id: input.ai?.analysisId ?? null,
    ai_original_protein_g: input.ai?.originalProteinG ?? null,
    ai_was_edited: input.ai ? input.ai.wasEdited : null,
    created_at: now,
    updated_at: now,
    deleted_at: null,
  };
}

export function addFoodLogs(inputs: NewLogInput[]): FoodLog[] {
  const { userId } = getState();
  const logs = inputs.map(input => buildLog(input, userId));
  for (const log of logs) {
    persistLog(log);
    analytics.track('food_logged', { source: log.source, meal: log.meal_type, protein_g: log.protein_g });
  }
  return logs;
}

export const addFoodLog = (input: NewLogInput): FoodLog => addFoodLogs([input])[0]!;

export type EditableLogFields = Partial<
  Pick<FoodLog, 'meal_type' | 'protein_g' | 'serving_quantity' | 'food_name' | 'calories' | 'carbs_g' | 'fat_g' | 'log_date'>
>;

export function updateFoodLog(id: string, patch: EditableLogFields): void {
  const existing = getState().logs[id];
  if (!existing) return;
  persistLog({ ...existing, ...patch, updated_at: nowIso() });
  analytics.track('food_log_edited', { source: existing.source });
}

/** Soft-deletes and returns an undo function. */
export function deleteFoodLog(id: string): () => void {
  const existing = getState().logs[id];
  if (!existing) return () => undefined;
  persistLog({ ...existing, deleted_at: nowIso(), updated_at: nowIso() });
  analytics.track('food_log_deleted', { source: existing.source });
  return () => {
    const current = getState().logs[id];
    if (current) persistLog({ ...current, deleted_at: null, updated_at: nowIso() });
  };
}

/** Undo for a just-added batch. */
export function undoLogs(ids: string[]): void {
  for (const id of ids) {
    const current = getState().logs[id];
    if (current) persistLog({ ...current, deleted_at: nowIso(), updated_at: nowIso() });
  }
}

export function quickAdd(args: { grams: number; name?: string; meal: MealType | null; date: LocalDate }): FoodLog {
  const log = addFoodLog({
    food: {
      food_name: args.name?.trim() || 'Quick add',
      brand: null,
      serving_quantity: null,
      serving_unit: null,
      serving_description: '',
      serving_grams: null,
      protein_g: args.grams,
      calories: null,
      carbs_g: null,
      fat_g: null,
      external_provider: null,
      external_food_id: null,
      custom_food_id: null,
      barcode: null,
    },
    meal: args.meal,
    date: args.date,
    source: 'quick_add',
  });
  analytics.track('quick_add_used', { protein_g: args.grams, named: !!args.name?.trim(), meal: args.meal });
  return log;
}

export function recentToLoggable(recent: RecentFood): LoggableFood {
  return {
    food_name: recent.food_name,
    brand: recent.brand,
    serving_quantity: recent.serving_quantity,
    serving_unit: recent.serving_unit,
    serving_description: '',
    serving_grams: null,
    protein_g: recent.protein_g,
    calories: recent.calories,
    carbs_g: recent.carbs_g,
    fat_g: recent.fat_g,
    external_provider: recent.external_provider,
    external_food_id: recent.external_food_id,
    custom_food_id: recent.custom_food_id,
    barcode: null,
  };
}

/** One-tap re-log with the most recently used serving. */
export function relogRecent(recent: RecentFood, date: LocalDate, meal: MealType | null): FoodLog {
  const log = addFoodLog({ food: recentToLoggable(recent), meal, date, source: 'recent' });
  analytics.track('recent_food_logged', { protein_g: log.protein_g });
  return log;
}

export function favoriteToLoggable(fav: Favorite): LoggableFood {
  return {
    food_name: fav.food_name,
    brand: fav.brand,
    serving_quantity: fav.serving_quantity,
    serving_unit: fav.serving_unit,
    serving_description: '',
    serving_grams: null,
    protein_g: fav.protein_g,
    calories: fav.calories,
    carbs_g: fav.carbs_g,
    fat_g: fav.fat_g,
    external_provider: fav.external_provider,
    external_food_id: fav.external_food_id,
    custom_food_id: fav.custom_food_id,
    barcode: null,
  };
}

export function relogFavorite(fav: Favorite, date: LocalDate, meal: MealType | null): FoodLog {
  const log = addFoodLog({ food: favoriteToLoggable(fav), meal, date, source: 'favorite' });
  analytics.track('favorite_food_logged', { protein_g: log.protein_g });
  return log;
}

/** Adds or removes a favorite. The preferred serving is the one currently selected. */
export function toggleFavorite(food: LoggableFood, servings = 1): boolean {
  const state = getState();
  const existing = findFavorite(state, food);
  const now = nowIso();
  if (existing) {
    const removed: Favorite = { ...existing, deleted_at: now, updated_at: now };
    setState(s => ({ favorites: { ...s.favorites, [removed.id]: removed } }));
    enqueueUpsert('favorites', removed.id, { ...removed });
    return false;
  }
  const fav: Favorite = {
    id: uuid(),
    user_id: state.userId,
    food_name: food.food_name,
    brand: food.brand,
    serving_quantity: food.serving_quantity === null ? null : round1(food.serving_quantity * servings),
    serving_unit: food.serving_unit,
    protein_g: round1(food.protein_g * servings),
    calories: food.calories === null ? null : round1(food.calories * servings),
    carbs_g: food.carbs_g === null ? null : round1(food.carbs_g * servings),
    fat_g: food.fat_g === null ? null : round1(food.fat_g * servings),
    external_provider: food.external_provider,
    external_food_id: food.external_food_id,
    custom_food_id: food.custom_food_id,
    created_at: now,
    updated_at: now,
    deleted_at: null,
  };
  setState(s => ({ favorites: { ...s.favorites, [fav.id]: fav } }));
  enqueueUpsert('favorites', fav.id, { ...fav });
  analytics.track('favorite_added', {});
  return true;
}

export function removeFavorite(id: string): void {
  const existing = getState().favorites[id];
  if (!existing) return;
  const removed = { ...existing, deleted_at: nowIso(), updated_at: nowIso() };
  setState(s => ({ favorites: { ...s.favorites, [id]: removed } }));
  enqueueUpsert('favorites', id, { ...removed });
}

// ---------------------------------------------------------------------------
// Set Today's Total (manual daily override)
// ---------------------------------------------------------------------------

/** Sets (not adds) the day's total. Individual logs are kept and still visible in history. */
export function setDailyOverride(date: LocalDate, proteinTotalG: number): DailyOverride {
  const state = getState();
  const existing =
    overrideForDate(state.overrides, date) ?? Object.values(state.overrides).find(o => o.log_date === date) ?? null;
  const now = nowIso();
  const override: DailyOverride = existing
    ? { ...existing, protein_total_g: round1(proteinTotalG), deleted_at: null, updated_at: now }
    : {
        id: uuid(),
        user_id: state.userId,
        log_date: date,
        protein_total_g: round1(proteinTotalG),
        created_at: now,
        updated_at: now,
        deleted_at: null,
      };
  setState(s => ({ overrides: { ...s.overrides, [override.id]: override } }));
  enqueueUpsert('daily_overrides', override.id, { ...override });
  analytics.track('daily_total_set', {
    protein_g: override.protein_total_g,
    had_entries: logsForDate(state.logs, date).length > 0,
  });
  return override;
}

/** Returns to the calculated food-log total. */
export function removeDailyOverride(date: LocalDate): void {
  const existing = overrideForDate(getState().overrides, date);
  if (!existing) return;
  const removed = { ...existing, deleted_at: nowIso(), updated_at: nowIso() };
  setState(s => ({ overrides: { ...s.overrides, [removed.id]: removed } }));
  enqueueUpsert('daily_overrides', removed.id, { ...removed });
  analytics.track('daily_total_removed', {});
}

// ---------------------------------------------------------------------------
// Custom foods
// ---------------------------------------------------------------------------

export interface CustomFoodInput {
  food_name: string;
  serving_description: string;
  protein_g: number;
  calories: number | null;
  notes: string | null;
}

export function saveCustomFood(input: CustomFoodInput, existingId?: string): CustomFood {
  const state = getState();
  const now = nowIso();
  const existing = existingId ? state.customFoods[existingId] : undefined;
  const food: CustomFood = {
    id: existing?.id ?? uuid(),
    user_id: state.userId,
    food_name: input.food_name.trim(),
    serving_description: input.serving_description.trim() || '1 serving',
    protein_g: round1(input.protein_g),
    calories: input.calories === null ? null : round1(input.calories),
    carbs_g: existing?.carbs_g ?? null,
    fat_g: existing?.fat_g ?? null,
    notes: input.notes?.trim() || null,
    created_at: existing?.created_at ?? now,
    updated_at: now,
    deleted_at: null,
  };
  setState(s => ({ customFoods: { ...s.customFoods, [food.id]: food } }));
  enqueueUpsert('custom_foods', food.id, { ...food });
  if (!existing) analytics.track('custom_food_created', {});
  return food;
}

export function deleteCustomFood(id: string): void {
  const existing = getState().customFoods[id];
  if (!existing) return;
  const removed = { ...existing, deleted_at: nowIso(), updated_at: nowIso() };
  setState(s => ({ customFoods: { ...s.customFoods, [id]: removed } }));
  enqueueUpsert('custom_foods', id, { ...removed });
}

// ---------------------------------------------------------------------------
// Copy meals / saved meals
// ---------------------------------------------------------------------------

function logToLoggable(log: FoodLog): LoggableFood {
  return {
    food_name: log.food_name,
    brand: log.brand,
    serving_quantity: log.serving_quantity,
    serving_unit: log.serving_unit,
    serving_description: '',
    serving_grams: null,
    protein_g: log.protein_g,
    calories: log.calories,
    carbs_g: log.carbs_g,
    fat_g: log.fat_g,
    external_provider: log.external_provider,
    external_food_id: log.external_food_id,
    custom_food_id: log.custom_food_id,
    barcode: null,
  };
}

export function copyLogsToDate(logs: FoodLog[], toDate: LocalDate, meal?: MealType | null): FoodLog[] {
  const created = addFoodLogs(
    logs.map(log => ({ food: logToLoggable(log), meal: meal === undefined ? log.meal_type : meal, date: toDate, source: 'copy' as const })),
  );
  analytics.track('meal_copied', { items: logs.length });
  return created;
}

export function saveMealFromLogs(name: string, logs: FoodLog[], defaultMeal: MealType | null): SavedMeal {
  const { userId } = getState();
  const now = nowIso();
  const meal: SavedMeal = {
    id: uuid(),
    user_id: userId,
    name: name.trim(),
    default_meal_type: defaultMeal,
    created_at: now,
    updated_at: now,
    deleted_at: null,
  };
  const items: SavedMealItem[] = logs.map((log, position) => ({
    id: uuid(),
    saved_meal_id: meal.id,
    user_id: userId,
    position,
    ...logToLoggableSnapshot(log),
    created_at: now,
    updated_at: now,
  }));
  setState(s => ({
    savedMeals: { ...s.savedMeals, [meal.id]: meal },
    savedMealItems: { ...s.savedMealItems, ...Object.fromEntries(items.map(i => [i.id, i])) },
  }));
  enqueueUpsert('saved_meals', meal.id, { ...meal });
  for (const item of items) enqueueUpsert('saved_meal_items', item.id, { ...item });
  analytics.track('saved_meal_created', { items: items.length });
  return meal;
}

function logToLoggableSnapshot(log: FoodLog) {
  const { serving_description: _d, serving_grams: _g, barcode: _b, ...snapshot } = logToLoggable(log);
  return snapshot;
}

export function logSavedMeal(savedMealId: string, date: LocalDate, meal: MealType | null): FoodLog[] {
  const state = getState();
  const saved = state.savedMeals[savedMealId];
  if (!saved) return [];
  const items = Object.values(state.savedMealItems)
    .filter(i => i.saved_meal_id === savedMealId)
    .sort((a, b) => a.position - b.position);
  const created = addFoodLogs(
    items.map(item => ({
      food: { ...item, serving_description: '', serving_grams: null, barcode: null },
      meal: meal ?? saved.default_meal_type,
      date,
      source: 'saved_meal' as const,
    })),
  );
  analytics.track('saved_meal_logged', { items: created.length });
  return created;
}
