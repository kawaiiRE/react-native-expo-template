import { MD3DarkTheme, MD3LightTheme, useTheme } from 'react-native-paper';
import type { MD3Theme } from 'react-native-paper';

import type { AppLanguage } from '@/i18n/languages';

import { darkColors, lightColors, type AppColors } from './colors';
import { buildTypescale, fontFamiliesFor, type FontFamilies } from './fonts';
import { radii } from './tokens';

export type ColorScheme = 'light' | 'dark';

export type AppTheme = Omit<MD3Theme, 'colors'> & {
  colors: AppColors;
  fontFamilies: FontFamilies;
  language: AppLanguage;
  scheme: ColorScheme;
};

export function buildAppTheme(
  scheme: ColorScheme,
  language: AppLanguage,
): AppTheme {
  const base = scheme === 'dark' ? MD3DarkTheme : MD3LightTheme;

  return {
    ...base,
    dark: scheme === 'dark',
    roundness: radii.sm / 2,
    colors: scheme === 'dark' ? darkColors : lightColors,
    fonts: buildTypescale(base.fonts, language),
    fontFamilies: fontFamiliesFor(language),
    language,
    scheme,
  };
}

export function useAppTheme() {
  return useTheme<AppTheme>();
}
