import { addDays, toLocalDate } from './dates';
import type { LocalDate } from './types';

export interface ReminderPreferences {
  enabled: boolean;
  zeroLog2pm: boolean;
  zeroLog7pm: boolean;
  progressReminder: boolean;
}

export const DEFAULT_REMINDER_PREFERENCES: ReminderPreferences = {
  enabled: true,
  zeroLog2pm: true,
  zeroLog7pm: false,
  progressReminder: false,
};

export type ReminderKind = 'zero_log_2pm' | 'zero_log_7pm' | 'progress';

export const REMINDER_TIMES: Record<ReminderKind, { hour: number; minute: number }> = {
  zero_log_2pm: { hour: 14, minute: 0 },
  zero_log_7pm: { hour: 19, minute: 0 },
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
  kind: 'zero_log_2pm' | 'zero_log_7pm';
}): boolean {
  const { totalToday, prefs, kind } = args;
  if (!prefs.enabled) return false;
  if (kind === 'zero_log_2pm' && !prefs.zeroLog2pm) return false;
  if (kind === 'zero_log_7pm' && !prefs.zeroLog7pm) return false;
  return totalToday === 0;
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
    case 'zero_log_2pm':
      return { title: 'Nothing logged yet today.', body: 'Even a quick estimate keeps you on track.' };
    case 'zero_log_7pm':
      return {
        title: 'Still time to log today.',
        body: 'Set a rough total in a few seconds to keep your history consistent.',
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

/**
 * Plans the full rolling schedule of local notifications. iOS cannot run app code at 2 PM,
 * so the app re-plans whenever today's total changes or the app foregrounds: future days
 * always get zero-log reminders (nothing can be logged there yet), and today's are dropped
 * as soon as anything is recorded.
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
    for (const kind of ['zero_log_2pm', 'zero_log_7pm'] as const) {
      if (!isZeroLogReminderEligible({ totalToday: totalForDay, prefs, kind })) continue;
      const fireAt = atTime(date, kind);
      if (fireAt <= now) continue;
      planned.push({
        id: `${kind}-${date}`,
        kind,
        date,
        fireAt,
        ...reminderCopy(kind),
        link: 'steady://log?src=notification',
      });
    }
  }

  if (isProgressReminderEligible({ totalToday, goalMin, prefs })) {
    const fireAt = atTime(today, 'progress');
    if (fireAt > now) {
      const toGoal = Math.ceil(goalMin - totalToday);
      planned.push({
        id: `progress-${today}`,
        kind: 'progress',
        date: today,
        fireAt,
        ...reminderCopy('progress', toGoal),
        link: 'steady://log?src=notification',
      });
    }
  }

  return planned.sort((a, b) => a.fireAt.getTime() - b.fireAt.getTime());
}
