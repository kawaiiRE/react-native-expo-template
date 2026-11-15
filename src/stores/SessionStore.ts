import { makeAutoObservable, runInAction } from 'mobx';
import { z } from 'zod';

import { storageKeys } from '@/constants/storageKeys';
import type {
  LocaleInput,
  RegisterInput,
  RegisterOutcome,
  ServerFeatures,
  SignInInput,
} from '@/models/auth';
import type { AppResult } from '@/models/errors';
import { userSchema, type User } from '@/models/user';
import type { AuthPort, ConfigPort } from '@/services/backend/ports';
import {
  readStoredJson,
  removeStoredItem,
  writeStoredJson,
  type KeyValueStorage,
} from '@/services/storage/keyValueStorage';

/** Minimum time between foreground revalidations of a restored session. */
export const REVALIDATE_INTERVAL_MS = 5 * 60 * 1000;

export type SessionStatus = 'restoring' | 'signedOut' | 'signedIn';

export type SignOutReason =
  | 'manual'
  | 'expired'
  | 'unauthorized'
  | 'passwordChanged'
  | 'accountDeleted'
  | 'guestEnded'
  | 'emailNotVerified';

export type SignOutNotice = Exclude<SignOutReason, 'manual'>;

const cachedUserSchema = z.object({
  version: z.literal(1),
  user: userSchema,
});

export type SessionStoreDependencies = {
  auth: Pick<
    AuthPort,
    | 'hasStoredCredential'
    | 'refreshSession'
    | 'signIn'
    | 'register'
    | 'startGuestSession'
    | 'upgradeGuest'
    | 'signOut'
    | 'clearCredential'
  >;
  config: ConfigPort;
  /** Secure storage for the cached profile shown while offline. */
  storage: KeyValueStorage;
  now?: () => number;
};

/**
 * Who is signed in. Backend adapters own the credential; this store owns the
 * observable user, server feature flags, and sign-out notices.
 */
export class SessionStore {
  status: SessionStatus = 'restoring';
  user: User | null = null;
  features: ServerFeatures | null = null;
  signOutNotice: SignOutNotice | null = null;
  /** Email to show on the verification notice after a forced sign-out. */
  pendingVerificationEmail: string | null = null;

  private refreshInFlight: Promise<boolean> | null = null;
  private lastValidatedAt = 0;
  private readonly deps: Required<SessionStoreDependencies>;

  constructor(deps: SessionStoreDependencies) {
    this.deps = { now: () => Date.now(), ...deps };
    makeAutoObservable<this, 'deps' | 'refreshInFlight' | 'lastValidatedAt'>(
      this,
      { deps: false, refreshInFlight: false, lastValidatedAt: false },
      { autoBind: true },
    );
  }

  get isSignedIn() {
    return this.status === 'signedIn' && this.user !== null;
  }

  get isGuest() {
    return this.user?.isGuest ?? false;
  }

  get registrationEnabled() {
    return this.features?.registration ?? false;
  }

  get guestEnabled() {
    return this.features?.guest ?? false;
  }

  /**
   * Restores a stored session: immediately from the cached profile when one
   * exists (then revalidates in the background), otherwise from the server.
   */
  async restore() {
    const [hasCredential, cached] = await Promise.all([
      this.deps.auth.hasStoredCredential(),
      readStoredJson(this.deps.storage, storageKeys.sessionUser),
    ]);

    if (!hasCredential) {
      await removeStoredItem(this.deps.storage, storageKeys.sessionUser);
      runInAction(() => this.clear());
      return;
    }

    const snapshot = cachedUserSchema.safeParse(cached);
    if (snapshot.success) {
      runInAction(() => {
        this.user = snapshot.data.user;
        this.status = 'signedIn';
      });
      void this.refresh();
      return;
    }

    const refreshed = await this.refresh();
    if (!refreshed) runInAction(() => this.clear());
  }

  async loadFeatures() {
    const result = await this.deps.config.features();

    if (result.ok) {
      runInAction(() => {
        this.features = result.data;
      });
    }

    return result;
  }

  async signIn(input: SignInInput): Promise<AppResult<User>> {
    const result = await this.deps.auth.signIn(input);
    if (result.ok) await this.applyUser(result.data);
    return result;
  }

  async register(input: RegisterInput): Promise<AppResult<RegisterOutcome>> {
    const result = await this.deps.auth.register(input);
    if (result.ok && result.data.status === 'authenticated') {
      await this.applyUser(result.data.user);
    }
    return result;
  }

  async startGuestSession(input?: LocaleInput): Promise<AppResult<User>> {
    const result = await this.deps.auth.startGuestSession(input);
    if (result.ok) await this.applyUser(result.data);
    return result;
  }

  async upgradeGuest(
    input: RegisterInput,
  ): Promise<AppResult<RegisterOutcome>> {
    const result = await this.deps.auth.upgradeGuest(input);
    if (!result.ok) return result;

    if (result.data.status === 'authenticated') {
      await this.applyUser(result.data.user);
    } else if (!(await this.deps.auth.hasStoredCredential())) {
      // The backend ended the guest session; nothing is left to keep.
      await this.signOut();
    }
    return result;
  }

  /** Single-flight revalidation. Resolves `true` when the session is valid. */
  refresh(): Promise<boolean> {
    if (this.refreshInFlight) return this.refreshInFlight;

    this.refreshInFlight = this.deps.auth
      .refreshSession()
      .then(async (result) => {
        if (result.ok) {
          await this.applyUser(result.data);
          return true;
        }

        if (result.error.code === 'EMAIL_NOT_VERIFIED') {
          const email = this.user?.email ?? null;
          await this.signOut('emailNotVerified');
          runInAction(() => {
            this.pendingVerificationEmail = email;
          });
        } else if (
          result.error.code === 'UNAUTHENTICATED' ||
          result.error.code === 'INVALID_CREDENTIALS'
        ) {
          await this.signOut(this.user ? 'expired' : 'manual');
        }

        return false;
      })
      .finally(() => {
        this.refreshInFlight = null;
      });

    return this.refreshInFlight;
  }

  /** Revalidates on app foreground, at most once per interval. */
  async revalidate() {
    if (!this.isSignedIn) return;
    if (this.deps.now() - this.lastValidatedAt < REVALIDATE_INTERVAL_MS) return;
    await this.refresh();
  }

  /** Adopts a user the backend signed in out of band (email verification). */
  async completeSignIn(user: User) {
    await this.applyUser(user);
  }

  handleUnauthorized() {
    if (this.status === 'signedIn') void this.signOut('unauthorized');
  }

  async updateUser(user: User) {
    if (!this.isSignedIn) return;
    await this.applyUser(user);
  }

  async signOut(reason: SignOutReason = 'manual') {
    const wasSignedIn = this.status === 'signedIn';
    this.clear();
    this.signOutNotice = reason === 'manual' ? null : reason;
    await Promise.all([
      reason === 'manual' && wasSignedIn
        ? this.deps.auth.signOut()
        : this.deps.auth.clearCredential(),
      removeStoredItem(this.deps.storage, storageKeys.sessionUser),
    ]);
  }

  dismissNotice() {
    this.signOutNotice = null;
    this.pendingVerificationEmail = null;
  }

  private async applyUser(user: User) {
    this.user = user;
    this.status = 'signedIn';
    this.signOutNotice = null;
    this.lastValidatedAt = this.deps.now();
    await writeStoredJson(this.deps.storage, storageKeys.sessionUser, {
      version: 1,
      user,
    });
  }

  private clear() {
    this.user = null;
    this.status = 'signedOut';
  }
}
