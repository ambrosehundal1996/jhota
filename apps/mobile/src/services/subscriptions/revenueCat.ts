import Purchases, {
  LOG_LEVEL,
  PACKAGE_TYPE,
  PURCHASES_ERROR_CODE,
  type CustomerInfo,
  type PurchasesPackage,
} from 'react-native-purchases';
import { appConfig, isBillingConfigured } from '../../config';
import type { SubscriptionSnapshot } from '../../types/models';
import type { PaywallPackage, PlanPeriod, SubscriptionService } from './SubscriptionService';

let configured = false;
let packagesById = new Map<string, PurchasesPackage>();

export function snapshotFromCustomerInfo(info: CustomerInfo, entitlementId = appConfig.entitlementId): SubscriptionSnapshot {
  const active = info.entitlements.active[entitlementId];
  const any = info.entitlements.all[entitlementId];
  return {
    isActive: !!active,
    isTrial: active?.periodType === 'TRIAL',
    hasExpired: !active && !!any,
    expiresAt: (active ?? any)?.expirationDate ?? null,
    willRenew: (active ?? any)?.willRenew ?? null,
    productIdentifier: (active ?? any)?.productIdentifier ?? null,
    checkedAt: new Date().toISOString(),
  };
}

const periodOf = (pkg: PurchasesPackage): PlanPeriod =>
  pkg.packageType === PACKAGE_TYPE.ANNUAL ? 'annual' : pkg.packageType === PACKAGE_TYPE.MONTHLY ? 'monthly' : 'other';

function describeIntro(pkg: PurchasesPackage): string | null {
  const intro = pkg.product.introPrice;
  if (!intro) return null;
  const unit = intro.periodUnit.toLowerCase().replace(/s$/, '');
  const count = intro.periodNumberOfUnits * Math.max(1, intro.cycles);
  const span = unit === 'week' ? `${count * 7} days` : `${count} ${unit}${count === 1 ? '' : 's'}`;
  return intro.price === 0 ? `${span} free` : `${intro.priceString} for ${span}`;
}

export const revenueCatService: SubscriptionService = {
  isConfigured: () => isBillingConfigured(),

  async configure(appUserId) {
    if (!isBillingConfigured() || configured) return;
    if (__DEV__) Purchases.setLogLevel(LOG_LEVEL.WARN);
    Purchases.configure({ apiKey: appConfig.revenueCatIosKey, appUserID: appUserId || undefined });
    configured = true;
  },

  async logIn(appUserId) {
    if (!configured) return null;
    const { customerInfo } = await Purchases.logIn(appUserId);
    return snapshotFromCustomerInfo(customerInfo);
  },

  async getStatus() {
    if (!configured) return null;
    return snapshotFromCustomerInfo(await Purchases.getCustomerInfo());
  },

  async getPackages() {
    if (!configured) return [];
    const offerings = await Purchases.getOfferings();
    const packages = offerings.current?.availablePackages ?? [];
    packagesById = new Map(packages.map(p => [p.identifier, p]));
    return packages
      .map<PaywallPackage>(pkg => ({
        id: pkg.identifier,
        period: periodOf(pkg),
        title: periodOf(pkg) === 'annual' ? 'Yearly' : periodOf(pkg) === 'monthly' ? 'Monthly' : pkg.product.title,
        priceString: pkg.product.priceString,
        pricePerMonthString: periodOf(pkg) === 'annual' ? pkg.product.pricePerMonthString ?? null : null,
        introOffer: describeIntro(pkg),
      }))
      .sort((a, b) => (a.period === 'annual' ? -1 : b.period === 'annual' ? 1 : 0));
  },

  async purchase(packageId) {
    const pkg = packagesById.get(packageId);
    if (!pkg) throw new Error('That plan is no longer available. Please try again.');
    try {
      const { customerInfo } = await Purchases.purchasePackage(pkg);
      return { status: snapshotFromCustomerInfo(customerInfo), cancelled: false };
    } catch (error) {
      const e = error as { code?: string; userCancelled?: boolean | null };
      if (e.userCancelled || e.code === PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR) {
        const status = await this.getStatus();
        return { status: status ?? emptySnapshot(), cancelled: true };
      }
      throw error;
    }
  },

  async restore() {
    if (!configured) return null;
    return snapshotFromCustomerInfo(await Purchases.restorePurchases());
  },

  onStatusChange(listener) {
    if (!configured) return () => undefined;
    const handler = (info: CustomerInfo) => listener(snapshotFromCustomerInfo(info));
    Purchases.addCustomerInfoUpdateListener(handler);
    return () => {
      Purchases.removeCustomerInfoUpdateListener(handler);
    };
  },

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
