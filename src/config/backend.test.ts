import { describe, expect, it } from 'vitest';

import { parseBackendConfig } from './backend';

describe('parseBackendConfig', () => {
  it('accepts both backends and normalizes trailing slashes', () => {
    expect(
      parseBackendConfig({
        backend: 'fastify',
        apiBaseUrl: ' http://192.168.1.20:5000/ ',
      }),
    ).toEqual({
      ok: true,
      config: { backend: 'fastify', apiBaseUrl: 'http://192.168.1.20:5000' },
    });
    expect(
      parseBackendConfig({
        backend: 'next',
        apiBaseUrl: 'https://app.example.com',
      }).ok,
    ).toBe(true);
  });

  it.each([
    [undefined, 'https://app.example.com', ['backend']],
    ['pocketbase', 'https://app.example.com', ['backend']],
    ['next', undefined, ['apiBaseUrl']],
    ['next', 'app.example.com', ['apiBaseUrl']],
    ['next', 'https://app.example.com/api/v1', ['apiBaseUrl']],
    ['next', 'ftp://app.example.com', ['apiBaseUrl']],
    ['', '', ['backend', 'apiBaseUrl']],
  ])('rejects backend=%s url=%s', (backend, apiBaseUrl, issues) => {
    expect(parseBackendConfig({ backend, apiBaseUrl })).toEqual({
      ok: false,
      issues,
    });
  });
});
