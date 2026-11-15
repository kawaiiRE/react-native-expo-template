import Constants from 'expo-constants';

import { parseBackendConfig } from '@/config/backend';

const expoConfig = Constants.expoConfig;
const scheme = Array.isArray(expoConfig?.scheme)
  ? expoConfig.scheme[0]
  : expoConfig?.scheme;

export const appConfig = {
  name: expoConfig?.name ?? 'Expo Starter',
  version: expoConfig?.version ?? '0.0.0',
  scheme: scheme ?? 'expo-starter',
  // `process.env.EXPO_PUBLIC_*` is inlined at bundle time and must be read statically.
  backend: parseBackendConfig({
    backend: process.env.EXPO_PUBLIC_BACKEND,
    apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL,
    allowInsecure: __DEV__,
  }),
} as const;
