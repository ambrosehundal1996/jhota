import { appConfig } from '../config';
import { getState, LOCAL_USER_ID, useAppStore } from '../state/appStore';
import { deviceTimezone, type AnalyticsAdapter, type AnalyticsEvent, type AnalyticsProps } from './events';

export type { AnalyticsEvent, AnalyticsProps, LogEntryMethod };
export { deviceTimezone, logEntryMethod } from './events';

const consoleAdapter: AnalyticsAdapter = {
  track: (event, props) => {
    if (__DEV__) console.log(`[analytics] ${event}`, props);
  },
  identify: (id, traits) => {
    if (__DEV__) console.log('[analytics] identify', id, traits);
  },
};

function maskKey(key: string): string {
  if (key.length < 8) return '(short)';
  return `${key.slice(0, 7)}…${key.slice(-4)}`;
}

/** PostHog capture API over fetch; no SDK so the vendor stays swappable. */
function posthogAdapter(apiKey: string, host: string): AnalyticsAdapter {
  const endpoint = `${host.replace(/\/$/, '')}/capture/`;
  console.log(`[posthog] enabled host=${host} key=${maskKey(apiKey)}`);

  const send = async (event: string, body: Record<string, unknown>) => {
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ api_key: apiKey, ...body }),
      });
      const detail = response.ok ? '' : ` ${await response.text().catch(() => '')}`.slice(0, 200);
      console.log(`[posthog] ${response.ok ? 'sent' : 'failed'} ${event} ${response.status}${detail}`);
    } catch (error) {
      console.warn(`[posthog] failed ${event} network`, error instanceof Error ? error.message : error);
    }
  };

  return {
    track: (event, props, distinctId) => {
      const name = typeof props.name === 'string' ? props.name : undefined;
      const timezone = typeof props.timezone === 'string' ? props.timezone : undefined;
      return void send(event, {
        event,
        distinct_id: distinctId,
        properties: {
          ...props,
          $lib: 'jota-ios',
          $set: {
            ...(name ? { $name: name, display_name: name } : {}),
            ...(timezone ? { timezone } : {}),
          },
        },
        timestamp: new Date().toISOString(),
      });
    },
    identify: (distinctId, traits) =>
      void send('$identify', { event: '$identify', distinct_id: distinctId, properties: { $set: traits } }),
  };
}

const adapters: AnalyticsAdapter[] = [consoleAdapter];
if (appConfig.posthogKey) {
  adapters.push(posthogAdapter(appConfig.posthogKey, appConfig.posthogHost));
} else {
  console.warn('[posthog] skipped — POSTHOG_API_KEY is empty. Events stay in the Metro log only.');
}

function currentDisplayName(): string | null {
  const { profile, onboarding } = getState();
  return profile?.display_name?.trim() || onboarding.displayName?.trim() || null;
}

function personKey(): string {
  const { userId } = getState();
  return `${userId}:${currentDisplayName() ?? ''}:${deviceTimezone()}`;
}

function personTraits(): AnalyticsProps {
  const name = currentDisplayName();
  return { $name: name, display_name: name, timezone: deviceTimezone() };
}

export const analytics = {
  track(event: AnalyticsEvent, props: AnalyticsProps = {}) {
    const distinctId = getState().userId;
    const name = currentDisplayName();
    const next = { timezone: deviceTimezone(), ...(name ? { name } : {}), ...props };
    for (const adapter of adapters) adapter.track(event, next, distinctId);
  },
  identify(distinctId: string, traits: AnalyticsProps = {}) {
    if (!distinctId || distinctId === LOCAL_USER_ID) return;
    for (const adapter of adapters) adapter.identify(distinctId, traits);
  },
  /** Bind this device's user to a PostHog person so People and HogQL can show a name. */
  identifyCurrentUser() {
    const { userId } = getState();
    analytics.identify(userId, personTraits());
  },
  /** Re-identifies when Apple linking or a display-name edit changes who this device is. */
  startPersonSync(): () => void {
    let last = personKey();
    analytics.identifyCurrentUser();
    return useAppStore.subscribe(() => {
      const next = personKey();
      if (next === last) return;
      last = next;
      analytics.identifyCurrentUser();
    });
  },
};
