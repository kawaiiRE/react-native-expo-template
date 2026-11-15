import { router } from 'expo-router';
import { observer } from 'mobx-react-lite';
import { useTranslation } from 'react-i18next';
import { Banner } from 'react-native-paper';

import { routes } from '@/constants/routes';
import { DEFAULT_GUEST_TTL_HOURS } from '@/models/auth';
import { useSession } from '@/stores/AppEnvironmentContext';
import { makeStyles } from '@/theme/makeStyles';
import { radii } from '@/theme/tokens';

type GuestBannerProps = {
  /** Runs before navigating, for example to close the drawer. */
  onNavigate?: () => void;
};

/** Explains guest-data expiry and offers the upgrade flow. Renders nothing for accounts. */
export default observer(function GuestBanner({ onNavigate }: GuestBannerProps) {
  const session = useSession();
  const { t } = useTranslation();
  const styles = useStyles();

  if (!session.isGuest) return null;

  const hours = session.features?.guestTtlHours ?? DEFAULT_GUEST_TTL_HOURS;

  return (
    <Banner
      actions={[
        {
          label: t('guest.createAccount'),
          onPress: () => {
            onNavigate?.();
            router.push(routes.upgrade);
          },
        },
      ]}
      contentStyle={styles.content}
      elevation={0}
      icon="account-clock-outline"
      style={styles.banner}
      visible
    >
      {t('guest.banner', { count: hours })}
    </Banner>
  );
});

const useStyles = makeStyles((theme) => ({
  banner: {
    backgroundColor: theme.colors.tertiaryContainer,
    borderRadius: radii.lg,
    overflow: 'hidden',
  },
  content: {
    flexWrap: 'nowrap',
  },
}));
