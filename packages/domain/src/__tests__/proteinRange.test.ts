import { describe, expect, it } from 'vitest';
import {
  calculateProteinRange,
  convertWeight,
  formatRange,
  LB_PER_KG,
  roundToNearest,
  validateProteinRange,
} from '..';

describe('calculateProteinRange', () => {
  it('200 lb user gets a raw range of 140–200g', () => {
    const range = calculateProteinRange(200, 'lb');
    expect(range.rawMin).toBe(140);
    expect(range.rawMax).toBe(200);
    expect(range).toMatchObject({ min: 140, max: 200 });
  });

  it('150 lb user gets a raw range of 105–150g', () => {
    const range = calculateProteinRange(150, 'lb');
    expect(range.rawMin).toBe(105);
    expect(range.rawMax).toBe(150);
    expect(range).toMatchObject({ min: 105, max: 150 });
  });

  it('175 lb rounds 122.5–175g to 125–175g', () => {
    expect(calculateProteinRange(175, 'lb')).toEqual({ rawMin: 122.5, rawMax: 175, min: 125, max: 175 });
  });

  it('180 lb displays 125–180g (raw 126–180)', () => {
    const range = calculateProteinRange(180, 'lb');
    expect(range.rawMin).toBe(126);
    expect(formatRange(range)).toBe('125–180g');
  });

  it('170 lb displays 120–170g', () => {
    expect(formatRange(calculateProteinRange(170, 'lb'))).toBe('120–170g');
  });

  it('converts kg to lb before calculating', () => {
    const kg = 80;
    const pounds = kg * LB_PER_KG; // 176.37
    const range = calculateProteinRange(kg, 'kg');
    expect(range.rawMin).toBeCloseTo(pounds * 0.7, 1);
    expect(range.rawMax).toBeCloseTo(pounds, 1);
    expect(range).toMatchObject({ min: 125, max: 175 });
    // Equivalent to ~1.54–2.20 g/kg
    expect(range.rawMin / kg).toBeCloseTo(1.54, 2);
    expect(range.rawMax / kg).toBeCloseTo(2.2, 2);
  });

  it('kg and equivalent lb inputs produce the same range', () => {
    expect(calculateProteinRange(90.7185, 'kg')).toMatchObject(calculateProteinRange(200, 'lb'));
  });

  it('rejects implausible weights', () => {
    expect(() => calculateProteinRange(0, 'lb')).toThrow(RangeError);
    expect(() => calculateProteinRange(-5, 'kg')).toThrow(RangeError);
    expect(() => calculateProteinRange(Number.NaN, 'lb')).toThrow(RangeError);
    expect(() => calculateProteinRange(2000, 'lb')).toThrow(RangeError);
  });
});

describe('unit conversion', () => {
  it('round-trips lb and kg', () => {
    expect(convertWeight(100, 'kg', 'lb')).toBe(220.5);
    expect(convertWeight(220.5, 'lb', 'kg')).toBe(100);
    expect(convertWeight(175, 'lb', 'lb')).toBe(175);
  });
});

describe('roundToNearest', () => {
  it('rounds to 5g steps', () => {
    expect(roundToNearest(122.5)).toBe(125);
    expect(roundToNearest(126)).toBe(125);
    expect(roundToNearest(119)).toBe(120);
  });
});

describe('validateProteinRange', () => {
  it('accepts valid ranges, including min equal to max', () => {
    expect(validateProteinRange(130, 150).ok).toBe(true);
    expect(validateProteinRange(140, 140).ok).toBe(true);
  });

  it('rejects non-positive, inverted, and absurd values', () => {
    expect(validateProteinRange(0, 150)).toMatchObject({ ok: false, error: 'not_positive' });
    expect(validateProteinRange(-10, 150)).toMatchObject({ ok: false, error: 'not_positive' });
    expect(validateProteinRange(160, 150)).toMatchObject({ ok: false, error: 'min_above_max' });
    expect(validateProteinRange(100, 900)).toMatchObject({ ok: false, error: 'too_high' });
    expect(validateProteinRange(Number.NaN, 150)).toMatchObject({ ok: false, error: 'not_a_number' });
  });
});
