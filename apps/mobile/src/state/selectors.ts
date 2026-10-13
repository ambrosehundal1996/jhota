import {
  computeDailyTotal,
  computeTotalsByDate,
  deriveRecentFoods,
  goalStatus,
  MEAL_TYPES,
  type LocalDate,
  type MealType,
  type ProteinRange,
} from '@steady/domain';
import type { DailyOverride, FoodLog } from '../types/models';
import type { AppData } from './appStore';

export const FALLBACK_RANGE: ProteinRange = { min: 120, max: 160 };

export function selectRange(state: Pick<AppData, 'profile'>): ProteinRange {
  const { profile } = state;
  if (profile?.protein_goal_min && profile.protein_goal_max) {
    return { min: profile.protein_goal_min, max: profile.protein_goal_max };
  }
  return FALLBACK_RANGE;
}

export function logsForDate(logs: Record<string, FoodLog>, date: LocalDate): FoodLog[] {
  return Object.values(logs)
    .filter(log => log.log_date === date && !log.deleted_at)
    .sort((a, b) => (a.logged_at < b.logged_at ? -1 : 1));
}

export function overrideForDate(overrides: Record<string, DailyOverride>, date: LocalDate): DailyOverride | null {
  return Object.values(overrides).find(o => o.log_date === date && !o.deleted_at) ?? null;
}

export function selectDay(state: Pick<AppData, 'logs' | 'overrides' | 'profile'>, date: LocalDate) {
  const logs = logsForDate(state.logs, date);
  const override = overrideForDate(state.overrides, date);
  const total = computeDailyTotal(logs, override);
  const range = selectRange(state);
  return { date, logs, override, total, range, status: goalStatus(total.total, range) };
}

export type DaySnapshot = ReturnType<typeof selectDay>;

export interface MealGroup {
  meal: MealType | 'other';
  logs: FoodLog[];
  protein: number;
}

export function groupByMeal(logs: FoodLog[]): MealGroup[] {
  const groups: MealGroup[] = [];
  for (const meal of [...MEAL_TYPES, 'other'] as const) {
    const items = logs.filter(log => (log.meal_type ?? 'other') === meal);
    if (!items.length) continue;
    groups.push({ meal, logs: items, protein: Math.round(items.reduce((sum, l) => sum + l.protein_g, 0)) });
  }
  return groups;
}

export function selectTotalsByDate(state: Pick<AppData, 'logs' | 'overrides'>): Record<LocalDate, number> {
  return computeTotalsByDate(Object.values(state.logs), Object.values(state.overrides));
}

export function selectRecents(state: Pick<AppData, 'logs'>, limit = 12) {
  return deriveRecentFoods(Object.values(state.logs), limit);
}

export function selectFavorites(state: Pick<AppData, 'favorites'>) {
  return Object.values(state.favorites)
    .filter(f => !f.deleted_at)
    .sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
}

export function selectCustomFoods(state: Pick<AppData, 'customFoods'>) {
  return Object.values(state.customFoods)
    .filter(f => !f.deleted_at)
    .sort((a, b) => a.food_name.localeCompare(b.food_name));
}

export function findFavorite(
  state: Pick<AppData, 'favorites'>,
  food: { external_provider: string | null; external_food_id: string | null; custom_food_id: string | null; food_name: string },
) {
  return selectFavorites(state).find(f =>
    food.external_food_id
      ? f.external_provider === food.external_provider && f.external_food_id === food.external_food_id
      : food.custom_food_id
        ? f.custom_food_id === food.custom_food_id
        : !f.external_food_id && !f.custom_food_id && f.food_name.toLowerCase() === food.food_name.toLowerCase(),
  );
}

export const MEAL_LABELS: Record<MealType | 'other', string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  snack: 'Snack',
  other: 'Other',
};
