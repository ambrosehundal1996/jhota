import { formatRange, parseLocalDate, type LocalDate, type ProteinRange } from '@jota/domain';

export const grams = (value: number) => `${Math.round(value)}g`;

export const rangeLabel = (range: ProteinRange) => formatRange(range);

const METRIC = new Set(['g', 'ml', 'oz', 'lb']);

export function formatServing(quantity: number | null, unit: string | null): string {
  if (!unit) return quantity ? `${trimNumber(quantity)} serving${quantity === 1 ? '' : 's'}` : '';
  if (METRIC.has(unit.toLowerCase())) return `${trimNumber(quantity ?? 1)}${unit.length > 1 ? ' ' : ''}${unit}`;
  if (quantity === null || quantity === 1) return unit;
  return `${trimNumber(quantity)} × ${unit}`;
}

export function trimNumber(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(2).replace(/\.?0+$/, '');
}

export function formatDayTitle(date: LocalDate): string {
  return parseLocalDate(date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
}

export function formatShortDay(date: LocalDate): string {
  return parseLocalDate(date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

export function formatTodayHeader(date: LocalDate): string {
  return parseLocalDate(date).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
}

/** "8:05 AM" in the device's local time zone. */
export function formatLogTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

export function weekdayInitial(date: LocalDate): string {
  return parseLocalDate(date).toLocaleDateString('en-US', { weekday: 'narrow' });
}

export function formatRangeOfDates(start: LocalDate, end: LocalDate): string {
  const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
  return `${parseLocalDate(start).toLocaleDateString('en-US', opts)} – ${parseLocalDate(end).toLocaleDateString('en-US', opts)}`;
}

export function initials(name: string | null | undefined): string {
  if (!name?.trim()) return '';
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map(part => part[0]?.toUpperCase() ?? '')
    .join('');
}
