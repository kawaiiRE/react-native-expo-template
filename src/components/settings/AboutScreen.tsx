import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { Divider, Icon, List, Text } from 'react-native-paper';

import HealthStatusCard from '@/components/health/HealthStatusCard';
import Screen from '@/components/ui/Screen';
import SectionCard from '@/components/ui/SectionCard';
import { appConfig } from '@/constants/app';
import { useBackendConfig } from '@/stores/AppEnvironmentContext';
import { makeStyles } from '@/theme/makeStyles';
import { useAppTheme } from '@/theme/theme';
import { radii, spacing } from '@/theme/tokens';

export default function AboutScreen() {
  const { t } = useTranslation();
  const theme = useAppTheme();
  const styles = useStyles();
  const { backend, apiBaseUrl } = useBackendConfig();

  return (
    <Screen safeBottom>
      <View style={styles.hero}>
        <View style={styles.mark}>
          <Icon
            color={theme.colors.onPrimaryContainer}
            size={36}
            source="note-text-outline"
          />
        </View>
        <Text
          accessibilityRole="header"
          style={styles.name}
          variant="headlineSmall"
        >
          {appConfig.name}
        </Text>
        <Text style={styles.description} variant="bodyMedium">
          {t('about.description')}
        </Text>
      </View>

      <SectionCard flush>
        <List.Item
          description={appConfig.version}
          left={(props) => <List.Icon {...props} icon="tag-outline" />}
          title={t('about.version')}
        />
        <Divider />
        <List.Item
          description={t(`about.backends.${backend}`)}
          left={(props) => <List.Icon {...props} icon="server-network" />}
          title={t('about.backend')}
        />
        <Divider />
        <List.Item
          description={apiBaseUrl}
          descriptionNumberOfLines={3}
          left={(props) => <List.Icon {...props} icon="api" />}
          title={t('about.apiUrl')}
        />
      </SectionCard>

      <HealthStatusCard />
    </Screen>
  );
}

const useStyles = makeStyles((theme) => ({
  hero: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingTop: spacing.md,
  },
  mark: {
    alignItems: 'center',
    backgroundColor: theme.colors.primaryContainer,
    borderRadius: radii.xl,
    height: 80,
    justifyContent: 'center',
    marginBottom: spacing.xs,
    width: 80,
  },
  name: {
    color: theme.colors.onBackground,
    fontFamily: theme.fontFamilies.semiBold,
    textAlign: 'center',
  },
  description: {
    color: theme.colors.onSurfaceVariant,
    maxWidth: 420,
    textAlign: 'center',
  },
}));
