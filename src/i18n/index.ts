import 'intl-pluralrules';
import { createInstance, type i18n as I18n } from 'i18next';
import { initReactI18next } from 'react-i18next';

import { DEFAULT_LANGUAGE, type AppLanguage } from './languages';
import { ar } from './locales/ar';
import { en } from './locales/en';

export const resources = {
  en: { translation: en },
  ar: { translation: ar },
} as const;

/** Creates an isolated i18next instance for one React tree. */
export function createI18n(language: AppLanguage): I18n {
  const instance = createInstance();

  void instance.use(initReactI18next).init({
    resources,
    lng: language,
    fallbackLng: DEFAULT_LANGUAGE,
    supportedLngs: Object.keys(resources),
    interpolation: { escapeValue: false },
    returnNull: false,
    initAsync: false,
  });

  return instance;
}
