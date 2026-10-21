const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const dotenv = require('dotenv');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

// Only public client values are exposed to the browser bundle; never add server secrets here.
const PUBLIC_ENV_KEYS = [
  'SUPABASE_URL',
  'SUPABASE_ANON_KEY',
  'API_BASE_URL',
  'REVENUECAT_ENTITLEMENT_ID',
  'POSTHOG_API_KEY',
  'POSTHOG_HOST',
  'PRIVACY_URL',
  'TERMS_URL',
  'SUPPORT_EMAIL',
];

function readPublicEnv() {
  const fromFile = dotenv.config({ path: path.join(projectRoot, '.env'), quiet: true }).parsed ?? {};
  const env = {};
  for (const key of PUBLIC_ENV_KEYS) {
    const value = process.env[key] ?? fromFile[key];
    if (value) env[key] = value;
  }
  return env;
}

// React Native libraries publish untranspiled JSX/Flow/TS, so they go through Babel like app code.
const compileModules = [
  'react-native-reanimated',
  'react-native-worklets',
  'react-native-safe-area-context',
  'react-native-screens',
  'react-native-svg',
  'react-native-image-picker',
  'react-native-vector-icons',
  '@react-native-community/netinfo',
  '@react-navigation',
  '@react-native/assets-registry',
];

const shouldCompile = file => {
  if (!file.includes('node_modules')) return true;
  return compileModules.some(name => file.includes(`${path.sep}node_modules${path.sep}${name}${path.sep}`));
};

/** Native-only modules the web build must never pull in. Each has a `.web.ts` counterpart in src. */
const nativeOnly = [
  '@notifee/react-native',
  '@invertase/react-native-apple-authentication',
  'react-native-purchases',
  'react-native-mmkv',
  'react-native-config',
  'react-native-vision-camera',
  'react-native-nitro-image',
  'react-native-nitro-modules',
];

module.exports = (_env, argv) => {
  const isDev = argv.mode !== 'production';
  return {
    mode: isDev ? 'development' : 'production',
    context: projectRoot,
    entry: path.join(projectRoot, 'index.web.js'),
    output: {
      path: path.join(projectRoot, 'web-build'),
      filename: isDev ? '[name].js' : '[name].[contenthash].js',
      publicPath: '/',
      clean: true,
    },
    devtool: isDev ? 'eval-cheap-module-source-map' : 'source-map',
    resolve: {
      extensions: ['.web.tsx', '.web.ts', '.web.js', '.tsx', '.ts', '.js', '.jsx', '.json'],
      alias: {
        'react-native$': 'react-native-web',
        '@jota/domain': path.join(workspaceRoot, 'packages/domain/src/index.ts'),
        'react-native-get-random-values': false,
        'react-native-url-polyfill/auto': false,
        ...Object.fromEntries(nativeOnly.map(name => [name, false])),
      },
      mainFields: ['browser', 'module', 'main'],
      modules: [path.join(projectRoot, 'node_modules'), path.join(workspaceRoot, 'node_modules'), 'node_modules'],
    },
    module: {
      rules: [
        {
          // Libraries marked "type": "module" use extensionless relative imports.
          test: /\.m?js$/,
          resolve: { fullySpecified: false },
        },
        {
          test: /\.[jt]sx?$/,
          include: shouldCompile,
          use: {
            loader: 'babel-loader',
            options: {
              babelrc: false,
              configFile: false,
              cacheDirectory: true,
              presets: [['module:@react-native/babel-preset', { disableImportExportTransform: true }]],
              plugins: ['react-native-worklets/plugin'],
            },
          },
        },
        {
          test: /\.(png|jpe?g|gif|svg|ttf|otf)$/,
          type: 'asset/resource',
        },
      ],
    },
    plugins: [
      new HtmlWebpackPlugin({ template: path.join(projectRoot, 'web/index.html') }),
      new webpack.DefinePlugin({
        __DEV__: JSON.stringify(isDev),
        'process.env.NODE_ENV': JSON.stringify(isDev ? 'development' : 'production'),
        __JOTA_PUBLIC_ENV__: JSON.stringify(readPublicEnv()),
      }),
    ],
    devServer: {
      port: Number(process.env.WEB_PORT) || 8080,
      historyApiFallback: true,
      hot: true,
      client: { overlay: { warnings: false, errors: true } },
    },
    performance: { hints: false },
    ignoreWarnings: [/export '.*' \(imported as '.*'\) was not found in 'react-native'/],
  };
};
