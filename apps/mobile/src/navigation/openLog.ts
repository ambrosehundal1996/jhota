import type { NavigationProp, ParamListBase } from '@react-navigation/native';
import { analytics } from '../analytics';
import type { LogStackParamList } from './types';

type LogScreen = keyof LogStackParamList;

/** Opens a screen inside the Log modal stack from anywhere in the app. */
export function openLog<S extends LogScreen>(
  navigation: Pick<NavigationProp<ParamListBase>, 'navigate'>,
  screen: S,
  params?: LogStackParamList[S],
): void {
  if (screen !== 'FoodDetail') {
    const src = (params as { src?: string } | undefined)?.src ?? 'app';
    analytics.track('log_started', { screen, src });
  }
  navigation.navigate('Log', { screen, params, initial: screen === 'LogHome' });
}
