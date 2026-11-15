/** Stable error codes the UI understands, independent of the active backend. */
export const SERVER_ERROR_CODES = [
  'INVALID_INPUT',
  'UNAUTHENTICATED',
  'INVALID_CREDENTIALS',
  'FORBIDDEN_ORIGIN',
  'REGISTRATION_DISABLED',
  'EMAIL_NOT_VERIFIED',
  'NOT_FOUND',
  'EMAIL_TAKEN',
  'BODY_TOO_LARGE',
  'UNSUPPORTED_MEDIA_TYPE',
  'RATE_LIMITED',
  'INVALID_RESPONSE',
  'UPSTREAM_UNAVAILABLE',
  'UNAVAILABLE',
  'GUEST_DISABLED',
  'NOT_GUEST',
  'GUEST_NOT_ALLOWED',
] as const;

export const CLIENT_ERROR_CODES = [
  'NETWORK_ERROR',
  'TIMEOUT',
  'ABORTED',
  'UNKNOWN',
] as const;

export type ServerErrorCode = (typeof SERVER_ERROR_CODES)[number];
export type ClientErrorCode = (typeof CLIENT_ERROR_CODES)[number];
export type AppErrorCode = ServerErrorCode | ClientErrorCode;

export const ALL_ERROR_CODES: readonly AppErrorCode[] = [
  ...SERVER_ERROR_CODES,
  ...CLIENT_ERROR_CODES,
];

export function isServerErrorCode(value: unknown): value is ServerErrorCode {
  return (
    typeof value === 'string' &&
    (SERVER_ERROR_CODES as readonly string[]).includes(value)
  );
}

/** Field-level validation codes. The UI translates them; backends never send display text here. */
export const FIELD_ERROR_CODES = [
  'required',
  'invalid',
  'invalid_email',
  'too_short',
  'too_long',
  'taken',
  'invalid_token',
  'incorrect_password',
] as const;

export type FieldErrorCode = (typeof FIELD_ERROR_CODES)[number];
export type FieldErrors = Partial<Record<string, FieldErrorCode>>;

export function isFieldErrorCode(value: unknown): value is FieldErrorCode {
  return (
    typeof value === 'string' &&
    (FIELD_ERROR_CODES as readonly string[]).includes(value)
  );
}

export type AppError = {
  code: AppErrorCode;
  status: number | null;
  fields?: FieldErrors;
};

export type AppResult<T> =
  { ok: true; data: T } | { ok: false; error: AppError };

export function success<T>(data: T): { ok: true; data: T } {
  return { ok: true, data };
}

export function failure(
  code: AppErrorCode,
  status: number | null = null,
  fields?: FieldErrors,
): { ok: false; error: AppError } {
  const hasFields = fields !== undefined && Object.keys(fields).length > 0;
  return {
    ok: false,
    error: hasFields ? { code, status, fields } : { code, status },
  };
}

/** Maps an HTTP status to the closest app code when the body carries no known code. */
export function codeFromStatus(status: number): AppErrorCode {
  if (status === 400 || status === 409 || status === 422) {
    return 'INVALID_INPUT';
  }
  if (status === 401) return 'UNAUTHENTICATED';
  if (status === 404) return 'NOT_FOUND';
  if (status === 413) return 'BODY_TOO_LARGE';
  if (status === 415) return 'UNSUPPORTED_MEDIA_TYPE';
  if (status === 429) return 'RATE_LIMITED';
  if (status === 502) return 'INVALID_RESPONSE';
  if (status >= 500) return 'UNAVAILABLE';
  return 'UNKNOWN';
}
