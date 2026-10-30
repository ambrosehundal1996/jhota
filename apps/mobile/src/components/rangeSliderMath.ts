import { MAX_DAILY_PROTEIN_G, RANGE_ROUNDING_STEP, roundToNearest, type ProteinRange } from '@jota/domain';

export type SliderThumb = 'min' | 'max';

/** Track limits around a suggested range so both thumbs have room to move. */
export function suggestedSliderBounds(suggested: ProteinRange): ProteinRange {
  const span = Math.max(80, suggested.max - suggested.min);
  const min = Math.max(RANGE_ROUNDING_STEP, roundToNearest(suggested.min - span));
  const max = Math.min(MAX_DAILY_PROTEIN_G, roundToNearest(suggested.max + span));
  return { min, max: Math.max(max, min + RANGE_ROUNDING_STEP) };
}

export function gramsAtX(x: number, width: number, bounds: ProteinRange, step = RANGE_ROUNDING_STEP): number {
  if (width <= 0) return bounds.min;
  const t = Math.min(1, Math.max(0, x / width));
  const raw = bounds.min + t * (bounds.max - bounds.min);
  return Math.min(bounds.max, Math.max(bounds.min, roundToNearest(raw, step)));
}

export function xAtGrams(grams: number, width: number, bounds: ProteinRange): number {
  if (width <= 0 || bounds.max <= bounds.min) return 0;
  const t = (grams - bounds.min) / (bounds.max - bounds.min);
  return Math.min(width, Math.max(0, t * width));
}

export function nearestThumb(x: number, range: ProteinRange, width: number, bounds: ProteinRange): SliderThumb {
  const minX = xAtGrams(range.min, width, bounds);
  const maxX = xAtGrams(range.max, width, bounds);
  return Math.abs(x - minX) <= Math.abs(x - maxX) ? 'min' : 'max';
}

export function applyThumb(
  range: ProteinRange,
  thumb: SliderThumb,
  grams: number,
  bounds: ProteinRange,
  step = RANGE_ROUNDING_STEP,
): ProteinRange {
  if (thumb === 'min') {
    const min = Math.min(Math.max(grams, bounds.min), range.max - step);
    return { min, max: range.max };
  }
  const max = Math.max(Math.min(grams, bounds.max), range.min + step);
  return { min: range.min, max };
}
