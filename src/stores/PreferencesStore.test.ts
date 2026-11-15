import { describe, expect, it } from 'vitest';

import { storageKeys } from '@/constants/storageKeys';
import { createMemoryStorage } from '@/services/storage/keyValueStorage';

import { PreferencesStore } from './PreferencesStore';

async function hydrated(raw?: string, deviceLanguage: 'en' | 'ar' = 'en') {
  const storage = createMemoryStorage(
    raw === undefined ? {} : { [storageKeys.preferences]: raw },
  );
  const store = new PreferencesStore(storage, deviceLanguage);
  await store.hydrate();
  return { store, storage };
}

describe('PreferencesStore', () => {
  it('uses defaults on first launch and follows the device language', async () => {
    const { store } = await hydrated(undefined, 'ar');

    expect(store.isHydrated).toBe(true);
    expect(store.themeMode).toBe('system');
    expect(store.language).toBeNull();
    expect(store.effectiveLanguage).toBe('ar');
    expect(store.onboardingCompleted).toBe(false);
  });

  it('restores a valid snapshot', async () => {
    const { store } = await hydrated(
      JSON.stringify({
        version: 1,
        themeMode: 'dark',
        language: 'ar',
        onboardingCompleted: true,
      }),
    );

    expect(store.themeMode).toBe('dark');
    expect(store.effectiveLanguage).toBe('ar');
    expect(store.onboardingCompleted).toBe(true);
  });

  it('falls back per field for invalid values and ignores corrupt JSON', async () => {
    const { store } = await hydrated(
      JSON.stringify({
        version: 1,
        themeMode: 'sepia',
        language: 'fr',
        onboardingCompleted: 'yes',
      }),
    );
    expect(store.themeMode).toBe('system');
    expect(store.language).toBeNull();
    expect(store.onboardingCompleted).toBe(false);

    const corrupt = await hydrated('{not json');
    expect(corrupt.store.themeMode).toBe('system');
    expect(corrupt.store.isHydrated).toBe(true);
  });

  it('ignores snapshots from an incompatible version', async () => {
    const { store } = await hydrated(
      JSON.stringify({
        version: 2,
        themeMode: 'dark',
        language: 'ar',
        onboardingCompleted: true,
      }),
    );
    expect(store.themeMode).toBe('system');
  });

  it('persists changes', async () => {
    const { store, storage } = await hydrated();

    store.setThemeMode('light');
    store.setLanguage('ar');
    store.completeOnboarding();
    await Promise.resolve();

    expect(
      JSON.parse((await storage.getItem(storageKeys.preferences)) ?? '{}'),
    ).toEqual({
      version: 1,
      themeMode: 'light',
      language: 'ar',
      onboardingCompleted: true,
    });
  });
});
