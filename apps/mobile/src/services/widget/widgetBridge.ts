import { lastNDates, toLocalDate } from '@jota/domain';
import { NativeModules, Platform } from 'react-native';
import { getState } from '../../state/appStore';
import { selectDay, selectTotalsByDate } from '../../state/selectors';

interface SharedWidgetStoreModule {
  setSnapshot(json: string): Promise<boolean>;
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

export async function updateWidget(): Promise<void> {
  if (!native || !getState().profile?.onboarding_complete) return;
  const { updatedAt: _ignored, ...comparable } = buildWidgetSnapshot();
  const key = JSON.stringify(comparable);
  if (key === lastJson) return;
  lastJson = key;
  try {
    await native.setSnapshot(JSON.stringify(buildWidgetSnapshot()));
  } catch (error) {
    if (__DEV__) console.warn('[widget] update failed', error);
  }
}
