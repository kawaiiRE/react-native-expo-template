import { makeAutoObservable, runInAction } from 'mobx';
import { z } from 'zod';

import { storageKeys } from '@/constants/storageKeys';
import { SUPPORTED_LANGUAGES, type AppLanguage } from '@/i18n/languages';
import {
  readStoredJson,
  writeStoredJson,
  type KeyValueStorage,
} from '@/services/storage/keyValueStorage';

export const THEME_PREFERENCES = ['system', 'light', 'dark'] as const;
export type ThemePreference = (typeof THEME_PREFERENCES)[number];

const preferencesSnapshotSchema = z.object({
  version: z.literal(1),
  themeMode: z.enum(THEME_PREFERENCES).catch('system'),
  language: z.enum(SUPPORTED_LANGUAGES).nullable().catch(null),
  onboardingCompleted: z.boolean().catch(false),
});

export type PreferencesSnapshot = z.infer<typeof preferencesSnapshotSchema>;

export class PreferencesStore {
  themeMode: ThemePreference = 'system';
  /** Explicit language override. `null` follows the device language. */
  language: AppLanguage | null = null;
  onboardingCompleted = false;
  deviceLanguage: AppLanguage;
  isHydrated = false;

  private readonly storage: KeyValueStorage;

  constructor(storage: KeyValueStorage, deviceLanguage: AppLanguage) {
    this.storage = storage;
    this.deviceLanguage = deviceLanguage;
    makeAutoObservable<this, 'storage'>(
      this,
      { storage: false },
      { autoBind: true },
    );
  }

  get effectiveLanguage(): AppLanguage {
    return this.language ?? this.deviceLanguage;
  }

  get snapshot(): PreferencesSnapshot {
    return {
      version: 1,
      themeMode: this.themeMode,
      language: this.language,
      onboardingCompleted: this.onboardingCompleted,
    };
  }

  async hydrate() {
    const parsed = preferencesSnapshotSchema.safeParse(
      await readStoredJson(this.storage, storageKeys.preferences),
    );

    runInAction(() => {
      if (parsed.success) {
        this.themeMode = parsed.data.themeMode;
        this.language = parsed.data.language;
        this.onboardingCompleted = parsed.data.onboardingCompleted;
      }
      this.isHydrated = true;
    });
  }

  setThemeMode(mode: ThemePreference) {
    this.themeMode = mode;
    void this.persist();
  }

  setLanguage(language: AppLanguage | null) {
    this.language = language;
    void this.persist();
  }

  setDeviceLanguage(language: AppLanguage) {
    this.deviceLanguage = language;
  }

  completeOnboarding() {
    this.onboardingCompleted = true;
    void this.persist();
  }

  private persist() {
    return writeStoredJson(
      this.storage,
      storageKeys.preferences,
      this.snapshot,
    );
  }
}
