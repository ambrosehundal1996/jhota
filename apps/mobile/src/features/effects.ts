import { AppState } from 'react-native';
import { getState, useAppStore, type AppData } from '../state/appStore';
import { reportDeliveredReminders, syncReminders } from '../services/notifications/reminders';
import { updateWidget } from '../services/widget/widgetBridge';

let timer: ReturnType<typeof setTimeout> | null = null;

function runEffects(): void {
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => {
    timer = null;
    void updateWidget();
    void syncReminders();
  }, 250);
}

const watched = (s: AppData) => [s.logs, s.overrides, s.profile, s.notificationPrefs] as const;

export function startDataEffects(): () => void {
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
