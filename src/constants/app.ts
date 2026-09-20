import Constants from 'expo-constants';

type ExtraConfig = {
  apiBaseUrl?: string;
};

const extra = (Constants.expoConfig?.extra ?? {}) as ExtraConfig;

function readExtraString(value: string | undefined) {
  return typeof value === 'string' ? value.trim() : '';
}

export const appConfig = {
  apiBaseUrl: readExtraString(extra.apiBaseUrl).replace(/\/+$/, ''),
} as const;
