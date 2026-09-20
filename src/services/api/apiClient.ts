import { appConfig } from '@/constants/app';

export const API_BASE_URL = appConfig.apiBaseUrl;
const REQUEST_TIMEOUT_MS = 10_000;

export type ApiError = {
  code: string;
  message: string;
};

export type ApiResult<T> =
  | { success: true; data: T; status: number }
  | { success: false; error: ApiError; status: number | null };

function failure(
  message: string,
  code: string,
  status: number | null,
): ApiResult<never> {
  return { success: false, error: { code, message }, status };
}

function buildUrl(path: string) {
  if (!API_BASE_URL) {
    return null;
  }

  try {
    const url = new URL(path, `${API_BASE_URL}/`);
    return url.protocol === 'http:' || url.protocol === 'https:' ? url : null;
  } catch {
    return null;
  }
}

export async function request<T>(
  path: string,
  parse: (value: unknown) => T,
): Promise<ApiResult<T>> {
  const url = buildUrl(path);

  if (!url) {
    return failure(
      'Set EXPO_PUBLIC_API_BASE_URL to the Next.js app origin.',
      'API_NOT_CONFIGURED',
      null,
    );
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });

    if (!response.ok) {
      return failure(
        'The application gateway is unavailable.',
        'HTTP_ERROR',
        response.status,
      );
    }

    try {
      return {
        success: true,
        data: parse(await response.json()),
        status: response.status,
      };
    } catch {
      return failure(
        'The gateway returned an incompatible response.',
        'INVALID_RESPONSE',
        response.status,
      );
    }
  } catch {
    return failure(
      'The application gateway could not be reached.',
      'NETWORK_ERROR',
      null,
    );
  } finally {
    clearTimeout(timeout);
  }
}
