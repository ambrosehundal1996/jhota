import { addDays, toLocalDate } from '@jota/domain';
import { Linking, Platform, Settings } from 'react-native';
import { quickAdd } from '../features/logging/actions';
import { completeOnboarding, setOnboardingGoal, setOnboardingWeight } from '../features/profile/actions';
import { initialAppData, setState, useAppStore } from '../state/appStore';

declare const window: { location: { href: string }; history: { replaceState(data: null, unused: string, url: string): void } };

const DEMO_WEEK: [number, string, number][] = [
  [-6, 'Greek yogurt', 150],
  [-5, 'Chicken bowl', 120],
  [-4, 'Protein shake', 160],
  [-2, 'Salmon dinner', 145],
  [-1, 'Turkey wrap', 110],
];

/** Debug-only: `jota://dev/seed` creates a demo profile and week; `jota://dev/reset` wipes local data. */
function seed(): void {
  useAppStore.setState(initialAppData(), true);
  setOnboardingGoal('build_muscle');
  setOnboardingWeight(180, 'lb');
  completeOnboarding({ min: 125, max: 180 }, false);
  const today = toLocalDate(new Date());
  for (const [offset, name, grams] of DEMO_WEEK) {
    quickAdd({ grams, name, date: addDays(today, offset) });
  }
  quickAdd({ grams: 32, name: 'Eggs and toast', date: today });
  quickAdd({ grams: 54, name: 'Chicken salad', date: today });
  setState(s => ({ flags: { ...s.flags, devBypassPaywall: true, notificationPromptShown: true } }));
}

/**
 * Simulator launch arguments land in NSUserDefaults, e.g.
 * `xcrun simctl launch booted app.jota.ios -jotaDevSeed YES -jotaDevLink jota://progress`.
 */
function applyLaunchArguments(): void {
  if (Platform.OS === 'web') {
    // Web equivalent: open http://localhost:8080/?devSeed
    const url = new URL(window.location.href);
    if (url.searchParams.has('devSeed')) {
      seed();
      url.searchParams.delete('devSeed');
      window.history.replaceState(null, '', url.toString());
    }
    return;
  }
  if (Platform.OS !== 'ios') return;
  if (Settings.get('jotaDevSeed')) seed();
  const link = Settings.get('jotaDevLink');
  if (typeof link === 'string' && link.startsWith('jota://')) {
    setTimeout(() => void Linking.openURL(link), 800);
  }
}

export function startDevTools(): () => void {
  if (!__DEV__) return () => undefined;
  applyLaunchArguments();
  const sub = Linking.addEventListener('url', ({ url }) => {
    if (url.startsWith('jota://dev/seed')) seed();
    if (url.startsWith('jota://dev/reset')) useAppStore.setState(initialAppData(), true);
  });
  return () => sub.remove();
}
