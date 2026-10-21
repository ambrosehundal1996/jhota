import type { LocalDate } from './types';

export interface CelebrationInput {
  prevTotal: number;
  newTotal: number;
  target: number;
  lastCelebratedDate: LocalDate | null;
  today: LocalDate;
}

/** True only when today's total first crosses the target. Never re-fires the same local day. */
export function shouldCelebrate(input: CelebrationInput): boolean {
  const { prevTotal, newTotal, target, lastCelebratedDate, today } = input;
  if (!(target > 0)) return false;
  if (lastCelebratedDate === today) return false;
  return prevTotal < target && newTotal >= target;
}

export interface HalfwayInput {
  prevTotal: number;
  newTotal: number;
  target: number;
  lastHalfwayDate: LocalDate | null;
  today: LocalDate;
}

/**
 * True when today's total first crosses 50% of the target.
 * A log that also crosses 100% skips this so only the goal celebration fires.
 */
export function shouldCelebrateHalfway(input: HalfwayInput): boolean {
  const { prevTotal, newTotal, target, lastHalfwayDate, today } = input;
  if (!(target > 0)) return false;
  if (lastHalfwayDate === today) return false;
  if (prevTotal < target && newTotal >= target) return false;
  const half = target / 2;
  return prevTotal < half && newTotal >= half;
}

/** Copy for the floating "+32g · 38g to go" chip. */
export function logDeltaLabel(grams: number, newTotal: number, target: number): string {
  const delta = Math.round(grams);
  if (target > 0 && newTotal >= target) {
    const over = Math.round(newTotal - target);
    return `+${delta}g · ${over}g over`;
  }
  const left = Math.max(0, Math.round(target - newTotal));
  return `+${delta}g · ${left}g to go`;
}
