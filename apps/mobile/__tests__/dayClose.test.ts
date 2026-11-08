import { analytics } from '../src/analytics';
import { datesToClose, flushClosedDays } from '../src/features/logging/dayClose';
import { completeOnboarding, setOnboardingGoal, setOnboardingName, setOnboardingWeight } from '../src/features/profile/actions';
import { quickAdd } from '../src/features/logging/actions';
import { getState, initialAppData, useAppStore } from '../src/state/appStore';

function onboard() {
  setOnboardingName('Ambrose');
  setOnboardingGoal('build_muscle');
  setOnboardingWeight(185, 'lb');
  completeOnboarding({ min: 130, max: 185 }, false);
}

beforeEach(() => {
  useAppStore.setState(initialAppData(), true);
  (analytics.track as jest.Mock).mockClear();
});

test('datesToClose only includes finished days after lastClosed', () => {
  expect(datesToClose('2026-11-06', null, ['2026-11-06', '2026-11-05', '2026-11-04'])).toEqual([
    '2026-11-04',
    '2026-11-05',
  ]);
  expect(datesToClose('2026-11-06', '2026-11-04', ['2026-11-05', '2026-11-04'])).toEqual(['2026-11-05']);
  expect(datesToClose('2026-11-06', '2026-11-05', ['2026-11-05'])).toEqual([]);
});

test('flushing the next morning sends one day_closed with total, goal, and reached', () => {
  onboard();
  quickAdd({ grams: 40, date: '2026-11-05' });
  quickAdd({ grams: 100, date: '2026-11-05' });
  (analytics.track as jest.Mock).mockClear();

  expect(flushClosedDays({ now: new Date(2026, 10, 6, 8) })).toEqual(['2026-11-05']);
  expect(analytics.track).toHaveBeenCalledWith(
    'day_closed',
    expect.objectContaining({
      date: '2026-11-05',
      name: 'Ambrose',
      log_count: 2,
      total_g: 140,
      min: 130,
      max: 185,
      reached: true,
      in_range: true,
      percent_of_goal: 108,
      source: 'logs',
    }),
  );
  expect(getState().flags.lastClosedDate).toBe('2026-11-05');
  expect(flushClosedDays({ now: new Date(2026, 10, 6, 9) })).toEqual([]);
});

test('an opened day with no logs still closes as a miss', () => {
  onboard();
  flushClosedDays({ now: new Date(2026, 10, 5, 9) });
  (analytics.track as jest.Mock).mockClear();

  expect(flushClosedDays({ now: new Date(2026, 10, 6, 8) })).toEqual(['2026-11-05']);
  expect(analytics.track).toHaveBeenCalledWith(
    'day_closed',
    expect.objectContaining({
      date: '2026-11-05',
      log_count: 0,
      total_g: 0,
      min: 130,
      reached: false,
    }),
  );
});

test('days the user never opened and never logged are not closed', () => {
  onboard();
  quickAdd({ grams: 150, date: '2026-11-01' });
  (analytics.track as jest.Mock).mockClear();

  expect(flushClosedDays({ now: new Date(2026, 10, 6, 8) })).toEqual(['2026-11-01']);
  expect(analytics.track).toHaveBeenCalledTimes(1);
});
