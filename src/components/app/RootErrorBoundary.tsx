import type { ErrorBoundaryProps } from 'expo-router';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  useColorScheme,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { resources } from '@/i18n';
import { readDeviceLanguage } from '@/i18n/deviceLanguage';
import { lightColors, darkColors } from '@/theme/colors';
import { radii, sizes, spacing } from '@/theme/tokens';

/**
 * Last-resort boundary for the root layout. It renders outside every app
 * provider, so it uses system fonts, the device language and device scheme.
 */
export default function RootErrorBoundary({ retry }: ErrorBoundaryProps) {
  const colors = useColorScheme() === 'dark' ? darkColors : lightColors;
  const copy = resources[readDeviceLanguage()].translation.errorBoundary;

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.background }]}>
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
        <Pressable
          accessibilityRole="button"
          onPress={() => void retry()}
          style={[styles.button, { backgroundColor: colors.primary }]}
        >
          <Text style={[styles.buttonLabel, { color: colors.onPrimary }]}>
            {copy.retry}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
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
  button: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: radii.full,
    justifyContent: 'center',
    marginTop: spacing.md,
    minHeight: sizes.touchTarget,
    paddingHorizontal: spacing.xxl,
  },
  buttonLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
});
