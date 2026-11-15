import type { FetchLike } from '../http/httpClient';

export type RecordedCall = {
  method: string;
  path: string;
  query: URLSearchParams;
  headers: Record<string, string>;
  body: unknown;
};

type Responder = (call: RecordedCall) => Response;

export function json(status: number, body?: unknown) {
  return new Response(body === undefined ? null : JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

/** Routes `"METHOD /path"` to canned responses and records every call. */
export function createFakeFetch(routes: Record<string, Responder>) {
  const calls: RecordedCall[] = [];

  const fetchImpl: FetchLike = async (url, init) => {
    const parsed = new URL(url);
    const call: RecordedCall = {
      method: init.method ?? 'GET',
      path: parsed.pathname,
      query: parsed.searchParams,
      headers: (init.headers ?? {}) as Record<string, string>,
      body: typeof init.body === 'string' ? JSON.parse(init.body) : undefined,
    };
    calls.push(call);

    const responder = routes[`${call.method} ${call.path}`];
    if (!responder) throw new TypeError(`Unexpected ${call.method} ${url}`);
    return responder(call);
  };

  return { fetchImpl, calls };
}
