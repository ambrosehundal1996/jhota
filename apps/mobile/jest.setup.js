/* eslint-env jest */
jest.mock('./src/services/sync/scheduler', () => ({
  scheduleSync: jest.fn(),
}));
jest.mock('./src/analytics', () => ({
  analytics: {
    track: jest.fn(),
    identify: jest.fn(),
    identifyCurrentUser: jest.fn(),
    startPersonSync: jest.fn(() => () => undefined),
    screen: jest.fn(),
  },
  logEntryMethod: jest.requireActual('./src/analytics/events').logEntryMethod,
  deviceTimezone: jest.requireActual('./src/analytics/events').deviceTimezone,
}));
jest.mock('./src/services/haptics', () => ({
  haptic: jest.fn(),
}));
jest.mock('./src/components/Toast', () => ({
  showToast: jest.fn(),
  hideToast: jest.fn(),
  ToastHost: () => null,
}));
