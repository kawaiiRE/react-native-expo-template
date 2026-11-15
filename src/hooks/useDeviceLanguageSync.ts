import { useLocales } from 'expo-localization';
import { useEffect } from 'react';

import { resolveLanguage } from '@/i18n/languages';
import { usePreferences } from '@/stores/AppEnvironmentContext';

/** Follows OS language changes while the app runs (Android allows this). */
export function useDeviceLanguageSync() {
  const preferences = usePreferences();
  const locales = useLocales();

  useEffect(() => {
    preferences.setDeviceLanguage(
      resolveLanguage(locales.map((locale) => locale.languageCode)),
    );
  }, [locales, preferences]);
}
