declare const __JOTA_PUBLIC_ENV__: Record<string, string | undefined>;

const read = (key: string): string => __JOTA_PUBLIC_ENV__[key]?.trim() ?? '';

export const appConfig = {
  paywallEnabled: false,
  supabaseUrl: read('SUPABASE_URL'),
  supabaseAnonKey: read('SUPABASE_ANON_KEY'),
  apiBaseUrl: read('API_BASE_URL').replace(/\/$/, ''),
  revenueCatIosKey: '',
  entitlementId: read('REVENUECAT_ENTITLEMENT_ID') || 'pro',
  posthogKey: read('POSTHOG_API_KEY'),
  posthogHost: read('POSTHOG_HOST') || 'https://us.i.posthog.com',
  privacyUrl: read('PRIVACY_URL') || 'https://jota.app/privacy',
  termsUrl: read('TERMS_URL') || 'https://jota.app/terms',
  supportEmail: read('SUPPORT_EMAIL') || 'support@jota.app',
} as const;

export const isSupabaseConfigured = () => !!appConfig.supabaseUrl && !!appConfig.supabaseAnonKey;
/** App Store billing is iOS-only; the web build never shows the paywall. */
export const isPaywallEnabled = () => false;
export const isBillingConfigured = () => false;
