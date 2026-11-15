import { NavigationBar } from 'expo-navigation-bar';
import { LocaleProvider, ThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { observer } from 'mobx-react-lite';
import { useEffect, useMemo, useState, type PropsWithChildren } from 'react';
import { I18nextProvider } from 'react-i18next';
import { useColorScheme } from 'react-native';
import { PaperProvider } from 'react-native-paper';

import { ConfirmProvider } from '@/components/feedback/ConfirmProvider';
import { SnackbarProvider } from '@/components/feedback/SnackbarProvider';
import { useDeviceLanguageSync } from '@/hooks/useDeviceLanguageSync';
import { useSessionLifecycle } from '@/hooks/useSessionLifecycle';
import { createI18n } from '@/i18n';
import {
  applyNativeColorScheme,
  applyRootBackground,
} from '@/services/platform/appearance';
import {
  applyLayoutDirection,
  isRtlLayout,
} from '@/services/platform/layoutDirection';
import { usePreferences } from '@/stores/AppEnvironmentContext';
import { buildNavigationTheme } from '@/theme/navigationTheme';
import { buildAppTheme } from '@/theme/theme';

/** Theme, language and feedback providers that react to user preferences. */
export default observer(function ThemedProviders({
  children,
}: PropsWithChildren) {
  const preferences = usePreferences();
  const systemScheme = useColorScheme();
  const language = preferences.effectiveLanguage;
  const scheme =
    preferences.themeMode === 'system'
      ? systemScheme === 'dark'
        ? 'dark'
        : 'light'
      : preferences.themeMode;
  const theme = useMemo(
    () => buildAppTheme(scheme, language),
    [scheme, language],
  );
  const navigationTheme = useMemo(() => buildNavigationTheme(theme), [theme]);
  const [i18n] = useState(() => createI18n(language));

  useDeviceLanguageSync();
  useSessionLifecycle();

  useEffect(() => {
    if (i18n.language !== language) void i18n.changeLanguage(language);
    applyLayoutDirection(language);
  }, [i18n, language]);

  useEffect(() => {
    applyNativeColorScheme(preferences.themeMode);
  }, [preferences.themeMode]);

  useEffect(() => {
    applyRootBackground(theme.colors.background);
  }, [theme]);

  return (
    <I18nextProvider i18n={i18n}>
      <PaperProvider theme={theme}>
        <LocaleProvider direction={isRtlLayout(language) ? 'rtl' : 'ltr'}>
          <ThemeProvider value={navigationTheme}>
            <StatusBar style={theme.dark ? 'light' : 'dark'} />
            <NavigationBar style={theme.dark ? 'light' : 'dark'} />
            <SnackbarProvider>
              <ConfirmProvider>{children}</ConfirmProvider>
            </SnackbarProvider>
          </ThemeProvider>
        </LocaleProvider>
      </PaperProvider>
    </I18nextProvider>
  );
});
