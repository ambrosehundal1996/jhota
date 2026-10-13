/* eslint-env jest */
jest.mock('./src/services/sync/scheduler', () => ({
  scheduleSync: jest.fn(),
}));
jest.mock('./src/analytics', () => ({
  analytics: { track: jest.fn(), identify: jest.fn(), screen: jest.fn() },
}));
