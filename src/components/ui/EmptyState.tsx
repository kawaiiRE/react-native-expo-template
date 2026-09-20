import type { ComponentProps } from 'react';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';

import { appFonts, appPalette } from '@/constants/theme';

type EmptyStateProps = {
  icon?: ComponentProps<typeof MaterialCommunityIcons>['name'];
  message: string;
  title: string;
};

export default function EmptyState({
  icon = 'lightbulb-outline',
  message,
  title,
}: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <View style={styles.iconFrame}>
        <MaterialCommunityIcons
          color={appPalette.cobalt}
          name={icon}
          size={28}
        />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: 8,
    padding: 24,
  },
  iconFrame: {
    alignItems: 'center',
    backgroundColor: appPalette.cobaltSoft,
    borderRadius: 8,
    height: 52,
    justifyContent: 'center',
    width: 52,
  },
  message: {
    color: appPalette.inkMuted,
    fontFamily: appFonts.medium,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  title: {
    color: appPalette.ink,
    fontFamily: appFonts.bold,
    fontSize: 18,
    lineHeight: 24,
    textAlign: 'center',
  },
});
