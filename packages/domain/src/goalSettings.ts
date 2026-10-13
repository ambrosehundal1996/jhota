import { calculateProteinRange, rangesEqual, validateProteinRange, type CalculatedProteinRange } from './proteinRange';
import type { ProteinRange, WeightUnit } from './types';

/**
 * The subset of the profile that owns the protein goal. All transitions are pure so that
 * the "never silently overwrite a custom range" rule is enforced in one place.
 */
export interface GoalSettings {
  weightValue: number;
  weightUnit: WeightUnit;
  proteinGoalMin: number;
  proteinGoalMax: number;
  proteinGoalIsCustom: boolean;
}

export function currentRange(settings: GoalSettings): ProteinRange {
  return { min: settings.proteinGoalMin, max: settings.proteinGoalMax };
}

export function settingsFromWeight(weightValue: number, weightUnit: WeightUnit): GoalSettings {
  const range = calculateProteinRange(weightValue, weightUnit);
  return {
    weightValue,
    weightUnit,
    proteinGoalMin: range.min,
    proteinGoalMax: range.max,
    proteinGoalIsCustom: false,
  };
}

/** User typed their own min/max. Custom values become authoritative. */
export function applyManualRange(settings: GoalSettings, range: ProteinRange): GoalSettings {
  const validation = validateProteinRange(range.min, range.max);
  if (!validation.ok) throw new RangeError(validation.message);
  return {
    ...settings,
    proteinGoalMin: range.min,
    proteinGoalMax: range.max,
    proteinGoalIsCustom: true,
  };
}

/** Preview only: never mutates. The UI must confirm before calling applyRecalculatedRange. */
export function previewRecalculatedRange(settings: GoalSettings): CalculatedProteinRange {
  return calculateProteinRange(settings.weightValue, settings.weightUnit);
}

/** Explicit, user-confirmed "Recalculate from body weight". */
export function applyRecalculatedRange(settings: GoalSettings): GoalSettings {
  const range = previewRecalculatedRange(settings);
  return {
    ...settings,
    proteinGoalMin: range.min,
    proteinGoalMax: range.max,
    proteinGoalIsCustom: false,
  };
}

export interface WeightChangeResult {
  /** New settings with only the weight changed. The range is always preserved. */
  settings: GoalSettings;
  suggestedRange: CalculatedProteinRange;
  /** True when the suggestion differs from the current range and the user should be asked. */
  shouldPromptRangeUpdate: boolean;
}

export function changeBodyWeight(
  settings: GoalSettings,
  weightValue: number,
  weightUnit: WeightUnit,
): WeightChangeResult {
  const next: GoalSettings = { ...settings, weightValue, weightUnit };
  const suggestedRange = calculateProteinRange(weightValue, weightUnit);
  return {
    settings: next,
    suggestedRange,
    shouldPromptRangeUpdate: shouldPromptRangeUpdate(currentRange(settings), suggestedRange),
  };
}

export function shouldPromptRangeUpdate(current: ProteinRange, suggested: ProteinRange): boolean {
  return !rangesEqual(current, suggested);
}

/** "Keep Current Range" after a weight change. */
export function keepCurrentRange(settings: GoalSettings): GoalSettings {
  return { ...settings };
}
