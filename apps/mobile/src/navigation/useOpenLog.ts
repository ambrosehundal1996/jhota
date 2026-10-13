import { useNavigation } from '@react-navigation/native';
import { useCallback } from 'react';
import { analytics } from '../analytics';
import type { LogStackParamList } from './types';

type ContextScreens = Exclude<keyof LogStackParamList, 'FoodDetail' | 'PhotoReview'>;

/** Opens the logging modal at a given screen with a date/meal context. */
export function useOpenLog() {
  const navigation = useNavigation();
  return useCallback(
    <S extends ContextScreens>(screen: S, params?: LogStackParamList[S]) => {
      const src = (params as { src?: string } | undefined)?.src ?? 'today';
      if (screen === 'LogHome' || screen === 'Search') analytics.track('log_started', { entry: src, method: screen === 'Search' ? 'search' : 'sheet' });
      // Nested navigate typing can't express the generic pairing; params are checked by the signature above.
      navigation.navigate('Log', { screen, params } as never);
    },
    [navigation],
  );
}
