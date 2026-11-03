import { analysisCopy } from '../src/screens/log/analysisCopy';

test('analysis copy starts on one honest analyzing state', () => {
  expect(analysisCopy(0)).toEqual({
    headline: 'Finding your protein.',
    supporting: 'Analyzing your meal',
    showCancel: false,
  });
});

test('after 8 seconds it reassures without claiming progress', () => {
  expect(analysisCopy(8)).toEqual({
    headline: 'Finding your protein.',
    supporting: 'Still working on your meal.',
    showCancel: false,
  });
  expect(analysisCopy(19).headline).toBe('Finding your protein.');
  expect(analysisCopy(19).showCancel).toBe(false);
});

test('after 20 seconds it offers an escape without saying the estimate is almost done', () => {
  expect(analysisCopy(20)).toEqual({
    headline: 'Taking a little longer than usual.',
    supporting: 'Your meal is still being analyzed.',
    showCancel: true,
  });
  expect(analysisCopy(40).headline).not.toMatch(/almost|finaliz/i);
});
