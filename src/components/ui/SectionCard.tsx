import type { PropsWithChildren, ReactNode } from 'react';
import { View } from 'react-native';
import { Surface, Text } from 'react-native-paper';

import { makeStyles } from '@/theme/makeStyles';
import { radii, spacing } from '@/theme/tokens';

type SectionCardProps = PropsWithChildren<{
  title?: string;
  action?: ReactNode;
  /** Remove inner padding for full-bleed list rows. */
  flush?: boolean;
}>;

export default function SectionCard({
  action,
  children,
  flush = false,
  title,
}: SectionCardProps) {
  const styles = useStyles();

  return (
    <View style={styles.section}>
      {title || action ? (
        <View style={styles.header}>
          {title ? (
            <Text
              accessibilityRole="header"
              style={styles.title}
              variant="titleSmall"
            >
              {title}
            </Text>
          ) : null}
          {action ? <View style={styles.action}>{action}</View> : null}
        </View>
      ) : null}
      <Surface
        elevation={0}
        mode="flat"
        style={[styles.card, flush && styles.flush]}
      >
        {children}
      </Surface>
    </View>
  );
}

const useStyles = makeStyles((theme) => ({
  section: {
    gap: spacing.sm,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'space-between',
    minHeight: 32,
    paddingHorizontal: spacing.xs,
  },
  title: {
    color: theme.colors.primary,
    flexShrink: 1,
  },
  action: {
    flexShrink: 0,
  },
  card: {
    backgroundColor: theme.colors.elevation.level1,
    borderRadius: radii.lg,
    gap: spacing.md,
    overflow: 'hidden',
    padding: spacing.lg,
  },
  flush: {
    gap: 0,
    padding: 0,
    paddingVertical: spacing.xs,
  },
}));
