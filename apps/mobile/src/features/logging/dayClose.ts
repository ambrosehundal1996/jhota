import { addDays, toLocalDate, type LocalDate } from '@jota/domain';
import { analytics } from '../../analytics';
import { getState, setState } from '../../state/appStore';
import { selectDay } from '../../state/selectors';

/** Past local dates that still need a `day_closed` snapshot, oldest first. */
export function datesToClose(today: LocalDate, lastClosed: LocalDate | null, candidates: LocalDate[]): LocalDate[] {
  const cutoff = addDays(today, -1);
  const start = lastClosed ? addDays(lastClosed, 1) : null;
  return [...new Set(candidates)]
    .filter(date => date <= cutoff && (!start || date >= start))
    .sort();
}

function emitDayClosed(date: LocalDate): void {
  const state = getState();
  const day = selectDay(state, date);
  const name = state.profile?.display_name?.trim() || state.onboarding.displayName?.trim() || null;
  analytics.track('day_closed', {
    date,
    name,
    log_count: day.total.entryCount,
    total_g: Math.round(day.total.total),
    min: Math.round(day.range.min),
    max: Math.round(day.range.max),
    reached: day.status.reached,
    in_range: day.status.inGoalZone,
    percent_of_goal: day.status.percentOfGoal,
    source: day.total.source,
  });
}

/** Re-send a snapshot when a day we already closed is edited. */
export function refreshClosedDay(date: LocalDate, now = new Date()): void {
  const today = toLocalDate(now);
  const lastClosed = getState().flags.lastClosedDate;
  if (!getState().profile?.onboarding_complete) return;
  if (!lastClosed || date >= today || date > lastClosed) return;
  emitDayClosed(date);
}

/**
 * Sends one `day_closed` per finished local day the user opened or logged,
 * then marks today as opened. Call on launch, foreground, and local midnight.
 */
export function flushClosedDays(opts?: { now?: Date; markOpened?: boolean }): LocalDate[] {
  const now = opts?.now ?? new Date();
  const today = toLocalDate(now);
  const state = getState();
  const markOpened = opts?.markOpened !== false;

  if (!state.profile?.onboarding_complete) {
    if (markOpened) setState(s => ({ flags: { ...s.flags, lastOpenedDate: today } }));
    return [];
  }

  const candidates = [
    ...Object.values(state.logs).filter(log => !log.deleted_at).map(log => log.log_date),
    ...Object.values(state.overrides).filter(row => !row.deleted_at).map(row => row.log_date),
    ...(state.flags.lastOpenedDate ? [state.flags.lastOpenedDate] : []),
  ];
  const dates = datesToClose(today, state.flags.lastClosedDate, candidates);
  for (const date of dates) emitDayClosed(date);

  const lastClosedDate = dates.length ? dates[dates.length - 1]! : state.flags.lastClosedDate;
  setState(s => ({
    flags: {
      ...s.flags,
      lastClosedDate,
      lastOpenedDate: markOpened
        ? !s.flags.lastOpenedDate || today > s.flags.lastOpenedDate
          ? today
          : s.flags.lastOpenedDate
        : s.flags.lastOpenedDate,
    },
  }));
  return dates;
}
