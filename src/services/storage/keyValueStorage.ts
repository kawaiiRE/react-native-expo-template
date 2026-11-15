export interface KeyValueStorage {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}

export function createMemoryStorage(
  initial: Record<string, string> = {},
): KeyValueStorage {
  const values = new Map(Object.entries(initial));

  return {
    async getItem(key) {
      return values.get(key) ?? null;
    },
    async setItem(key, value) {
      values.set(key, value);
    },
    async removeItem(key) {
      values.delete(key);
    },
  };
}

export async function readStoredJson(
  storage: KeyValueStorage,
  key: string,
): Promise<unknown> {
  try {
    const raw = await storage.getItem(key);
    return raw ? (JSON.parse(raw) as unknown) : null;
  } catch {
    return null;
  }
}

export async function writeStoredJson(
  storage: KeyValueStorage,
  key: string,
  value: unknown,
) {
  try {
    await storage.setItem(key, JSON.stringify(value));
  } catch {
    // Persistence is best-effort; in-memory state stays authoritative.
  }
}

export async function removeStoredItem(storage: KeyValueStorage, key: string) {
  try {
    await storage.removeItem(key);
  } catch {
    // Best-effort cleanup.
  }
}
