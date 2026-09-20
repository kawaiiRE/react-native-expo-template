import { StyleSheet, View } from 'react-native';
import { ActivityIndicator, Text } from 'react-native-paper';

import { appFonts, appPalette } from '@/constants/theme';

type LoadingScreenProps = {
  message?: string;
  title?: string;
};

export default function LoadingScreen({
  message = 'Getting the app ready.',
  title = 'Loading',
}: LoadingScreenProps) {
  return (
    <View style={styles.container}>
      <ActivityIndicator animating color={appPalette.cobalt} size="large" />
      <View style={styles.textBlock}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.message}>{message}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    backgroundColor: appPalette.paper,
    flex: 1,
    gap: 18,
    justifyContent: 'center',
    padding: 24,
  },
  message: {
    color: appPalette.inkMuted,
    fontFamily: appFonts.medium,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  textBlock: {
    gap: 4,
    maxWidth: 280,
  },
  title: {
    color: appPalette.ink,
    fontFamily: appFonts.extraBold,
    fontSize: 24,
    lineHeight: 30,
    textAlign: 'center',
  },
});
