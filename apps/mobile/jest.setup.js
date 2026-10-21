/* eslint-env jest */
jest.mock('./src/services/sync/scheduler', () => ({
  scheduleSync: jest.fn(),
}));
jest.mock('./src/analytics', () => ({
  analytics: { track: jest.fn(), identify: jest.fn(), screen: jest.fn() },
}));
jest.mock('./src/services/haptics', () => ({
  haptic: jest.fn(),
}));
jest.mock('./src/components/Toast', () => ({
  showToast: jest.fn(),
  hideToast: jest.fn(),
  ToastHost: () => null,
}));
