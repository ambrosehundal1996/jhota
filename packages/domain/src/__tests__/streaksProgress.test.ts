import { describe, expect, it } from 'vitest';
import {
  buildInsights,
  computeGoalStreak,
  computeTotalsByDate,
  computeTrackingStreak,
  weeklySummary,
} from '..';

const TODAY = '2026-10-09';

describe('streaks', () => {
  const totals = {
    '2026-10-05': 140,
    '2026-10-06': 118,
    '2026-10-07': 134,
    '2026-10-08': 165,
  };

  it('goal streak counts consecutive days at or above the minimum', () => {
    // Today not yet reached: streak runs through yesterday.
    expect(computeGoalStreak(totals, TODAY, 130)).toBe(2);
  });

  it('today counts once reached', () => {
    expect(computeGoalStreak({ ...totals, [TODAY]: 131 }, TODAY, 130)).toBe(3);
  });

  it('going above the max still counts', () => {
    expect(computeGoalStreak({ '2026-10-08': 400, [TODAY]: 300 }, TODAY, 130)).toBe(2);
  });

  it('manual daily totals count toward streaks', () => {
    const byDate = computeTotalsByDate(
      [{ protein_g: 40, deleted_at: null, log_date: '2026-10-08' }],
      [{ protein_total_g: 135, deleted_at: null, log_date: '2026-10-08' }],
    );
    expect(computeGoalStreak(byDate, TODAY, 130)).toBe(1);
  });

  it('recalculates when a past day is edited', () => {
    const edited = { ...totals, '2026-10-06': 132 };
    expect(computeGoalStreak(edited, TODAY, 130)).toBe(4);
  });

  it('tracking streak only needs some protein recorded', () => {
    expect(computeTrackingStreak(totals, TODAY)).toBe(4);
    expect(computeTrackingStreak({}, TODAY)).toBe(0);
  });
});

describe('weekly summary', () => {
  const range = { min: 130, max: 150 };

  it('averages tracked days and counts goal days', () => {
    const summary = weeklySummary(
      { '2026-10-03': 146, '2026-10-04': 152, '2026-10-05': 158, '2026-10-06': 121, '2026-10-07': 155, '2026-10-08': 150, [TODAY]: 151 },
      TODAY,
      range,
    );
    expect(summary.days).toHaveLength(7);
    expect(summary.days[0]?.date).toBe('2026-10-03');
    expect(summary.average).toBe(148);
    expect(summary.goalDays).toBe(6);
  });

  it('insights avoid judgmental language', () => {
    const summary = weeklySummary({ [TODAY]: 100, '2026-10-08': 90 }, TODAY, range);
    const text = buildInsights(summary, range).map(i => i.text).join(' ').toLowerCase();
    for (const word of ['fail', 'missed', 'bad', 'should have']) expect(text).not.toContain(word);
    expect(text).toContain('95g of protein per day');
  });

  it('empty week has a helpful insight', () => {
    const summary = weeklySummary({}, TODAY, range);
    expect(summary.average).toBeNull();
    expect(buildInsights(summary, range)[0]?.id).toBe('empty');
  });
});
