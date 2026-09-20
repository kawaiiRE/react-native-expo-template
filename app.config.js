const readEnv = (name) => process.env[name]?.trim() || '';
const readNumberEnv = (name, fallback) => {
  const value = Number(readEnv(name));
  return Number.isFinite(value) && value > 0 ? value : fallback;
};

const appSlug = readEnv('APP_SLUG') || 'expo-starter';
const appScheme = readEnv('APP_SCHEME') || appSlug;
const appPackage = readEnv('ANDROID_PACKAGE') || 'dev.example.expostarter';
const easProjectId = readEnv('EAS_PROJECT_ID');

module.exports = ({ config }) => ({
  ...config,
  name: readEnv('APP_NAME') || 'Expo Starter',
  slug: appSlug,
  version: readEnv('APP_VERSION') || '1.0.0',
  orientation: 'portrait',
  scheme: appScheme,
  userInterfaceStyle: 'automatic',
  newArchEnabled: true,
  ios: {
    ...config.ios,
    supportsTablet: true,
    bundleIdentifier: readEnv('IOS_BUNDLE_IDENTIFIER') || appPackage,
  },
  android: {
    ...config.android,
    edgeToEdgeEnabled: true,
    predictiveBackGestureEnabled: false,
    package: appPackage,
    versionCode: readNumberEnv('ANDROID_VERSION_CODE', 1),
  },
  web: {
    ...config.web,
    bundler: 'metro',
    output: 'static',
  },
  plugins: ['expo-router'],
  extra: {
    ...config.extra,
    router: {},
    apiBaseUrl:
      readEnv('EXPO_PUBLIC_API_BASE_URL') ||
      readEnv('EXPO_PUBLIC_LOCAL_API_BASE_URL') ||
      '',
    ...(easProjectId
      ? {
          eas: {
            projectId: easProjectId,
          },
        }
      : {}),
  },
  experiments: {
    ...config.experiments,
    typedRoutes: true,
  },
});
