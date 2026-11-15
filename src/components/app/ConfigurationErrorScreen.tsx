import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { StyleSheet, Text, View, useColorScheme } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

import type { BackendConfigIssue } from '@/config/backend';
import { resources } from '@/i18n';
import { readDeviceLanguage } from '@/i18n/deviceLanguage';
import { darkColors, lightColors } from '@/theme/colors';
import { spacing } from '@/theme/tokens';

/**
 * Shown instead of the app when `EXPO_PUBLIC_BACKEND` or
 * `EXPO_PUBLIC_API_BASE_URL` is missing or invalid. Renders outside every
 * provider, like the root error boundary.
 */
export default function ConfigurationErrorScreen({
  issues,
}: {
  issues: readonly BackendConfigIssue[];
}) {
  const colors = useColorScheme() === 'dark' ? darkColors : lightColors;
  const copy = resources[readDeviceLanguage()].translation.configError;

  useEffect(() => {
    SplashScreen.hideAsync().catch(() => undefined);
  }, []);

  return (
    <SafeAreaProvider>
      <SafeAreaView
        style={[styles.root, { backgroundColor: colors.background }]}
      >
        <View style={styles.content}>
          <Text
            accessibilityRole="header"
            style={[styles.title, { color: colors.onBackground }]}
          >
            {copy.title}
          </Text>
          <Text style={[styles.body, { color: colors.onSurfaceVariant }]}>
            {copy.body}
          </Text>
          {issues.map((issue) => (
            <Text key={issue} style={[styles.issue, { color: colors.error }]}>
              {copy.issues[issue]}
            </Text>
          ))}
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  content: {
    flex: 1,
    gap: spacing.md,
    justifyContent: 'center',
    padding: spacing.xxl,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    lineHeight: 32,
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
  },
  issue: {
    fontSize: 15,
    lineHeight: 22,
  },
});
