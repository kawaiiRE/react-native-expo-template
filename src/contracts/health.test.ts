import { describe, expect, it } from 'vitest';

import { API_VERSION, healthViewModelSchema } from './health';

describe('healthViewModelSchema', () => {
  it('accepts the versioned Next.js health response', () => {
    expect(
      healthViewModelSchema.parse({
        available: true,
        apiVersion: API_VERSION,
        service: 'pocketbase-template',
        checkedAt: '2026-09-20T00:00:00.000Z',
      }),
    ).toEqual({
      available: true,
      apiVersion: 1,
      service: 'pocketbase-template',
      checkedAt: '2026-09-20T00:00:00.000Z',
    });
  });

  it('rejects incompatible contract versions', () => {
    expect(() =>
      healthViewModelSchema.parse({
        available: true,
        apiVersion: 2,
        service: 'pocketbase-template',
        checkedAt: '2026-09-20T00:00:00.000Z',
      }),
    ).toThrow();
  });
});
