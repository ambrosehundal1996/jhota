import type { SubscriptionSnapshot } from '../../types/models';
import type { SubscriptionService } from './SubscriptionService';

/** App Store purchases don't exist on web; access is not gated there. */
export const revenueCatService: SubscriptionService = {
  isConfigured: () => false,
  configure: async () => undefined,
  logIn: async () => null,
  getStatus: async () => null,
  getPackages: async () => [],
  purchase: async () => {
    throw new Error('Subscriptions are managed in the Steady iOS app.');
  },
  restore: async () => null,
  onStatusChange: () => () => undefined,
  manageSubscriptionsUrl: () => 'https://apps.apple.com/account/subscriptions',
};

export const emptySnapshot = (): SubscriptionSnapshot => ({
  isActive: false,
  isTrial: false,
  hasExpired: false,
  expiresAt: null,
  willRenew: null,
  productIdentifier: null,
  checkedAt: new Date().toISOString(),
});
