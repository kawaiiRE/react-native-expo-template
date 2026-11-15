import { describe, expect, it, vi } from 'vitest';
import { z } from 'zod';

import { codeFromStatus } from '@/models/errors';

import {
  HttpClient,
  type FetchLike,
  type HttpClientOptions,
} from './httpClient';

const BASE = 'https://api.example.com/';

function jsonResponse(status: number, body: unknown) {
  return new Response(body === undefined ? null : JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function createClient(
  fetchImpl: FetchLike,
  options: Partial<HttpClientOptions> = {},
) {
  return new HttpClient({
    baseUrl: BASE,
    fetchImpl,
    timeoutMs: 50,
    mapError: (status) => ({ code: codeFromStatus(status), status }),
    ...options,
  });
}

const itemSchema = z.object({ id: z.string() });

describe('HttpClient', () => {
  it('builds URLs with encoded query params and validates bodies', async () => {
    const fetchImpl = vi.fn<FetchLike>(async () =>
      jsonResponse(200, { id: 'n1' }),
    );
    const client = createClient(fetchImpl);

    const result = await client.request({
      path: '/api/v1/notes',
      query: { page: 2, search: 'a&b', archived: false, empty: '' },
      schema: itemSchema,
    });

    expect(result).toEqual({ ok: true, data: { id: 'n1' } });
    expect(fetchImpl.mock.calls[0][0]).toBe(
      'https://api.example.com/api/v1/notes?page=2&search=a%26b&archived=false',
    );
  });

  it('sends JSON bodies, no Origin, and omits cookies by default', async () => {
    const fetchImpl = vi.fn<FetchLike>(async () =>
      jsonResponse(204, undefined),
    );
    await createClient(fetchImpl).request({
      method: 'POST',
      path: '/x',
      body: { email: 'a@b.co' },
    });

    const init = fetchImpl.mock.calls[0][1];
    const headers = init.headers as Record<string, string>;
    expect(init.method).toBe('POST');
    expect(init.body).toBe('{"email":"a@b.co"}');
    expect(init.credentials).toBe('omit');
    expect(headers['Content-Type']).toBe('application/json');
    expect(headers.Origin).toBeUndefined();
  });

  it('includes browser cookies when configured for the web build', async () => {
    const fetchImpl = vi.fn<FetchLike>(async () =>
      jsonResponse(204, undefined),
    );
    await createClient(fetchImpl, { includeCookies: true }).request({
      path: '/x',
    });
    expect(fetchImpl.mock.calls[0][1].credentials).toBe('include');
  });

  it('delegates error bodies to the backend mapper', async () => {
    const mapError = vi.fn(() => ({
      code: 'EMAIL_TAKEN' as const,
      status: 409,
      fields: { email: 'taken' as const },
    }));
    const client = createClient(async () => jsonResponse(409, { code: 'X' }), {
      mapError,
    });

    const result = await client.request({ path: '/x' });

    expect(mapError).toHaveBeenCalledWith(409, { code: 'X' });
    expect(result).toEqual({
      ok: false,
      error: { code: 'EMAIL_TAKEN', status: 409, fields: { email: 'taken' } },
    });
  });

  it('passes a null body to the mapper for non-JSON errors', async () => {
    const mapError = vi.fn(() => ({
      code: 'UNAVAILABLE' as const,
      status: 500,
    }));
    const client = createClient(
      async () => new Response('<html>oops</html>', { status: 500 }),
      { mapError },
    );
    await client.request({ path: '/x' });
    expect(mapError).toHaveBeenCalledWith(500, null);
  });

  it('rejects responses that fail schema validation', async () => {
    const client = createClient(async () => jsonResponse(200, { id: 42 }));
    expect(await client.request({ path: '/x', schema: itemSchema })).toEqual({
      ok: false,
      error: { code: 'INVALID_RESPONSE', status: 200 },
    });
  });

  it('maps network failures, timeouts and caller cancellation', async () => {
    const hang: FetchLike = (_url, init) =>
      new Promise((_resolve, reject) => {
        init.signal?.addEventListener('abort', () =>
          reject(new DOMException('Aborted', 'AbortError')),
        );
      });
    const offline = createClient(async () => {
      throw new TypeError('Network request failed');
    });
    const controller = new AbortController();
    const cancelled = createClient(hang).request({
      path: '/x',
      signal: controller.signal,
    });
    controller.abort();

    expect((await offline.request({ path: '/x' })).ok || 'NETWORK_ERROR').toBe(
      'NETWORK_ERROR',
    );
    const slow = await createClient(hang).request({ path: '/x' });
    expect(slow.ok || slow.error.code).toBe('TIMEOUT');
    const aborted = await cancelled;
    expect(aborted.ok || aborted.error.code).toBe('ABORTED');
  });

  it('attaches session credentials and reports rejected sessions', async () => {
    const onUnauthorized = vi.fn();
    const fetchImpl = vi.fn<FetchLike>(async () => jsonResponse(401, {}));
    const client = createClient(fetchImpl, {
      credentials: { headers: async () => ({ Authorization: 'Bearer t' }) },
      onUnauthorized,
    });

    await client.request({ path: '/me', authenticated: true });

    const headers = fetchImpl.mock.calls[0][1].headers as Record<
      string,
      string
    >;
    expect(headers.Authorization).toBe('Bearer t');
    expect(onUnauthorized).toHaveBeenCalledTimes(1);
  });

  it('does not report 401s from public endpoints', async () => {
    const onUnauthorized = vi.fn();
    const client = createClient(async () => jsonResponse(401, {}), {
      onUnauthorized,
    });
    await client.request({ method: 'POST', path: '/auth/token', body: {} });
    expect(onUnauthorized).not.toHaveBeenCalled();
  });

  it('fails fast without a credential', async () => {
    const fetchImpl = vi.fn<FetchLike>();
    const onUnauthorized = vi.fn();
    const client = createClient(fetchImpl, {
      credentials: { headers: async () => null },
      onUnauthorized,
    });

    const result = await client.request({
      path: '/notes',
      authenticated: true,
    });

    expect(result.ok || result.error.code).toBe('UNAUTHENTICATED');
    expect(fetchImpl).not.toHaveBeenCalled();
    expect(onUnauthorized).toHaveBeenCalledTimes(1);
  });
});
