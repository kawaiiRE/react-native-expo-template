import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState, type PropsWithChildren } from 'react';
import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import type { BackendConfig } from '@/config/backend';
import { appConfig } from '@/constants/app';
import { createAppEnvironment } from '@/services/container';
import { AppEnvironmentProvider } from '@/stores/AppEnvironmentContext';
import { fontAssets } from '@/theme/fontAssets';

import ConfigurationErrorScreen from './ConfigurationErrorScreen';
import ThemedProviders from './ThemedProviders';

/** Refuses to start with an invalid public configuration instead of failing on every request. */
export default function AppProviders({ children }: PropsWithChildren) {
  if (!appConfig.backend.ok) {
    return <ConfigurationErrorScreen issues={appConfig.backend.issues} />;
  }

  return (
    <EnvironmentProviders config={appConfig.backend.config}>
      {children}
    </EnvironmentProviders>
  );
}

/**
 * Owns the per-tree composition root and keeps the native splash screen up
 * until fonts, preferences and the stored session are ready.
 */
function EnvironmentProviders({
  children,
  config,
}: PropsWithChildren<{ config: BackendConfig }>) {
  const [environment] = useState(() => createAppEnvironment(config));
  const [hydrated, setHydrated] = useState(false);
  const [fontsLoaded, fontError] = useFonts(fontAssets);
  // A font failure falls back to system fonts instead of blocking startup.
  const ready = hydrated && (fontsLoaded || fontError !== null);

  useEffect(() => {
    let active = true;

    void environment.store.hydrate().finally(() => {
      if (active) setHydrated(true);
    });

    return () => {
      active = false;
    };
  }, [environment]);

  useEffect(() => {
    if (ready) SplashScreen.hideAsync().catch(() => undefined);
  }, [ready]);

  if (!ready) return null;

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <AppEnvironmentProvider environment={environment}>
          <ThemedProviders>{children}</ThemedProviders>
        </AppEnvironmentProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
