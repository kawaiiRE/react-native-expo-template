import { describe, expect, it, vi } from 'vitest';

import { createFakeFetch, json, type RecordedCall } from '../testing/fakeFetch';

import type { AuthCallResult, BetterAuthTransport } from './authTransport';
import { fieldCodeFromMessage, mapFastifyError } from './errors';
import { createFastifyBackend } from './fastifyBackend';

const BASE = 'http://localhost:5000';

const meDto = {
  id: '6f1c2f9e-5b8a-4c1e-9d3b-2a7e4f0c1b9d',
  email: 'nour@example.com',
  name: 'نور الهدى عبد الرحمن',
  emailVerified: false,
  image: null,
  locale: 'ar',
  createdAt: '2026-01-01T00:00:00.000Z',
};

const noteDto = {
  id: '0b6a3d1e-7c2f-4a9b-8e5d-1f2a3b4c5d6e',
  title: 'Groceries',
  body: 'Milk',
  archived: false,
  createdAt: '2026-10-01T10:00:00.000Z',
  updatedAt: '2026-10-01T10:00:00.000Z',
};

const ok = (data: unknown = {}): AuthCallResult => ({ data, error: null });
const err = (status: number, code?: string): AuthCallResult => ({
  data: null,
  error: { status, code },
});

function fakeTransport(
  overrides: Partial<BetterAuthTransport> = {},
): BetterAuthTransport {
  return {
    signInEmail: vi.fn(async () => ok({ token: 't', user: {} })),
    signUpEmail: vi.fn(async () => ok({ token: 't', user: {} })),
    signInAnonymous: vi.fn(async () => ok({ token: 't', user: {} })),
    signOut: vi.fn(async () => ok({ success: true })),
    getSession: vi.fn(async () => ok({ session: { id: 's1' }, user: {} })),
    requestPasswordReset: vi.fn(async () => ok({ status: true })),
    resetPassword: vi.fn(async () => ok({ status: true })),
    verifyEmail: vi.fn(async () => ok({ status: true })),
    sendVerificationEmail: vi.fn(async () => ok({ status: true })),
    changePassword: vi.fn(async () => ok({ token: 't' })),
    deleteUser: vi.fn(async () => ok({ success: true })),
    deleteAnonymousUser: vi.fn(async () => ok({ success: true })),
    getCookie: vi.fn(async () => 'better-auth.session_token=abc.def'),
    ...overrides,
  };
}

type Routes = Parameters<typeof createFakeFetch>[0];

function setup(
  routes: Routes = {},
  transport = fakeTransport(),
  platform: 'native' | 'web' = 'native',
) {
  const onSessionRejected = vi.fn();
  const { fetchImpl, calls } = createFakeFetch({
    'GET /api/v1/me': () => json(200, meDto),
    ...routes,
  });
  const backend = createFastifyBackend({
    baseUrl: BASE,
    transport,
    hooks: { onSessionRejected },
    platform,
    fetchImpl,
    now: () => new Date('2026-10-01T12:00:00.000Z'),
  });
  return { backend, calls, transport, onSessionRejected };
}

function last(calls: RecordedCall[]) {
  return calls[calls.length - 1];
}

const registration = {
  name: 'Nour',
  email: meDto.email,
  password: 'secret123',
};

describe('Fastify adapter: auth', () => {
  it('signs in through Better Auth, then loads the profile with the session cookie', async () => {
    const { backend, calls, transport } = setup();

    const result = await backend.auth.signIn({
      email: meDto.email,
      password: 'secret123',
    });

    expect(transport.signInEmail).toHaveBeenCalledWith({
      email: meDto.email,
      password: 'secret123',
    });
    expect(result).toEqual({
      ok: true,
      data: {
        id: meDto.id,
        email: meDto.email,
        name: meDto.name,
        verified: false,
        locale: 'ar',
        isGuest: false,
        createdAt: meDto.createdAt,
      },
    });
    expect(last(calls).headers.Cookie).toBe(
      'better-auth.session_token=abc.def',
    );
  });

  it.each([
    [401, 'INVALID_EMAIL_OR_PASSWORD', 'INVALID_CREDENTIALS'],
    [403, 'EMAIL_NOT_VERIFIED', 'EMAIL_NOT_VERIFIED'],
    [403, 'INVALID_ORIGIN', 'FORBIDDEN_ORIGIN'],
    [429, undefined, 'RATE_LIMITED'],
    [0, undefined, 'NETWORK_ERROR'],
    [0, 'TIMEOUT', 'TIMEOUT'],
  ] as const)('maps sign-in %i %s to %s', async (status, code, expected) => {
    const { backend } = setup(
      {},
      fakeTransport({ signInEmail: vi.fn(async () => err(status, code)) }),
    );
    const result = await backend.auth.signIn({
      email: 'a@b.co',
      password: 'x',
    });
    expect(result.ok || result.error.code).toBe(expected);
  });

  it('reports verification-required sign-ups without loading a profile', async () => {
    const { backend, calls } = setup(
      {},
      fakeTransport({ signUpEmail: vi.fn(async () => ok({ token: null })) }),
    );

    const result = await backend.auth.register(registration);

    expect(result).toEqual({
      ok: true,
      data: { status: 'verification_required', email: meDto.email },
    });
    expect(calls).toHaveLength(0);
  });

  it('maps duplicate and closed registrations', async () => {
    const taken = setup(
      {},
      fakeTransport({
        signUpEmail: vi.fn(async () =>
          err(422, 'USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL'),
        ),
      }),
    );
    const closed = setup(
      {},
      fakeTransport({
        signUpEmail: vi.fn(async () =>
          err(400, 'EMAIL_PASSWORD_SIGN_UP_DISABLED'),
        ),
      }),
    );

    const first = await taken.backend.auth.register(registration);
    const second = await closed.backend.auth.register(registration);

    expect(first.ok || first.error).toEqual({
      code: 'EMAIL_TAKEN',
      status: 422,
      fields: { email: 'taken' },
    });
    expect(second.ok || second.error.code).toBe('REGISTRATION_DISABLED');
  });

  it('starts guests anonymously and upgrades them by signing up', async () => {
    const transport = fakeTransport();
    const { backend } = setup(
      { 'GET /api/v1/me': () => json(200, { ...meDto, isGuest: true }) },
      transport,
    );

    const guest = await backend.auth.startGuestSession({ locale: 'ar' });
    await backend.auth.upgradeGuest({ ...registration, locale: 'ar' });

    expect(guest.ok && guest.data.isGuest).toBe(true);
    expect(transport.signInAnonymous).toHaveBeenCalledWith({ locale: 'ar' });
    expect(transport.signUpEmail).toHaveBeenCalledWith({
      ...registration,
      locale: 'ar',
    });
  });

  it('maps GUEST_DISABLED from the anonymous sign-in', async () => {
    const { backend } = setup(
      {},
      fakeTransport({
        signInAnonymous: vi.fn(async () => err(403, 'GUEST_DISABLED')),
      }),
    );
    const result = await backend.auth.startGuestSession();
    expect(result.ok || result.error.code).toBe('GUEST_DISABLED');
  });

  it('validates the stored session with get-session before loading the profile', async () => {
    const signedOut = setup(
      {},
      fakeTransport({ getSession: vi.fn(async () => ok(null)) }),
    );
    const signedIn = setup();

    const missing = await signedOut.backend.auth.refreshSession();
    const present = await signedIn.backend.auth.refreshSession();

    expect(missing.ok || missing.error.code).toBe('UNAUTHENTICATED');
    expect(signedOut.calls).toHaveLength(0);
    expect(present.ok).toBe(true);
  });

  it('knows about stored cookies on native and asks the server on the web', async () => {
    const empty = setup(
      {},
      fakeTransport({ getCookie: vi.fn(async () => '') }),
    );
    const web = setup(
      {},
      fakeTransport({ getCookie: vi.fn(async () => '') }),
      'web',
    );

    expect(await empty.backend.auth.hasStoredCredential()).toBe(false);
    expect(await web.backend.auth.hasStoredCredential()).toBe(true);
  });

  it('maps reset, verification and resend calls', async () => {
    const transport = fakeTransport({
      resetPassword: vi.fn(async () => err(400, 'INVALID_TOKEN')),
    });
    const { backend } = setup({}, transport);

    const reset = await backend.auth.resetPassword({
      token: 'bad',
      password: 'new-pass-1',
    });
    const verified = await backend.auth.verifyEmail('jwt');
    const resent = await backend.auth.resendVerification({
      email: meDto.email,
    });

    expect(transport.resetPassword).toHaveBeenCalledWith({
      token: 'bad',
      newPassword: 'new-pass-1',
    });
    expect(reset.ok || reset.error).toEqual({
      code: 'INVALID_INPUT',
      status: 400,
      fields: { token: 'invalid_token' },
    });
    expect(verified.ok && verified.data.user?.email).toBe(meDto.email);
    expect(resent.ok).toBe(true);
    expect(backend.auth.capabilities.resendVerification).toBe(true);
  });

  it('returns a null user when verification does not sign in', async () => {
    const { backend } = setup({
      'GET /api/v1/me': () => json(401, { message: 'x', code: 'UNAUTHORIZED' }),
    });
    expect(await backend.auth.verifyEmail('jwt')).toEqual({
      ok: true,
      data: { user: null },
    });
  });

  it('signs out through Better Auth even when the request fails', async () => {
    const transport = fakeTransport({
      signOut: vi.fn(async () => {
        throw new Error('offline');
      }),
    });
    const { backend } = setup({}, transport);

    await expect(backend.auth.signOut()).resolves.toBeUndefined();
    await expect(backend.auth.clearCredential()).resolves.toBeUndefined();
    expect(transport.signOut).toHaveBeenCalledTimes(2);
  });
});

describe('Fastify adapter: account', () => {
  it('keeps this device signed in after a password change', async () => {
    const transport = fakeTransport();
    const { backend } = setup({}, transport);

    const result = await backend.account.changePassword({
      currentPassword: 'old-pass',
      password: 'new-pass-1',
    });

    expect(transport.changePassword).toHaveBeenCalledWith({
      currentPassword: 'old-pass',
      newPassword: 'new-pass-1',
      revokeOtherSessions: true,
    });
    expect(result).toEqual({ ok: true, data: { signedOut: false } });
  });

  it('maps a wrong current password onto the form field', async () => {
    const { backend } = setup(
      {},
      fakeTransport({
        changePassword: vi.fn(async () => err(400, 'INVALID_PASSWORD')),
      }),
    );
    const result = await backend.account.changePassword({
      currentPassword: 'wrong',
      password: 'new-pass-1',
    });
    expect(result.ok || result.error.fields).toEqual({
      currentPassword: 'incorrect_password',
    });
  });

  it('deletes accounts with the password and guests with the anonymous endpoint', async () => {
    const transport = fakeTransport();
    const { backend } = setup({}, transport);

    await backend.account.deleteAccount({ isGuest: false }, { password: 'pw' });
    await backend.account.deleteAccount({ isGuest: true }, {});

    expect(transport.deleteUser).toHaveBeenCalledWith({ password: 'pw' });
    expect(transport.deleteAnonymousUser).toHaveBeenCalledTimes(1);
    expect(transport.signOut).toHaveBeenCalledTimes(2);
  });

  it('patches the profile through the domain API', async () => {
    const { backend, calls } = setup({
      'PATCH /api/v1/me': (call) =>
        json(200, { ...meDto, ...(call.body as object) }),
    });
    const result = await backend.account.updateProfile({ name: 'Nour' });
    expect(result.ok && result.data.name).toBe('Nour');
    expect(last(calls)).toMatchObject({
      method: 'PATCH',
      body: { name: 'Nour' },
    });
  });

  it('reports rejected sessions from domain routes', async () => {
    const { backend, onSessionRejected } = setup({
      'GET /api/v1/me': () => json(401, { message: 'x', code: 'UNAUTHORIZED' }),
    });
    const result = await backend.account.me();
    expect(result.ok || result.error.code).toBe('UNAUTHENTICATED');
    expect(onSessionRejected).toHaveBeenCalledTimes(1);
  });
});

describe('Fastify adapter: config, health and notes', () => {
  it('reads features and ignores unrelated fields', async () => {
    const { backend } = setup({
      'GET /api/v1/config': () =>
        json(200, {
          apiVersion: 1,
          features: {
            registration: true,
            emailVerification: true,
            socialProviders: ['google'],
            guest: true,
            guestTtlHours: 24,
          },
        }),
    });
    expect(await backend.config.features()).toEqual({
      ok: true,
      data: {
        registration: true,
        emailVerification: true,
        guest: true,
        guestTtlHours: 24,
      },
    });
  });

  it('reports readiness from /readyz', async () => {
    const ready = setup({
      'GET /readyz': () => json(200, { status: 'ok', database: 'ok' }),
    });
    const down = setup({
      'GET /readyz': () => json(503, { message: 'x', code: 'NOT_READY' }),
    });

    expect(await ready.backend.health.check()).toEqual({
      ok: true,
      data: {
        available: true,
        service: null,
        apiVersion: null,
        checkedAt: '2026-10-01T12:00:00.000Z',
      },
    });
    const result = await down.backend.health.check();
    expect(result.ok || result.error.code).toBe('UNAVAILABLE');
  });

  it('maps the note list envelope to the app page', async () => {
    const { backend, calls } = setup({
      'GET /api/v1/notes': () =>
        json(200, {
          list: [noteDto],
          page: 1,
          perPage: 20,
          total: 1,
          totalPages: 1,
          nextPage: null,
          prevPage: null,
        }),
    });

    const result = await backend.notes.list({
      page: 1,
      archived: false,
      search: 'gro',
    });

    expect(result).toEqual({
      ok: true,
      data: {
        items: [noteDto],
        page: 1,
        perPage: 20,
        totalItems: 1,
        totalPages: 1,
      },
    });
    expect(Object.fromEntries(last(calls).query)).toEqual({
      page: '1',
      perPage: '20',
      search: 'gro',
      archived: 'false',
    });
  });

  it('runs note mutations and maps NOTE_NOT_FOUND', async () => {
    const { backend } = setup({
      'POST /api/v1/notes': () => json(201, noteDto),
      'PATCH /api/v1/notes/missing': () =>
        json(404, { message: 'x', code: 'NOTE_NOT_FOUND', requestId: 'r' }),
      'DELETE /api/v1/notes/n1': () => json(204),
    });

    expect(
      (await backend.notes.create({ title: 'Groceries', body: '' })).ok,
    ).toBe(true);
    const missing = await backend.notes.update('missing', { archived: true });
    expect(missing.ok || missing.error.code).toBe('NOT_FOUND');
    expect(await backend.notes.remove('n1')).toEqual({
      ok: true,
      data: undefined,
    });
  });

  it('uses browser cookies instead of a Cookie header on the web', async () => {
    const { backend, calls } = setup({}, fakeTransport(), 'web');
    await backend.account.me();
    expect(last(calls).headers.Cookie).toBeUndefined();
  });

  it('fails fast when no session cookie is stored on native', async () => {
    const { backend, calls } = setup(
      {},
      fakeTransport({ getCookie: vi.fn(async () => '') }),
    );
    const result = await backend.notes.get('n1');
    expect(result.ok || result.error.code).toBe('UNAUTHENTICATED');
    expect(calls).toHaveLength(0);
  });
});

describe('Fastify error mapping', () => {
  it('reduces Zod field messages to field codes', () => {
    expect(
      mapFastifyError(400, {
        message: 'Invalid request data.',
        code: 'VALIDATION_ERROR',
        requestId: 'r',
        fields: {
          title: 'Too small: expected string to have >=1 characters',
          body: 'Too big: expected string to have <=20000 characters',
          email: 'Invalid email address',
          perPage: 'Invalid input: expected number, received undefined',
          newPassword: 'Something else',
        },
      }),
    ).toEqual({
      code: 'INVALID_INPUT',
      status: 400,
      fields: {
        title: 'too_short',
        body: 'too_long',
        email: 'invalid_email',
        perPage: 'required',
        password: 'invalid',
      },
    });
  });

  it.each([
    ['Required', 'required'],
    ['String must contain at least 8 character(s)', 'too_short'],
    ['String must contain at most 100 character(s)', 'too_long'],
    ['Weird', 'invalid'],
  ] as const)('%s -> %s', (message, code) => {
    expect(fieldCodeFromMessage(message)).toBe(code);
  });

  it.each([
    [413, 'PAYLOAD_TOO_LARGE', 'BODY_TOO_LARGE'],
    [500, 'INTERNAL_ERROR', 'UNAVAILABLE'],
    [403, 'GUEST_NOT_ALLOWED', 'GUEST_NOT_ALLOWED'],
    [403, 'EMAIL_NOT_VERIFIED', 'EMAIL_NOT_VERIFIED'],
    [418, 'BRAND_NEW', 'UNKNOWN'],
  ] as const)('maps %i %s to %s', (status, code, expected) => {
    expect(mapFastifyError(status, { message: 'x', code }).code).toBe(expected);
  });

  it('falls back to the status for bodies without a code', () => {
    expect(mapFastifyError(502, '<html>')).toEqual({
      code: 'INVALID_RESPONSE',
      status: 502,
    });
  });
});
