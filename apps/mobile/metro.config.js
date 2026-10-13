const path = require('path');
const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

/**
 * Monorepo setup: watch the workspace so @steady/domain source changes hot-reload, and
 * resolve modules from the hoisted root node_modules.
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const config = {
  watchFolders: [workspaceRoot],
  resolver: {
    nodeModulesPaths: [
      path.resolve(projectRoot, 'node_modules'),
      path.resolve(workspaceRoot, 'node_modules'),
    ],
    unstable_enablePackageExports: true,
    unstable_conditionNames: ['react-native', 'require', 'default'],
  },
};

module.exports = mergeConfig(getDefaultConfig(projectRoot), config);
