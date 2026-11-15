export type TranslationTree = { [key: string]: string | TranslationTree };

export const PLURAL_SUFFIXES = [
  'zero',
  'one',
  'two',
  'few',
  'many',
  'other',
] as const;

const pluralSuffixPattern = new RegExp(`_(${PLURAL_SUFFIXES.join('|')})$`);

export function flattenKeys(tree: TranslationTree, prefix = ''): string[] {
  return Object.entries(tree).flatMap(([key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    return typeof value === 'string' ? [path] : flattenKeys(value, path);
  });
}

export function stripPluralSuffix(key: string) {
  return key.replace(pluralSuffixPattern, '');
}

export function isPluralKey(key: string) {
  return pluralSuffixPattern.test(key);
}
