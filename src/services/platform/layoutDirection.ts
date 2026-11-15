import { isRunningInExpoGo, reloadAppAsync } from 'expo';
import { I18nManager, Platform } from 'react-native';

import { isRtlLanguage, type AppLanguage } from '@/i18n/languages';

export type DirectionChange = 'none' | 'reload' | 'unsupported';

/**
 * Native layout direction is fixed at startup. Returns what the UI must do
 * after the language changes: nothing, offer a reload, or explain that the
 * runtime (Expo Go on this SDK) cannot mirror the layout.
 */
export function applyLayoutDirection(language: AppLanguage): DirectionChange {
  const shouldBeRtl = isRtlLanguage(language);

  if (Platform.OS === 'web') {
    if (typeof document !== 'undefined') {
      document.documentElement.dir = shouldBeRtl ? 'rtl' : 'ltr';
      document.documentElement.lang = language;
    }
    return 'none';
  }

  if (I18nManager.isRTL === shouldBeRtl) return 'none';

  I18nManager.allowRTL(shouldBeRtl);
  I18nManager.forceRTL(shouldBeRtl);

  return isRunningInExpoGo() ? 'unsupported' : 'reload';
}

export function reloadApp() {
  return reloadAppAsync('Apply layout direction').catch(() => undefined);
}

/**
 * Whether the current layout is mirrored. Native direction is fixed at
 * startup; the web preview follows the active language immediately.
 */
export function isRtlLayout(language: AppLanguage) {
  return Platform.OS === 'web' ? isRtlLanguage(language) : I18nManager.isRTL;
}
