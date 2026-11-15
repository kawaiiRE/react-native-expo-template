import * as SplashScreen from 'expo-splash-screen';

import AppProviders from '@/components/app/AppProviders';
import RootNavigator from '@/components/navigation/RootNavigator';

export { default as ErrorBoundary } from '@/components/app/RootErrorBoundary';

SplashScreen.preventAutoHideAsync().catch(() => undefined);

export default function RootLayout() {
  return (
    <AppProviders>
      <RootNavigator />
    </AppProviders>
  );
}
