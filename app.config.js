const readEnv = (name) => process.env[name]?.trim() || '';
const readNumberEnv = (name, fallback) => {
  const value = Number(readEnv(name));
  return Number.isFinite(value) && value > 0 ? value : fallback;
};

const appSlug = readEnv('APP_SLUG') || 'expo-starter';
const appScheme = readEnv('APP_SCHEME') || appSlug;
const appPackage = readEnv('ANDROID_PACKAGE') || 'dev.example.expostarter';
const easProjectId = readEnv('EAS_PROJECT_ID');
// Host of the web frontend that emails verification and reset links. When set,
// those https links open the app (universal links / Android App Links).
const appLinkHost = readEnv('APP_LINK_HOST');
const appLinkPaths = ['/verify-email', '/reset-password'];

// Keep in sync with src/i18n/languages.ts.
const supportedLocales = ['en', 'ar'];

// Splash backgrounds match the theme background colors in src/theme/colors.ts.
const splashBackground = { light: '#F9FAFD', dark: '#111318' };

module.exports = ({ config }) => ({
  ...config,
  name: readEnv('APP_NAME') || 'Expo Starter',
  slug: appSlug,
  version: readEnv('APP_VERSION') || '1.0.0',
  orientation: 'default',
  scheme: appScheme,
  userInterfaceStyle: 'automatic',
  ios: {
    ...config.ios,
    supportsTablet: true,
    bundleIdentifier: readEnv('IOS_BUNDLE_IDENTIFIER') || appPackage,
    ...(appLinkHost ? { associatedDomains: [`applinks:${appLinkHost}`] } : {}),
    infoPlist: {
      ...config.ios?.infoPlist,
      CADisableMinimumFrameDurationOnPhone: true,
      ITSAppUsesNonExemptEncryption: false,
    },
  },
  android: {
    ...config.android,
    edgeToEdgeEnabled: true,
    predictiveBackGestureEnabled: false,
    package: appPackage,
    versionCode: readNumberEnv('ANDROID_VERSION_CODE', 1),
    ...(appLinkHost
      ? {
          intentFilters: [
            {
              action: 'VIEW',
              autoVerify: true,
              data: appLinkPaths.map((pathPrefix) => ({
                scheme: 'https',
                host: appLinkHost,
                pathPrefix,
              })),
              category: ['BROWSABLE', 'DEFAULT'],
            },
          ],
        }
      : {}),
  },
  web: {
    ...config.web,
    bundler: 'metro',
    output: 'static',
  },
  plugins: [
    'expo-router',
    'expo-secure-store',
    'expo-web-browser',
    [
      'expo-localization',
      {
        supportsRTL: true,
        supportedLocales: { ios: supportedLocales, android: supportedLocales },
      },
    ],
    [
      'expo-splash-screen',
      {
        backgroundColor: splashBackground.light,
        dark: { backgroundColor: splashBackground.dark },
      },
    ],
  ],
  extra: {
    ...config.extra,
    router: {},
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
