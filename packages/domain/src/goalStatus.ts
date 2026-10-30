import type { ProteinRange } from './types';
import { roundTo } from './units';

export type GoalState = 'not_started' | 'in_progress' | 'reached';

export interface GoalStatus {
  state: GoalState;
  reached: boolean;
  /** Grams still needed to reach the minimum. 0 once reached. */
  toGoal: number;
  /** 0–1, capped at 1, measured against the minimum. */
  progress: number;
  /** Whole-number percent of the minimum, uncapped (e.g. 110 when above). */
  percentOfGoal: number;
  /** Informational only. Being above the max is never a failure. */
  inGoalZone: boolean;
  aboveMax: boolean;
  /** True when today’s total is essentially the lower bound. */
  atLowerBound: boolean;
}

/** protein_goal_min is the success threshold; anything at or above it is success. */
export function isGoalReached(total: number, range: ProteinRange): boolean {
  return total >= range.min;
}

export function goalStatus(total: number, range: ProteinRange): GoalStatus {
  const consumed = Number.isFinite(total) ? Math.max(0, total) : 0;
  const min = Number.isFinite(range.min) ? range.min : 0;
  const max = Number.isFinite(range.max) ? range.max : min;
  const reached = isGoalReached(consumed, { min, max });
  const safeMin = min > 0 ? min : 1;
  return {
    state: reached ? 'reached' : consumed > 0 ? 'in_progress' : 'not_started',
    reached,
    toGoal: reached ? 0 : Math.ceil(roundTo(min - consumed, 1)),
    progress: Math.min(1, Math.max(0, consumed / safeMin)),
    percentOfGoal: Math.round((consumed / safeMin) * 100),
    inGoalZone: reached && consumed <= max,
    aboveMax: consumed > max,
    atLowerBound: reached && Math.abs(consumed - min) < 0.5,
  };
}

/**
 * Dashboard copy for the day’s range. Hitting the minimum is success;
 * going above the maximum is never framed as failure.
 */
export function goalStatusHeadline(status: GoalStatus): string {
  if (status.state === 'not_started') return 'Let’s make some progress today.';
  if (!status.reached) return `${status.toGoal}g until you reach your goal.`;
  if (status.aboveMax) return 'Goal reached! Great consistency.';
  if (status.atLowerBound) return 'Goal reached! Nice work.';
  return 'You’re in your protein range!';
}
