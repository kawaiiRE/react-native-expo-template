import { useNetInfo } from '@react-native-community/netinfo';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { Icon, Text } from 'react-native-paper';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { makeStyles } from '@/theme/makeStyles';
import { durations, EASE_OUT } from '@/theme/motion';
import { useAppTheme } from '@/theme/theme';
import { sizes, spacing } from '@/theme/tokens';

const ENTER = FadeIn.duration(durations.enter).easing(EASE_OUT);
const EXIT = FadeOut.duration(durations.exit).easing(EASE_OUT);

export default function OfflineBanner() {
  const { isConnected, isInternetReachable } = useNetInfo();
  const { t } = useTranslation();
  const theme = useAppTheme();
  const styles = useStyles();
  const offline = isConnected === false || isInternetReachable === false;

  if (!offline) return null;

  return (
    <Animated.View
      accessibilityLiveRegion="polite"
      accessibilityRole="alert"
      entering={ENTER}
      exiting={EXIT}
      style={styles.banner}
    >
      <View style={styles.icon}>
        <Icon
          color={theme.colors.onTertiaryContainer}
          size={sizes.iconSm}
          source="cloud-off-outline"
        />
      </View>
      <Text style={styles.text} variant="labelLarge">
        {t('offline.message')}
      </Text>
    </Animated.View>
  );
}

const useStyles = makeStyles((theme) => ({
  banner: {
    alignItems: 'center',
    backgroundColor: theme.colors.tertiaryContainer,
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  icon: {
    flexShrink: 0,
  },
  text: {
    color: theme.colors.onTertiaryContainer,
    flexShrink: 1,
  },
}));
