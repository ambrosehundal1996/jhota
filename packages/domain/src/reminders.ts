import { addDays, toLocalDate } from './dates';
import type { LocalDate } from './types';

export interface ReminderPreferences {
  enabled: boolean;
  morning9am: boolean;
  zeroLog2pm: boolean;
  remaining4pm: boolean;
  remaining7pm: boolean;
  zeroLog8pm: boolean;
  progressReminder: boolean;
}

export const DEFAULT_REMINDER_PREFERENCES: ReminderPreferences = {
  enabled: true,
  morning9am: true,
  zeroLog2pm: true,
  remaining4pm: true,
  remaining7pm: true,
  zeroLog8pm: true,
  progressReminder: false,
};

export type ReminderKind = 'morning_9am' | 'zero_log_2pm' | 'remaining_4pm' | 'remaining_7pm' | 'zero_log_8pm' | 'progress';

export const REMINDER_TIMES: Record<ReminderKind, { hour: number; minute: number }> = {
  morning_9am: { hour: 9, minute: 0 },
  zero_log_2pm: { hour: 14, minute: 0 },
  remaining_4pm: { hour: 16, minute: 0 },
  remaining_7pm: { hour: 19, minute: 0 },
  zero_log_8pm: { hour: 20, minute: 0 },
  progress: { hour: 20, minute: 0 },
};

export interface PlannedReminder {
  id: string;
  kind: ReminderKind;
  date: LocalDate;
  fireAt: Date;
  title: string;
  body: string;
  link: string;
}

export function isZeroLogReminderEligible(args: {
  totalToday: number;
  prefs: ReminderPreferences;
  kind: 'morning_9am' | 'zero_log_2pm' | 'zero_log_8pm';
}): boolean {
  const { totalToday, prefs, kind } = args;
  if (!prefs.enabled || totalToday !== 0) return false;
  if (kind === 'morning_9am') return prefs.morning9am;
  return kind === 'zero_log_2pm' ? prefs.zeroLog2pm : prefs.zeroLog8pm;
}

export function isRemainingReminderEligible(args: {
  totalToday: number;
  goalMin: number;
  prefs: ReminderPreferences;
  kind: 'remaining_4pm' | 'remaining_7pm';
}): boolean {
  const { totalToday, goalMin, prefs, kind } = args;
  if (!prefs.enabled || goalMin <= 0 || totalToday >= goalMin) return false;
  return kind === 'remaining_4pm' ? prefs.remaining4pm : prefs.remaining7pm;
}

export function isProgressReminderEligible(args: {
  totalToday: number;
  goalMin: number;
  prefs: ReminderPreferences;
}): boolean {
  const { totalToday, goalMin, prefs } = args;
  return prefs.enabled && prefs.progressReminder && totalToday > 0 && totalToday < goalMin;
}

export function reminderCopy(kind: ReminderKind, toGoal = 0): { title: string; body: string } {
  switch (kind) {
    case 'morning_9am':
      return {
        title: 'New day, fresh start',
        body: toGoal > 0 ? `Today’s goal is ${toGoal}g. Log as you go.` : 'Log as you go today.',
      };
    case 'zero_log_2pm':
      return { title: 'Nothing logged yet today.', body: 'Takes about 5 seconds to log.' };
    case 'remaining_4pm':
    case 'remaining_7pm':
      return {
        title: `${toGoal}g of protein left`,
        body: 'That’s how much you still have to eat today.',
      };
    case 'zero_log_8pm':
      return {
        title: 'Quick estimate for today?',
        body: 'Skip the food-by-food. Set your protein total in one step.',
      };
    case 'progress':
      return toGoal <= 25
        ? { title: 'Almost there', body: `${toGoal}g of protein left to hit your goal today.` }
        : { title: `${toGoal}g to go`, body: `You're ${toGoal}g away from today's protein goal.` };
  }
}

function atTime(date: LocalDate, kind: ReminderKind): Date {
  const [y, m, d] = date.split('-').map(Number);
  const { hour, minute } = REMINDER_TIMES[kind];
  return new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1, hour, minute, 0, 0);
}

function gramsLeft(goalMin: number, total: number): number {
  return Math.max(0, Math.ceil(goalMin - total));
}

/**
 * Plans the full rolling schedule of local notifications. iOS cannot run app code at 2 PM,
 * so the app re-plans whenever today's total changes or the app foregrounds: future days
 * always get zero-log reminders (nothing can be logged there yet), and today's are dropped
 * as soon as anything is recorded. Remaining-protein reminders keep a fresh gram count
 * because they are cancelled and rescheduled on every plan.
 */
export function planReminders(args: {
  now: Date;
  totalToday: number;
  goalMin: number;
  prefs: ReminderPreferences;
  days?: number;
}): PlannedReminder[] {
  const { now, totalToday, goalMin, prefs, days = 7 } = args;
  if (!prefs.enabled) return [];
  const today = toLocalDate(now);
  const planned: PlannedReminder[] = [];

  for (let i = 0; i < days; i++) {
    const date = addDays(today, i);
    const totalForDay = i === 0 ? totalToday : 0;
    const toGoal = gramsLeft(goalMin, totalForDay);

    for (const kind of ['morning_9am', 'zero_log_2pm', 'zero_log_8pm'] as const) {
      if (!isZeroLogReminderEligible({ totalToday: totalForDay, prefs, kind })) continue;
      const fireAt = atTime(date, kind);
      if (fireAt <= now) continue;
      planned.push({
        id: `${kind}-${date}`,
        kind,
        date,
        fireAt,
        ...reminderCopy(kind, toGoal),
        link: kind === 'zero_log_8pm' ? 'jota://log/set-total?src=notification' : 'jota://log?src=notification',
      });
    }

    for (const kind of ['remaining_4pm', 'remaining_7pm'] as const) {
      if (!isRemainingReminderEligible({ totalToday: totalForDay, goalMin, prefs, kind })) continue;
      const fireAt = atTime(date, kind);
      if (fireAt <= now) continue;
      planned.push({
        id: `${kind}-${date}`,
        kind,
        date,
        fireAt,
        ...reminderCopy(kind, toGoal),
        link: 'jota://log?src=notification',
      });
    }
  }

  if (isProgressReminderEligible({ totalToday, goalMin, prefs })) {
    const fireAt = atTime(today, 'progress');
    if (fireAt > now) {
      planned.push({
        id: `progress-${today}`,
        kind: 'progress',
        date: today,
        fireAt,
        ...reminderCopy('progress', gramsLeft(goalMin, totalToday)),
        link: 'jota://log?src=notification',
      });
    }
  }

  return planned.sort((a, b) => a.fireAt.getTime() - b.fireAt.getTime());
}
