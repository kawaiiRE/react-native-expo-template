import { Appearance, Platform } from 'react-native';
import * as SystemUI from 'expo-system-ui';

import type { ThemePreference } from '@/stores/PreferencesStore';

/** Aligns native chrome (alerts, keyboards, pickers) with the chosen theme. */
export function applyNativeColorScheme(mode: ThemePreference) {
  if (Platform.OS === 'web') return;

  try {
    Appearance.setColorScheme(mode === 'system' ? 'unspecified' : mode);
  } catch {
    // Older runtimes reject the override; the app theme still applies.
  }
}

export function applyRootBackground(color: string) {
  SystemUI.setBackgroundColorAsync(color).catch(() => undefined);
}
