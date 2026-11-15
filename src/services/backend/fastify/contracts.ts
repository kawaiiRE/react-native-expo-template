import { z } from 'zod';

import { SUPPORTED_LANGUAGES } from '@/i18n/languages';
import { DEFAULT_GUEST_TTL_HOURS } from '@/models/auth';

/**
 * Raw DTOs of the Fastify backend. Source of truth: fastify-backend-template
 * `docs/integration.md` and `openapi/openapi.json`. Better Auth endpoints live
 * under `/api/auth/*` and are called through the Better Auth client.
 */
export const FASTIFY_API_VERSION = 1;

export const fastifyPaths = {
  ready: '/readyz',
  config: '/api/v1/config',
  me: '/api/v1/me',
  notes: '/api/v1/notes',
  note: (id: string) => `/api/v1/notes/${encodeURIComponent(id)}`,
} as const;

export const FASTIFY_AUTH_BASE_PATH = '/api/auth';

const isoDateTime = z.iso.datetime({ offset: true });

export const fastifyMeSchema = z.object({
  id: z.string().min(1),
  email: z.string().min(1),
  name: z.string(),
  emailVerified: z.boolean(),
  locale: z.enum(SUPPORTED_LANGUAGES).nullable(),
  isGuest: z.boolean().default(false),
  createdAt: isoDateTime,
});

export const fastifyConfigSchema = z.object({
  apiVersion: z.literal(FASTIFY_API_VERSION),
  features: z.object({
    registration: z.boolean(),
    emailVerification: z.boolean(),
    guest: z.boolean().default(false),
    guestTtlHours: z.number().positive().default(DEFAULT_GUEST_TTL_HOURS),
  }),
});

export const fastifyReadySchema = z.object({
  status: z.literal('ok'),
  database: z.literal('ok'),
});

export const fastifyNoteSchema = z.object({
  id: z.string().min(1),
  title: z.string(),
  body: z.string(),
  archived: z.boolean(),
  createdAt: isoDateTime,
  updatedAt: isoDateTime,
});

export const fastifyNoteListSchema = z.object({
  list: z.array(fastifyNoteSchema),
  page: z.number().int().min(1),
  perPage: z.number().int().min(1),
  total: z.number().int().min(0),
  totalPages: z.number().int().min(0),
});

/** Domain errors (`{ message, code, requestId, fields? }`) and Better Auth errors (`{ message, code }`). */
export const fastifyErrorBodySchema = z.object({
  message: z.string().optional(),
  code: z.string().optional(),
  fields: z.record(z.string(), z.string()).optional(),
});

/** `POST /api/auth/sign-up/email`: `token` is `null` when verification is required. */
export const fastifySignUpSchema = z.object({
  token: z.string().nullable(),
});

/** `GET /api/auth/get-session`: `null` when signed out. */
export const fastifyGetSessionSchema = z
  .object({ session: z.object({ id: z.string() }) })
  .nullable();

export type FastifyMe = z.infer<typeof fastifyMeSchema>;
export type FastifyNote = z.infer<typeof fastifyNoteSchema>;
