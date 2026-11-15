import { expoClient } from '@better-auth/expo/client';
import { createAuthClient } from 'better-auth/client';
import { anonymousClient } from 'better-auth/client/plugins';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

import type { AuthCallResult, BetterAuthTransport } from './authTransport';
import { FASTIFY_AUTH_BASE_PATH } from './contracts';

const AUTH_TIMEOUT_MS = 15_000;
/** SecureStore keys allow only letters, digits, `.`, `-` and `_`. */
const STORAGE_PREFIX = 'app_auth';

type ClientResponse = {
  data: unknown;
  error: { status: number; code?: string; message?: string } | null;
};

async function call(
  run: () => Promise<ClientResponse>,
): Promise<AuthCallResult> {
  try {
    const { data, error } = await run();
    return error
      ? {
          data: null,
          error: {
            status: error.status,
            code: error.code,
            message: error.message,
          },
        }
      : { data, error: null };
  } catch (error) {
    const timedOut = error instanceof Error && error.name === 'AbortError';
    return {
      data: null,
      error: { status: 0, code: timedOut ? 'TIMEOUT' : undefined },
    };
  }
}

/** Better Auth's official Expo client, exposed through the adapter's transport port. */
export function createBetterAuthTransport(options: {
  baseUrl: string;
  scheme: string;
}): BetterAuthTransport {
  const client = createAuthClient({
    baseURL: options.baseUrl,
    basePath: FASTIFY_AUTH_BASE_PATH,
    fetchOptions: { timeout: AUTH_TIMEOUT_MS },
    plugins: [
      expoClient({
        scheme: options.scheme,
        storagePrefix: STORAGE_PREFIX,
        storage: SecureStore,
      }),
      anonymousClient(),
    ],
  });

  return {
    signInEmail: (body) => call(() => client.signIn.email(body)),
    signUpEmail: (body) => call(() => client.signUp.email(body)),
    // The endpoint has no body schema; Fastify falls back to Accept-Language.
    signInAnonymous: ({ locale }) =>
      call(() =>
        client.signIn.anonymous(
          locale
            ? { fetchOptions: { headers: { 'accept-language': locale } } }
            : {},
        ),
      ),
    signOut: () => call(() => client.signOut()),
    getSession: () => call(() => client.getSession()),
    requestPasswordReset: (body) =>
      call(() => client.requestPasswordReset(body)),
    resetPassword: (body) => call(() => client.resetPassword(body)),
    verifyEmail: (token) =>
      call(() => client.verifyEmail({ query: { token } })),
    sendVerificationEmail: (body) =>
      call(() => client.sendVerificationEmail(body)),
    changePassword: (body) => call(() => client.changePassword(body)),
    deleteUser: (body) => call(() => client.deleteUser(body)),
    deleteAnonymousUser: () => call(() => client.deleteAnonymousUser()),
    getCookie: () =>
      Platform.OS === 'web' ? Promise.resolve('') : client.getCookie(),
  };
}
