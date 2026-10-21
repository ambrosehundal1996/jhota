module.exports = {
  preset: '@react-native/jest-preset',
  setupFiles: ['<rootDir>/jest.setup.js'],
  moduleNameMapper: {
    '^@jota/domain$': '<rootDir>/../../packages/domain/src/index.ts',
    '^react-native-mmkv$': '<rootDir>/test/mocks/mmkv.ts',
    '^react-native-config$': '<rootDir>/test/mocks/config.ts',
    '^react-native-get-random-values$': '<rootDir>/test/mocks/empty.ts',
    '^react-native-url-polyfill/auto$': '<rootDir>/test/mocks/empty.ts',
  },
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|@react-navigation|zod)/)',
  ],
  testPathIgnorePatterns: ['/node_modules/', '/test/mocks/'],
};
