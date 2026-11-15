import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { ActivityIndicator, Button, Icon, Text } from 'react-native-paper';

import SectionCard from '@/components/ui/SectionCard';
import { useHealthStatus } from '@/hooks/useHealthStatus';
import { errorMessageKey } from '@/presenters/errors';
import { formatDateTime } from '@/presenters/format';
import { makeStyles } from '@/theme/makeStyles';
import { useAppTheme } from '@/theme/theme';
import { radii, sizes, spacing } from '@/theme/tokens';

export default function HealthStatusCard() {
  const { refresh, status } = useHealthStatus();
  const { t } = useTranslation();
  const theme = useAppTheme();
  const styles = useStyles();
  const available = status.state === 'available';

  const detail =
    status.state === 'loading'
      ? t('about.health.checking')
      : status.state === 'available'
        ? status.data.service && status.data.apiVersion !== null
          ? t('about.health.details', {
              service: status.data.service,
              version: status.data.apiVersion,
            })
          : t('about.health.ready')
        : status.error
          ? t(errorMessageKey(status.error))
          : t('errors.UPSTREAM_UNAVAILABLE');

  return (
    <SectionCard title={t('about.health.title')}>
      <View accessibilityLiveRegion="polite" style={styles.row}>
        <View
          style={[
            styles.badge,
            status.state === 'loading'
              ? styles.badgeNeutral
              : available
                ? styles.badgeSuccess
                : styles.badgeError,
          ]}
        >
          {status.state === 'loading' ? (
            <ActivityIndicator size={sizes.iconSm} />
          ) : (
            <Icon
              color={
                available
                  ? theme.colors.onSuccessContainer
                  : theme.colors.onErrorContainer
              }
              size={sizes.iconMd}
              source={
                available ? 'check-network-outline' : 'close-network-outline'
              }
            />
          )}
        </View>
        <View style={styles.copy}>
          <Text style={styles.title} variant="titleMedium">
            {status.state === 'loading'
              ? t('about.health.checking')
              : available
                ? t('about.health.connected')
                : t('about.health.unavailable')}
          </Text>
          {status.state === 'loading' ? null : (
            <Text style={styles.detail} variant="bodyMedium">
              {detail}
            </Text>
          )}
          {status.state === 'available' ? (
            <Text style={styles.detail} variant="labelMedium">
              {t('about.health.checkedAt', {
                time: formatDateTime(status.data.checkedAt, theme.language),
              })}
            </Text>
          ) : null}
        </View>
      </View>
      <Button
        contentStyle={styles.buttonContent}
        disabled={status.state === 'loading'}
        icon="refresh"
        mode="outlined"
        onPress={() => void refresh()}
      >
        {t('about.health.refresh')}
      </Button>
    </SectionCard>
  );
}

const useStyles = makeStyles((theme) => ({
  row: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: spacing.md,
  },
  badge: {
    alignItems: 'center',
    borderRadius: radii.md,
    flexShrink: 0,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  badgeNeutral: {
    backgroundColor: theme.colors.surfaceVariant,
  },
  badgeSuccess: {
    backgroundColor: theme.colors.successContainer,
  },
  badgeError: {
    backgroundColor: theme.colors.errorContainer,
  },
  copy: {
    flex: 1,
    gap: spacing.xxs,
  },
  title: {
    color: theme.colors.onSurface,
  },
  detail: {
    color: theme.colors.onSurfaceVariant,
  },
  buttonContent: {
    minHeight: sizes.touchTarget,
  },
}));
