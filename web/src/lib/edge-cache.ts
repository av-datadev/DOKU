// A short-lived cache in front of the slow upstream reads every SSR page makes.
//
// Why: visitors from India are served by Cloudflare's Marseille location while
// the Supabase project sits in Sydney (ap-southeast-2), so one catalog query is
// a ~2s round trip — paid on every click before any HTML left the Worker.
// Stale-while-revalidate, in two layers, both keyed by name:
//   1. this isolate's memory (free; lives as long as the isolate does)
//   2. the Cloudflare location's Cache API (shared by every isolate there)
// Only good results are stored: when `load` returns null (upstream failed),
// nothing is cached and the caller falls back as before.
//
// Where a stale status could matter it is bypassed: holding a piece, checkout
// and confirmation ask for fresh data (fetchProducts({ fresh: true })), and
// the payment Edge Functions re-check the database regardless.

import { AsyncLocalStorage } from 'node:async_hooks';

// Older than `ttl` → still served, but refreshed behind the response so no
// visitor waits on Sydney. Older than STALE_LIMIT → never served; the request
// that finds it fetches before rendering (the old behaviour).
const STALE_LIMIT = 600;

type Entry = { at: number; value: unknown };
const memory = new Map<string, Entry>();
const inflight = new Map<string, Promise<unknown>>();

// The request's ctx.waitUntil, set by middleware, so a background refresh can
// outlive the response it was started from.
const background = new AsyncLocalStorage<(p: Promise<unknown>) => void>();
export const withBackground = <T>(waitUntil: ((p: Promise<unknown>) => void) | undefined, run: () => T): T =>
  waitUntil ? background.run(waitUntil, run) : run();

// caches.default exists in the Workers runtime; not in every dev server.
const edgeCache = (): Cache | undefined =>
  (globalThis as { caches?: { default?: Cache } }).caches?.default;
const urlFor = (key: string) => `https://edge-cache.discoverdoku.com/${key}`;

function refresh<T>(key: string, load: () => Promise<T | null>): Promise<T | null> {
  const running = inflight.get(key);
  if (running) return running as Promise<T | null>;
  const job = (async () => {
    const value = await load();
    if (value === null) return null;
    const entry: Entry = { at: Date.now(), value };
    memory.set(key, entry);
    try {
      await edgeCache()?.put(urlFor(key), new Response(JSON.stringify(entry), {
        headers: { 'content-type': 'application/json', 'cache-control': `max-age=${STALE_LIMIT}` },
      }));
    } catch {
      /* caching is best-effort */
    }
    return value;
  })().finally(() => inflight.delete(key));
  inflight.set(key, job);
  return job;
}

export async function cached<T>(key: string, ttlSeconds: number, load: () => Promise<T | null>): Promise<T | null> {
  let entry = memory.get(key);
  if (!entry) {
    try {
      const res = await edgeCache()?.match(urlFor(key));
      if (res) {
        entry = (await res.json()) as Entry;
        memory.set(key, entry);
      }
    } catch {
      /* a cache miss or a bad entry — load it */
    }
  }

  const age = entry ? (Date.now() - entry.at) / 1000 : Infinity;
  if (!entry || age > STALE_LIMIT) return refresh(key, load);
  if (age > ttlSeconds) {
    const job = refresh(key, load);
    background.getStore()?.(job);
  }
  return entry.value as T;
}
