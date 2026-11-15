/**
 * Live contract check against the backend selected by EXPO_PUBLIC_BACKEND,
 * speaking the same protocol as the app:
 *
 * - `next`: the Next.js gateway's native routes (`/api/v1/auth/token*`) with
 *   bearer tokens and no Origin header.
 * - `fastify`: Better Auth (`/api/auth/*`) with the session cookie stored by
 *   the client and the `expo-origin` header sent by `@better-auth/expo`.
 *
 * Covers config, health, sign-in (INTEGRATION_EMAIL / INTEGRATION_PASSWORD, or a
 * throwaway account when registration is open), profile, notes CRUD with
 * search, archive and pagination, and guest sessions when the backend enables
 * them. Throwaway accounts are deleted afterwards.
 *
 * Skips (exit 0) when the backend is unreachable unless INTEGRATION_REQUIRED=1.
 */
import { randomBytes } from 'node:crypto';

import { z } from 'zod';

const TIMEOUT_MS = 10_000;

const backend = process.env.EXPO_PUBLIC_BACKEND?.trim();
const origin = process.env.EXPO_PUBLIC_API_BASE_URL?.trim().replace(/\/+$/, '');
const scheme =
  process.env.APP_SCHEME?.trim() ||
  process.env.APP_SLUG?.trim() ||
  'expo-starter';
const required = process.env.INTEGRATION_REQUIRED === '1';

if (backend !== 'next' && backend !== 'fastify') {
  throw new Error('Set EXPO_PUBLIC_BACKEND to "next" or "fastify".');
}
if (!origin) {
  throw new Error('Set EXPO_PUBLIC_API_BASE_URL to the backend origin.');
}

const isoDate = z.iso.datetime({ offset: true });
const featuresSchema = z.object({
  apiVersion: z.literal(1),
  features: z.object({
    registration: z.boolean(),
    emailVerification: z.boolean(),
    guest: z.boolean().default(false),
    guestTtlHours: z.number().positive().default(24),
  }),
});
const noteSchema = z.object({
  id: z.string().min(1),
  title: z.string(),
  body: z.string(),
  archived: z.boolean(),
  createdAt: isoDate,
  updatedAt: isoDate,
});
const nextUserSchema = z.object({
  id: z.string().min(1),
  email: z.string().min(1),
  name: z.string(),
  verified: z.boolean(),
  isGuest: z.boolean().default(false),
  locale: z.enum(['en', 'ar']).nullable(),
  createdAt: isoDate,
});
const nextSessionSchema = z.object({
  token: z.string().min(1),
  expiresAt: isoDate,
  user: nextUserSchema,
});
const nextRegisterSchema = z.discriminatedUnion('status', [
  z.object({ status: z.literal('authenticated'), session: nextSessionSchema }),
  z.object({
    status: z.literal('verification_required'),
    user: nextUserSchema,
  }),
]);
const nextPageSchema = z.object({
  items: z.array(noteSchema),
  page: z.number().int().min(1),
  perPage: z.number().int().min(1),
  totalItems: z.number().int().min(0),
  totalPages: z.number().int().min(0),
});
const fastifyMeSchema = z.object({
  id: z.string().min(1),
  email: z.string().min(1),
  name: z.string(),
  emailVerified: z.boolean(),
  isGuest: z.boolean().default(false),
  locale: z.enum(['en', 'ar']).nullable(),
  createdAt: isoDate,
});
const fastifyListSchema = z.object({
  list: z.array(noteSchema),
  page: z.number().int().min(1),
  perPage: z.number().int().min(1),
  total: z.number().int().min(0),
  totalPages: z.number().int().min(0),
});
const errorSchema = z.object({
  message: z.string().optional(),
  code: z.string().optional(),
});

type Method = 'GET' | 'POST' | 'PATCH' | 'DELETE';
type CallOptions = { method?: Method; body?: unknown; expect: number };

class BackendUnreachable extends Error {}

function step(label: string) {
  console.log(`✓ ${label}`);
}

/** One signed-in device: bearer token (next) or cookie jar (fastify). */
class Client {
  token: string | null = null;
  private readonly cookies = new Map<string, string>();

  async call<T>(
    path: string,
    schema: z.ZodType<T> | null,
    options: CallOptions,
  ): Promise<T> {
    const headers: Record<string, string> = { Accept: 'application/json' };
    if (options.body !== undefined)
      headers['Content-Type'] = 'application/json';
    if (this.token) headers.Authorization = `Bearer ${this.token}`;
    if (backend === 'fastify') {
      headers['expo-origin'] = `${scheme}://`;
      const cookie = [...this.cookies]
        .map(([name, value]) => `${name}=${value}`)
        .join('; ');
      if (cookie) headers.Cookie = cookie;
    }

    let response: Response;
    try {
      response = await fetch(`${origin}${path}`, {
        method: options.method ?? 'GET',
        headers,
        body:
          options.body === undefined ? undefined : JSON.stringify(options.body),
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
    } catch (error) {
      throw new BackendUnreachable(
        `Cannot reach ${origin}: ${(error as Error).message}`,
      );
    }

    for (const raw of response.headers.getSetCookie()) {
      const [pair = '', ...attributes] = raw.split(';');
      const index = pair.indexOf('=');
      const name = pair.slice(0, index).trim();
      const value = pair.slice(index + 1).trim();
      const expired = attributes.some((attribute) =>
        /^\s*max-age=0\s*$/i.test(attribute),
      );
      if (!value || expired) this.cookies.delete(name);
      else this.cookies.set(name, value);
    }

    const text = await response.text();
    const json: unknown = text ? JSON.parse(text) : null;

    if (response.status !== options.expect) {
      const parsed = errorSchema.safeParse(json);
      const detail = parsed.success
        ? `${parsed.data.code}: ${parsed.data.message}`
        : text.slice(0, 200);
      throw new Error(
        `${options.method ?? 'GET'} ${path} returned ${response.status} (expected ${options.expect}). ${detail}`,
      );
    }

    return schema ? schema.parse(json) : (undefined as T);
  }
}

type Account = { email: string; password: string; temporary: boolean };

function throwawayAccount(): Account {
  return {
    email: `mobile-check-${randomBytes(6).toString('hex')}@example.com`,
    password: `Check-${randomBytes(12).toString('base64url')}`,
    temporary: true,
  };
}

/** Backend-specific auth operations; notes and profile checks are shared. */
const protocol = {
  next: {
    async health(client: Client) {
      const health = await client.call(
        '/api/v1/health',
        z.object({
          available: z.boolean(),
          service: z.string(),
          apiVersion: z.literal(1),
        }),
        { expect: 200 },
      );
      if (!health.available)
        throw new Error('The gateway reports its backend as unavailable.');
      step(`GET /api/v1/health (${health.service})`);
    },
    async signIn(client: Client, account: Account) {
      const session = await client.call(
        '/api/v1/auth/token',
        nextSessionSchema,
        {
          method: 'POST',
          body: { email: account.email, password: account.password },
          expect: 200,
        },
      );
      client.token = session.token;
      step('POST /api/v1/auth/token');
    },
    async register(client: Client, account: Account) {
      const result = await client.call(
        '/api/v1/auth/token/register',
        nextRegisterSchema,
        {
          method: 'POST',
          body: {
            name: 'Mobile Integration Check',
            email: account.email,
            password: account.password,
          },
          expect: 201,
        },
      );
      if (result.status === 'verification_required') return false;
      client.token = result.session.token;
      step('POST /api/v1/auth/token/register -> authenticated');
      return true;
    },
    async refresh(client: Client) {
      const session = await client.call(
        '/api/v1/auth/token/refresh',
        nextSessionSchema,
        {
          method: 'POST',
          expect: 200,
        },
      );
      client.token = session.token;
      step('POST /api/v1/auth/token/refresh');
    },
    async me(client: Client) {
      const { user } = await client.call(
        '/api/v1/me',
        z.object({ user: nextUserSchema }),
        { expect: 200 },
      );
      return user.isGuest;
    },
    async startGuest(client: Client) {
      const session = await client.call(
        '/api/v1/auth/token/guest',
        nextSessionSchema,
        {
          method: 'POST',
          body: { locale: 'en' },
          expect: 200,
        },
      );
      client.token = session.token;
      step('POST /api/v1/auth/token/guest');
    },
    async upgradeGuest(client: Client, account: Account) {
      const response = await fetch(
        `${origin}/api/v1/auth/token/guest/upgrade`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${client.token}`,
          },
          body: JSON.stringify({
            name: 'Upgraded Guest',
            email: account.email,
            password: account.password,
          }),
          signal: AbortSignal.timeout(TIMEOUT_MS),
        },
      );
      const result = nextRegisterSchema.parse(await response.json());
      if (result.status === 'verification_required') {
        client.token = null;
        return false;
      }
      client.token = result.session.token;
      step('POST /api/v1/auth/token/guest/upgrade -> authenticated');
      return true;
    },
    async deleteAccount(client: Client) {
      await client.call('/api/v1/me', null, { method: 'DELETE', expect: 204 });
      client.token = null;
    },
    listNotes: (client: Client, query: string) =>
      client
        .call(`/api/v1/notes?${query}`, nextPageSchema, { expect: 200 })
        .then((page) => ({ items: page.items, total: page.totalItems })),
  },
  fastify: {
    async health(client: Client) {
      await client.call(
        '/readyz',
        z.object({ status: z.literal('ok'), database: z.literal('ok') }),
        {
          expect: 200,
        },
      );
      step('GET /readyz');
    },
    async signIn(client: Client, account: Account) {
      await client.call('/api/auth/sign-in/email', null, {
        method: 'POST',
        body: { email: account.email, password: account.password },
        expect: 200,
      });
      await client.call(
        '/api/auth/get-session',
        z.object({ session: z.object({ id: z.string() }) }),
        {
          expect: 200,
        },
      );
      step('POST /api/auth/sign-in/email + GET /api/auth/get-session');
    },
    async register(client: Client, account: Account) {
      const result = await client.call(
        '/api/auth/sign-up/email',
        z.object({ token: z.string().nullable() }),
        {
          method: 'POST',
          body: {
            name: 'Mobile Integration Check',
            email: account.email,
            password: account.password,
          },
          expect: 200,
        },
      );
      if (result.token === null) return false;
      step('POST /api/auth/sign-up/email -> session');
      return true;
    },
    async refresh(client: Client) {
      await client.call(
        '/api/auth/get-session',
        z.object({ session: z.object({ id: z.string() }) }),
        {
          expect: 200,
        },
      );
      step('GET /api/auth/get-session');
    },
    async me(client: Client) {
      const me = await client.call('/api/v1/me', fastifyMeSchema, {
        expect: 200,
      });
      return me.isGuest;
    },
    async startGuest(client: Client) {
      await client.call('/api/auth/sign-in/anonymous', null, {
        method: 'POST',
        expect: 200,
      });
      step('POST /api/auth/sign-in/anonymous');
    },
    async upgradeGuest(client: Client, account: Account) {
      const result = await client.call(
        '/api/auth/sign-up/email',
        z.object({ token: z.string().nullable() }),
        {
          method: 'POST',
          body: {
            name: 'Upgraded Guest',
            email: account.email,
            password: account.password,
          },
          expect: 200,
        },
      );
      if (result.token === null) return false;
      step('POST /api/auth/sign-up/email with the guest cookie -> upgraded');
      return true;
    },
    async deleteAccount(client: Client, account: Account) {
      await client.call('/api/auth/delete-user', null, {
        method: 'POST',
        body: { password: account.password },
        expect: 200,
      });
    },
    listNotes: (client: Client, query: string) =>
      client
        .call(`/api/v1/notes?${query}`, fastifyListSchema, { expect: 200 })
        .then((page) => ({ items: page.list, total: page.total })),
  },
}[backend];

async function checkNotes(client: Client) {
  const created = await client.call('/api/v1/notes', noteSchema, {
    method: 'POST',
    body: {
      title: 'Integration check',
      body: 'Created by the mobile template.',
    },
    expect: 201,
  });
  step('POST /api/v1/notes');

  try {
    const page = await protocol.listNotes(
      client,
      `page=1&perPage=5&archived=false&search=${encodeURIComponent('Integration check')}`,
    );
    if (!page.items.some((note) => note.id === created.id)) {
      throw new Error('The created note is missing from the filtered list.');
    }
    step('GET /api/v1/notes (search + pagination)');

    await client.call(`/api/v1/notes/${created.id}`, noteSchema, {
      expect: 200,
    });
    const archived = await client.call(
      `/api/v1/notes/${created.id}`,
      noteSchema,
      {
        method: 'PATCH',
        body: { archived: true },
        expect: 200,
      },
    );
    if (!archived.archived) throw new Error('PATCH did not archive the note.');
    const archivedPage = await protocol.listNotes(
      client,
      'page=1&archived=true',
    );
    if (!archivedPage.items.some((note) => note.id === created.id)) {
      throw new Error('The archived note is missing from the archived filter.');
    }
    step('GET + PATCH /api/v1/notes/:id (archive filter)');
  } finally {
    await client.call(`/api/v1/notes/${created.id}`, null, {
      method: 'DELETE',
      expect: 204,
    });
    step('DELETE /api/v1/notes/:id');
  }

  await client.call(`/api/v1/notes/${created.id}`, null, { expect: 404 });
  step('GET /api/v1/notes/:id after delete -> 404');
}

async function checkGuest(registrationEnabled: boolean) {
  const client = new Client();
  await protocol.startGuest(client);
  if (!(await protocol.me(client)))
    throw new Error('Guest profile is missing isGuest: true.');
  step('GET /api/v1/me reports isGuest');

  const note = await client.call('/api/v1/notes', noteSchema, {
    method: 'POST',
    body: { title: 'Guest note', body: '' },
    expect: 201,
  });
  if (!registrationEnabled) return;

  const account = throwawayAccount();
  if (!(await protocol.upgradeGuest(client, account))) {
    console.log(
      '↷ Guest upgrade awaits email verification; data transfer not checked.',
    );
    return;
  }
  if (await protocol.me(client))
    throw new Error('Upgraded profile still reports isGuest.');
  await client.call(`/api/v1/notes/${note.id}`, noteSchema, { expect: 200 });
  step('Guest notes kept after the upgrade');
  await protocol.deleteAccount(client, account);
  step('Upgraded throwaway account deleted');
}

async function run() {
  const anonymous = new Client();
  const config = await anonymous.call('/api/v1/config', featuresSchema, {
    expect: 200,
  });
  const { features } = config;
  step(
    `GET /api/v1/config (registration=${features.registration}, emailVerification=${features.emailVerification}, guest=${features.guest})`,
  );
  await protocol.health(anonymous);

  await anonymous.call('/api/v1/notes', null, { expect: 401 });
  step('GET /api/v1/notes without a session -> 401');

  const client = new Client();
  const email = process.env.INTEGRATION_EMAIL?.trim();
  const password = process.env.INTEGRATION_PASSWORD;
  let account: Account | null =
    email && password ? { email, password, temporary: false } : null;

  if (account) {
    await protocol.signIn(client, account);
  } else if (features.registration) {
    const candidate = throwawayAccount();
    if (await protocol.register(client, candidate)) account = candidate;
    else console.log('↷ Registration requires email verification.');
  }

  if (account) {
    await protocol.refresh(client);
    await protocol.me(client);
    step('GET /api/v1/me');
    await checkNotes(client);
    if (account.temporary) {
      await protocol.deleteAccount(client, account);
      step('Throwaway account deleted');
    }
  } else {
    console.log(
      '↷ Account checks skipped: set INTEGRATION_EMAIL and INTEGRATION_PASSWORD for a verified account.',
    );
  }

  if (features.guest) await checkGuest(features.registration);
  else console.log('↷ Guest checks skipped: guest sessions are disabled.');
}

try {
  await run();
  console.log(`Integration healthy: mobile (${backend}) -> ${origin}.`);
} catch (error) {
  if (error instanceof BackendUnreachable && !required) {
    console.log(
      `↷ Skipped: ${error.message}. Start the backend or set INTEGRATION_REQUIRED=1 to fail.`,
    );
  } else {
    throw error;
  }
}
