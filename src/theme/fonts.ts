import type { MD3Theme } from 'react-native-paper';

import type { AppLanguage } from '@/i18n/languages';

export type FontWeightName = 'regular' | 'medium' | 'semiBold' | 'bold';
export type FontFamilies = Record<FontWeightName, string>;

const latinFamilies: FontFamilies = {
  regular: 'DMSans_400Regular',
  medium: 'DMSans_500Medium',
  semiBold: 'DMSans_600SemiBold',
  bold: 'DMSans_700Bold',
};

const arabicFamilies: FontFamilies = {
  regular: 'IBMPlexSansArabic_400Regular',
  medium: 'IBMPlexSansArabic_500Medium',
  semiBold: 'IBMPlexSansArabic_600SemiBold',
  bold: 'IBMPlexSansArabic_700Bold',
};

// Arabic glyphs carry taller ascenders and descenders than Latin glyphs at the
// same size, so line heights grow to avoid clipping diacritics.
const ARABIC_LINE_HEIGHT_SCALE = 1.2;

export function fontFamiliesFor(language: AppLanguage): FontFamilies {
  return language === 'ar' ? arabicFamilies : latinFamilies;
}

function familyForWeight(families: FontFamilies, weight: string | undefined) {
  const numeric = Number(weight);

  if (numeric >= 700 || weight === 'bold') {
    return families.bold;
  }

  if (numeric >= 600) {
    return families.semiBold;
  }

  if (numeric >= 500) {
    return families.medium;
  }

  return families.regular;
}

export function buildTypescale(
  base: MD3Theme['fonts'],
  language: AppLanguage,
): MD3Theme['fonts'] {
  const families = fontFamiliesFor(language);
  const lineHeightScale = language === 'ar' ? ARABIC_LINE_HEIGHT_SCALE : 1;
  const entries = Object.entries(base).map(([key, value]) => {
    const fontFamily = familyForWeight(families, value.fontWeight);

    if (!('lineHeight' in value)) {
      return [key, { ...value, fontFamily, fontWeight: 'normal' as const }];
    }

    return [
      key,
      {
        ...value,
        fontFamily,
        fontWeight: 'normal' as const,
        letterSpacing: language === 'ar' ? 0 : value.letterSpacing,
        lineHeight: Math.ceil(value.lineHeight * lineHeightScale),
      },
    ];
  });

  return Object.fromEntries(entries) as MD3Theme['fonts'];
}
