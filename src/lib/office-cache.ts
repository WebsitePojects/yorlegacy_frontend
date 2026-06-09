type CacheEnvelope<T> = {
  updatedAt: number;
  data: T;
};

const OFFICE_CACHE_PREFIX = 'yor-office-cache:v1:';
const inflightRequests = new Map<string, Promise<unknown>>();

function storageKey(key: string) {
  return `${OFFICE_CACHE_PREFIX}${key}`;
}

export function readOfficeCache<T>(key: string): CacheEnvelope<T> | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(storageKey(key));

    if (!raw) {
      return null;
    }

    return JSON.parse(raw) as CacheEnvelope<T>;
  } catch {
    return null;
  }
}

export function writeOfficeCache<T>(key: string, data: T): CacheEnvelope<T> {
  const envelope: CacheEnvelope<T> = {
    updatedAt: Date.now(),
    data
  };

  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(storageKey(key), JSON.stringify(envelope));
    } catch {
      // Ignore storage quota or serialization errors and keep the in-memory flow working.
    }
  }

  return envelope;
}

export async function warmOfficeCache<T>(key: string, loader: () => Promise<T>): Promise<T> {
  const existing = inflightRequests.get(key) as Promise<T> | undefined;

  if (existing) {
    return existing;
  }

  const request = loader()
    .then((data) => {
      writeOfficeCache(key, data);
      return data;
    })
    .finally(() => {
      inflightRequests.delete(key);
    });

  inflightRequests.set(key, request);
  return request;
}

export function clearOfficeCache(key: string): void {
  inflightRequests.delete(key);

  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.removeItem(storageKey(key));
  } catch {
    // Ignore storage access failures during invalidation.
  }
}

export function clearAllOfficeCache(): void {
  inflightRequests.clear();

  if (typeof window === 'undefined') {
    return;
  }

  try {
    const keysToRemove: string[] = [];
    for (let index = 0; index < window.localStorage.length; index += 1) {
      const key = window.localStorage.key(index);
      if (key?.startsWith(OFFICE_CACHE_PREFIX)) {
        keysToRemove.push(key);
      }
    }

    for (const key of keysToRemove) {
      window.localStorage.removeItem(key);
    }
  } catch {
    // Ignore storage access failures during invalidation.
  }
}
