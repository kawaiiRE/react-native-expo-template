import { z } from 'zod';

import { SUPPORTED_LANGUAGES } from '@/i18n/languages';
import { DEFAULT_GUEST_TTL_HOURS } from '@/models/auth';
import { isFieldErrorCode, type FieldErrorCode } from '@/models/errors';

/**
 * Raw DTOs of the Next.js gateway `/api/v1` contract consumed by native
 * clients (bearer tokens, no cookies). Source of truth:
 * next-frontend-template `src/contracts/**` and `src/app/api/v1/**`.
 */
export const NEXT_API_VERSION = 1;

export const nextPaths = {
  health: '/api/v1/health',
  config: '/api/v1/config',
  token: '/api/v1/auth/token',
  tokenRegister: '/api/v1/auth/token/register',
  tokenRefresh: '/api/v1/auth/token/refresh',
  tokenGuest: '/api/v1/auth/token/guest',
  tokenGuestUpgrade: '/api/v1/auth/token/guest/upgrade',
  passwordReset: '/api/v1/auth/password-reset',
  passwordResetConfirm: '/api/v1/auth/password-reset/confirm',
  verifyEmail: '/api/v1/auth/verify-email',
  verifyEmailRequest: '/api/v1/auth/verify-email/request',
  me: '/api/v1/me',
  mePassword: '/api/v1/me/password',
  notes: '/api/v1/notes',
  note: (id: string) => `/api/v1/notes/${encodeURIComponent(id)}`,
} as const;

const isoDateTime = z.iso.datetime({ offset: true });

export const nextUserSchema = z.object({
  id: z.string().min(1),
  email: z.string().min(1),
  name: z.string(),
  verified: z.boolean(),
  locale: z.enum(SUPPORTED_LANGUAGES).nullable(),
  isGuest: z.boolean().default(false),
  createdAt: isoDateTime,
});

export const nextUserEnvelopeSchema = z.object({ user: nextUserSchema });

export const nextSessionSchema = z.object({
  token: z.string().min(1),
  expiresAt: isoDateTime,
  user: nextUserSchema,
});

/** Also the guest upgrade response: `200 authenticated` or `202 verification_required`. */
export const nextRegisterResponseSchema = z.discriminatedUnion('status', [
  z.object({ status: z.literal('authenticated'), session: nextSessionSchema }),
  z.object({
    status: z.literal('verification_required'),
    user: nextUserSchema,
  }),
]);

export const nextConfigSchema = z.object({
  apiVersion: z.literal(NEXT_API_VERSION),
  features: z.object({
    registration: z.boolean(),
    emailVerification: z.boolean(),
    guest: z.boolean().default(false),
    guestTtlHours: z.number().positive().default(DEFAULT_GUEST_TTL_HOURS),
  }),
});

export const nextHealthSchema = z.object({
  available: z.boolean(),
  apiVersion: z.literal(NEXT_API_VERSION),
  service: z.string().min(1),
  checkedAt: z.string().min(1),
});

export const nextNoteSchema = z.object({
  id: z.string().min(1),
  title: z.string(),
  body: z.string(),
  archived: z.boolean(),
  createdAt: isoDateTime,
  updatedAt: isoDateTime,
});

export const nextNotesPageSchema = z.object({
  items: z.array(nextNoteSchema),
  page: z.number().int().min(1),
  perPage: z.number().int().min(1),
  totalItems: z.number().int().min(0),
  totalPages: z.number().int().min(0),
});

export const nextErrorBodySchema = z.object({
  message: z.string(),
  code: z.string().min(1),
  fields: z
    .record(
      z.string(),
      z
        .string()
        .transform((value): FieldErrorCode =>
          isFieldErrorCode(value) ? value : 'invalid',
        ),
    )
    .optional(),
});

export type NextUser = z.infer<typeof nextUserSchema>;
export type NextSession = z.infer<typeof nextSessionSchema>;
