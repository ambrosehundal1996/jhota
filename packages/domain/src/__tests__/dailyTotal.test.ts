import { describe, expect, it } from 'vitest';
import { computeDailyTotal, computeTotalsByDate, goalStatus, isGoalReached } from '..';

const log = (protein_g: number, deleted = false, log_date = '2026-10-09') => ({
  protein_g,
  deleted_at: deleted ? '2026-10-09T12:00:00Z' : null,
  log_date,
});

describe('computeDailyTotal', () => {
  it('sums non-deleted food logs', () => {
    expect(computeDailyTotal([log(28), log(42), log(30), log(99, true)])).toEqual({
      total: 100,
      loggedTotal: 100,
      source: 'logs',
      entryCount: 3,
    });
  });

  it('a manual override replaces (does not add to) the logged total', () => {
    const result = computeDailyTotal([log(28), log(42), log(30)], { protein_total_g: 137, deleted_at: null });
    expect(result).toMatchObject({ total: 137, loggedTotal: 100, source: 'override' });
  });

  it('override works with no logs at all', () => {
    expect(computeDailyTotal([], { protein_total_g: 135, deleted_at: null })).toMatchObject({
      total: 135,
      source: 'override',
    });
  });

  it('removing the override returns to the calculated total', () => {
    const removed = { protein_total_g: 137, deleted_at: '2026-10-09T23:00:00Z' };
    expect(computeDailyTotal([log(28), log(42), log(30)], removed)).toMatchObject({
      total: 100,
      source: 'logs',
    });
  });

  it('computes per-date totals honoring overrides', () => {
    const totals = computeTotalsByDate(
      [log(50, false, '2026-10-07'), log(20, false, '2026-10-08'), log(30, false, '2026-10-08')],
      [{ protein_total_g: 140, deleted_at: null, log_date: '2026-10-08' }],
    );
    expect(totals).toEqual({ '2026-10-07': 50, '2026-10-08': 140 });
  });
});

describe('goal status', () => {
  const range = { min: 130, max: 150 };

  it.each([
    [129, false],
    [130, true],
    [145, true],
    [150, true],
    [165, true],
  ])('%ig against 130–150g → reached=%s', (total, reached) => {
    expect(isGoalReached(total, range)).toBe(reached);
    expect(goalStatus(total, range).reached).toBe(reached);
  });

  it('going above the max is never a failure state', () => {
    const status = goalStatus(220, range);
    expect(status.state).toBe('reached');
    expect(status.reached).toBe(true);
    expect(status.toGoal).toBe(0);
    expect(status.progress).toBe(1);
    expect(status.aboveMax).toBe(true);
  });

  it('reports grams to goal against the minimum', () => {
    expect(goalStatus(92, range)).toMatchObject({ toGoal: 38, state: 'in_progress', reached: false });
    expect(goalStatus(0, { min: 125, max: 180 })).toMatchObject({ toGoal: 125, state: 'not_started' });
  });

  it('matches the day-1 scenario from the spec', () => {
    const r = { min: 125, max: 180 };
    expect(goalStatus(28, r).toGoal).toBe(97);
    expect(goalStatus(70, r).toGoal).toBe(55);
    expect(goalStatus(100, r).toGoal).toBe(25);
    expect(goalStatus(137, r).reached).toBe(true);
  });
});
