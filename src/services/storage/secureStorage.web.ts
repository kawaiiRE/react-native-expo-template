import { createMemoryStorage, type KeyValueStorage } from './keyValueStorage';

/**
 * expo-secure-store has no web implementation and browser storage is readable
 * by any script on the origin, so the web preview keeps secrets in memory. A
 * gateway bearer token is lost on reload; a Fastify session survives in the
 * browser's HttpOnly cookie.
 */
export const secureStorage: KeyValueStorage = createMemoryStorage();
