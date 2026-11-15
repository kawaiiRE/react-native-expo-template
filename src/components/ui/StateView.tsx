import type { ComponentProps } from 'react';
import { View } from 'react-native';
import { Button, Icon, Text } from 'react-native-paper';

import { makeStyles } from '@/theme/makeStyles';
import { useAppTheme } from '@/theme/theme';
import { radii, sizes, spacing } from '@/theme/tokens';

type IconSource = ComponentProps<typeof Icon>['source'];

type StateViewProps = {
  icon: IconSource;
  title: string;
  message?: string;
  tone?: 'neutral' | 'error';
  actionLabel?: string;
  actionIcon?: IconSource;
  onAction?: () => void;
};

/** Shared empty / error / informational state with an optional action. */
export default function StateView({
  actionIcon,
  actionLabel,
  icon,
  message,
  onAction,
  title,
  tone = 'neutral',
}: StateViewProps) {
  const theme = useAppTheme();
  const styles = useStyles();
  const isError = tone === 'error';

  return (
    <View
      accessibilityRole={isError ? 'alert' : undefined}
      style={styles.container}
    >
      <View style={[styles.iconFrame, isError && styles.iconFrameError]}>
        <Icon
          color={
            isError
              ? theme.colors.onErrorContainer
              : theme.colors.onPrimaryContainer
          }
          size={sizes.iconLg}
          source={icon}
        />
      </View>
      <Text
        accessibilityRole="header"
        style={styles.title}
        variant="titleLarge"
      >
        {title}
      </Text>
      {message ? (
        <Text style={styles.message} variant="bodyMedium">
          {message}
        </Text>
      ) : null}
      {actionLabel && onAction ? (
        <Button
          contentStyle={styles.actionContent}
          icon={actionIcon}
          mode={isError ? 'contained-tonal' : 'contained'}
          onPress={onAction}
          style={styles.action}
        >
          {actionLabel}
        </Button>
      ) : null}
    </View>
  );
}

const useStyles = makeStyles((theme) => ({
  container: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.huge,
  },
  iconFrame: {
    alignItems: 'center',
    backgroundColor: theme.colors.primaryContainer,
    borderRadius: radii.xl,
    height: sizes.avatarLg,
    justifyContent: 'center',
    marginBottom: spacing.sm,
    width: sizes.avatarLg,
  },
  iconFrameError: {
    backgroundColor: theme.colors.errorContainer,
  },
  title: {
    color: theme.colors.onSurface,
    textAlign: 'center',
  },
  message: {
    color: theme.colors.onSurfaceVariant,
    maxWidth: 360,
    textAlign: 'center',
  },
  action: {
    marginTop: spacing.md,
  },
  actionContent: {
    minHeight: sizes.touchTarget,
    paddingHorizontal: spacing.sm,
  },
}));
