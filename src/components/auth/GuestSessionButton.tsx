import { observer } from 'mobx-react-lite';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from 'react-native-paper';

import { useSnackbar } from '@/components/feedback/SnackbarProvider';
import { errorMessageKey } from '@/presenters/errors';
import { haptics } from '@/services/platform/haptics';
import { usePreferences, useSession } from '@/stores/AppEnvironmentContext';
import { makeStyles } from '@/theme/makeStyles';
import { sizes } from '@/theme/tokens';

type GuestSessionButtonProps = {
  /** Runs once the guest session exists, for example to finish onboarding. */
  onStarted?: () => void;
};

/** "Continue as guest". Hidden unless the backend enables guest sessions. */
export default observer(function GuestSessionButton({
  onStarted,
}: GuestSessionButtonProps) {
  const session = useSession();
  const preferences = usePreferences();
  const snackbar = useSnackbar();
  const { t } = useTranslation();
  const styles = useStyles();
  const [busy, setBusy] = useState(false);

  if (!session.guestEnabled) return null;

  async function start() {
    setBusy(true);
    const result = await session.startGuestSession({
      locale: preferences.effectiveLanguage,
    });
    setBusy(false);

    if (!result.ok) {
      snackbar.show({
        message: t(errorMessageKey(result.error)),
        tone: 'error',
        haptic: true,
      });
      return;
    }
    haptics.success();
    onStarted?.();
  }

  return (
    <Button
      accessibilityHint={t('guest.continueHint')}
      contentStyle={styles.content}
      disabled={busy}
      icon="account-clock-outline"
      loading={busy}
      mode="outlined"
      onPress={() => void start()}
    >
      {t('guest.continue')}
    </Button>
  );
});

const useStyles = makeStyles(() => ({
  content: {
    minHeight: sizes.touchTarget + 4,
  },
}));
