import { z } from 'zod';

import { BACKEND_KINDS, type BackendKind } from '@/services/backend/ports';

export type BackendConfig = { backend: BackendKind; apiBaseUrl: string };

export type BackendConfigIssue = 'backend' | 'apiBaseUrl';

export type BackendConfigResult =
  | { ok: true; config: BackendConfig }
  | { ok: false; issues: BackendConfigIssue[] };

const originSchema = z
  .string()
  .trim()
  .transform((value) => value.replace(/\/+$/, ''))
  .refine((value) => {
    try {
      const url = new URL(value);
      return (
        (url.protocol === 'http:' || url.protocol === 'https:') &&
        url.pathname === '/' &&
        !url.search &&
        !url.hash
      );
    } catch {
      return false;
    }
  });

/**
 * Validates the public build-time configuration. `EXPO_PUBLIC_BACKEND` picks
 * the adapter; `EXPO_PUBLIC_API_BASE_URL` is that backend's public origin.
 */
export function parseBackendConfig(source: {
  backend: string | undefined;
  apiBaseUrl: string | undefined;
}): BackendConfigResult {
  const backend = z.enum(BACKEND_KINDS).safeParse(source.backend?.trim());
  const apiBaseUrl = originSchema.safeParse(source.apiBaseUrl ?? '');

  if (backend.success && apiBaseUrl.success) {
    return {
      ok: true,
      config: { backend: backend.data, apiBaseUrl: apiBaseUrl.data },
    };
  }

  const issues: BackendConfigIssue[] = [];
  if (!backend.success) issues.push('backend');
  if (!apiBaseUrl.success) issues.push('apiBaseUrl');
  return { ok: false, issues };
}
