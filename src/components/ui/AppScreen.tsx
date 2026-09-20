import type { PropsWithChildren, ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from 'react-native-paper';

import { appFonts, appPalette } from '@/constants/theme';

type AppScreenProps = PropsWithChildren<{
  action?: ReactNode;
  contentContainerStyle?: StyleProp<ViewStyle>;
  scroll?: boolean;
  style?: StyleProp<ViewStyle>;
  subtitle?: string;
  title?: string;
}>;

export default function AppScreen({
  action,
  children,
  contentContainerStyle,
  scroll = true,
  style,
  subtitle,
  title,
}: AppScreenProps) {
  const content = (
    <View style={[styles.content, contentContainerStyle]}>
      {(title || subtitle || action) && (
        <View style={styles.header}>
          <View style={styles.headerText}>
            {title ? <Text style={styles.title}>{title}</Text> : null}
            {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
          </View>
          {action ? <View style={styles.action}>{action}</View> : null}
        </View>
      )}
      {children}
    </View>
  );

  return (
    <SafeAreaView edges={['left', 'right']} style={[styles.safeArea, style]}>
      {scroll ? (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {content}
        </ScrollView>
      ) : (
        content
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  action: {
    alignItems: 'flex-end',
    flexShrink: 0,
  },
  content: {
    gap: 16,
    padding: 16,
    paddingBottom: 108,
  },
  header: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
  },
  headerText: {
    flex: 1,
    gap: 4,
  },
  safeArea: {
    backgroundColor: appPalette.paper,
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  subtitle: {
    color: appPalette.inkMuted,
    fontFamily: appFonts.medium,
    fontSize: 14,
    lineHeight: 20,
  },
  title: {
    color: appPalette.ink,
    fontFamily: appFonts.extraBold,
    fontSize: 28,
    lineHeight: 34,
  },
});
