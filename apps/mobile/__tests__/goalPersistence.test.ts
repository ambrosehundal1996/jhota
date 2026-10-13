import { completeOnboarding, keepRangeAfterWeightChange, saveBodyWeight, saveManualRange, setOnboardingGoal, setOnboardingWeight, setWeightUnit, confirmRecalculatedRange } from '../src/features/profile/actions';
import { getState, initialAppData, useAppStore } from '../src/state/appStore';
import { storage } from '../src/state/storage';

async function relaunch() {
  const persisted = storage.getString('steady-app');
  useAppStore.setState(initialAppData(), true);
  if (persisted) storage.set('steady-app', persisted);
  await useAppStore.persist.rehydrate();
}

function onboard(weight: number, range: { min: number; max: number }, isCustom: boolean) {
  setOnboardingGoal('build_muscle');
  setOnboardingWeight(weight, 'lb');
  completeOnboarding(range, isCustom);
}

beforeEach(() => {
  storage.clearAll();
  useAppStore.setState(initialAppData(), true);
});

test('a custom range survives an app relaunch', async () => {
  onboard(180, { min: 125, max: 180 }, false);
  saveManualRange({ min: 150, max: 190 });
  await relaunch();
  const profile = getState().profile!;
  expect(profile.protein_goal_min).toBe(150);
  expect(profile.protein_goal_max).toBe(190);
  expect(profile.protein_goal_is_custom).toBe(true);
  expect(profile.onboarding_complete).toBe(true);
});

test('changing body weight never silently overwrites a custom range', () => {
  onboard(180, { min: 150, max: 190 }, true);
  const result = saveBodyWeight(200, 'lb')!;
  expect(result.shouldPromptRangeUpdate).toBe(true);
  expect(result.suggestedRange).toMatchObject({ min: 140, max: 200 });
  expect(getState().profile).toMatchObject({ weight_value: 200, protein_goal_min: 150, protein_goal_max: 190 });

  keepRangeAfterWeightChange();
  expect(getState().profile).toMatchObject({ protein_goal_min: 150, protein_goal_max: 190, protein_goal_is_custom: true });
});

test('recalculating only applies after explicit confirmation', () => {
  onboard(180, { min: 125, max: 180 }, false);
  saveBodyWeight(150, 'lb');
  expect(getState().profile).toMatchObject({ protein_goal_min: 125, protein_goal_max: 180 });
  confirmRecalculatedRange();
  expect(getState().profile).toMatchObject({ protein_goal_min: 105, protein_goal_max: 150, protein_goal_is_custom: false });
});

test('switching units converts weight but keeps the range', () => {
  onboard(180, { min: 125, max: 180 }, false);
  setWeightUnit('kg');
  expect(getState().profile).toMatchObject({ weight_unit: 'kg', weight_value: 81.6, protein_goal_min: 125, protein_goal_max: 180 });
});

test('profile writes are queued for sync', () => {
  onboard(180, { min: 125, max: 180 }, false);
  const tables = getState().outbox.map(item => item.table);
  expect(tables).toEqual(expect.arrayContaining(['profiles', 'notification_preferences']));
});
