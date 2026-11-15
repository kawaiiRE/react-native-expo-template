import { describe, expect, it } from 'vitest';

import { parseBackendConfig } from './backend';

describe('parseBackendConfig', () => {
  it('accepts both backends and normalizes trailing slashes', () => {
    expect(
      parseBackendConfig({
        backend: 'fastify',
        apiBaseUrl: ' http://192.168.1.20:5000/ ',
        allowInsecure: true,
      }),
    ).toEqual({
      ok: true,
      config: { backend: 'fastify', apiBaseUrl: 'http://192.168.1.20:5000' },
    });
    expect(
      parseBackendConfig({
        backend: 'next',
        apiBaseUrl: 'https://app.example.com',
        allowInsecure: false,
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
    expect(
      parseBackendConfig({ backend, apiBaseUrl, allowInsecure: true }),
    ).toEqual({ ok: false, issues });
  });

  describe('release builds', () => {
    it.each([
      'http://api.example.com',
      'http://127.0.0.1:3000',
      'http://192.168.1.20:5000',
    ])('rejects plain http origin %s', (apiBaseUrl) => {
      expect(
        parseBackendConfig({
          backend: 'next',
          apiBaseUrl,
          allowInsecure: false,
        }),
      ).toEqual({ ok: false, issues: ['apiBaseUrlInsecure'] });
    });

    it('reports an invalid backend alongside an insecure origin', () => {
      expect(
        parseBackendConfig({
          backend: 'pocketbase',
          apiBaseUrl: 'http://api.example.com',
          allowInsecure: false,
        }),
      ).toEqual({ ok: false, issues: ['backend', 'apiBaseUrlInsecure'] });
    });

    it('accepts https origins', () => {
      expect(
        parseBackendConfig({
          backend: 'fastify',
          apiBaseUrl: 'https://api.example.com/',
          allowInsecure: false,
        }),
      ).toEqual({
        ok: true,
        config: { backend: 'fastify', apiBaseUrl: 'https://api.example.com' },
      });
    });
  });
});
