import { DarkTheme, DefaultTheme, type Theme } from 'expo-router';

import type { AppTheme } from './theme';

/**
 * Maps the Paper theme onto the navigation theme (the same mapping as Paper's
 * `adaptNavigationTheme`, typed for Expo Router's navigation fork) so headers,
 * drawer and tab chrome share Paper's colors and fonts.
 */
export function buildNavigationTheme(theme: AppTheme): Theme {
  const base = theme.dark ? DarkTheme : DefaultTheme;
  const families = theme.fontFamilies;

  return {
    ...base,
    dark: theme.dark,
    colors: {
      ...base.colors,
      primary: theme.colors.primary,
      background: theme.colors.background,
      card: theme.colors.background,
      text: theme.colors.onSurface,
      border: theme.colors.outlineVariant,
      notification: theme.colors.error,
    },
    fonts: {
      regular: { fontFamily: families.regular, fontWeight: 'normal' },
      medium: { fontFamily: families.medium, fontWeight: 'normal' },
      bold: { fontFamily: families.semiBold, fontWeight: 'normal' },
      heavy: { fontFamily: families.bold, fontWeight: 'normal' },
    },
  };
}
