import type { AppError, AppErrorCode, FieldErrorCode } from '@/models/errors';

export type ErrorMessageKey = `errors.${AppErrorCode}`;
export type FieldErrorMessageKey = `fieldErrors.${FieldErrorCode}`;

export function errorMessageKey(
  error: Pick<AppError, 'code'>,
): ErrorMessageKey {
  return `errors.${error.code}`;
}

export function fieldErrorMessageKey(
  code: FieldErrorCode,
): FieldErrorMessageKey {
  return `fieldErrors.${code}`;
}
