import { Stack } from 'expo-router';
import { observer } from 'mobx-react-lite';
import { useTranslation } from 'react-i18next';

import { useSession } from '@/stores/AppEnvironmentContext';

import { useStackScreenOptions } from './useStackScreenOptions';

/**
 * Switches between the auth and app trees with protected route guards. Email
 * link targets (`verify-email`, `reset-password`) work in both states.
 */
export default observer(function RootNavigator() {
  const session = useSession();
  const screenOptions = useStackScreenOptions();
  const { t } = useTranslation();
  const signedIn = session.isSignedIn;

  return (
    <Stack screenOptions={{ ...screenOptions, headerShown: false }}>
      <Stack.Protected guard={!signedIn}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>
      <Stack.Protected guard={signedIn}>
        <Stack.Screen name="(app)" />
      </Stack.Protected>
      <Stack.Screen
        name="verify-email"
        options={{ headerShown: true, title: t('auth.verify.title') }}
      />
      <Stack.Screen
        name="reset-password"
        options={{ headerShown: true, title: t('auth.reset.title') }}
      />
      <Stack.Screen
        name="+not-found"
        options={{ headerShown: true, title: t('notFound.title') }}
      />
    </Stack>
  );
});
