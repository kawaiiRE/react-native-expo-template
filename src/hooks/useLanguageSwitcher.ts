import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import { useConfirm } from '@/components/feedback/ConfirmProvider';
import type { AppLanguage } from '@/i18n/languages';
import { haptics } from '@/services/platform/haptics';
import {
  applyLayoutDirection,
  reloadApp,
} from '@/services/platform/layoutDirection';
import { usePreferences } from '@/stores/AppEnvironmentContext';

/**
 * Changes the app language (`null` follows the device) and handles the
 * layout-direction restart that native RTL switching requires.
 */
export function useLanguageSwitcher() {
  const preferences = usePreferences();
  const confirm = useConfirm();
  const { t } = useTranslation();

  return useCallback(
    async (language: AppLanguage | null) => {
      if (language === preferences.language) return;

      haptics.selection();
      preferences.setLanguage(language);
      const direction = applyLayoutDirection(preferences.effectiveLanguage);

      if (direction === 'reload') {
        const restart = await confirm({
          title: t('settings.rtl.title'),
          message: t('settings.rtl.body'),
          confirmLabel: t('settings.rtl.restart'),
          cancelLabel: t('settings.rtl.later'),
        });
        if (restart) await reloadApp();
      } else if (direction === 'unsupported') {
        await confirm({
          title: t('settings.rtl.title'),
          message: t('settings.rtl.expoGo'),
          hideCancel: true,
        });
      }
    },
    [confirm, preferences, t],
  );
}
