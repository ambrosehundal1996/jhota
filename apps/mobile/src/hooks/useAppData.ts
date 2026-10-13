import type { LocalDate } from '@steady/domain';
import { useMemo } from 'react';
import { useAppStore } from '../state/appStore';
import {
  selectCustomFoods,
  selectDay,
  selectFavorites,
  selectRange,
  selectRecents,
  selectTotalsByDate,
} from '../state/selectors';

export function useDay(date: LocalDate) {
  const logs = useAppStore(s => s.logs);
  const overrides = useAppStore(s => s.overrides);
  const profile = useAppStore(s => s.profile);
  return useMemo(() => selectDay({ logs, overrides, profile }, date), [logs, overrides, profile, date]);
}

export function useRange() {
  const profile = useAppStore(s => s.profile);
  return useMemo(() => selectRange({ profile }), [profile]);
}

export function useTotalsByDate() {
  const logs = useAppStore(s => s.logs);
  const overrides = useAppStore(s => s.overrides);
  return useMemo(() => selectTotalsByDate({ logs, overrides }), [logs, overrides]);
}

export function useRecents(limit = 12) {
  const logs = useAppStore(s => s.logs);
  return useMemo(() => selectRecents({ logs }, limit), [logs, limit]);
}

export function useFavorites() {
  const favorites = useAppStore(s => s.favorites);
  return useMemo(() => selectFavorites({ favorites }), [favorites]);
}

export function useCustomFoods() {
  const customFoods = useAppStore(s => s.customFoods);
  return useMemo(() => selectCustomFoods({ customFoods }), [customFoods]);
}
