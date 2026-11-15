import type { FieldValues, Path, UseFormSetError } from 'react-hook-form';

import type { AppError } from '@/models/errors';
import { fieldErrorMessageKey } from '@/presenters/errors';

/**
 * Copies backend field errors onto known form fields as translation keys.
 * Returns `true` when at least one field received an error, so callers can
 * skip a form-level banner.
 */
export function applyServerFieldErrors<T extends FieldValues>(
  error: AppError,
  setError: UseFormSetError<T>,
  fields: readonly Path<T>[],
): boolean {
  let applied = false;

  for (const field of fields) {
    const code = error.fields?.[field];

    if (code) {
      setError(field, { type: 'server', message: fieldErrorMessageKey(code) });
      applied = true;
    }
  }

  return applied;
}
