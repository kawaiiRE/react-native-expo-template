import { describe, expect, it, vi } from 'vitest';

import { storageKeys } from '@/constants/storageKeys';
import type { ServerFeatures } from '@/models/auth';
import { failure, success, type AppResult } from '@/models/errors';
import type { User } from '@/models/user';
import { createMemoryStorage } from '@/services/storage/keyValueStorage';

import {
  REVALIDATE_INTERVAL_MS,
  SessionStore,
  type SessionStoreDependencies,
} from './SessionStore';

const NOW = Date.parse('2026-10-01T12:00:00.000Z');

const user: User = {
  id: 'u1',
  email: 'aleksandra@example.com',
  name: 'Aleksandra Wiśniewska-Kowalczyk',
  verified: true,
  locale: null,
  isGuest: false,
  createdAt: '2026-01-01T00:00:00.000Z',
};

const guest: User = {
  ...user,
  id: 'g1',
  email: 'guest-g1@guest.invalid',
  name: '',
  isGuest: true,
};

const features: ServerFeatures = {
  registration: true,
  emailVerification: false,
  guest: true,
  guestTtlHours: 24,
};

type AuthFake = SessionStoreDependencies['auth'];

function setup(overrides: Partial<AuthFake> = {}) {
  let now = NOW;
  const storage = createMemoryStorage();
  const auth = {
    hasStoredCredential: vi.fn(async () => true),
    refreshSession: vi.fn(async (): Promise<AppResult<User>> => success(user)),
    signIn: vi.fn(async (): Promise<AppResult<User>> => success(user)),
    register: vi.fn(async () =>
      success({ status: 'authenticated' as const, user }),
    ),
    startGuestSession: vi.fn(async (): Promise<AppResult<User>> =>
      success(guest),
    ),
    upgradeGuest: vi.fn(async () =>
      success({ status: 'authenticated' as const, user }),
    ),
    signOut: vi.fn(async () => undefined),
    clearCredential: vi.fn(async () => undefined),
    ...overrides,
  } satisfies AuthFake;
  const config = { features: vi.fn(async () => success(features)) };
  const store = new SessionStore({
    auth,
    config,
    storage,
    now: () => now,
  });

  return {
    store,
    storage,
    auth,
    advance: (ms: number) => {
      now += ms;
    },
  };
}

async function cacheUser(
  storage: ReturnType<typeof createMemoryStorage>,
  value: unknown,
) {
  await storage.setItem(storageKeys.sessionUser, JSON.stringify(value));
}

describe('SessionStore', () => {
  it('signs in and caches the profile for offline launches', async () => {
    const { store, storage } = setup();

    const result = await store.signIn({
      email: user.email,
      password: 'secret123',
    });

    expect(result.ok).toBe(true);
    expect(store.isSignedIn).toBe(true);
    expect(
      JSON.parse((await storage.getItem(storageKeys.sessionUser)) ?? '{}'),
    ).toEqual({ version: 1, user });
  });

  it('restores from the cached profile and revalidates in the background', async () => {
    const { store, storage, auth } = setup({
      refreshSession: vi.fn(async () =>
        success({ ...user, name: 'Renamed elsewhere' }),
      ),
    });
    await cacheUser(storage, { version: 1, user });

    await store.restore();
    expect(store.isSignedIn).toBe(true);
    await vi.waitFor(() => expect(store.user?.name).toBe('Renamed elsewhere'));
    expect(auth.refreshSession).toHaveBeenCalledTimes(1);
  });

  it('asks the server when a credential exists without a cached profile', async () => {
    const { store, auth } = setup();

    await store.restore();

    expect(auth.refreshSession).toHaveBeenCalledTimes(1);
    expect(store.user).toEqual(user);
  });

  it('stays signed out without a credential and drops a stale cache', async () => {
    const { store, storage, auth } = setup({
      hasStoredCredential: vi.fn(async () => false),
    });
    await cacheUser(storage, { version: 1, user });

    await store.restore();

    expect(store.status).toBe('signedOut');
    expect(auth.refreshSession).not.toHaveBeenCalled();
    expect(await storage.getItem(storageKeys.sessionUser)).toBeNull();
  });

  it('ignores malformed cached profiles', async () => {
    const { store, storage, auth } = setup();
    await cacheUser(storage, { version: 1, user: { id: 42 } });

    await store.restore();

    expect(auth.refreshSession).toHaveBeenCalledTimes(1);
    expect(store.isSignedIn).toBe(true);
  });

  it('keeps a cached session when revalidation fails offline', async () => {
    const { store, storage } = setup({
      refreshSession: vi.fn(async () => failure('NETWORK_ERROR')),
    });
    await cacheUser(storage, { version: 1, user });

    await store.restore();
    await store.refresh();

    expect(store.isSignedIn).toBe(true);
  });

  it('signs out with a notice when the server rejects the session', async () => {
    const { store, auth } = setup({
      refreshSession: vi.fn(async () => failure('UNAUTHENTICATED', 401)),
    });
    await store.signIn({ email: user.email, password: 'secret123' });

    expect(await store.refresh()).toBe(false);
    expect(store.status).toBe('signedOut');
    expect(store.signOutNotice).toBe('expired');
    expect(auth.clearCredential).toHaveBeenCalled();
    expect(auth.signOut).not.toHaveBeenCalled();
  });

  it('routes EMAIL_NOT_VERIFIED to the verification notice', async () => {
    const { store } = setup({
      refreshSession: vi.fn(async () => failure('EMAIL_NOT_VERIFIED', 403)),
    });
    await store.signIn({ email: user.email, password: 'secret123' });
    await store.refresh();

    expect(store.signOutNotice).toBe('emailNotVerified');
    expect(store.pendingVerificationEmail).toBe(user.email);
  });

  it('deduplicates concurrent revalidations', async () => {
    const { store, auth } = setup();
    await store.signIn({ email: user.email, password: 'secret123' });

    await Promise.all([store.refresh(), store.refresh(), store.refresh()]);

    expect(auth.refreshSession).toHaveBeenCalledTimes(1);
  });

  it('revalidates on foreground at most once per interval', async () => {
    const { store, auth, advance } = setup();
    await store.signIn({ email: user.email, password: 'secret123' });

    await store.revalidate();
    expect(auth.refreshSession).not.toHaveBeenCalled();

    advance(REVALIDATE_INTERVAL_MS + 1);
    await store.revalidate();
    expect(auth.refreshSession).toHaveBeenCalledTimes(1);
  });

  it('handles rejected requests only while signed in', async () => {
    const { store } = setup();
    store.handleUnauthorized();
    expect(store.signOutNotice).toBeNull();

    await store.signIn({ email: user.email, password: 'secret123' });
    store.handleUnauthorized();
    await vi.waitFor(() => expect(store.status).toBe('signedOut'));
    expect(store.signOutNotice).toBe('unauthorized');
  });

  it('loads server features that gate registration and guests', async () => {
    const { store } = setup();
    expect(store.registrationEnabled).toBe(false);
    expect(store.guestEnabled).toBe(false);

    await store.loadFeatures();

    expect(store.registrationEnabled).toBe(true);
    expect(store.guestEnabled).toBe(true);
  });

  it('starts and upgrades guest sessions', async () => {
    const { store } = setup();

    await store.startGuestSession();
    expect(store.isGuest).toBe(true);

    await store.upgradeGuest({
      name: 'Aleksandra',
      email: user.email,
      password: 'secret123',
    });
    expect(store.isGuest).toBe(false);
    expect(store.user?.id).toBe(user.id);
  });

  it.each([
    [true, true],
    [false, false],
  ])(
    'after an upgrade awaiting verification, credential kept=%s keeps the guest=%s',
    async (credentialKept, guestKept) => {
      const { store, auth } = setup({
        upgradeGuest: vi.fn(async () =>
          success({
            status: 'verification_required' as const,
            email: user.email,
          }),
        ),
      });
      await store.startGuestSession();
      vi.mocked(auth.hasStoredCredential).mockResolvedValue(credentialKept);

      const result = await store.upgradeGuest({
        name: 'Aleksandra',
        email: user.email,
        password: 'secret123',
      });

      expect(result.ok && result.data.status).toBe('verification_required');
      expect(store.isSignedIn).toBe(guestKept);
      expect(store.signOutNotice).toBeNull();
    },
  );

  it('manual sign-out ends the server session and clears the cache', async () => {
    const { store, storage, auth } = setup();
    await store.signIn({ email: user.email, password: 'secret123' });
    await store.signOut();

    expect(store.isSignedIn).toBe(false);
    expect(store.signOutNotice).toBeNull();
    expect(auth.signOut).toHaveBeenCalledTimes(1);
    expect(await storage.getItem(storageKeys.sessionUser)).toBeNull();
  });

  it('adopts a user signed in by email verification', async () => {
    const { store } = setup();
    await store.completeSignIn(user);
    expect(store.isSignedIn).toBe(true);
  });
});
