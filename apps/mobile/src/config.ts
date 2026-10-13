import Config from 'react-native-config';

const read = (key: string): string => (Config as Record<string, string | undefined>)[key]?.trim() ?? '';
const readFlag = (key: string): boolean => ['true', '1'].includes(read(key).toLowerCase());

export const appConfig = {
  paywallEnabled: readFlag('PAYWALL_ENABLED'),
  supabaseUrl: read('SUPABASE_URL'),
  supabaseAnonKey: read('SUPABASE_ANON_KEY'),
  apiBaseUrl: read('API_BASE_URL').replace(/\/$/, ''),
  revenueCatIosKey: read('REVENUECAT_IOS_API_KEY'),
  entitlementId: read('REVENUECAT_ENTITLEMENT_ID') || 'pro',
  posthogKey: read('POSTHOG_API_KEY'),
  posthogHost: read('POSTHOG_HOST') || 'https://us.i.posthog.com',
  privacyUrl: read('PRIVACY_URL') || 'https://steady.app/privacy',
  termsUrl: read('TERMS_URL') || 'https://steady.app/terms',
  supportEmail: read('SUPPORT_EMAIL') || 'support@steady.app',
} as const;

export const isSupabaseConfigured = () => !!appConfig.supabaseUrl && !!appConfig.supabaseAnonKey;
/** When off, RevenueCat is never touched and every user has full access. */
export const isPaywallEnabled = () => appConfig.paywallEnabled;
export const isBillingConfigured = () => isPaywallEnabled() && !!appConfig.revenueCatIosKey;
