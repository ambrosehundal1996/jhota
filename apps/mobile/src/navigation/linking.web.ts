import type { LinkingOptions } from '@react-navigation/native';
import type { RootStackParamList } from './types';

/** Browser URLs map to the same paths as the app's steady:// deep links, e.g. /progress or /log/quick-add. */
export const linking: LinkingOptions<RootStackParamList> = {
  prefixes: [typeof window !== 'undefined' ? window.location.origin : 'http://localhost'],
  config: {
    initialRouteName: 'Main',
    screens: {
      Main: {
        screens: {
          Today: '',
          Progress: 'progress',
          Profile: 'profile',
        },
      },
      Log: {
        screens: {
          LogHome: 'log',
          QuickAdd: 'log/quick-add',
          Photo: 'log/photo',
          Search: 'log/search',
          SetTotal: 'log/set-total',
          Barcode: 'log/barcode',
        },
      },
      Day: 'day/:date',
    },
  },
};
