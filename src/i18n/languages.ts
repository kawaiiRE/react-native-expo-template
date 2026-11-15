export const SUPPORTED_LANGUAGES = ['en', 'ar'] as const;

export type AppLanguage = (typeof SUPPORTED_LANGUAGES)[number];

export const DEFAULT_LANGUAGE: AppLanguage = 'en';

export const RTL_LANGUAGES: ReadonlySet<AppLanguage> = new Set(['ar']);

export const languageNativeNames: Record<AppLanguage, string> = {
  en: 'English',
  ar: 'العربية',
};

export function isAppLanguage(value: unknown): value is AppLanguage {
  return (
    typeof value === 'string' &&
    (SUPPORTED_LANGUAGES as readonly string[]).includes(value)
  );
}

export function isRtlLanguage(language: AppLanguage) {
  return RTL_LANGUAGES.has(language);
}

export function resolveLanguage(
  languageCodes: readonly (string | null | undefined)[],
): AppLanguage {
  for (const code of languageCodes) {
    const normalized = code?.toLowerCase().split(/[-_]/)[0];

    if (isAppLanguage(normalized)) {
      return normalized;
    }
  }

  return DEFAULT_LANGUAGE;
}

export function intlLocaleFor(language: AppLanguage) {
  return language === 'ar' ? 'ar' : 'en';
}
