import {
  codeFromStatus,
  isServerErrorCode,
  type AppError,
} from '@/models/errors';

import { nextErrorBodySchema } from './contracts';

/**
 * The gateway already speaks the app's code vocabulary (`{ message, code,
 * fields? }` with field codes), so mapping only guards against unknown codes.
 */
export function mapNextError(status: number, body: unknown): AppError {
  const parsed = nextErrorBodySchema.safeParse(body);

  if (!parsed.success) return { code: codeFromStatus(status), status };

  const code = isServerErrorCode(parsed.data.code)
    ? parsed.data.code
    : codeFromStatus(status);
  const fields = parsed.data.fields;

  return fields && Object.keys(fields).length > 0
    ? { code, status, fields }
    : { code, status };
}
