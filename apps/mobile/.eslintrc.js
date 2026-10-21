module.exports = {
  root: true,
  extends: '@react-native',
  ignorePatterns: ['ios/', 'android/', 'node_modules/', 'coverage/', 'web-build/'],
  rules: {
    // `void promise` marks intentionally un-awaited work.
    'no-void': 'off',
    'react/no-unstable-nested-components': ['warn', { allowAsProps: true }],
    'react-native/no-inline-styles': 'off',
  },
  overrides: [
    {
      files: ['*.ts', '*.tsx'],
      rules: {
        '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_', ignoreRestSiblings: true }],
      },
    },
    { files: ['src/utils/id.ts'], rules: { 'no-bitwise': 'off' } },
    { files: ['index.web.js'], env: { browser: true }, rules: { 'no-alert': 'off' } },
  ],
};
