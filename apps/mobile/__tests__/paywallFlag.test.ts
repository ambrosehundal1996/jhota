const mockEnv: Record<string, string> = { REVENUECAT_IOS_API_KEY: 'appl_test_key' };

jest.mock('react-native-config', () => ({ __esModule: true, default: mockEnv }));
jest.mock('react-native-purchases', () => ({
  __esModule: true,
  default: { configure: jest.fn(), setLogLevel: jest.fn(), getCustomerInfo: jest.fn(), addCustomerInfoUpdateListener: jest.fn() },
  LOG_LEVEL: { WARN: 'WARN' },
  PACKAGE_TYPE: {},
  PURCHASES_ERROR_CODE: {},
}));

function load(paywallEnabled: string | undefined) {
  if (paywallEnabled === undefined) delete mockEnv.PAYWALL_ENABLED;
  else mockEnv.PAYWALL_ENABLED = paywallEnabled;
  let loaded!: {
    config: typeof import('../src/config');
    subs: typeof import('../src/services/subscriptions');
    store: typeof import('../src/state/appStore');
    Purchases: { configure: jest.Mock };
  };
  jest.isolateModules(() => {
    loaded = {
      config: require('../src/config'),
      subs: require('../src/services/subscriptions'),
      store: require('../src/state/appStore'),
      Purchases: require('react-native-purchases').default,
    };
  });
  return loaded;
}

test.each([undefined, '', 'false', 'yes'])('paywall flag %p is off: full access and RevenueCat untouched', async flag => {
  const { config, subs, store, Purchases } = load(flag);
  expect(config.isPaywallEnabled()).toBe(false);
  expect(config.isBillingConfigured()).toBe(false);
  expect(subs.subscriptions.isConfigured()).toBe(false);
  expect(subs.hasAccess({ ...store.getState(), subscription: null })).toBe(true);
  await subs.subscriptions.configure('user-1');
  expect(Purchases.configure).not.toHaveBeenCalled();
});

test.each(['true', '1', 'TRUE'])('paywall flag %p is on: access requires an active subscription', flag => {
  const { config, subs, store } = load(flag);
  expect(config.isPaywallEnabled()).toBe(true);
  expect(config.isBillingConfigured()).toBe(true);
  const state = store.getState();
  expect(subs.hasAccess({ ...state, subscription: null, flags: { ...state.flags, devBypassPaywall: false } })).toBe(false);
});
