import type { DailyOverride, FoodLog, LocalDate } from './types';
import { roundTo } from './units';

type LogLike = Pick<FoodLog, 'protein_g' | 'deleted_at'>;
type OverrideLike = Pick<DailyOverride, 'protein_total_g' | 'deleted_at'>;

export interface DailyTotal {
  total: number;
  /** Sum of individual entries, regardless of any override. */
  loggedTotal: number;
  source: 'logs' | 'override';
  entryCount: number;
}

export function sumLoggedProtein(logs: readonly LogLike[]): number {
  return roundTo(
    logs.reduce((sum, log) => (log.deleted_at ? sum : sum + log.protein_g), 0),
    1,
  );
}

/** If a daily override exists it is the day's total; otherwise the sum of food logs. */
export function computeDailyTotal(
  logs: readonly LogLike[],
  override?: OverrideLike | null,
): DailyTotal {
  const live = logs.filter(log => !log.deleted_at);
  const loggedTotal = sumLoggedProtein(live);
  const activeOverride = override && !override.deleted_at ? override : null;
  return {
    total: activeOverride ? roundTo(activeOverride.protein_total_g, 1) : loggedTotal,
    loggedTotal,
    source: activeOverride ? 'override' : 'logs',
    entryCount: live.length,
  };
}

export function computeTotalsByDate(
  logs: readonly Pick<FoodLog, 'protein_g' | 'deleted_at' | 'log_date'>[],
  overrides: readonly Pick<DailyOverride, 'protein_total_g' | 'deleted_at' | 'log_date'>[],
): Record<LocalDate, number> {
  const logsByDate = new Map<LocalDate, LogLike[]>();
  for (const log of logs) {
    if (log.deleted_at) continue;
    const list = logsByDate.get(log.log_date) ?? [];
    list.push(log);
    logsByDate.set(log.log_date, list);
  }
  const overrideByDate = new Map<LocalDate, OverrideLike>();
  for (const override of overrides) {
    if (!override.deleted_at) overrideByDate.set(override.log_date, override);
  }
  const dates = new Set<LocalDate>([...logsByDate.keys(), ...overrideByDate.keys()]);
  const totals: Record<LocalDate, number> = {};
  for (const date of dates) {
    totals[date] = computeDailyTotal(logsByDate.get(date) ?? [], overrideByDate.get(date)).total;
  }
  return totals;
}
