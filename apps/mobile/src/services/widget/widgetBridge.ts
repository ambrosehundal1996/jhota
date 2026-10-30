import { lastNDates, reminderFirstName, toLocalDate } from '@jota/domain';
import { NativeModules, Platform } from 'react-native';
import { ingestWidgetQuickAdd } from '../../features/logging/actions';
import { getState } from '../../state/appStore';
import { selectDay, selectTotalsByDate } from '../../state/selectors';

interface PendingWidgetQuickAdd {
  id: string;
  grams: number;
  date: string;
  loggedAt: string;
}

interface SharedWidgetStoreModule {
  setSnapshot(json: string): Promise<boolean>;
  takePendingQuickAdds(): Promise<PendingWidgetQuickAdd[]>;
}

const native: SharedWidgetStoreModule | undefined =
  Platform.OS === 'ios' ? (NativeModules.SharedWidgetStore as SharedWidgetStoreModule | undefined) : undefined;

/** Shape read by the Swift widget (keep in sync with WidgetSnapshot.swift). */
export interface WidgetSnapshot {
  version: 1;
  date: string;
  total: number;
  goalMin: number;
  goalMax: number;
  toGoal: number;
  firstName: string | null;
  reached: boolean;
  isOverride: boolean;
  week: { date: string; total: number; reached: boolean }[];
  updatedAt: string;
}

export function buildWidgetSnapshot(now = new Date()): WidgetSnapshot {
  const state = getState();
  const today = toLocalDate(now);
  const day = selectDay(state, today);
  const totals = selectTotalsByDate(state);
  return {
    version: 1,
    date: today,
    total: Math.round(day.total.total),
    goalMin: day.range.min,
    goalMax: day.range.max,
    toGoal: day.status.toGoal,
    firstName: reminderFirstName(state.profile?.display_name),
    reached: day.status.reached,
    isOverride: day.total.source === 'override',
    week: lastNDates(today, 7).map(date => {
      const total = Math.round(totals[date] ?? 0);
      return { date, total, reached: total >= day.range.min };
    }),
    updatedAt: now.toISOString(),
  };
}

let lastJson = '';

export async function ingestPendingWidgetLogs(): Promise<number> {
  if (!native?.takePendingQuickAdds) return 0;
  try {
    const pending = await native.takePendingQuickAdds();
    if (!pending?.length) return 0;
    return pending.filter(item => !!ingestWidgetQuickAdd(item)).length;
  } catch (error) {
    if (__DEV__) console.warn('[widget] ingest failed', error);
    return 0;
  }
}

export async function updateWidget(force = false): Promise<void> {
  if (!native || !getState().profile?.onboarding_complete) return;
  const ingested = await ingestPendingWidgetLogs();
  const snapshot = buildWidgetSnapshot();
  const { updatedAt: _ignored, ...comparable } = snapshot;
  const key = JSON.stringify(comparable);
  if (!force && !ingested && key === lastJson) return;
  lastJson = key;
  try {
    await native.setSnapshot(JSON.stringify(snapshot));
  } catch (error) {
    if (__DEV__) console.warn('[widget] update failed', error);
  }
}
