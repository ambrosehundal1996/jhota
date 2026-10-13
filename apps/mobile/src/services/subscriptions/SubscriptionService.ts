import type { SubscriptionSnapshot } from '../../types/models';

export type PlanPeriod = 'annual' | 'monthly' | 'other';

export interface PaywallPackage {
  id: string;
  period: PlanPeriod;
  title: string;
  /** Localized store price, e.g. "$59.99". Never hard-coded. */
  priceString: string;
  /** e.g. "$4.99/mo" for annual plans when derivable. */
  pricePerMonthString: string | null;
  /** e.g. "7 days free" from the store's introductory offer. */
  introOffer: string | null;
}

export interface PurchaseResult {
  status: SubscriptionSnapshot;
  cancelled: boolean;
}

/** Vendor-neutral billing contract; RevenueCat is the default adapter. */
export interface SubscriptionService {
  isConfigured(): boolean;
  configure(appUserId: string): Promise<void>;
  logIn(appUserId: string): Promise<SubscriptionSnapshot | null>;
  getStatus(): Promise<SubscriptionSnapshot | null>;
  getPackages(): Promise<PaywallPackage[]>;
  purchase(packageId: string): Promise<PurchaseResult>;
  restore(): Promise<SubscriptionSnapshot | null>;
  onStatusChange(listener: (status: SubscriptionSnapshot) => void): () => void;
  manageSubscriptionsUrl(): string;
}
