import { estimateBarProgress, estimateStep } from '../src/screens/log/photoEstimateProgress';

test('upload stays on the first checkpoint', () => {
  expect(estimateStep('uploading', 0)).toBe(0);
  expect(estimateStep('uploading', 3)).toBe(0);
  expect(estimateBarProgress('uploading', 0)).toBeLessThan(0.2);
});

test('analysis checkpoints move forward with time and the bar never completes early', () => {
  expect(estimateStep('analyzing', 0)).toBe(1);
  expect(estimateStep('analyzing', 4)).toBe(2);
  expect(estimateStep('analyzing', 7)).toBe(3);
  expect(estimateStep('analyzing', 11)).toBe(4);
  expect(estimateBarProgress('analyzing', 3)).toBeGreaterThan(0.2);
  expect(estimateBarProgress('analyzing', 20)).toBeLessThan(0.95);
});
