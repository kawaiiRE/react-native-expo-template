import { View } from 'react-native';
import { Icon, Text } from 'react-native-paper';

import PressableScale from '@/components/ui/PressableScale';
import Skeleton from '@/components/ui/Skeleton';
import { formatNumber } from '@/presenters/format';
import { makeStyles } from '@/theme/makeStyles';
import { useAppTheme } from '@/theme/theme';
import { radii, sizes, spacing } from '@/theme/tokens';

type StatTileProps = {
  icon: string;
  label: string;
  value: number;
  loading?: boolean;
  tone: 'primary' | 'secondary';
  onPress: () => void;
};

export default function StatTile({
  icon,
  label,
  loading = false,
  onPress,
  tone,
  value,
}: StatTileProps) {
  const theme = useAppTheme();
  const styles = useStyles();
  const formatted = formatNumber(value, theme.language);
  const iconColor =
    tone === 'primary'
      ? theme.colors.onPrimaryContainer
      : theme.colors.onSecondaryContainer;

  return (
    <PressableScale
      accessibilityLabel={`${label}: ${formatted}`}
      onPress={onPress}
      style={styles.pressable}
      contentStyle={styles.tile}
    >
      <View
        style={[
          styles.iconFrame,
          tone === 'primary' ? styles.primary : styles.secondary,
        ]}
      >
        <Icon color={iconColor} size={sizes.iconMd} source={icon} />
      </View>
      {loading ? (
        <Skeleton height={28} width={56} />
      ) : (
        <Text numberOfLines={1} style={styles.value} variant="headlineMedium">
          {formatted}
        </Text>
      )}
      <Text numberOfLines={2} style={styles.label} variant="labelLarge">
        {label}
      </Text>
    </PressableScale>
  );
}

const useStyles = makeStyles((theme) => ({
  pressable: {
    flexBasis: 140,
    flexGrow: 1,
  },
  tile: {
    backgroundColor: theme.colors.elevation.level1,
    borderRadius: radii.lg,
    gap: spacing.sm,
    padding: spacing.lg,
  },
  iconFrame: {
    alignItems: 'center',
    borderRadius: radii.md,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  primary: {
    backgroundColor: theme.colors.primaryContainer,
  },
  secondary: {
    backgroundColor: theme.colors.secondaryContainer,
  },
  value: {
    color: theme.colors.onSurface,
    fontFamily: theme.fontFamilies.semiBold,
    fontVariant: ['tabular-nums'],
  },
  label: {
    color: theme.colors.onSurfaceVariant,
  },
}));
