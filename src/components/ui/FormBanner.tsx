import { View } from 'react-native';
import { Icon, Text } from 'react-native-paper';

import { makeStyles } from '@/theme/makeStyles';
import { useAppTheme } from '@/theme/theme';
import { radii, sizes, spacing } from '@/theme/tokens';

type FormBannerProps = {
  message: string | null | undefined;
  tone?: 'error' | 'info' | 'success';
};

export default function FormBanner({
  message,
  tone = 'error',
}: FormBannerProps) {
  const theme = useAppTheme();
  const styles = useStyles();

  if (!message) return null;

  const palette = {
    error: {
      background: theme.colors.errorContainer,
      foreground: theme.colors.onErrorContainer,
      icon: 'alert-circle-outline',
    },
    info: {
      background: theme.colors.primaryContainer,
      foreground: theme.colors.onPrimaryContainer,
      icon: 'information-outline',
    },
    success: {
      background: theme.colors.successContainer,
      foreground: theme.colors.onSuccessContainer,
      icon: 'check-circle-outline',
    },
  }[tone];

  return (
    <View
      accessibilityLiveRegion="polite"
      accessibilityRole={tone === 'error' ? 'alert' : undefined}
      style={[styles.banner, { backgroundColor: palette.background }]}
    >
      <View style={styles.icon}>
        <Icon
          color={palette.foreground}
          size={sizes.iconMd}
          source={palette.icon}
        />
      </View>
      <Text
        style={[styles.text, { color: palette.foreground }]}
        variant="bodyMedium"
      >
        {message}
      </Text>
    </View>
  );
}

const useStyles = makeStyles(() => ({
  banner: {
    alignItems: 'flex-start',
    borderRadius: radii.md,
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.md,
  },
  icon: {
    flexShrink: 0,
  },
  text: {
    flex: 1,
  },
}));
