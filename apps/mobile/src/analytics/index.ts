import { appConfig } from '../config';
import { getState } from '../state/appStore';
import type { AnalyticsAdapter, AnalyticsEvent, AnalyticsProps } from './events';

export type { AnalyticsEvent, AnalyticsProps };

const consoleAdapter: AnalyticsAdapter = {
  track: (event, props) => {
    if (__DEV__) console.log(`[analytics] ${event}`, props);
  },
  identify: (id, traits) => {
    if (__DEV__) console.log('[analytics] identify', id, traits);
  },
};

/** PostHog capture API over fetch; no SDK so the vendor stays swappable. */
function posthogAdapter(apiKey: string, host: string): AnalyticsAdapter {
  const send = (body: Record<string, unknown>) =>
    fetch(`${host}/capture/`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ api_key: apiKey, ...body }),
    }).catch(() => undefined);
  return {
    track: (event, props, distinctId) =>
      void send({ event, distinct_id: distinctId, properties: { ...props, $lib: 'steady-ios' }, timestamp: new Date().toISOString() }),
    identify: (distinctId, traits) => void send({ event: '$identify', distinct_id: distinctId, properties: { $set: traits } }),
  };
}

const adapters: AnalyticsAdapter[] = [consoleAdapter];
if (appConfig.posthogKey) adapters.push(posthogAdapter(appConfig.posthogKey, appConfig.posthogHost));

export const analytics = {
  track(event: AnalyticsEvent, props: AnalyticsProps = {}) {
    const distinctId = getState().userId;
    for (const adapter of adapters) adapter.track(event, props, distinctId);
  },
  identify(distinctId: string, traits: AnalyticsProps = {}) {
    for (const adapter of adapters) adapter.identify(distinctId, traits);
  },
};
