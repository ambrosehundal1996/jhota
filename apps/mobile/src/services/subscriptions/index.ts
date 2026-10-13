import { analytics } from '../../analytics';
import { getState, setState } from '../../state/appStore';
import type { SubscriptionSnapshot } from '../../types/models';
import { revenueCatService } from './revenueCat';
import type { SubscriptionService } from './SubscriptionService';

export type { PaywallPackage } from './SubscriptionService';

export const subscriptions: SubscriptionService = revenueCatService;

/** Stores the latest entitlement state and emits lifecycle analytics on transitions. */
export function applySubscriptionStatus(next: SubscriptionSnapshot | null): void {
  if (!next) return;
  const previous = getState().subscription;
  setState({ subscription: next });
  if (!previous?.isActive && next.isActive) {
    analytics.track(next.isTrial ? 'trial_started' : 'subscription_started', { product: next.productIdentifier });
  }
  if (previous?.willRenew && next.willRenew === false) {
    analytics.track('subscription_cancelled', { product: next.productIdentifier });
  }
}

/** Entitlement gate. Cached CustomerInfo keeps paying users in the app while offline. */
export function hasAccess(state = getState()): boolean {
  if (!subscriptions.isConfigured()) return true;
  if (__DEV__ && state.flags.devBypassPaywall) return true;
  return !!state.subscription?.isActive;
}
