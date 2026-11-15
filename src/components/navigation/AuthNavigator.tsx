import { Stack } from 'expo-router';
import { observer } from 'mobx-react-lite';

import { usePreferences, useSession } from '@/stores/AppEnvironmentContext';

import { useStackScreenOptions } from './useStackScreenOptions';

export default observer(function AuthNavigator() {
  const preferences = usePreferences();
  const session = useSession();
  const screenOptions = useStackScreenOptions();

  return (
    <Stack screenOptions={{ ...screenOptions, title: '' }}>
      <Stack.Protected guard={!preferences.onboardingCompleted}>
        <Stack.Screen name="welcome" options={{ headerShown: false }} />
      </Stack.Protected>
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Protected guard={session.registrationEnabled}>
        <Stack.Screen name="register" />
      </Stack.Protected>
      <Stack.Screen name="forgot-password" />
    </Stack>
  );
});
