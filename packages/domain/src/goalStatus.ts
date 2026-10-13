import type { ProteinRange } from './types';
import { roundTo } from './units';

export type GoalState = 'not_started' | 'in_progress' | 'reached';

export interface GoalStatus {
  state: GoalState;
  reached: boolean;
  /** Grams still needed to reach the minimum. 0 once reached. */
  toGoal: number;
  /** 0–1, capped at 1, for the progress ring (measured against the minimum). */
  progress: number;
  /** Whole-number percent of the minimum, uncapped (e.g. 110 when above). */
  percentOfGoal: number;
  /** Informational only. Being above the max is never a failure. */
  inGoalZone: boolean;
  aboveMax: boolean;
}

/** protein_goal_min is the success threshold; anything at or above it is success. */
export function isGoalReached(total: number, range: ProteinRange): boolean {
  return total >= range.min;
}

export function goalStatus(total: number, range: ProteinRange): GoalStatus {
  const reached = isGoalReached(total, range);
  const safeMin = range.min > 0 ? range.min : 1;
  return {
    state: reached ? 'reached' : total > 0 ? 'in_progress' : 'not_started',
    reached,
    toGoal: reached ? 0 : Math.ceil(roundTo(range.min - total, 1)),
    progress: Math.min(1, Math.max(0, total / safeMin)),
    percentOfGoal: Math.round((total / safeMin) * 100),
    inGoalZone: reached && total <= range.max,
    aboveMax: total > range.max,
  };
}
