import { applyThumb, gramsAtX, nearestThumb, suggestedSliderBounds, xAtGrams } from '../src/components/rangeSliderMath';

const suggested = { min: 112, max: 160 };

test('slider bounds leave room on both sides of the suggestion', () => {
  const bounds = suggestedSliderBounds(suggested);
  expect(bounds.min).toBeLessThan(suggested.min);
  expect(bounds.max).toBeGreaterThan(suggested.max);
});

test('thumbs snap to 5g and cannot cross', () => {
  const bounds = suggestedSliderBounds(suggested);
  expect(applyThumb(suggested, 'min', 140, bounds)).toEqual({ min: 140, max: 160 });
  expect(applyThumb(suggested, 'min', 160, bounds).min).toBe(155);
  expect(applyThumb(suggested, 'max', 112, bounds).max).toBe(117);
});

test('x mapping round-trips through the track', () => {
  const bounds = { min: 40, max: 240 };
  const grams = gramsAtX(50, 200, bounds);
  expect(grams % 5).toBe(0);
  expect(xAtGrams(bounds.min, 200, bounds)).toBe(0);
  expect(xAtGrams(bounds.max, 200, bounds)).toBe(200);
  expect(nearestThumb(10, suggested, 200, bounds)).toBe('min');
  expect(nearestThumb(190, suggested, 200, bounds)).toBe('max');
});
