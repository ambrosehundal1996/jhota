import { describe, expect, it } from 'vitest';
import {
  applyManualRange,
  applyRecalculatedRange,
  changeBodyWeight,
  keepCurrentRange,
  previewRecalculatedRange,
  settingsFromWeight,
  type GoalSettings,
} from '..';

const onboarded = (): GoalSettings => settingsFromWeight(180, 'lb');

describe('goal settings transitions', () => {
  it('onboarding acceptance stores the calculated range as non-custom', () => {
    expect(onboarded()).toEqual({
      weightValue: 180,
      weightUnit: 'lb',
      proteinGoalMin: 125,
      proteinGoalMax: 180,
      proteinGoalIsCustom: false,
    });
  });

  it('user can manually customize both values, which marks the range custom', () => {
    const custom = applyManualRange(onboarded(), { min: 135, max: 175 });
    expect(custom).toMatchObject({ proteinGoalMin: 135, proteinGoalMax: 175, proteinGoalIsCustom: true });
  });

  it('manual edits are validated', () => {
    expect(() => applyManualRange(onboarded(), { min: 180, max: 150 })).toThrow();
    expect(() => applyManualRange(onboarded(), { min: 0, max: 150 })).toThrow();
  });

  it('changing body weight never silently overwrites a custom range', () => {
    const custom = applyManualRange(onboarded(), { min: 135, max: 175 });
    const result = changeBodyWeight(custom, 170, 'lb');
    expect(result.settings).toMatchObject({
      weightValue: 170,
      proteinGoalMin: 135,
      proteinGoalMax: 175,
      proteinGoalIsCustom: true,
    });
  });

  it('changing body weight generates a new suggested range and asks to update', () => {
    const custom = applyManualRange(onboarded(), { min: 135, max: 175 });
    const result = changeBodyWeight(custom, 170, 'lb');
    expect(result.suggestedRange).toMatchObject({ min: 120, max: 170 });
    expect(result.shouldPromptRangeUpdate).toBe(true);
  });

  it('does not prompt when the suggestion matches the current range', () => {
    const result = changeBodyWeight(onboarded(), 181, 'lb');
    expect(result.suggestedRange).toMatchObject({ min: 125, max: 180 });
    expect(result.shouldPromptRangeUpdate).toBe(false);
  });

  it('even a non-custom range is not changed by a weight change until confirmed', () => {
    const result = changeBodyWeight(onboarded(), 200, 'lb');
    expect(result.settings).toMatchObject({ proteinGoalMin: 125, proteinGoalMax: 180 });
    expect(result.shouldPromptRangeUpdate).toBe(true);
  });

  it('preview does not mutate; only an explicit apply replaces the range', () => {
    const custom = applyManualRange(onboarded(), { min: 135, max: 175 });
    const afterWeight = changeBodyWeight(custom, 170, 'lb').settings;
    const preview = previewRecalculatedRange(afterWeight);
    expect(preview).toMatchObject({ min: 120, max: 170 });
    expect(afterWeight).toMatchObject({ proteinGoalMin: 135, proteinGoalMax: 175 });
  });

  it('"Keep Current Range" preserves existing values', () => {
    const custom = applyManualRange(onboarded(), { min: 135, max: 175 });
    const afterWeight = changeBodyWeight(custom, 170, 'lb').settings;
    expect(keepCurrentRange(afterWeight)).toMatchObject({
      proteinGoalMin: 135,
      proteinGoalMax: 175,
      proteinGoalIsCustom: true,
    });
  });

  it('"Recalculate from body weight" restores calculated values and clears custom', () => {
    const custom = applyManualRange(onboarded(), { min: 135, max: 175 });
    const afterWeight = changeBodyWeight(custom, 170, 'lb').settings;
    expect(applyRecalculatedRange(afterWeight)).toMatchObject({
      weightValue: 170,
      proteinGoalMin: 120,
      proteinGoalMax: 170,
      proteinGoalIsCustom: false,
    });
  });
});
