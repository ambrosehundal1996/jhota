import { toLocalDate } from '@steady/domain';
import { AppState } from 'react-native';
import { analytics } from '../analytics';
import { getState, setState, useAppStore, type AppData } from '../state/appStore';
import { selectDay } from '../state/selectors';
import { reportDeliveredReminders, syncReminders } from '../services/notifications/reminders';
import { updateWidget } from '../services/widget/widgetBridge';

const lastReached = new Map<string, boolean>();

/** Detects the moment today's total crosses the minimum and queues the completion screen. */
function checkGoalReached(): void {
  const state = getState();
  if (!state.profile?.onboarding_complete) return;
  const today = toLocalDate(new Date());
  const day = selectDay(state, today);
  const before = lastReached.get(today);
  lastReached.set(today, day.status.reached);
  if (before === false && day.status.reached && state.flags.celebratedDate !== today) {
    analytics.track('goal_reached', { total: Math.round(day.total.total), min: day.range.min, source: day.total.source });
    setState(s => ({ flags: { ...s.flags, celebratedDate: today, pendingCelebrationDate: today } }));
  }
}

let timer: ReturnType<typeof setTimeout> | null = null;

function runEffects(): void {
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => {
    timer = null;
    checkGoalReached();
    void updateWidget();
    void syncReminders();
  }, 250);
}

const watched = (s: AppData) => [s.logs, s.overrides, s.profile, s.notificationPrefs] as const;

export function startDataEffects(): () => void {
  checkGoalReached();
  runEffects();
  void reportDeliveredReminders();
  let previous = watched(getState());
  const unsubscribe = useAppStore.subscribe(state => {
    const next = watched(state);
    if (next.some((value, i) => value !== previous[i])) {
      previous = next;
      runEffects();
    }
  });
  const appSub = AppState.addEventListener('change', s => {
    if (s !== 'active') return;
    runEffects();
    void reportDeliveredReminders();
  });
  return () => {
    unsubscribe();
    appSub.remove();
  };
}
