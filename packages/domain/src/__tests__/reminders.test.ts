import { describe, expect, it } from 'vitest';
import {
  DEFAULT_REMINDER_PREFERENCES,
  isZeroLogReminderEligible,
  planReminders,
  type ReminderPreferences,
} from '..';

const prefs: ReminderPreferences = { ...DEFAULT_REMINDER_PREFERENCES };
const morning = new Date(2026, 9, 9, 9, 0);

describe('zero-log reminder eligibility', () => {
  it('eligible when nothing is logged', () => {
    expect(isZeroLogReminderEligible({ totalToday: 0, prefs, kind: 'zero_log_2pm' })).toBe(true);
  });

  it('not eligible once anything is logged', () => {
    expect(isZeroLogReminderEligible({ totalToday: 20, prefs, kind: 'zero_log_2pm' })).toBe(false);
  });

  it('respects preferences', () => {
    expect(isZeroLogReminderEligible({ totalToday: 0, prefs: { ...prefs, enabled: false }, kind: 'zero_log_2pm' })).toBe(false);
    expect(isZeroLogReminderEligible({ totalToday: 0, prefs, kind: 'zero_log_7pm' })).toBe(false);
    expect(
      isZeroLogReminderEligible({ totalToday: 0, prefs: { ...prefs, zeroLog7pm: true }, kind: 'zero_log_7pm' }),
    ).toBe(true);
  });
});

describe('planReminders', () => {
  it('schedules a 2 PM zero-log reminder today and for the next days', () => {
    const plan = planReminders({ now: morning, totalToday: 0, goalMin: 125, prefs });
    expect(plan).toHaveLength(7);
    expect(plan[0]).toMatchObject({
      id: 'zero_log_2pm-2026-10-09',
      title: 'Nothing logged yet today.',
      body: 'Even a quick estimate keeps you on track.',
      link: 'steady://log?src=notification',
    });
    expect(plan[0]?.fireAt.getHours()).toBe(14);
  });

  it('drops today’s reminder once 20g is logged before 2 PM, keeping future days', () => {
    const plan = planReminders({ now: morning, totalToday: 20, goalMin: 125, prefs });
    expect(plan.find(p => p.date === '2026-10-09')).toBeUndefined();
    expect(plan[0]?.date).toBe('2026-10-10');
  });

  it('skips reminders whose time has passed', () => {
    const afternoon = new Date(2026, 9, 9, 15, 0);
    const plan = planReminders({ now: afternoon, totalToday: 0, goalMin: 125, prefs });
    expect(plan[0]?.date).toBe('2026-10-10');
  });

  it('includes the optional 7 PM reminder only when enabled', () => {
    const plan = planReminders({ now: morning, totalToday: 0, goalMin: 125, prefs: { ...prefs, zeroLog7pm: true } });
    expect(plan.filter(p => p.date === '2026-10-09').map(p => p.kind)).toEqual(['zero_log_2pm', 'zero_log_7pm']);
  });

  it('progress reminder uses fresh copy and only when behind', () => {
    const p = { ...prefs, progressReminder: true };
    const behind = planReminders({ now: morning, totalToday: 93, goalMin: 125, prefs: p });
    expect(behind.find(r => r.kind === 'progress')).toMatchObject({ title: '32g to go' });
    const reached = planReminders({ now: morning, totalToday: 130, goalMin: 125, prefs: p });
    expect(reached.find(r => r.kind === 'progress')).toBeUndefined();
  });

  it('plans nothing when reminders are off', () => {
    expect(planReminders({ now: morning, totalToday: 0, goalMin: 125, prefs: { ...prefs, enabled: false } })).toEqual([]);
  });
});
