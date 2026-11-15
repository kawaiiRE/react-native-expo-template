import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { useProfileLocaleSync } from '@/hooks/useProfileLocaleSync';

import { useStackScreenOptions } from './useStackScreenOptions';

/** Authenticated stack: the drawer shell plus detail, form and settings pages. */
export default function AppStackNavigator() {
  const screenOptions = useStackScreenOptions();
  const { t } = useTranslation();

  useProfileLocaleSync();

  return (
    <Stack screenOptions={screenOptions}>
      <Stack.Screen name="(drawer)" options={{ headerShown: false }} />
      <Stack.Screen
        name="notes/new"
        options={{ presentation: 'modal', title: t('navigation.newNote') }}
      />
      <Stack.Screen
        name="notes/[id]/index"
        options={{ title: t('navigation.note') }}
      />
      <Stack.Screen
        name="notes/[id]/edit"
        options={{ presentation: 'modal', title: t('navigation.editNote') }}
      />
      <Stack.Screen
        name="settings/profile"
        options={{ title: t('navigation.profile') }}
      />
      <Stack.Screen
        name="settings/language"
        options={{ title: t('navigation.language') }}
      />
      <Stack.Screen
        name="settings/password"
        options={{ title: t('navigation.changePassword') }}
      />
      <Stack.Screen
        name="settings/delete-account"
        options={{ title: t('navigation.deleteAccount') }}
      />
      <Stack.Screen name="about" options={{ title: t('navigation.about') }} />
      <Stack.Screen
        name="upgrade"
        options={{ presentation: 'modal', title: t('navigation.upgrade') }}
      />
    </Stack>
  );
}
