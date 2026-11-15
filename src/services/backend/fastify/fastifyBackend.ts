import { failure, success, type AppResult } from '@/models/errors';
import { NOTES_PAGE_SIZE, type Note } from '@/models/note';
import type { User } from '@/models/user';

import { HttpClient, type FetchLike } from '../http/httpClient';
import type {
  AccountPort,
  AuthPort,
  Backend,
  BackendHooks,
  ConfigPort,
  HealthPort,
  NotesPort,
} from '../ports';

import type { AuthCallResult, BetterAuthTransport } from './authTransport';
import {
  fastifyConfigSchema,
  fastifyGetSessionSchema,
  fastifyMeSchema,
  fastifyNoteListSchema,
  fastifyNoteSchema,
  fastifyPaths,
  fastifyReadySchema,
  fastifySignUpSchema,
  type FastifyMe,
  type FastifyNote,
} from './contracts';
import { mapBetterAuthError, mapFastifyError } from './errors';

export type FastifyBackendOptions = {
  baseUrl: string;
  transport: BetterAuthTransport;
  hooks: BackendHooks;
  /** Native apps send the stored cookie; the web build relies on browser cookies. */
  platform: 'native' | 'web';
  fetchImpl?: FetchLike;
  now?: () => Date;
};

function toUser(dto: FastifyMe): User {
  return {
    id: dto.id,
    email: dto.email,
    name: dto.name,
    verified: dto.emailVerified,
    locale: dto.locale,
    isGuest: dto.isGuest,
    createdAt: dto.createdAt,
  };
}

function toNote(dto: FastifyNote): Note {
  return {
    id: dto.id,
    title: dto.title,
    body: dto.body,
    archived: dto.archived,
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt,
  };
}

function mapResult<T, U>(result: AppResult<T>, map: (value: T) => U) {
  return result.ok ? success(map(result.data)) : result;
}

function toVoid(result: AuthCallResult): AppResult<void> {
  return result.error
    ? { ok: false, error: mapBetterAuthError(result.error) }
    : success(undefined);
}

/**
 * Adapter for the Fastify + Better Auth backend. Better Auth's Expo client
 * keeps the session cookie in SecureStore; domain calls send it as `Cookie`.
 */
export function createFastifyBackend(options: FastifyBackendOptions): Backend {
  const { transport, platform } = options;
  const now = options.now ?? (() => new Date());

  const http = new HttpClient({
    baseUrl: options.baseUrl,
    mapError: mapFastifyError,
    includeCookies: platform === 'web',
    credentials: {
      async headers(): Promise<Record<string, string> | null> {
        if (platform === 'web') return {};
        const cookie = await transport.getCookie();
        return cookie ? { Cookie: cookie } : null;
      },
    },
    onUnauthorized: options.hooks.onSessionRejected,
    fetchImpl: options.fetchImpl,
  });

  async function me(): Promise<AppResult<User>> {
    const result = await http.request({
      path: fastifyPaths.me,
      authenticated: true,
      schema: fastifyMeSchema,
    });
    return mapResult(result, toUser);
  }

  async function afterAuth(result: AuthCallResult): Promise<AppResult<User>> {
    if (result.error)
      return { ok: false, error: mapBetterAuthError(result.error) };
    return me();
  }

  async function signUp(
    input: Parameters<AuthPort['register']>[0],
  ): ReturnType<AuthPort['register']> {
    const result = await transport.signUpEmail(input);
    if (result.error)
      return { ok: false, error: mapBetterAuthError(result.error) };

    const parsed = fastifySignUpSchema.safeParse(result.data);
    if (!parsed.success) return failure('INVALID_RESPONSE');
    if (parsed.data.token === null) {
      return success({ status: 'verification_required', email: input.email });
    }

    const user = await me();
    return user.ok
      ? success({ status: 'authenticated', user: user.data })
      : user;
  }

  async function forget() {
    try {
      await transport.signOut();
    } catch {
      // The Expo client clears its stored cookie before the request is sent.
    }
  }

  const auth: AuthPort = {
    capabilities: {
      resendVerification: true,
      deleteAccountRequiresPassword: true,
    },
    async hasStoredCredential() {
      // Browser cookies are HttpOnly, so the web build has to ask the server.
      if (platform === 'web') return true;
      return (await transport.getCookie()) !== '';
    },
    async refreshSession() {
      const session = await transport.getSession();
      if (session.error) {
        return { ok: false, error: mapBetterAuthError(session.error) };
      }
      const parsed = fastifyGetSessionSchema.safeParse(session.data);
      if (!parsed.success) return failure('INVALID_RESPONSE');
      if (!parsed.data) return failure('UNAUTHENTICATED', 401);
      return me();
    },
    signIn: async (input) => afterAuth(await transport.signInEmail(input)),
    register: signUp,
    startGuestSession: async (input = {}) =>
      afterAuth(await transport.signInAnonymous(input)),
    // Signing up while signed in as a guest links the guest's data to the new account.
    upgradeGuest: signUp,
    signOut: forget,
    clearCredential: forget,
    requestPasswordReset: async (input) =>
      toVoid(await transport.requestPasswordReset(input)),
    resetPassword: async ({ token, password }) =>
      toVoid(await transport.resetPassword({ token, newPassword: password })),
    async verifyEmail(token) {
      const result = await transport.verifyEmail(token);
      if (result.error)
        return { ok: false, error: mapBetterAuthError(result.error) };
      // Verification signs the user in when the backend enables auto sign-in.
      const user = await me();
      return success({ user: user.ok ? user.data : null });
    },
    resendVerification: async (input) =>
      toVoid(await transport.sendVerificationEmail(input)),
  };

  const account: AccountPort = {
    me,
    async updateProfile(input) {
      const result = await http.request({
        method: 'PATCH',
        path: fastifyPaths.me,
        authenticated: true,
        body: input,
        schema: fastifyMeSchema,
      });
      return mapResult(result, toUser);
    },
    async changePassword({ currentPassword, password }) {
      const result = toVoid(
        await transport.changePassword({
          currentPassword,
          newPassword: password,
          revokeOtherSessions: true,
        }),
      );
      // Better Auth keeps this device signed in and revokes the others.
      return result.ok ? success({ signedOut: false }) : result;
    },
    async deleteAccount(user, input) {
      const result = toVoid(
        user.isGuest
          ? await transport.deleteAnonymousUser()
          : await transport.deleteUser(
              input.password ? { password: input.password } : {},
            ),
      );
      if (result.ok) await forget();
      return result;
    },
  };

  const config: ConfigPort = {
    async features() {
      const result = await http.request({
        path: fastifyPaths.config,
        schema: fastifyConfigSchema,
        timeoutMs: 8_000,
      });
      return mapResult(result, ({ features }) => features);
    },
  };

  const health: HealthPort = {
    async check(signal) {
      const result = await http.request({
        path: fastifyPaths.ready,
        schema: fastifyReadySchema,
        signal,
        timeoutMs: 8_000,
      });
      return mapResult(result, () => ({
        available: true,
        service: null,
        apiVersion: null,
        checkedAt: now().toISOString(),
      }));
    },
  };

  const notes: NotesPort = {
    async list(query, signal) {
      const result = await http.request({
        path: fastifyPaths.notes,
        authenticated: true,
        query: {
          page: query.page,
          perPage: query.perPage ?? NOTES_PAGE_SIZE,
          search: query.search?.trim(),
          archived: query.archived,
        },
        schema: fastifyNoteListSchema,
        signal,
      });
      return mapResult(result, (page) => ({
        items: page.list.map(toNote),
        page: page.page,
        perPage: page.perPage,
        totalItems: page.total,
        totalPages: page.totalPages,
      }));
    },
    async get(id, signal) {
      const result = await http.request({
        path: fastifyPaths.note(id),
        authenticated: true,
        schema: fastifyNoteSchema,
        signal,
      });
      return mapResult(result, toNote);
    },
    async create(input) {
      const result = await http.request({
        method: 'POST',
        path: fastifyPaths.notes,
        authenticated: true,
        body: input,
        schema: fastifyNoteSchema,
      });
      return mapResult(result, toNote);
    },
    async update(id, input) {
      const result = await http.request({
        method: 'PATCH',
        path: fastifyPaths.note(id),
        authenticated: true,
        body: input,
        schema: fastifyNoteSchema,
      });
      return mapResult(result, toNote);
    },
    remove: (id) =>
      http.request({
        method: 'DELETE',
        path: fastifyPaths.note(id),
        authenticated: true,
      }),
  };

  return { auth, account, config, health, notes };
}
