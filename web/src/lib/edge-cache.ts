// A short-lived cache in front of the slow upstream reads every SSR page makes.
//
// Why: visitors from India are served by Cloudflare's Marseille location while
// the Supabase project sits in Sydney (ap-southeast-2), so one catalog query is
// a ~2s round trip — paid on every click before any HTML left the Worker.
// Two layers, both keyed by name:
//   1. this isolate's memory (free; lives as long as the isolate does)
//   2. the Cloudflare location's Cache API (shared by every isolate there)
// Only good results are stored: when `load` returns null (upstream failed),
// nothing is cached and the caller falls back as before.
//
// Where a stale status could matter it is bypassed: holding a piece, checkout
// and confirmation ask for fresh data (fetchProducts({ fresh: true })), and
// the payment Edge Functions re-check the database regardless.

const memory = new Map<string, { until: number; value: unknown }>();

// caches.default exists in the Workers runtime; not in every dev server.
const edgeCache = (): Cache | undefined =>
  (globalThis as { caches?: { default?: Cache } }).caches?.default;

export async function cached<T>(key: string, ttlSeconds: number, load: () => Promise<T | null>): Promise<T | null> {
  const hit = memory.get(key);
  if (hit && hit.until > Date.now()) return hit.value as T;

  const url = `https://edge-cache.discoverdoku.com/${key}`;
  const cache = edgeCache();
  try {
    const res = await cache?.match(url);
    if (res) {
      const value = (await res.json()) as T;
      memory.set(key, { until: Date.now() + ttlSeconds * 1000, value });
      return value;
    }
  } catch {
    /* a cache miss or a bad entry — load it */
  }

  const value = await load();
  if (value === null) return null;
  memory.set(key, { until: Date.now() + ttlSeconds * 1000, value });
  try {
    await cache?.put(url, new Response(JSON.stringify(value), {
      headers: { 'content-type': 'application/json', 'cache-control': `max-age=${ttlSeconds}` },
    }));
  } catch {
    /* caching is best-effort */
  }
  return value;
}
