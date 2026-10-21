import {
  applyManualRange,
  applyRecalculatedRange,
  changeBodyWeight,
  convertWeight,
  keepCurrentRange,
  type GoalSettings,
  type GoalType,
  type ProteinRange,
  type WeightChangeResult,
  type WeightUnit,
} from '@jota/domain';
import { analytics } from '../../analytics';
import { getState, setState } from '../../state/appStore';
import { enqueueUpsert } from '../../state/outbox';
import type { NotificationPreferences, Profile } from '../../types/models';
import { nowIso } from '../../utils/id';

const deviceTimezone = () => Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';

export function toGoalSettings(profile: Profile): GoalSettings {
  return {
    weightValue: profile.weight_value ?? 0,
    weightUnit: profile.weight_unit,
    proteinGoalMin: profile.protein_goal_min ?? 0,
    proteinGoalMax: profile.protein_goal_max ?? 0,
    proteinGoalIsCustom: profile.protein_goal_is_custom,
  };
}

function writeProfile(next: Profile): void {
  const profile = { ...next, updated_at: nowIso() };
  setState({ profile });
  enqueueUpsert('profiles', profile.id, { ...profile });
}

function applySettings(settings: GoalSettings): void {
  const profile = getState().profile;
  if (!profile) return;
  writeProfile({
    ...profile,
    weight_value: settings.weightValue,
    weight_unit: settings.weightUnit,
    protein_goal_min: settings.proteinGoalMin,
    protein_goal_max: settings.proteinGoalMax,
    protein_goal_is_custom: settings.proteinGoalIsCustom,
  });
}

// ---------------------------------------------------------------------------
// Onboarding
// ---------------------------------------------------------------------------

export function setOnboardingGoal(goalType: GoalType): void {
  setState(s => ({ onboarding: { ...s.onboarding, goalType } }));
  analytics.track('goal_selected', { goal_type: goalType });
}

export function setOnboardingWeight(weightValue: number, weightUnit: WeightUnit): void {
  setState(s => ({ onboarding: { ...s.onboarding, weightValue, weightUnit } }));
  analytics.track('weight_entered', { unit: weightUnit });
}

export function completeOnboarding(range: ProteinRange, isCustom: boolean): Profile {
  const { userId, onboarding, notificationPrefs, profile: existing } = getState();
  const now = nowIso();
  const profile: Profile = {
    id: userId,
    goal_type: onboarding.goalType,
    weight_value: onboarding.weightValue,
    weight_unit: onboarding.weightUnit,
    protein_goal_min: range.min,
    protein_goal_max: range.max,
    protein_goal_is_custom: isCustom,
    timezone: deviceTimezone(),
    display_name: existing?.display_name ?? null,
    onboarding_complete: true,
    created_at: existing?.created_at ?? now,
    updated_at: now,
  };
  writeProfile(profile);
  const prefs = { ...notificationPrefs, user_id: userId, updated_at: now };
  setState({ notificationPrefs: prefs });
  enqueueUpsert('notification_preferences', userId, { ...prefs });
  analytics.track(isCustom ? 'protein_range_customized' : 'protein_range_accepted', { min: range.min, max: range.max });
  analytics.track('onboarding_completed', { goal_type: onboarding.goalType, custom_range: isCustom });
  return profile;
}

// ---------------------------------------------------------------------------
// Protein goal (never silently overwritten)
// ---------------------------------------------------------------------------

export function saveManualRange(range: ProteinRange): void {
  const profile = getState().profile;
  if (!profile) return;
  applySettings(applyManualRange(toGoalSettings(profile), range));
  analytics.track('protein_range_customized', { min: range.min, max: range.max, from: 'profile' });
}

/** Call only after the user confirmed the previewed range. */
export function confirmRecalculatedRange(): void {
  const profile = getState().profile;
  if (!profile) return;
  const next = applyRecalculatedRange(toGoalSettings(profile));
  applySettings(next);
  analytics.track('protein_range_recalculated', { min: next.proteinGoalMin, max: next.proteinGoalMax });
}

/** Saves only the weight. Returns the suggestion so the UI can ask before changing the range. */
export function saveBodyWeight(weightValue: number, weightUnit: WeightUnit): WeightChangeResult | null {
  const profile = getState().profile;
  if (!profile) return null;
  const result = changeBodyWeight(toGoalSettings(profile), weightValue, weightUnit);
  applySettings(result.settings);
  analytics.track('body_weight_changed', { unit: weightUnit, prompt: result.shouldPromptRangeUpdate });
  return result;
}

export function keepRangeAfterWeightChange(): void {
  const profile = getState().profile;
  if (!profile) return;
  applySettings(keepCurrentRange(toGoalSettings(profile)));
}

export function setGoalType(goalType: GoalType): void {
  const profile = getState().profile;
  if (!profile) return;
  writeProfile({ ...profile, goal_type: goalType });
  analytics.track('goal_selected', { goal_type: goalType, from: 'profile' });
}

/** Changes display units; converts the stored weight but never touches the protein range. */
export function setWeightUnit(unit: WeightUnit): void {
  const profile = getState().profile;
  if (!profile || profile.weight_unit === unit) return;
  const weight = profile.weight_value === null ? null : convertWeight(profile.weight_value, profile.weight_unit, unit);
  writeProfile({ ...profile, weight_unit: unit, weight_value: weight });
}

export function setDisplayName(name: string | null): void {
  const profile = getState().profile;
  if (!profile || !name) return;
  writeProfile({ ...profile, display_name: name });
}

export function updateNotificationPrefs(patch: Partial<Omit<NotificationPreferences, 'user_id'>>): void {
  const state = getState();
  const prefs = { ...state.notificationPrefs, ...patch, user_id: state.userId, updated_at: nowIso() };
  setState({ notificationPrefs: prefs });
  enqueueUpsert('notification_preferences', state.userId, { ...prefs });
}
