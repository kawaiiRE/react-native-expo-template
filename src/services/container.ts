import type { BackendConfig } from '@/config/backend';
import { appConfig } from '@/constants/app';
import { readDeviceLanguage } from '@/i18n/deviceLanguage';
import { createBackend } from '@/services/backend/createBackend';
import type {
  AccountPort,
  AuthPort,
  ConfigPort,
  HealthPort,
} from '@/services/backend/ports';
import { NotesService } from '@/services/notes/notesService';
import { preferencesStorage } from '@/services/storage/asyncStorage';
import { secureStorage } from '@/services/storage/secureStorage';
import { RootStore } from '@/stores/RootStore';

export type AppServices = {
  auth: AuthPort;
  account: AccountPort;
  config: ConfigPort;
  health: HealthPort;
  notes: NotesService;
};

export type AppEnvironment = {
  config: BackendConfig;
  services: AppServices;
  store: RootStore;
};

/** Composition root. Called once per React tree by the app provider. */
export function createAppEnvironment(config: BackendConfig): AppEnvironment {
  let store: RootStore | null = null;
  const backend = createBackend(config, appConfig.scheme, {
    onSessionRejected: () => store?.session.handleUnauthorized(),
  });

  store = new RootStore({
    preferencesStorage,
    deviceLanguage: readDeviceLanguage(),
    session: {
      auth: backend.auth,
      config: backend.config,
      storage: secureStorage,
    },
  });

  return {
    config,
    services: {
      auth: backend.auth,
      account: backend.account,
      config: backend.config,
      health: backend.health,
      notes: new NotesService(backend.notes),
    },
    store,
  };
}
