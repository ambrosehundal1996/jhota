import { defaultMealForTime, type LocalDate, type MealType } from '@steady/domain';
import { useState } from 'react';
import { useLocalToday } from '../../hooks/useLocalToday';
import type { LaunchSource } from '../../navigation/types';

interface Params {
  date?: LocalDate;
  meal?: MealType;
  src?: LaunchSource;
}

/** Resolves the target date and meal for a logging flow. Defaults to today and time-of-day meal. */
export function useLogContext(params: Params | undefined) {
  const today = useLocalToday();
  const date = params?.date ?? today;
  const [meal, setMeal] = useState<MealType>(params?.meal ?? defaultMealForTime(new Date()));
  return { date, isToday: date === today, meal, setMeal, src: params?.src };
}

/** Closes the whole Log modal. */
export function closeLog(navigation: { getParent: () => { goBack: () => void } | undefined; goBack: () => void }) {
  const parent = navigation.getParent();
  if (parent) parent.goBack();
  else navigation.goBack();
}
