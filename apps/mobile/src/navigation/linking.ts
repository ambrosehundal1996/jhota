import notifee from '@notifee/react-native';
import type { LinkingOptions } from '@react-navigation/native';
import { Linking } from 'react-native';
import { analytics } from '../analytics';
import { getInitialNotificationLink, linkFromNotificationEvent } from '../services/notifications/reminders';
import type { RootStackParamList } from './types';

export const URL_PREFIXES = ['jota://'];

const ACTIONS: Record<string, string> = {
  'log/quick-add': 'quick_add',
  'log/photo': 'ai_photo',
  'log/search': 'search',
  'log/set-total': 'set_total',
  log: 'log',
};

/** Widget links carry ?src=widget so taps are attributable without extra native code. */
export function trackIncomingUrl(url: string): void {
  const match = url.match(/^jota:\/\/([^?]*)(?:\?(.*))?$/);
  if (!match) return;
  const path = (match[1] ?? '').replace(/\/$/, '');
  const src = new URLSearchParams(match[2] ?? '').get('src');
  if (src === 'widget') {
    analytics.track('widget_opened', { path });
    const action = ACTIONS[path];
    if (action && action !== 'log') analytics.track('widget_quick_action_used', { action });
  }
  if (path.startsWith('log')) analytics.track('log_started', { from: src ?? 'link', path });
}

export const linking: LinkingOptions<RootStackParamList> = {
  prefixes: URL_PREFIXES,
  config: {
    initialRouteName: 'Main',
    screens: {
      Main: {
        screens: {
          Today: 'today',
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
  async getInitialURL() {
    const fromNotification = await getInitialNotificationLink();
    const url = fromNotification ?? (await Linking.getInitialURL());
    if (url) trackIncomingUrl(url);
    return url;
  },
  subscribe(listener) {
    const linkSub = Linking.addEventListener('url', ({ url }) => {
      trackIncomingUrl(url);
      listener(url);
    });
    const notifeeUnsub = notifee.onForegroundEvent(event => {
      const link = linkFromNotificationEvent(event);
      if (link) {
        trackIncomingUrl(link);
        listener(link);
      }
    });
    return () => {
      linkSub.remove();
      notifeeUnsub();
    };
  },
};
