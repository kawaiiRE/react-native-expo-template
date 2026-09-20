import 'react-native-gesture-handler';

import FontAwesome from '@expo/vector-icons/FontAwesome';
import {
  DMSans_400Regular,
  DMSans_500Medium,
  DMSans_600SemiBold,
  DMSans_700Bold,
  DMSans_800ExtraBold,
} from '@expo-google-fonts/dm-sans';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useMemo, useState } from 'react';
import { Provider as PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import LoadingScreen from '@/components/ui/LoadingScreen';
import { appLightTheme } from '@/constants/theme';
import { RootStore, RootStoreProvider } from '@/stores/rootStore';

export { ErrorBoundary } from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

SplashScreen.preventAutoHideAsync().catch(() => undefined);

export default function RootLayout() {
  const rootStore = useMemo(() => new RootStore(), []);
  const [isReady, setIsReady] = useState(false);
  const [fontsLoaded, fontError] = useFonts({
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_600SemiBold,
    DMSans_700Bold,
    DMSans_800ExtraBold,
    ...FontAwesome.font,
  });

  useEffect(() => {
    let isMounted = true;

    async function prepareApp() {
      await rootStore.hydrate();

      if (isMounted) {
        setIsReady(true);
      }
    }

    void prepareApp();

    return () => {
      isMounted = false;
    };
  }, [rootStore]);

  useEffect(() => {
    if (fontError) {
      throw fontError;
    }
  }, [fontError]);

  useEffect(() => {
    if (fontsLoaded && isReady) {
      SplashScreen.hideAsync().catch(() => undefined);
    }
  }, [fontsLoaded, isReady]);

  if (!fontsLoaded || !isReady) {
    return (
      <LoadingScreen
        message="Loading fonts and local preferences."
        title="Starting"
      />
    );
  }

  return (
    <RootStoreProvider store={rootStore}>
      <SafeAreaProvider>
        <PaperProvider theme={appLightTheme}>
          <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="+not-found" />
          </Stack>
        </PaperProvider>
      </SafeAreaProvider>
    </RootStoreProvider>
  );
}
