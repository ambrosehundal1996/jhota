import { AccessibilityInfo } from 'react-native';
import {
  logDeltaLabel,
  shouldCelebrate,
  shouldCelebrateHalfway,
  toLocalDate,
  type LocalDate,
} from '@jota/domain';
import { analytics } from '../../analytics';
import { haptic } from '../../services/haptics';
import { getState, setState } from '../../state/appStore';
import { selectDay } from '../../state/selectors';
import { create } from 'zustand';

export interface LogPulse {
  id: number;
  grams: number;
  label: string;
  halfway: boolean;
}

const usePulseStore = create<LogPulse>(() => ({ id: 0, grams: 0, label: '', halfway: false }));

export const useLogPulse = usePulseStore;

/** Floating "+32g" chip after a successful log. Auto-clears in ~1s. */
export function emitLogPulse(pulse: Omit<LogPulse, 'id'>): void {
  usePulseStore.setState(s => ({ ...pulse, id: s.id + 1 }));
}

export function clearLogPulse(): void {
  usePulseStore.setState({ label: '', halfway: false });
}

export function playLogFeedback(args: { grams: number; date: LocalDate; prevTotal: number }): void {
  const grams = Math.round(args.grams);
  const today = toLocalDate(new Date());
  const day = selectDay(getState(), args.date);
  const newTotal = day.total.total;
  const target = day.range.min;
  AccessibilityInfo.announceForAccessibility(
    `Logged ${grams} grams. ${Math.round(newTotal)} of ${Math.round(target)} grams.`,
  );

  if (args.date !== today) {
    haptic('light');
    return;
  }

  const flags = getState().flags;
  const celebrate = shouldCelebrate({
    prevTotal: args.prevTotal,
    newTotal,
    target,
    lastCelebratedDate: flags.celebratedDate,
    today,
  });
  const halfway = shouldCelebrateHalfway({
    prevTotal: args.prevTotal,
    newTotal,
    target,
    lastHalfwayDate: flags.halfwayDate,
    today,
  });

  if (celebrate) {
    analytics.track('goal_reached', { total: Math.round(newTotal), min: target, source: day.total.source });
    setState(s => ({ flags: { ...s.flags, celebratedDate: today, pendingCelebrationDate: today } }));
    return;
  }

  if (halfway) {
    setState(s => ({ flags: { ...s.flags, halfwayDate: today } }));
    haptic('medium');
    emitLogPulse({ grams, label: 'Halfway there', halfway: true });
    return;
  }

  haptic('light');
  emitLogPulse({ grams, label: logDeltaLabel(grams, newTotal, target), halfway: false });
}
