import type { ReminderPreferences } from '@steady/domain';
import type { NotificationPreferences } from '../../types/models';

/** Local scheduled reminders are iOS-only; the web build hides reminder settings. */
export const remindersSupported = false;

export function toReminderPrefs(prefs: NotificationPreferences): ReminderPreferences {
  return {
    enabled: prefs.enabled,
    zeroLog2pm: prefs.zero_log_2pm,
    zeroLog7pm: prefs.zero_log_7pm,
    progressReminder: prefs.progress_reminder,
  };
}

export type PermissionResult = 'granted' | 'denied' | 'not_determined';

export const getPermissionStatus = async (): Promise<PermissionResult> => 'denied';
export const requestPermission = async (): Promise<PermissionResult> => 'denied';
export const syncReminders = async (): Promise<void> => undefined;
export const reportDeliveredReminders = async (): Promise<void> => undefined;
