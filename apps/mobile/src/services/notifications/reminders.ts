import notifee, { AuthorizationStatus, EventType, TriggerType, type Event } from '@notifee/react-native';
import { planReminders, toLocalDate, type ReminderPreferences } from '@jota/domain';
import { analytics } from '../../analytics';
import { getState, setState } from '../../state/appStore';
import { selectDay } from '../../state/selectors';
import type { NotificationPreferences } from '../../types/models';

export const remindersSupported = true;

const REMINDER_PREFIXES = [
  'morning_9am-',
  'zero_log_2pm-',
  'zero_log_7pm-',
  'zero_log_8pm-',
  'remaining_4pm-',
  'remaining_7pm-',
  'progress-',
];
const isOurs = (id: string) => REMINDER_PREFIXES.some(p => id.startsWith(p));
const isZeroLog = (id: string) => id.startsWith('zero_log') || id.startsWith('morning_');
const needsFreshCopy = (id: string) => id.startsWith('progress-') || id.startsWith('remaining_') || id.startsWith('morning_');

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

export async function getPermissionStatus(): Promise<PermissionResult> {
  const settings = await notifee.getNotificationSettings();
  if (settings.authorizationStatus === AuthorizationStatus.NOT_DETERMINED) return 'not_determined';
  return settings.authorizationStatus >= AuthorizationStatus.AUTHORIZED ? 'granted' : 'denied';
}

export async function requestPermission(): Promise<PermissionResult> {
  const settings = await notifee.requestPermission({ alert: true, sound: true, badge: false });
  const granted = settings.authorizationStatus >= AuthorizationStatus.AUTHORIZED;
  analytics.track(granted ? 'notification_permission_granted' : 'notification_permission_denied', {});
  return granted ? 'granted' : 'denied';
}

let pending: Promise<void> | null = null;

/**
 * Re-plans the rolling local schedule from current data. Called whenever today's total or
 * preferences change and on foreground, so the 2 PM reminder is cancelled as soon as anything
 * is logged and future days are always covered.
 */
export function syncReminders(): Promise<void> {
  pending = (pending ?? Promise.resolve()).then(runSync, runSync);
  return pending;
}

async function runSync(): Promise<void> {
  try {
    if ((await getPermissionStatus()) !== 'granted') return;
    const state = getState();
    if (!state.profile?.onboarding_complete) return;
    const today = toLocalDate(new Date());
    const day = selectDay(state, today);
    const plan = planReminders({
      now: new Date(),
      totalToday: day.total.total,
      goalMin: day.range.min,
      prefs: toReminderPrefs(state.notificationPrefs),
    });

    const existing = (await notifee.getTriggerNotificationIds()).filter(isOurs);
    const wanted = new Set(plan.map(p => p.id));
    const stale = existing.filter(id => !wanted.has(id) || needsFreshCopy(id));
    if (stale.length) await notifee.cancelTriggerNotifications(stale);

    const kept = new Set(existing.filter(id => !stale.includes(id)));
    for (const reminder of plan) {
      if (kept.has(reminder.id)) continue;
      await notifee.createTriggerNotification(
        {
          id: reminder.id,
          title: reminder.title,
          body: reminder.body,
          data: { link: reminder.link, kind: reminder.kind },
          ios: { sound: 'default', interruptionLevel: 'active' },
        },
        { type: TriggerType.TIMESTAMP, timestamp: reminder.fireAt.getTime() },
      );
    }
  } catch (error) {
    if (__DEV__) console.warn('[reminders] sync failed', error);
  }
}

/** Reports reminders iOS delivered while the app was closed (zero_log_reminder_sent). */
export async function reportDeliveredReminders(): Promise<void> {
  try {
    const displayed = await notifee.getDisplayedNotifications();
    const reported = new Set(getState().flags.reportedReminderIds);
    const fresh = displayed.map(d => d.id ?? d.notification.id ?? '').filter(id => id && isOurs(id) && !reported.has(id));
    for (const id of fresh) {
      if (isZeroLog(id)) analytics.track('zero_log_reminder_sent', { kind: id.split('-')[0] });
    }
    if (fresh.length) {
      setState(s => ({ flags: { ...s.flags, reportedReminderIds: [...s.flags.reportedReminderIds, ...fresh].slice(-60) } }));
    }
  } catch {
    // Non-critical.
  }
}

export function linkFromNotificationEvent(event: Event): string | null {
  if (event.type !== EventType.PRESS) return null;
  const notification = event.detail.notification;
  const link = notification?.data?.link;
  if (typeof link !== 'string') return null;
  const kind = String(notification?.data?.kind ?? '');
  analytics.track(isZeroLog(kind) ? 'zero_log_reminder_opened' : 'progress_reminder_opened', { kind });
  return link;
}

export async function getInitialNotificationLink(): Promise<string | null> {
  const initial = await notifee.getInitialNotification();
  const link = initial?.notification.data?.link;
  if (typeof link !== 'string') return null;
  const kind = String(initial?.notification.data?.kind ?? '');
  analytics.track(isZeroLog(kind) ? 'zero_log_reminder_opened' : 'progress_reminder_opened', { kind });
  return link;
}
