import {
  codeFromStatus,
  isServerErrorCode,
  type AppError,
  type AppErrorCode,
  type FieldErrorCode,
  type FieldErrors,
} from '@/models/errors';

import { fastifyErrorBodySchema } from './contracts';

type MappedCode = { code: AppErrorCode; fields?: FieldErrors };

/** Fastify domain codes and Better Auth codes mapped to the app vocabulary. */
const CODE_MAP: Record<string, MappedCode> = {
  VALIDATION_ERROR: { code: 'INVALID_INPUT' },
  BAD_REQUEST: { code: 'INVALID_INPUT' },
  UNAUTHORIZED: { code: 'UNAUTHENTICATED' },
  NOTE_NOT_FOUND: { code: 'NOT_FOUND' },
  PAYLOAD_TOO_LARGE: { code: 'BODY_TOO_LARGE' },
  INTERNAL_ERROR: { code: 'UNAVAILABLE' },
  NOT_READY: { code: 'UNAVAILABLE' },
  INVALID_EMAIL_OR_PASSWORD: { code: 'INVALID_CREDENTIALS' },
  INVALID_ORIGIN: { code: 'FORBIDDEN_ORIGIN' },
  MISSING_OR_NULL_ORIGIN: { code: 'FORBIDDEN_ORIGIN' },
  INVALID_CALLBACKURL: { code: 'FORBIDDEN_ORIGIN' },
  EMAIL_PASSWORD_SIGN_UP_DISABLED: { code: 'REGISTRATION_DISABLED' },
  USER_ALREADY_EXISTS: { code: 'EMAIL_TAKEN', fields: { email: 'taken' } },
  USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL: {
    code: 'EMAIL_TAKEN',
    fields: { email: 'taken' },
  },
  INVALID_EMAIL: { code: 'INVALID_INPUT', fields: { email: 'invalid_email' } },
  INVALID_TOKEN: { code: 'INVALID_INPUT', fields: { token: 'invalid_token' } },
  TOKEN_EXPIRED: { code: 'INVALID_INPUT', fields: { token: 'invalid_token' } },
  PASSWORD_TOO_SHORT: {
    code: 'INVALID_INPUT',
    fields: { password: 'too_short' },
  },
  PASSWORD_TOO_LONG: {
    code: 'INVALID_INPUT',
    fields: { password: 'too_long' },
  },
  INVALID_PASSWORD: {
    code: 'INVALID_INPUT',
    fields: { currentPassword: 'incorrect_password' },
  },
  SESSION_EXPIRED: {
    code: 'INVALID_INPUT',
    fields: { currentPassword: 'required' },
  },
  USER_IS_NOT_ANONYMOUS: { code: 'NOT_GUEST' },
};

/** Better Auth field names that differ from the app's form fields. */
const FIELD_ALIASES: Record<string, string> = {
  newPassword: 'password',
};

/** Fastify returns human-readable Zod messages per field; reduce them to codes. */
export function fieldCodeFromMessage(message: string): FieldErrorCode {
  const text = message.toLowerCase();
  if (text.includes('email')) return 'invalid_email';
  if (text.includes('required') || text.includes('received undefined')) {
    return 'required';
  }
  if (text.includes('too small') || text.includes('at least')) {
    return 'too_short';
  }
  if (text.includes('too big') || text.includes('at most')) return 'too_long';
  return 'invalid';
}

function toFieldErrors(fields: Record<string, string> | undefined) {
  const result: FieldErrors = {};
  for (const [key, message] of Object.entries(fields ?? {})) {
    result[FIELD_ALIASES[key] ?? key] = fieldCodeFromMessage(message);
  }
  return result;
}

function build(status: number, mapped: MappedCode): AppError {
  return mapped.fields && Object.keys(mapped.fields).length > 0
    ? { code: mapped.code, status, fields: mapped.fields }
    : { code: mapped.code, status };
}

export function mapFastifyError(status: number, body: unknown): AppError {
  const parsed = fastifyErrorBodySchema.safeParse(body);
  const raw = parsed.success ? parsed.data.code : undefined;
  const known = raw ? CODE_MAP[raw] : undefined;
  const fields = parsed.success ? toFieldErrors(parsed.data.fields) : {};

  if (known) {
    return build(status, {
      code: known.code,
      fields: { ...known.fields, ...fields },
    });
  }

  return build(status, {
    code: isServerErrorCode(raw) ? raw : codeFromStatus(status),
    fields,
  });
}

/** Errors surfaced by the Better Auth client (`{ status, code?, message? }`). */
export type BetterAuthError = {
  status: number;
  code?: string;
  message?: string;
};

export function mapBetterAuthError(error: BetterAuthError): AppError {
  // Transport failures (offline, DNS, timeouts) carry status 0.
  if (!error.status) {
    return {
      code: error.code === 'TIMEOUT' ? 'TIMEOUT' : 'NETWORK_ERROR',
      status: null,
    };
  }
  return mapFastifyError(error.status, {
    code: error.code,
    message: error.message,
  });
}
