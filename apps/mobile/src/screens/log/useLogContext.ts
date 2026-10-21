import type { LocalDate } from '@jota/domain';
import { useLocalToday } from '../../hooks/useLocalToday';
import type { LaunchSource } from '../../navigation/types';

interface Params {
  date?: LocalDate;
  src?: LaunchSource;
}

/** Resolves the target date for a logging flow. Defaults to today. */
export function useLogContext(params: Params | undefined) {
  const today = useLocalToday();
  const date = params?.date ?? today;
  return { date, isToday: date === today, src: params?.src };
}

/** Closes the whole Log modal. */
export function closeLog(navigation: { getParent: () => { goBack: () => void } | undefined; goBack: () => void }) {
  const parent = navigation.getParent();
  if (parent) parent.goBack();
  else navigation.goBack();
}
