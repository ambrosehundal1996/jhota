import { analytics } from '../analytics';
import { startDataEffects } from '../features/effects';
import { startDevTools } from './devTools';
import { applySubscriptionStatus, subscriptions } from '../services/subscriptions';
import { ensureSession } from '../services/supabase/auth';
import { startSyncEngine } from '../services/sync/syncEngine';
import { getState, LOCAL_USER_ID, useAppStore } from '../state/appStore';

let started = false;

async function startBilling(): Promise<() => void> {
  if (!subscriptions.isConfigured()) return () => undefined;
  const { userId } = getState();
  await subscriptions.configure(userId === LOCAL_USER_ID ? '' : userId);
  const unsubscribe = subscriptions.onStatusChange(applySubscriptionStatus);
  applySubscriptionStatus(await subscriptions.getStatus().catch(() => null));

  // Keep RevenueCat's app user id equal to the Supabase user id (survives Apple linking).
  let lastUserId = userId;
  const unsubUser = useAppStore.subscribe(state => {
    if (state.userId === lastUserId || state.userId === LOCAL_USER_ID) return;
    lastUserId = state.userId;
    subscriptions
      .logIn(state.userId)
      .then(applySubscriptionStatus)
      .catch(() => undefined);
  });
  return () => {
    unsubscribe();
    unsubUser();
  };
}

/** Starts background services once per process. Every step tolerates being offline. */
export function bootstrap(): () => void {
  if (started) return () => undefined;
  started = true;
  analytics.track('app_opened', {});
  const stopSync = startSyncEngine();
  const stopEffects = startDataEffects();
  const stopDevTools = startDevTools();
  let stopBilling: () => void = () => undefined;

  ensureSession()
    .catch(() => null)
    .finally(() => {
      startBilling()
        .then(stop => {
          stopBilling = stop;
        })
        .catch(() => undefined);
    });

  return () => {
    stopSync();
    stopEffects();
    stopDevTools();
    stopBilling();
    started = false;
  };
}
