import { describe, expect, it } from 'vitest';
import { rangeBarLayout } from '..';

const range = { min: 112, max: 160 };

describe('rangeBarLayout', () => {
  it('starts at 0 and keeps the goal range on the bar', () => {
    const layout = rangeBarLayout(0, range);
    expect(layout.minStart).toBeGreaterThan(0);
    expect(layout.maxEnd).toBeGreaterThan(layout.minStart);
    expect(layout.maxEnd).toBeLessThan(1);
    expect(layout.current).toBe(0);
    expect(layout.reached).toBe(false);
  });

  it('places progress before the range when below the lower bound', () => {
    const layout = rangeBarLayout(85, range);
    expect(layout.current).toBeLessThan(layout.minStart);
    expect(layout.reached).toBe(false);
    expect(layout.aboveMax).toBe(false);
  });

  it('puts the marker inside the range at the lower bound and within it', () => {
    const atMin = rangeBarLayout(112, range);
    expect(atMin.current).toBeCloseTo(atMin.minStart);
    expect(atMin.reached).toBe(true);

    const inside = rangeBarLayout(125, range);
    expect(inside.current).toBeGreaterThan(inside.minStart);
    expect(inside.current).toBeLessThan(inside.maxEnd);
  });

  it('keeps an over-range total on the bar without treating it as failure', () => {
    const over = rangeBarLayout(168, range);
    expect(over.aboveMax).toBe(true);
    expect(over.reached).toBe(true);
    expect(over.current).toBeGreaterThan(over.maxEnd);
    expect(over.current).toBeLessThanOrEqual(1);
    expect(over.scaleMax).toBeGreaterThanOrEqual(168);

    const wayOver = rangeBarLayout(400, range);
    expect(wayOver.current).toBe(1);
    expect(wayOver.scaleMax).toBeGreaterThanOrEqual(400);
    expect(wayOver.maxEnd).toBeGreaterThan(wayOver.minStart);
  });

  it('handles a missing or inverted range without overflowing', () => {
    expect(rangeBarLayout(40, { min: Number.NaN, max: Number.NaN }).scaleMax).toBeGreaterThan(0);
    const inverted = rangeBarLayout(50, { min: 180, max: 100 });
    expect(inverted.maxEnd).toBeGreaterThanOrEqual(inverted.minStart);
    expect(inverted.current).toBeGreaterThan(0);
  });
});
