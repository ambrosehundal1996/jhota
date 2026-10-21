import { describe, expect, it } from 'vitest';
import { logDeltaLabel, shouldCelebrate, shouldCelebrateHalfway } from '../celebration';

const today = '2026-10-19';
const yesterday = '2026-10-18';

describe('shouldCelebrate', () => {
  it('fires when the total first crosses the target', () => {
    expect(
      shouldCelebrate({ prevTotal: 140, newTotal: 160, target: 150, lastCelebratedDate: null, today }),
    ).toBe(true);
  });

  it('fires when a log lands exactly on the target', () => {
    expect(
      shouldCelebrate({ prevTotal: 140, newTotal: 150, target: 150, lastCelebratedDate: null, today }),
    ).toBe(true);
  });

  it('does not fire if already at or above the target', () => {
    expect(
      shouldCelebrate({ prevTotal: 150, newTotal: 180, target: 150, lastCelebratedDate: null, today }),
    ).toBe(false);
  });

  it('does not re-fire the same local day after a delete-then-re-cross', () => {
    expect(
      shouldCelebrate({ prevTotal: 140, newTotal: 160, target: 150, lastCelebratedDate: today, today }),
    ).toBe(false);
  });

  it('fires again after midnight on a new local date', () => {
    expect(
      shouldCelebrate({ prevTotal: 140, newTotal: 160, target: 150, lastCelebratedDate: yesterday, today }),
    ).toBe(true);
  });

  it('does not fire for a zero or missing target', () => {
    expect(
      shouldCelebrate({ prevTotal: 0, newTotal: 40, target: 0, lastCelebratedDate: null, today }),
    ).toBe(false);
  });

  it('does not fire while still below the target', () => {
    expect(
      shouldCelebrate({ prevTotal: 20, newTotal: 140, target: 150, lastCelebratedDate: null, today }),
    ).toBe(false);
  });
});

describe('shouldCelebrateHalfway', () => {
  it('fires when the total first crosses 50%', () => {
    expect(
      shouldCelebrateHalfway({ prevTotal: 20, newTotal: 80, target: 150, lastHalfwayDate: null, today }),
    ).toBe(true);
  });

  it('skips halfway when the same log also crosses the goal', () => {
    expect(
      shouldCelebrateHalfway({ prevTotal: 20, newTotal: 160, target: 150, lastHalfwayDate: null, today }),
    ).toBe(false);
  });

  it('does not re-fire the same local day', () => {
    expect(
      shouldCelebrateHalfway({ prevTotal: 20, newTotal: 80, target: 150, lastHalfwayDate: today, today }),
    ).toBe(false);
  });

  it('fires again after midnight', () => {
    expect(
      shouldCelebrateHalfway({ prevTotal: 20, newTotal: 80, target: 150, lastHalfwayDate: yesterday, today }),
    ).toBe(true);
  });

  it('does not fire if already past halfway', () => {
    expect(
      shouldCelebrateHalfway({ prevTotal: 80, newTotal: 90, target: 150, lastHalfwayDate: null, today }),
    ).toBe(false);
  });

  it('fires when a log lands exactly on 50%', () => {
    expect(
      shouldCelebrateHalfway({ prevTotal: 70, newTotal: 75, target: 150, lastHalfwayDate: null, today }),
    ).toBe(true);
  });
});

describe('logDeltaLabel', () => {
  it('shows grams still to go while under the target', () => {
    expect(logDeltaLabel(32, 118, 150)).toBe('+32g · 32g to go');
  });

  it('shows grams over in the same quiet style', () => {
    expect(logDeltaLabel(32, 162, 150)).toBe('+32g · 12g over');
  });
});
