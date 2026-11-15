import { z } from 'zod';

import type { AppResult } from '@/models/errors';
import {
  readStoredJson,
  removeStoredItem,
  writeStoredJson,
  type KeyValueStorage,
} from '@/services/storage/keyValueStorage';

import type { SessionCredentials } from '../http/httpClient';

import type { NextSession } from './contracts';

/** Refresh once less than this share of the token lifetime remains. */
export const REFRESH_REMAINING_RATIO = 0.25;

export const NEXT_TOKEN_STORAGE_KEY = 'app.next.token.v1';

const storedTokenSchema = z.object({
  version: z.literal(1),
  token: z.string().min(1),
  expiresAt: z.number().int().positive(),
  receivedAt: z.number().int().positive(),
});

type StoredToken = z.infer<typeof storedTokenSchema>;

/** Error codes that mean the token can never be used again. */
const REJECTED = new Set([
  'UNAUTHENTICATED',
  'INVALID_CREDENTIALS',
  'EMAIL_NOT_VERIFIED',
]);

export type TokenStoreDependencies = {
  storage: KeyValueStorage;
  exchange: (token: string) => Promise<AppResult<NextSession>>;
  now?: () => number;
};

/**
 * Owns the gateway bearer token: secure persistence, proactive single-flight
 * refresh, and the `Authorization` header for authenticated requests.
 */
export class NextTokenStore implements SessionCredentials {
  private current: StoredToken | null = null;
  private loading: Promise<void> | null = null;
  private refreshing: Promise<AppResult<NextSession>> | null = null;
  private readonly now: () => number;

  constructor(private readonly deps: TokenStoreDependencies) {
    this.now = deps.now ?? (() => Date.now());
  }

  async hasToken() {
    await this.load();
    return this.current !== null && !this.isExpired(this.current);
  }

  async save(session: NextSession) {
    const expiresAt = Date.parse(session.expiresAt);
    this.current = {
      version: 1,
      token: session.token,
      expiresAt,
      receivedAt: this.now(),
    };
    this.loading = Promise.resolve();
    await writeStoredJson(
      this.deps.storage,
      NEXT_TOKEN_STORAGE_KEY,
      this.current,
    );
  }

  async clear() {
    this.current = null;
    this.loading = Promise.resolve();
    await removeStoredItem(this.deps.storage, NEXT_TOKEN_STORAGE_KEY);
  }

  /** Exchanges the stored token for a fresh session (single flight). */
  async refresh(): Promise<AppResult<NextSession> | null> {
    await this.load();
    const stored = this.current;
    if (!stored) return null;
    if (this.refreshing) return this.refreshing;

    this.refreshing = this.deps
      .exchange(stored.token)
      .then(async (result) => {
        if (this.current?.token !== stored.token) return result;
        if (result.ok) await this.save(result.data);
        else if (REJECTED.has(result.error.code)) await this.clear();
        return result;
      })
      .finally(() => {
        this.refreshing = null;
      });

    return this.refreshing;
  }

  async headers(): Promise<Record<string, string> | null> {
    const token = await this.validToken();
    return token ? { Authorization: `Bearer ${token}` } : null;
  }

  private async validToken() {
    await this.load();
    const stored = this.current;
    if (!stored) return null;

    if (this.isExpired(stored)) {
      await this.clear();
      return null;
    }

    if (this.shouldRefresh(stored)) await this.refresh();
    return this.current?.token ?? null;
  }

  private shouldRefresh(stored: StoredToken) {
    const lifetime = stored.expiresAt - stored.receivedAt;
    const remaining = stored.expiresAt - this.now();
    return lifetime <= 0 || remaining < lifetime * REFRESH_REMAINING_RATIO;
  }

  private isExpired(stored: StoredToken) {
    return this.now() >= stored.expiresAt;
  }

  private load() {
    if (this.loading) return this.loading;

    const pending: Promise<void> = readStoredJson(
      this.deps.storage,
      NEXT_TOKEN_STORAGE_KEY,
    ).then((raw) => {
      // A save or clear that happened meanwhile is newer than the stored value.
      if (this.loading !== pending) return;
      const parsed = storedTokenSchema.safeParse(raw);
      this.current = parsed.success ? parsed.data : null;
    });
    this.loading = pending;
    return pending;
  }
}
