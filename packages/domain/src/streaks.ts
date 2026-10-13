import { addDays } from './dates';
import type { LocalDate } from './types';

export type StreakKind = 'goal' | 'tracking';

/** The day-qualification rule for each streak kind. */
export function dayQualifies(kind: StreakKind, total: number, goalMin: number): boolean {
  return kind === 'goal' ? total >= goalMin : total > 0;
}

/**
 * Consecutive qualifying days ending today. Today counts once it qualifies, but an
 * unfinished today never breaks a streak that ran through yesterday.
 */
export function computeStreak(
  kind: StreakKind,
  totalsByDate: Readonly<Record<LocalDate, number>>,
  today: LocalDate,
  goalMin: number,
): number {
  const qualifies = (date: LocalDate) => dayQualifies(kind, totalsByDate[date] ?? 0, goalMin);
  let cursor = qualifies(today) ? today : addDays(today, -1);
  let streak = 0;
  // Upper bound guards against pathological input; ~10 years of days.
  while (streak < 3660 && qualifies(cursor)) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }
  return streak;
}

export const computeGoalStreak = (
  totalsByDate: Readonly<Record<LocalDate, number>>,
  today: LocalDate,
  goalMin: number,
) => computeStreak('goal', totalsByDate, today, goalMin);

export const computeTrackingStreak = (
  totalsByDate: Readonly<Record<LocalDate, number>>,
  today: LocalDate,
) => computeStreak('tracking', totalsByDate, today, 0);
