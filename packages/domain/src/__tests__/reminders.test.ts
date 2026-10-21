import { describe, expect, it } from 'vitest';
import {
  DEFAULT_REMINDER_PREFERENCES,
  isRemainingReminderEligible,
  isZeroLogReminderEligible,
  planReminders,
  type ReminderPreferences,
} from '..';

const prefs: ReminderPreferences = { ...DEFAULT_REMINDER_PREFERENCES };
const only2pm: ReminderPreferences = { ...prefs, morning9am: false, zeroLog8pm: false, remaining4pm: false, remaining7pm: false };
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
    expect(isZeroLogReminderEligible({ totalToday: 0, prefs: { ...prefs, zeroLog2pm: false }, kind: 'zero_log_2pm' })).toBe(false);
  });
});

describe('remaining reminder eligibility', () => {
  it('eligible while behind the goal, including zero logged', () => {
    expect(isRemainingReminderEligible({ totalToday: 0, goalMin: 125, prefs, kind: 'remaining_4pm' })).toBe(true);
    expect(isRemainingReminderEligible({ totalToday: 80, goalMin: 125, prefs, kind: 'remaining_7pm' })).toBe(true);
  });

  it('not eligible once the goal is reached', () => {
    expect(isRemainingReminderEligible({ totalToday: 125, goalMin: 125, prefs, kind: 'remaining_4pm' })).toBe(false);
  });

  it('respects preferences', () => {
    expect(
      isRemainingReminderEligible({ totalToday: 0, goalMin: 125, prefs: { ...prefs, remaining4pm: false }, kind: 'remaining_4pm' }),
    ).toBe(false);
  });
});

describe('planReminders', () => {
  it('schedules a 2 PM zero-log reminder today and for the next days', () => {
    const plan = planReminders({ now: morning, totalToday: 0, goalMin: 125, prefs: only2pm });
    expect(plan).toHaveLength(7);
    expect(plan[0]).toMatchObject({
      id: 'zero_log_2pm-2026-10-09',
      title: 'Nothing logged yet today.',
      body: 'Takes about 5 seconds to log.',
      link: 'jota://log?src=notification',
    });
    expect(plan[0]?.fireAt.getHours()).toBe(14);
  });

  it('schedules a 9 AM morning reminder with today’s goal, skipped once anything is logged', () => {
    const early = new Date(2026, 9, 9, 7, 0);
    const p = { ...only2pm, zeroLog2pm: false, morning9am: true };
    const plan = planReminders({ now: early, totalToday: 0, goalMin: 125, prefs: p });
    expect(plan[0]).toMatchObject({
      id: 'morning_9am-2026-10-09',
      title: 'New day, fresh start',
      body: 'Today’s goal is 125g. Log as you go.',
      link: 'jota://log?src=notification',
    });
    expect(plan[0]?.fireAt.getHours()).toBe(9);
    const logged = planReminders({ now: early, totalToday: 30, goalMin: 125, prefs: p });
    expect(logged[0]?.date).toBe('2026-10-10');
  });

  it('schedules an 8 PM set-total reminder only when nothing is logged', () => {
    const p = { ...only2pm, zeroLog2pm: false, zeroLog8pm: true };
    const plan = planReminders({ now: morning, totalToday: 0, goalMin: 125, prefs: p });
    expect(plan[0]).toMatchObject({
      id: 'zero_log_8pm-2026-10-09',
      title: 'Quick estimate for today?',
      body: 'Skip the food-by-food. Set your protein total in one step.',
      link: 'jota://log/set-total?src=notification',
    });
    expect(plan[0]?.fireAt.getHours()).toBe(20);
    const logged = planReminders({ now: morning, totalToday: 10, goalMin: 125, prefs: p });
    expect(logged.find(r => r.date === '2026-10-09')).toBeUndefined();
  });

  it('drops today’s 2 PM reminder once 20g is logged before 2 PM, keeping future days', () => {
    const plan = planReminders({
      now: morning,
      totalToday: 20,
      goalMin: 125,
      prefs: only2pm,
    });
    expect(plan.find(p => p.date === '2026-10-09')).toBeUndefined();
    expect(plan[0]?.date).toBe('2026-10-10');
  });

  it('skips reminders whose time has passed', () => {
    const afternoon = new Date(2026, 9, 9, 15, 0);
    const plan = planReminders({
      now: afternoon,
      totalToday: 0,
      goalMin: 125,
      prefs: only2pm,
    });
    expect(plan[0]?.date).toBe('2026-10-10');
  });

  it('includes 4 PM and 7 PM remaining-protein reminders with grams left', () => {
    const plan = planReminders({ now: morning, totalToday: 80, goalMin: 125, prefs });
    const today = plan.filter(p => p.date === '2026-10-09');
    expect(today.map(p => p.kind)).toEqual(['remaining_4pm', 'remaining_7pm']);
    expect(today[0]).toMatchObject({
      title: '45g of protein left',
      body: 'That’s how much you still have to eat today.',
    });
    expect(today[0]?.fireAt.getHours()).toBe(16);
    expect(today[1]?.fireAt.getHours()).toBe(19);
  });

  it('skips remaining reminders after the goal is reached', () => {
    const plan = planReminders({ now: morning, totalToday: 130, goalMin: 125, prefs });
    expect(plan.filter(p => p.date === '2026-10-09')).toEqual([]);
  });

  it('progress reminder uses fresh copy and only when behind', () => {
    const p = { ...only2pm, progressReminder: true };
    const behind = planReminders({ now: morning, totalToday: 93, goalMin: 125, prefs: p });
    expect(behind.find(r => r.kind === 'progress')).toMatchObject({ title: '32g to go' });
    const reached = planReminders({ now: morning, totalToday: 130, goalMin: 125, prefs: p });
    expect(reached.find(r => r.kind === 'progress')).toBeUndefined();
  });

  it('plans nothing when reminders are off', () => {
    expect(planReminders({ now: morning, totalToday: 0, goalMin: 125, prefs: { ...prefs, enabled: false } })).toEqual([]);
  });
});
