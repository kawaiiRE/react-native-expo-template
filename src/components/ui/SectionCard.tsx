import type { PropsWithChildren, ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { Surface, Text } from 'react-native-paper';

import { appFonts, appPalette } from '@/constants/theme';

type SectionCardProps = PropsWithChildren<{
  action?: ReactNode;
  subtitle?: string;
  title: string;
}>;

export default function SectionCard({
  action,
  children,
  subtitle,
  title,
}: SectionCardProps) {
  return (
    <Surface elevation={0} style={styles.card}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
        {action ? <View style={styles.action}>{action}</View> : null}
      </View>
      <View style={styles.body}>{children}</View>
    </Surface>
  );
}

const styles = StyleSheet.create({
  action: {
    alignItems: 'flex-end',
    flexShrink: 0,
  },
  body: {
    gap: 10,
  },
  card: {
    backgroundColor: appPalette.surface,
    borderColor: appPalette.line,
    borderRadius: 8,
    borderWidth: 1,
    gap: 14,
    padding: 14,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
  },
  headerText: {
    flex: 1,
    gap: 2,
  },
  subtitle: {
    color: appPalette.inkMuted,
    fontFamily: appFonts.medium,
    fontSize: 13,
    lineHeight: 18,
  },
  title: {
    color: appPalette.ink,
    fontFamily: appFonts.bold,
    fontSize: 17,
    lineHeight: 22,
  },
});
