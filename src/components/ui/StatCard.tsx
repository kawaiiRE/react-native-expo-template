import type { ComponentProps } from 'react';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';

import { appFonts, appPalette } from '@/constants/theme';

type StatTone = 'blue' | 'green' | 'yellow' | 'red';

const toneStyles = {
  blue: {
    backgroundColor: appPalette.cobaltSoft,
    color: appPalette.cobalt,
  },
  green: {
    backgroundColor: appPalette.emeraldSoft,
    color: appPalette.emerald,
  },
  yellow: {
    backgroundColor: appPalette.saffronSoft,
    color: appPalette.saffron,
  },
  red: {
    backgroundColor: appPalette.coralSoft,
    color: appPalette.coral,
  },
} as const;

type StatCardProps = {
  icon: ComponentProps<typeof MaterialCommunityIcons>['name'];
  label: string;
  tone?: StatTone;
  value: string;
};

export default function StatCard({
  icon,
  label,
  tone = 'blue',
  value,
}: StatCardProps) {
  const colors = toneStyles[tone];

  return (
    <View style={styles.card}>
      <View
        style={[styles.iconFrame, { backgroundColor: colors.backgroundColor }]}
      >
        <MaterialCommunityIcons color={colors.color} name={icon} size={22} />
      </View>
      <View style={styles.textBlock}>
        <Text style={styles.value}>{value}</Text>
        <Text style={styles.label}>{label}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: appPalette.surface,
    borderColor: appPalette.line,
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    gap: 12,
    minWidth: 148,
    padding: 14,
  },
  iconFrame: {
    alignItems: 'center',
    borderRadius: 8,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  label: {
    color: appPalette.inkMuted,
    fontFamily: appFonts.medium,
    fontSize: 13,
    lineHeight: 18,
  },
  textBlock: {
    gap: 2,
  },
  value: {
    color: appPalette.ink,
    fontFamily: appFonts.extraBold,
    fontSize: 24,
    lineHeight: 30,
  },
});
