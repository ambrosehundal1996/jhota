import { toLocalDate, type LocalDate } from '@jota/domain';
import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

/** Today's local date; rolls over at midnight and when the app returns to the foreground. */
export function useLocalToday(): LocalDate {
  const [today, setToday] = useState(() => toLocalDate(new Date()));
  useEffect(() => {
    const refresh = () => setToday(toLocalDate(new Date()));
    const interval = setInterval(refresh, 60_000);
    const sub = AppState.addEventListener('change', s => s === 'active' && refresh());
    return () => {
      clearInterval(interval);
      sub.remove();
    };
  }, []);
  return today;
}
