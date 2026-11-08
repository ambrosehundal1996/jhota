import { analytics } from '../src/analytics';
import { deviceTimezone, logEntryMethod } from '../src/analytics/events';
import { completeOnboarding, setDisplayName, setOnboardingGoal, setOnboardingName, setOnboardingWeight } from '../src/features/profile/actions';
import { quickAdd } from '../src/features/logging/actions';
import { getState, initialAppData, useAppStore } from '../src/state/appStore';

beforeEach(() => {
  useAppStore.setState(initialAppData(), true);
  (analytics.track as jest.Mock).mockClear();
  (analytics.identify as jest.Mock).mockClear();
});

test('log methods collapse sources into dashboard buckets', () => {
  expect(logEntryMethod('ai_photo')).toBe('ai');
  expect(logEntryMethod('quick_add')).toBe('quick_add');
  expect(logEntryMethod('search')).toBe('search');
  expect(logEntryMethod('barcode')).toBe('manual');
  expect(logEntryMethod('custom')).toBe('manual');
  expect(logEntryMethod('recent')).toBe('manual');
  expect(logEntryMethod('favorite')).toBe('manual');
  expect(logEntryMethod('saved_meal')).toBe('manual');
  expect(logEntryMethod('copy')).toBe('manual');
});

test('food_logged includes the profile name and entry method', () => {
  setOnboardingName('Ambrose');
  setOnboardingGoal('build_muscle');
  setOnboardingWeight(185, 'lb');
  completeOnboarding({ min: 130, max: 185 }, false);
  (analytics.track as jest.Mock).mockClear();

  quickAdd({ grams: 40, date: '2026-10-09' });

  expect(analytics.track).toHaveBeenCalledWith(
    'food_logged',
    expect.objectContaining({
      source: 'quick_add',
      method: 'quick_add',
      protein_g: 40,
      name: 'Ambrose',
      timezone: deviceTimezone(),
    }),
  );
});

test('saving a profile name identifies the PostHog person', () => {
  useAppStore.setState({ userId: 'user-1' });
  setOnboardingName('Ambrose');
  setOnboardingGoal('build_muscle');
  setOnboardingWeight(185, 'lb');
  completeOnboarding({ min: 130, max: 185 }, false);

  expect(analytics.identify).toHaveBeenCalledWith(
    'user-1',
    expect.objectContaining({ $name: 'Ambrose', display_name: 'Ambrose', timezone: expect.any(String) }),
  );

  setDisplayName('Bo');
  expect(getState().profile?.display_name).toBe('Bo');
  expect(analytics.identify).toHaveBeenCalledWith('user-1', expect.objectContaining({ $name: 'Bo', display_name: 'Bo' }));
});
