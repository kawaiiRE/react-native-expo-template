import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import { useConfirm } from '@/components/feedback/ConfirmProvider';
import { useSession } from '@/stores/AppEnvironmentContext';

/** Confirmed sign-out. Guests are warned that they cannot come back to their data. */
export function useSignOut() {
  const session = useSession();
  const confirm = useConfirm();
  const { t } = useTranslation();

  return useCallback(async () => {
    const guest = session.isGuest;
    const confirmed = await confirm({
      title: guest
        ? t('guest.confirmSignOut.title')
        : t('settings.confirmSignOut.title'),
      message: guest
        ? t('guest.confirmSignOut.body')
        : t('settings.confirmSignOut.body'),
      confirmLabel: t('settings.confirmSignOut.confirm'),
      destructive: guest,
    });
    if (confirmed) await session.signOut();
  }, [confirm, session, t]);
}
