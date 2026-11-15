import type { PropsWithChildren, ReactNode } from 'react';
import { View } from 'react-native';
import { Icon, Text } from 'react-native-paper';

import Screen from '@/components/ui/Screen';
import { makeStyles } from '@/theme/makeStyles';
import { useAppTheme } from '@/theme/theme';
import { radii, spacing } from '@/theme/tokens';

type AuthLayoutProps = PropsWithChildren<{
  icon: string;
  title: string;
  subtitle?: string;
  footer?: ReactNode;
  /** True when the navigator shows no header above this screen. */
  headerless?: boolean;
}>;

/** Shared hero + keyboard-aware form layout for unauthenticated screens. */
export default function AuthLayout({
  children,
  footer,
  headerless = false,
  icon,
  subtitle,
  title,
}: AuthLayoutProps) {
  const theme = useAppTheme();
  const styles = useStyles();

  return (
    <Screen centered keyboard safeBottom safeTop={headerless}>
      <View style={styles.hero}>
        <View style={styles.mark}>
          <Icon
            color={theme.colors.onPrimaryContainer}
            size={32}
            source={icon}
          />
        </View>
        <Text
          accessibilityRole="header"
          style={styles.title}
          variant="headlineMedium"
        >
          {title}
        </Text>
        {subtitle ? (
          <Text style={styles.subtitle} variant="bodyLarge">
            {subtitle}
          </Text>
        ) : null}
      </View>
      <View style={styles.form}>{children}</View>
      {footer ? <View style={styles.footer}>{footer}</View> : null}
    </Screen>
  );
}

const useStyles = makeStyles((theme) => ({
  hero: {
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  mark: {
    alignItems: 'center',
    backgroundColor: theme.colors.primaryContainer,
    borderRadius: radii.lg,
    height: 64,
    justifyContent: 'center',
    marginBottom: spacing.sm,
    width: 64,
  },
  title: {
    color: theme.colors.onBackground,
    fontFamily: theme.fontFamilies.semiBold,
  },
  subtitle: {
    color: theme.colors.onSurfaceVariant,
  },
  form: {
    gap: spacing.md,
  },
  footer: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    justifyContent: 'center',
  },
}));
