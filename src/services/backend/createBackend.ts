import { Platform } from 'react-native';

import type { BackendConfig } from '@/config/backend';
import { secureStorage } from '@/services/storage/secureStorage';

import { createBetterAuthTransport } from './fastify/betterAuthTransport';
import { createFastifyBackend } from './fastify/fastifyBackend';
import { createNextBackend } from './next/nextBackend';
import type { Backend, BackendHooks } from './ports';

/** Picks the adapter for the configured backend. Nothing else branches on it. */
export function createBackend(
  config: BackendConfig,
  scheme: string,
  hooks: BackendHooks,
): Backend {
  switch (config.backend) {
    case 'next':
      return createNextBackend({
        baseUrl: config.apiBaseUrl,
        storage: secureStorage,
        hooks,
      });
    case 'fastify':
      return createFastifyBackend({
        baseUrl: config.apiBaseUrl,
        transport: createBetterAuthTransport({
          baseUrl: config.apiBaseUrl,
          scheme,
        }),
        hooks,
        platform: Platform.OS === 'web' ? 'web' : 'native',
      });
  }
}
