import { describe, expect, it } from 'vitest';

import { ALL_ERROR_CODES, FIELD_ERROR_CODES } from '@/models/errors';
import { BACKEND_KINDS } from '@/services/backend/ports';

import { createI18n } from './index';
import { resolveLanguage } from './languages';
import { ar } from './locales/ar';
import { en } from './locales/en';
import {
  PLURAL_SUFFIXES,
  flattenKeys,
  isPluralKey,
  stripPluralSuffix,
} from './types';

function baseKeys(keys: string[]) {
  return new Set(keys.map(stripPluralSuffix));
}

describe('translations', () => {
  const enKeys = flattenKeys(en);
  const arKeys = flattenKeys(ar);

  it('keeps English and Arabic keys in parity (ignoring plural forms)', () => {
    expect([...baseKeys(arKeys)].sort()).toEqual([...baseKeys(enKeys)].sort());
  });

  it('defines every Arabic plural category for plural keys', () => {
    const pluralBases = new Set(
      enKeys.filter(isPluralKey).map(stripPluralSuffix),
    );

    for (const base of pluralBases) {
      for (const suffix of PLURAL_SUFFIXES) {
        expect(arKeys).toContain(`${base}_${suffix}`);
      }
      expect(enKeys).toContain(`${base}_one`);
      expect(enKeys).toContain(`${base}_other`);
    }
  });

  it('translates every API error code', () => {
    for (const code of ALL_ERROR_CODES) {
      expect(en.errors[code]).toBeTruthy();
      expect(ar.errors[code]).toBeTruthy();
    }
  });

  it('translates every field error code and backend name', () => {
    for (const code of FIELD_ERROR_CODES) {
      expect(en.fieldErrors[code]).toBeTruthy();
      expect(ar.fieldErrors[code]).toBeTruthy();
    }
    for (const kind of BACKEND_KINDS) {
      expect(en.about.backends[kind]).toBeTruthy();
      expect(ar.about.backends[kind]).toBeTruthy();
    }
  });

  it('has no empty strings', () => {
    const values = (tree: object): string[] =>
      Object.values(tree).flatMap((value) =>
        typeof value === 'string' ? [value] : values(value as object),
      );

    expect(values(en).every((value) => value.trim().length > 0)).toBe(true);
    expect(values(ar).every((value) => value.trim().length > 0)).toBe(true);
  });
});

describe('pluralization', () => {
  it('uses English one/other forms', () => {
    const i18n = createI18n('en');
    expect(i18n.t('notes.count', { count: 1 })).toBe('1 note');
    expect(i18n.t('notes.count', { count: 0 })).toBe('0 notes');
    expect(i18n.t('notes.count', { count: 1284 })).toBe('1284 notes');
  });

  it('uses all six Arabic plural categories', () => {
    const i18n = createI18n('ar');
    expect(i18n.t('notes.count', { count: 0 })).toBe('لا توجد ملاحظات');
    expect(i18n.t('notes.count', { count: 1 })).toBe('ملاحظة واحدة');
    expect(i18n.t('notes.count', { count: 2 })).toBe('ملاحظتان');
    expect(i18n.t('notes.count', { count: 3 })).toBe('3 ملاحظات');
    expect(i18n.t('notes.count', { count: 11 })).toBe('11 ملاحظة');
    expect(i18n.t('notes.count', { count: 100 })).toBe('100 ملاحظة');
  });
});

describe('guest banner', () => {
  it('pluralizes the guest lifetime, including fractional hours', () => {
    const english = createI18n('en');
    const arabic = createI18n('ar');

    expect(english.t('guest.banner', { count: 1 })).toContain('1 hour.');
    expect(english.t('guest.banner', { count: 24 })).toContain('24 hours.');
    expect(english.t('guest.banner', { count: 0.5 })).toContain('0.5 hours.');
    expect(arabic.t('guest.banner', { count: 2 })).toContain('ساعتين');
    expect(arabic.t('guest.banner', { count: 3 })).toContain('3 ساعات');
    expect(arabic.t('guest.banner', { count: 24 })).toContain('24 ساعة');
  });
});

describe('resolveLanguage', () => {
  it('picks the first supported device language', () => {
    expect(resolveLanguage(['fr', 'ar-EG', 'en'])).toBe('ar');
    expect(resolveLanguage(['en_GB'])).toBe('en');
    expect(resolveLanguage(['de', null])).toBe('en');
  });
});
