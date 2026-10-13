import type { ProteinRange, WeightUnit } from './types';
import { isValidWeight, roundTo, toPounds } from './units';

export const PROTEIN_G_PER_LB_MIN = 0.7;
export const PROTEIN_G_PER_LB_MAX = 1.0;
export const RANGE_ROUNDING_STEP = 5;
export const MAX_DAILY_PROTEIN_G = 500;

export interface CalculatedProteinRange extends ProteinRange {
  rawMin: number;
  rawMax: number;
}

export function roundToNearest(value: number, step = RANGE_ROUNDING_STEP): number {
  return Math.round(value / step) * step;
}

/**
 * The single source of truth for the suggested protein range.
 * Minimum is 0.7 g/lb, maximum is 1.0 g/lb (≈1.54–2.20 g/kg); each bound is rounded
 * to the nearest 5 g for display.
 */
export function calculateProteinRange(weight: number, weightUnit: WeightUnit): CalculatedProteinRange {
  if (!isValidWeight(weight, weightUnit)) {
    throw new RangeError(`Invalid body weight: ${weight} ${weightUnit}`);
  }
  const pounds = toPounds(weight, weightUnit);
  // Rounding to 2 decimals first avoids float artifacts like 175 * 0.7 = 122.49999…
  const rawMin = roundTo(pounds * PROTEIN_G_PER_LB_MIN, 2);
  const rawMax = roundTo(pounds * PROTEIN_G_PER_LB_MAX, 2);
  const min = roundToNearest(rawMin);
  const max = Math.max(min, roundToNearest(rawMax));
  return { rawMin, rawMax, min, max };
}

export type RangeValidationError = 'not_a_number' | 'not_positive' | 'min_above_max' | 'too_high';

export type RangeValidation = { ok: true } | { ok: false; error: RangeValidationError; message: string };

export function validateProteinRange(min: number, max: number): RangeValidation {
  if (!Number.isFinite(min) || !Number.isFinite(max)) {
    return { ok: false, error: 'not_a_number', message: 'Enter a number for both values.' };
  }
  if (min <= 0 || max <= 0) {
    return { ok: false, error: 'not_positive', message: 'Both values need to be above 0g.' };
  }
  if (min > max) {
    return { ok: false, error: 'min_above_max', message: 'Minimum should be lower than or equal to maximum.' };
  }
  if (max > MAX_DAILY_PROTEIN_G) {
    return { ok: false, error: 'too_high', message: `Keep your range under ${MAX_DAILY_PROTEIN_G}g per day.` };
  }
  return { ok: true };
}

export function rangesEqual(a: ProteinRange, b: ProteinRange): boolean {
  return a.min === b.min && a.max === b.max;
}

export function formatRange(range: ProteinRange): string {
  return `${Math.round(range.min)}–${Math.round(range.max)}g`;
}
