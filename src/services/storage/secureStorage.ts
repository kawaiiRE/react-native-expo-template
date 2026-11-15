import * as SecureStore from 'expo-secure-store';

import type { KeyValueStorage } from './keyValueStorage';

const options: SecureStore.SecureStoreOptions = {
  keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK,
};

/** Keychain (iOS) / Keystore-encrypted storage (Android) for credentials. */
export const secureStorage: KeyValueStorage = {
  getItem: (key) => SecureStore.getItemAsync(key, options),
  setItem: (key, value) => SecureStore.setItemAsync(key, value, options),
  removeItem: (key) => SecureStore.deleteItemAsync(key, options),
};
