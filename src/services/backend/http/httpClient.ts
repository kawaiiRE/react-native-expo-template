import type { z } from 'zod';

import {
  failure,
  success,
  type AppError,
  type AppResult,
} from '@/models/errors';

const DEFAULT_TIMEOUT_MS = 15_000;

export type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'DELETE';
export type QueryValue = string | number | boolean | null | undefined;

export type HttpRequest<T> = {
  method?: HttpMethod;
  path: string;
  query?: Record<string, QueryValue>;
  body?: unknown;
  /** Response schema. Omit for endpoints that answer with an empty body. */
  schema?: z.ZodType<T>;
  /** Attach the session credential; fails fast when none is available. */
  authenticated?: boolean;
  headers?: Record<string, string>;
  signal?: AbortSignal;
  timeoutMs?: number;
};

/** Supplies request headers for the current session, or `null` when signed out. */
export interface SessionCredentials {
  headers(): Promise<Record<string, string> | null>;
}

/** Translates a backend error response into the shared app error. */
export type ErrorMapper = (status: number, body: unknown) => AppError;

export type FetchLike = (url: string, init: RequestInit) => Promise<Response>;

export type HttpClientOptions = {
  baseUrl: string;
  mapError: ErrorMapper;
  credentials?: SessionCredentials;
  /** Called when an authenticated request answers `UNAUTHENTICATED`. */
  onUnauthorized?: () => void;
  /** Send browser cookies (cookie sessions on the web build). */
  includeCookies?: boolean;
  fetchImpl?: FetchLike;
  timeoutMs?: number;
};

export function buildQuery(query: Record<string, QueryValue> | undefined) {
  if (!query) return '';

  const params = Object.entries(query)
    .filter(
      ([, value]) => value !== undefined && value !== null && value !== '',
    )
    .map(
      ([key, value]) =>
        `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`,
    );

  return params.length ? `?${params.join('&')}` : '';
}

async function readJson(response: Response): Promise<unknown> {
  const text = await response.text();
  return text ? (JSON.parse(text) as unknown) : null;
}

/** JSON-over-HTTP transport with timeouts, cancellation and response validation. */
export class HttpClient {
  private readonly baseUrl: string;
  private readonly fetchImpl: FetchLike;
  private readonly timeoutMs: number;

  constructor(private readonly options: HttpClientOptions) {
    this.baseUrl = options.baseUrl.replace(/\/+$/, '');
    this.fetchImpl = options.fetchImpl ?? ((url, init) => fetch(url, init));
    this.timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  }

  async request<T = void>(request: HttpRequest<T>): Promise<AppResult<T>> {
    const headers: Record<string, string> = {
      Accept: 'application/json',
      ...request.headers,
    };

    if (request.authenticated) {
      const credentials = await this.options.credentials?.headers();
      if (!credentials) {
        this.options.onUnauthorized?.();
        return failure('UNAUTHENTICATED', 401);
      }
      Object.assign(headers, credentials);
    }

    const hasBody = request.body !== undefined;
    if (hasBody) headers['Content-Type'] = 'application/json';

    if (request.signal?.aborted) return failure('ABORTED');

    const controller = new AbortController();
    let timedOut = false;
    const timeout = setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, request.timeoutMs ?? this.timeoutMs);
    const abortFromCaller = () => controller.abort();
    request.signal?.addEventListener('abort', abortFromCaller);

    try {
      const response = await this.fetchImpl(
        `${this.baseUrl}${request.path}${buildQuery(request.query)}`,
        {
          method: request.method ?? 'GET',
          headers,
          body: hasBody ? JSON.stringify(request.body) : undefined,
          credentials: this.options.includeCookies ? 'include' : 'omit',
          signal: controller.signal,
        },
      );

      if (!response.ok) {
        return { ok: false, error: await this.toError(response, request) };
      }

      if (!request.schema) return success(undefined as T);

      const parsed = request.schema.safeParse(await readJson(response));
      return parsed.success
        ? success(parsed.data)
        : failure('INVALID_RESPONSE', response.status);
    } catch (error) {
      if (request.signal?.aborted) return failure('ABORTED');
      if (timedOut) return failure('TIMEOUT');
      if (error instanceof SyntaxError) return failure('INVALID_RESPONSE');
      return failure('NETWORK_ERROR');
    } finally {
      clearTimeout(timeout);
      request.signal?.removeEventListener('abort', abortFromCaller);
    }
  }

  private async toError(
    response: Response,
    request: HttpRequest<unknown>,
  ): Promise<AppError> {
    let body: unknown = null;

    try {
      body = await readJson(response);
    } catch {
      body = null;
    }

    const error = this.options.mapError(response.status, body);

    if (request.authenticated && error.code === 'UNAUTHENTICATED') {
      this.options.onUnauthorized?.();
    }

    return error;
  }
}
