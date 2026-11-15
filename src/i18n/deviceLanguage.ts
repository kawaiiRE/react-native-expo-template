import { getLocales } from 'expo-localization';

import { resolveLanguage } from './languages';

export function readDeviceLanguage() {
  return resolveLanguage(getLocales().map((locale) => locale.languageCode));
}
