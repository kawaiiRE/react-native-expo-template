import { describe, expect, it, vi } from 'vitest';

import { createMemoryStorage } from '@/services/storage/keyValueStorage';

import { createFakeFetch, json, type RecordedCall } from '../testing/fakeFetch';

import { createNextBackend } from './nextBackend';
import { NEXT_TOKEN_STORAGE_KEY } from './tokenStore';

const BASE = 'https://app.example.com';
const NOW = Date.parse('2026-10-01T12:00:00.000Z');
const DAY = 24 * 60 * 60 * 1000;

const userDto = {
  id: 'abcdefghijklmno',
  email: 'bartholomew.fitzgerald@northwind-industries-holdings.example.com',
  name: 'Bartholomew Fitzgerald',
  verified: true,
  locale: 'ar',
  createdAt: '2026-01-01T00:00:00.000Z',
};

function sessionDto(token: string, overrides: Record<string, unknown> = {}) {
  return {
    token,
    expiresAt: new Date(NOW + 7 * DAY).toISOString(),
    user: { ...userDto, ...overrides },
  };
}

const noteDto = {
  id: 'n1aaaaaaaaaaaaa',
  title: 'Q3 Board Deck — FINAL (revised) v12',
  body: '',
  archived: false,
  createdAt: '2026-10-01T10:00:00.000Z',
  updatedAt: '2026-10-01T10:00:00.000Z',
};

type Routes = Parameters<typeof createFakeFetch>[0];

function setup(routes: Routes, now = () => NOW) {
  const storage = createMemoryStorage();
  const onSessionRejected = vi.fn();
  const { fetchImpl, calls } = createFakeFetch({
    'POST /api/v1/auth/token': () => json(200, sessionDto('login-token')),
    ...routes,
  });
  const backend = createNextBackend({
    baseUrl: BASE,
    storage,
    hooks: { onSessionRejected },
    fetchImpl,
    now,
  });
  const signIn = () =>
    backend.auth.signIn({ email: userDto.email, password: 'secret123' });

  return { backend, calls, storage, onSessionRejected, signIn };
}

function last(calls: RecordedCall[]) {
  return calls[calls.length - 1];
}

describe('Next gateway adapter: auth', () => {
  it('signs in with the token route and never sends credentials to it', async () => {
    const { backend, calls, signIn } = setup({});

    const result = await signIn();

    expect(result).toEqual({
      ok: true,
      data: {
        id: userDto.id,
        email: userDto.email,
        name: userDto.name,
        verified: true,
        locale: 'ar',
        isGuest: false,
        createdAt: userDto.createdAt,
      },
    });
    expect(calls[0]).toMatchObject({
      method: 'POST',
      path: '/api/v1/auth/token',
      body: { email: userDto.email, password: 'secret123' },
    });
    expect(calls[0].headers.Authorization).toBeUndefined();
    expect(await backend.auth.hasStoredCredential()).toBe(true);
  });

  it('maps registration outcomes', async () => {
    const authenticated = setup({
      'POST /api/v1/auth/token/register': () =>
        json(201, { status: 'authenticated', session: sessionDto('t1') }),
    });
    const pending = setup({
      'POST /api/v1/auth/token/register': () =>
        json(201, {
          status: 'verification_required',
          user: { ...userDto, verified: false },
        }),
    });
    const input = { name: 'Bart', email: userDto.email, password: 'secret123' };

    const first = await authenticated.backend.auth.register(input);
    const second = await pending.backend.auth.register(input);

    expect(first.ok && first.data.status).toBe('authenticated');
    expect(second).toEqual({
      ok: true,
      data: { status: 'verification_required', email: userDto.email },
    });
    expect(await pending.backend.auth.hasStoredCredential()).toBe(false);
  });

  it('starts guest sessions with the active locale', async () => {
    const { backend, calls } = setup({
      'POST /api/v1/auth/token/guest': () =>
        json(200, sessionDto('guest-token', { isGuest: true })),
      'GET /api/v1/me': () =>
        json(200, { user: { ...userDto, isGuest: true } }),
    });

    const result = await backend.auth.startGuestSession({ locale: 'ar' });
    expect(calls[0]?.body).toEqual({ locale: 'ar' });
    await backend.account.me();

    expect(result.ok && result.data.isGuest).toBe(true);
    expect(last(calls).headers.Authorization).toBe('Bearer guest-token');
  });

  it('upgrades guests with the guest bearer token', async () => {
    const { backend, calls } = setup({
      'POST /api/v1/auth/token/guest': () =>
        json(200, sessionDto('guest-token', { isGuest: true })),
      'POST /api/v1/auth/token/guest/upgrade': () =>
        json(200, { status: 'authenticated', session: sessionDto('member') }),
    });
    await backend.auth.startGuestSession();
    const input = {
      name: 'Bart',
      email: userDto.email,
      password: 'secret123',
      locale: 'en' as const,
    };

    const result = await backend.auth.upgradeGuest(input);

    expect(result.ok && result.data.status).toBe('authenticated');
    expect(last(calls).headers.Authorization).toBe('Bearer guest-token');
    expect(last(calls).body).toEqual(input);
  });

  it('reports upgrades that need verification', async () => {
    const { backend } = setup({
      'POST /api/v1/auth/token/guest': () =>
        json(200, sessionDto('guest-token', { isGuest: true })),
      'POST /api/v1/auth/token/guest/upgrade': () =>
        json(202, {
          status: 'verification_required',
          user: { ...userDto, verified: false },
        }),
    });
    await backend.auth.startGuestSession();

    const result = await backend.auth.upgradeGuest({
      name: 'Bart',
      email: userDto.email,
      password: 'secret123',
    });

    expect(result).toEqual({
      ok: true,
      data: { status: 'verification_required', email: userDto.email },
    });
    expect(await backend.auth.hasStoredCredential()).toBe(false);
  });

  it('maps guest error codes', async () => {
    const { backend } = setup({
      'POST /api/v1/auth/token/guest': () =>
        json(403, { message: 'Off', code: 'GUEST_DISABLED' }),
    });
    const result = await backend.auth.startGuestSession();
    expect(result.ok || result.error).toEqual({
      code: 'GUEST_DISABLED',
      status: 403,
    });
  });

  it('refreshes with the stored token and forgets rejected tokens', async () => {
    let accept = true;
    const { backend, calls, signIn } = setup({
      'POST /api/v1/auth/token/refresh': () =>
        accept
          ? json(200, sessionDto('rotated'))
          : json(401, { message: 'No', code: 'UNAUTHENTICATED' }),
    });
    await signIn();

    expect((await backend.auth.refreshSession()).ok).toBe(true);
    expect(last(calls).headers.Authorization).toBe('Bearer login-token');

    accept = false;
    const rejected = await backend.auth.refreshSession();
    expect(rejected.ok || rejected.error.code).toBe('UNAUTHENTICATED');
    expect(last(calls).headers.Authorization).toBe('Bearer rotated');
    expect(await backend.auth.hasStoredCredential()).toBe(false);
  });

  it('keeps the token when a refresh fails for connectivity reasons', async () => {
    const { backend, signIn } = setup({
      'POST /api/v1/auth/token/refresh': () => {
        throw new TypeError('Network request failed');
      },
    });
    await signIn();

    const result = await backend.auth.refreshSession();

    expect(result.ok || result.error.code).toBe('NETWORK_ERROR');
    expect(await backend.auth.hasStoredCredential()).toBe(true);
  });

  it('restores a persisted token and reports refresh without one', async () => {
    const { backend } = setup({});
    expect(await backend.auth.hasStoredCredential()).toBe(false);
    const result = await backend.auth.refreshSession();
    expect(result.ok || result.error.code).toBe('UNAUTHENTICATED');
  });

  it('calls password-reset, confirm, verification and resend routes', async () => {
    const { backend, calls } = setup({
      'POST /api/v1/auth/password-reset': () => json(202, {}),
      'POST /api/v1/auth/password-reset/confirm': () => json(204),
      'POST /api/v1/auth/verify-email': () => json(204),
      'POST /api/v1/auth/verify-email/request': () => json(202, {}),
    });

    expect(
      (await backend.auth.requestPasswordReset({ email: userDto.email })).ok,
    ).toBe(true);
    expect(
      (await backend.auth.resetPassword({ token: 'tok', password: 'n3w-pass' }))
        .ok,
    ).toBe(true);
    expect(await backend.auth.verifyEmail('vtok')).toEqual({
      ok: true,
      data: { user: null },
    });
    expect(
      (await backend.auth.resendVerification({ email: userDto.email })).ok,
    ).toBe(true);
    expect(calls.map((call) => [call.path, call.body])).toEqual([
      ['/api/v1/auth/password-reset', { email: userDto.email }],
      [
        '/api/v1/auth/password-reset/confirm',
        { token: 'tok', password: 'n3w-pass' },
      ],
      ['/api/v1/auth/verify-email', { token: 'vtok' }],
      ['/api/v1/auth/verify-email/request', { email: userDto.email }],
    ]);
  });

  it('keeps gateway field codes and normalizes unknown ones', async () => {
    const { backend } = setup({
      'POST /api/v1/auth/token/register': () =>
        json(400, {
          message: 'Invalid',
          code: 'INVALID_INPUT',
          fields: { email: 'taken', name: 'something_new' },
        }),
    });

    const result = await backend.auth.register({
      name: 'B',
      email: userDto.email,
      password: 'secret123',
    });

    expect(result.ok || result.error).toEqual({
      code: 'INVALID_INPUT',
      status: 400,
      fields: { email: 'taken', name: 'invalid' },
    });
  });

  it('falls back to the HTTP status for unknown codes and bodies', async () => {
    const { backend, signIn } = setup({
      'GET /api/v1/me': () =>
        json(418, { message: 'Teapot', code: 'NEW_THING' }),
      'GET /api/v1/config': () => new Response('<html>', { status: 503 }),
    });
    await signIn();

    const me = await backend.account.me();
    const config = await backend.config.features();

    expect(me.ok || me.error.code).toBe('UNKNOWN');
    expect(config.ok || config.error.code).toBe('UNAVAILABLE');
  });
});

describe('Next gateway adapter: account and config', () => {
  it('updates the profile and rejects malformed users', async () => {
    const { backend, calls, signIn } = setup({
      'PATCH /api/v1/me': (call) =>
        json(200, { user: { ...userDto, ...(call.body as object) } }),
      'GET /api/v1/me': () =>
        json(200, { user: { ...userDto, createdAt: 'yesterday' } }),
    });
    await signIn();

    const updated = await backend.account.updateProfile({ locale: 'en' });
    const malformed = await backend.account.me();

    expect(updated.ok && updated.data.locale).toBe('en');
    expect(calls[1]).toMatchObject({ method: 'PATCH', body: { locale: 'en' } });
    expect(malformed.ok || malformed.error.code).toBe('INVALID_RESPONSE');
  });

  it('forgets the token after a password change and after deletion', async () => {
    const changed = setup({ 'POST /api/v1/me/password': () => json(204) });
    await changed.signIn();
    const result = await changed.backend.account.changePassword({
      currentPassword: 'old-pass',
      password: 'new-pass-1',
    });
    expect(result).toEqual({ ok: true, data: { signedOut: true } });
    expect(await changed.backend.auth.hasStoredCredential()).toBe(false);

    const deleted = setup({ 'DELETE /api/v1/me': () => json(204) });
    await deleted.signIn();
    expect(
      (await deleted.backend.account.deleteAccount({ isGuest: true }, {})).ok,
    ).toBe(true);
    expect(last(deleted.calls).method).toBe('DELETE');
    expect(await deleted.backend.auth.hasStoredCredential()).toBe(false);
  });

  it('defaults guest features for gateways that predate guests', async () => {
    const { backend } = setup({
      'GET /api/v1/config': () =>
        json(200, {
          apiVersion: 1,
          features: { registration: false, emailVerification: true },
        }),
    });

    expect(await backend.config.features()).toEqual({
      ok: true,
      data: {
        registration: false,
        emailVerification: true,
        guest: false,
        guestTtlHours: 24,
      },
    });
  });

  it('pins the API version and accepts fractional guest lifetimes', async () => {
    let apiVersion = 1;
    const { backend } = setup({
      'GET /api/v1/config': () =>
        json(200, {
          apiVersion,
          features: {
            registration: true,
            emailVerification: false,
            guest: true,
            guestTtlHours: 0.5,
          },
        }),
    });

    const current = await backend.config.features();
    apiVersion = 2;
    const future = await backend.config.features();

    expect(current.ok && current.data.guestTtlHours).toBe(0.5);
    expect(future.ok || future.error.code).toBe('INVALID_RESPONSE');
  });

  it('reads the gateway health report', async () => {
    const { backend } = setup({
      'GET /api/v1/health': () =>
        json(200, {
          available: true,
          apiVersion: 1,
          service: 'pocketbase-template',
          checkedAt: '2026-10-01T12:00:00.000Z',
        }),
    });
    expect(await backend.health.check()).toEqual({
      ok: true,
      data: {
        available: true,
        service: 'pocketbase-template',
        apiVersion: 1,
        checkedAt: '2026-10-01T12:00:00.000Z',
      },
    });
  });
});

describe('Next gateway adapter: notes', () => {
  it('lists with bearer auth, query parameters and page mapping', async () => {
    const { backend, calls, signIn } = setup({
      'GET /api/v1/notes': () =>
        json(200, {
          items: [noteDto],
          page: 2,
          perPage: 20,
          totalItems: 21,
          totalPages: 2,
        }),
    });
    await signIn();

    const result = await backend.notes.list({
      page: 2,
      search: '  board ',
      archived: true,
    });

    expect(result).toEqual({
      ok: true,
      data: {
        items: [noteDto],
        page: 2,
        perPage: 20,
        totalItems: 21,
        totalPages: 2,
      },
    });
    const call = last(calls);
    expect(call.headers.Authorization).toBe('Bearer login-token');
    expect(Object.fromEntries(call.query)).toEqual({
      page: '2',
      perPage: '20',
      search: 'board',
      archived: 'true',
    });
  });

  it('creates, reads, updates and deletes with encoded ids', async () => {
    const { backend, calls, signIn } = setup({
      'POST /api/v1/notes': (call) =>
        json(201, { ...noteDto, ...(call.body as object) }),
      'GET /api/v1/notes/a%2Fb': () => json(200, noteDto),
      'PATCH /api/v1/notes/a%2Fb': () =>
        json(200, { ...noteDto, archived: true }),
      'DELETE /api/v1/notes/a%2Fb': () => json(204),
    });
    await signIn();

    const created = await backend.notes.create({ title: 'New', body: 'Text' });
    await backend.notes.get('a/b');
    const updated = await backend.notes.update('a/b', { archived: true });
    const removed = await backend.notes.remove('a/b');

    expect(created.ok && created.data.title).toBe('New');
    expect(updated.ok && updated.data.archived).toBe(true);
    expect(removed).toEqual({ ok: true, data: undefined });
    expect(calls.slice(1).map((call) => `${call.method} ${call.path}`)).toEqual(
      [
        'POST /api/v1/notes',
        'GET /api/v1/notes/a%2Fb',
        'PATCH /api/v1/notes/a%2Fb',
        'DELETE /api/v1/notes/a%2Fb',
      ],
    );
  });

  it('reports rejected sessions and skips requests without a token', async () => {
    const { backend, calls, onSessionRejected, signIn } = setup({
      'GET /api/v1/notes/x': () =>
        json(401, { message: 'No', code: 'UNAUTHENTICATED' }),
    });

    const anonymous = await backend.notes.get('x');
    expect(anonymous.ok || anonymous.error.code).toBe('UNAUTHENTICATED');
    expect(calls).toHaveLength(0);

    await signIn();
    await backend.notes.get('x');
    expect(onSessionRejected).toHaveBeenCalledTimes(2);
  });
});

describe('Next gateway adapter: token lifetime', () => {
  it('refreshes proactively once less than a quarter of the lifetime remains', async () => {
    let now = NOW;
    const storage = createMemoryStorage();
    const { fetchImpl, calls } = createFakeFetch({
      'POST /api/v1/auth/token': () =>
        json(200, {
          ...sessionDto('first'),
          expiresAt: new Date(NOW + DAY).toISOString(),
        }),
      'POST /api/v1/auth/token/refresh': () =>
        json(200, {
          ...sessionDto('second'),
          expiresAt: new Date(now + DAY).toISOString(),
        }),
      'GET /api/v1/me': () => json(200, { user: userDto }),
    });
    const backend = createNextBackend({
      baseUrl: BASE,
      storage,
      hooks: { onSessionRejected: vi.fn() },
      fetchImpl,
      now: () => now,
    });
    await backend.auth.signIn({ email: userDto.email, password: 'x' });

    now += 17 * 60 * 60 * 1000;
    await backend.account.me();
    expect(last(calls).headers.Authorization).toBe('Bearer first');

    now += 2 * 60 * 60 * 1000;
    await Promise.all([backend.account.me(), backend.account.me()]);
    expect(
      calls.filter((call) => call.path === '/api/v1/auth/token/refresh'),
    ).toHaveLength(1);
    expect(last(calls).headers.Authorization).toBe('Bearer second');
  });

  it('drops expired and malformed persisted tokens', async () => {
    const expired = createMemoryStorage({
      [NEXT_TOKEN_STORAGE_KEY]: JSON.stringify({
        version: 1,
        token: 'old',
        expiresAt: NOW - 1,
        receivedAt: NOW - DAY,
      }),
    });
    const malformed = createMemoryStorage({
      [NEXT_TOKEN_STORAGE_KEY]: '{"token":42',
    });
    const make = (storage: typeof expired) =>
      createNextBackend({
        baseUrl: BASE,
        storage,
        hooks: { onSessionRejected: vi.fn() },
        fetchImpl: createFakeFetch({}).fetchImpl,
        now: () => NOW,
      });

    expect(await make(expired).auth.hasStoredCredential()).toBe(false);
    expect(await make(malformed).auth.hasStoredCredential()).toBe(false);
  });
});
