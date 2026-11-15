import { z } from 'zod';

import { failure, success, type AppResult } from '@/models/errors';
import { NOTES_PAGE_SIZE, type Note } from '@/models/note';
import type { User } from '@/models/user';
import type { KeyValueStorage } from '@/services/storage/keyValueStorage';

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

import {
  nextConfigSchema,
  nextHealthSchema,
  nextNoteSchema,
  nextNotesPageSchema,
  nextPaths,
  nextRegisterResponseSchema,
  nextSessionSchema,
  nextUserEnvelopeSchema,
  type NextSession,
  type NextUser,
} from './contracts';
import { mapNextError } from './errors';
import { NextTokenStore } from './tokenStore';

export type NextBackendOptions = {
  baseUrl: string;
  storage: KeyValueStorage;
  hooks: BackendHooks;
  fetchImpl?: FetchLike;
  now?: () => number;
};

function toUser(dto: NextUser): User {
  return {
    id: dto.id,
    email: dto.email,
    name: dto.name,
    verified: dto.verified,
    locale: dto.locale,
    isGuest: dto.isGuest,
    createdAt: dto.createdAt,
  };
}

function toNote(dto: z.infer<typeof nextNoteSchema>): Note {
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

/** Adapter for the Next.js gateway's native-client contract (bearer tokens). */
export function createNextBackend(options: NextBackendOptions): Backend {
  let tokens: NextTokenStore;
  const http = new HttpClient({
    baseUrl: options.baseUrl,
    mapError: mapNextError,
    credentials: { headers: () => tokens.headers() },
    onUnauthorized: options.hooks.onSessionRejected,
    fetchImpl: options.fetchImpl,
  });

  tokens = new NextTokenStore({
    storage: options.storage,
    now: options.now,
    exchange: (token) =>
      http.request({
        method: 'POST',
        path: nextPaths.tokenRefresh,
        headers: { Authorization: `Bearer ${token}` },
        schema: nextSessionSchema,
      }),
  });

  async function adopt(session: NextSession): Promise<User> {
    await tokens.save(session);
    return toUser(session.user);
  }

  const auth: AuthPort = {
    capabilities: {
      resendVerification: true,
      deleteAccountRequiresPassword: false,
    },
    hasStoredCredential: () => tokens.hasToken(),
    async refreshSession() {
      const result = await tokens.refresh();
      if (!result) return failure('UNAUTHENTICATED', 401);
      return mapResult(result, (session) => toUser(session.user));
    },
    async signIn(input) {
      const result = await http.request({
        method: 'POST',
        path: nextPaths.token,
        body: input,
        schema: nextSessionSchema,
      });
      return result.ok ? success(await adopt(result.data)) : result;
    },
    async register(input) {
      const result = await http.request({
        method: 'POST',
        path: nextPaths.tokenRegister,
        body: input,
        schema: nextRegisterResponseSchema,
      });
      if (!result.ok) return result;
      return result.data.status === 'authenticated'
        ? success({
            status: 'authenticated',
            user: await adopt(result.data.session),
          })
        : success({
            status: 'verification_required',
            email: result.data.user.email,
          });
    },
    async startGuestSession(input = {}) {
      const result = await http.request({
        method: 'POST',
        path: nextPaths.tokenGuest,
        body: input,
        schema: nextSessionSchema,
      });
      return result.ok ? success(await adopt(result.data)) : result;
    },
    async upgradeGuest(input) {
      const result = await http.request({
        method: 'POST',
        path: nextPaths.tokenGuestUpgrade,
        authenticated: true,
        body: input,
        schema: nextRegisterResponseSchema,
      });
      if (!result.ok) return result;
      if (result.data.status === 'authenticated') {
        return success({
          status: 'authenticated',
          user: await adopt(result.data.session),
        });
      }
      // The gateway invalidates the guest token once the upgrade awaits verification.
      await tokens.clear();
      return success({
        status: 'verification_required',
        email: result.data.user.email,
      });
    },
    // Gateway tokens are stateless: forgetting the token is the sign-out.
    signOut: () => tokens.clear(),
    clearCredential: () => tokens.clear(),
    requestPasswordReset: (input) =>
      http.request({
        method: 'POST',
        path: nextPaths.passwordReset,
        body: input,
      }),
    resetPassword: (input) =>
      http.request({
        method: 'POST',
        path: nextPaths.passwordResetConfirm,
        body: input,
      }),
    async verifyEmail(token) {
      const result = await http.request({
        method: 'POST',
        path: nextPaths.verifyEmail,
        body: { token },
      });
      return result.ok ? success({ user: null }) : result;
    },
    resendVerification: (input) =>
      http.request({
        method: 'POST',
        path: nextPaths.verifyEmailRequest,
        body: input,
      }),
  };

  const account: AccountPort = {
    async me() {
      const result = await http.request({
        path: nextPaths.me,
        authenticated: true,
        schema: nextUserEnvelopeSchema,
      });
      return mapResult(result, ({ user }) => toUser(user));
    },
    async updateProfile(input) {
      const result = await http.request({
        method: 'PATCH',
        path: nextPaths.me,
        authenticated: true,
        body: input,
        schema: nextUserEnvelopeSchema,
      });
      return mapResult(result, ({ user }) => toUser(user));
    },
    async changePassword(input) {
      const result = await http.request({
        method: 'POST',
        path: nextPaths.mePassword,
        authenticated: true,
        body: input,
      });
      if (!result.ok) return result;
      // The gateway revokes every token of the account.
      await tokens.clear();
      return success({ signedOut: true });
    },
    async deleteAccount() {
      const result = await http.request({
        method: 'DELETE',
        path: nextPaths.me,
        authenticated: true,
      });
      if (result.ok) await tokens.clear();
      return result;
    },
  };

  const config: ConfigPort = {
    async features() {
      const result = await http.request({
        path: nextPaths.config,
        schema: nextConfigSchema,
        timeoutMs: 8_000,
      });
      return mapResult(result, ({ features }) => features);
    },
  };

  const health: HealthPort = {
    async check(signal) {
      const result = await http.request({
        path: nextPaths.health,
        schema: nextHealthSchema,
        signal,
        timeoutMs: 8_000,
      });
      return mapResult(result, (report) => ({
        available: report.available,
        service: report.service,
        apiVersion: report.apiVersion,
        checkedAt: report.checkedAt,
      }));
    },
  };

  const notes: NotesPort = {
    async list(query, signal) {
      const result = await http.request({
        path: nextPaths.notes,
        authenticated: true,
        query: {
          page: query.page,
          perPage: query.perPage ?? NOTES_PAGE_SIZE,
          search: query.search?.trim(),
          archived: query.archived,
        },
        schema: nextNotesPageSchema,
        signal,
      });
      return mapResult(result, (page) => ({
        items: page.items.map(toNote),
        page: page.page,
        perPage: page.perPage,
        totalItems: page.totalItems,
        totalPages: page.totalPages,
      }));
    },
    async get(id, signal) {
      const result = await http.request({
        path: nextPaths.note(id),
        authenticated: true,
        schema: nextNoteSchema,
        signal,
      });
      return mapResult(result, toNote);
    },
    async create(input) {
      const result = await http.request({
        method: 'POST',
        path: nextPaths.notes,
        authenticated: true,
        body: input,
        schema: nextNoteSchema,
      });
      return mapResult(result, toNote);
    },
    async update(id, input) {
      const result = await http.request({
        method: 'PATCH',
        path: nextPaths.note(id),
        authenticated: true,
        body: input,
        schema: nextNoteSchema,
      });
      return mapResult(result, toNote);
    },
    remove: (id) =>
      http.request({
        method: 'DELETE',
        path: nextPaths.note(id),
        authenticated: true,
      }),
  };

  return { auth, account, config, health, notes };
}
