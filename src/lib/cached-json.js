const CACHE_WINDOW = 5 * 60 * 1000;

// Browser-memory cache: URL includes both the endpoint and exact location.
export function createCachedJsonFetch(service) {
  const entries = new Map();
  return (url) => {
    const now = Date.now();
    for (const [key, entry] of entries) {
      if (entry.expiresAt <= now) entries.delete(key);
    }
    if (entries.has(url)) return entries.get(url).promise;

    const entry = { expiresAt: Infinity };
    entry.promise = (async () => {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`${service} request failed with status ${response.status}.`);
      }
      const data = await response.json();
      entry.expiresAt = Date.now() + CACHE_WINDOW;
      return data;
    })().catch((error) => {
      entries.delete(url);
      throw error;
    });
    entries.set(url, entry);
    return entry.promise;
  };
}
