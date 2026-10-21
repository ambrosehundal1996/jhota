import type { ReminderPreferences } from '@jota/domain';
import type { NotificationPreferences } from '../../types/models';

/** Local scheduled reminders are iOS-only; the web build hides reminder settings. */
export const remindersSupported = false;

export function toReminderPrefs(prefs: NotificationPreferences): ReminderPreferences {
  return {
    enabled: prefs.enabled,
    morning9am: prefs.morning_9am !== false,
    zeroLog2pm: prefs.zero_log_2pm,
    remaining4pm: prefs.remaining_4pm !== false,
    remaining7pm: prefs.remaining_7pm !== false,
    zeroLog8pm: prefs.zero_log_8pm !== false,
    progressReminder: prefs.progress_reminder,
  };
}

export type PermissionResult = 'granted' | 'denied' | 'not_determined';

export const getPermissionStatus = async (): Promise<PermissionResult> => 'denied';
export const requestPermission = async (): Promise<PermissionResult> => 'denied';
export const syncReminders = async (): Promise<void> => undefined;
export const reportDeliveredReminders = async (): Promise<void> => undefined;
