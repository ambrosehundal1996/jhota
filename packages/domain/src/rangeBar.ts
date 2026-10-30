import type { ProteinRange } from './types';
import { isGoalReached } from './goalStatus';

export interface RangeBarLayout {
  /** Grams at the right edge of the bar. Always ≥ today’s total and the range max. */
  scaleMax: number;
  /** 0–1 position of the lower bound. */
  minStart: number;
  /** 0–1 position of the upper bound. */
  maxEnd: number;
  /** 0–1 position of today’s total. Never clipped off the bar. */
  current: number;
  reached: boolean;
  aboveMax: boolean;
}

function safeRange(range: ProteinRange): ProteinRange {
  const min = Number.isFinite(range.min) ? Math.max(0, range.min) : 0;
  const max = Number.isFinite(range.max) ? Math.max(min, range.max) : min;
  return { min, max };
}

/**
 * Lays out a 0g-origin bar so the goal range stays visible and today’s total
 * is never clipped, even when it exceeds the upper bound.
 */
export function rangeBarLayout(total: number, range: ProteinRange): RangeBarLayout {
  const { min, max } = safeRange(range);
  const consumed = Number.isFinite(total) ? Math.max(0, total) : 0;
  const span = Math.max(max - min, 1);
  const headroom = Math.max(span * 0.35, max * 0.15, 20);
  const scaleMax = Math.max(max + headroom, consumed, 1);
  const zoneEnd = max <= min ? Math.min(1, (min + span * 0.04) / scaleMax) : max / scaleMax;
  return {
    scaleMax,
    minStart: min / scaleMax,
    maxEnd: zoneEnd,
    current: Math.min(1, consumed / scaleMax),
    reached: isGoalReached(consumed, { min, max }),
    aboveMax: consumed > max,
  };
}
