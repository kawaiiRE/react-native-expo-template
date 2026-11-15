import type { AppLanguage } from '@/i18n/languages';
import type { KeyValueStorage } from '@/services/storage/keyValueStorage';

import { PreferencesStore } from './PreferencesStore';
import { SessionStore, type SessionStoreDependencies } from './SessionStore';

export type RootStoreDependencies = {
  preferencesStorage: KeyValueStorage;
  deviceLanguage: AppLanguage;
  session: SessionStoreDependencies;
};

/** Owns the genuinely shared client state. Create one instance per React tree. */
export class RootStore {
  readonly preferences: PreferencesStore;
  readonly session: SessionStore;

  constructor(deps: RootStoreDependencies) {
    this.preferences = new PreferencesStore(
      deps.preferencesStorage,
      deps.deviceLanguage,
    );
    this.session = new SessionStore(deps.session);
  }

  async hydrate() {
    await Promise.all([
      this.preferences.hydrate(),
      this.session.restore(),
      this.session.loadFeatures(),
    ]);
  }
}
