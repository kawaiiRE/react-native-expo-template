import AsyncStorage from '@react-native-async-storage/async-storage';

import type { KeyValueStorage } from './keyValueStorage';

/** Non-sensitive preferences only. Never store tokens here. */
export const preferencesStorage: KeyValueStorage = {
  getItem: (key) => AsyncStorage.getItem(key),
  setItem: (key, value) => AsyncStorage.setItem(key, value),
  removeItem: (key) => AsyncStorage.removeItem(key),
};
