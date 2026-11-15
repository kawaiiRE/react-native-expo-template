import { useMemo } from 'react';
import type { NativeStackNavigationOptions } from 'expo-router';
import { useReducedMotion } from 'react-native-reanimated';

import { useAppTheme } from '@/theme/theme';

/** Native-stack chrome derived from the active Paper theme. */
export function useStackScreenOptions(): NativeStackNavigationOptions {
  const theme = useAppTheme();
  const reducedMotion = useReducedMotion();

  return useMemo(
    () => ({
      animation: reducedMotion ? 'fade' : 'default',
      contentStyle: { backgroundColor: theme.colors.background },
      headerBackButtonDisplayMode: 'minimal',
      headerShadowVisible: false,
      headerStyle: { backgroundColor: theme.colors.background },
      headerTintColor: theme.colors.onSurface,
      headerTitleStyle: {
        color: theme.colors.onSurface,
        fontFamily: theme.fontFamilies.semiBold,
      },
    }),
    [reducedMotion, theme],
  );
}
