// Read a SERVER-ONLY env var (e.g. CART_SECRET) reliably in both places it runs.
//
// On Cloudflare Workers, secrets set with `wrangler secret` arrive at runtime on
// `Astro.locals.runtime.env` — they are NOT in `import.meta.env`, which is
// inlined at build time and would be `undefined` for a runtime secret. In local
// dev, Astro loads `.env` into `import.meta.env`. Preferring runtime.env and
// falling back to import.meta.env makes the same code correct in both.
export function serverEnv(locals: App.Locals | undefined, key: string): string {
  const runtimeEnv = (locals as { runtime?: { env?: Record<string, unknown> } } | undefined)?.runtime?.env;
  const fromRuntime = runtimeEnv?.[key];
  if (typeof fromRuntime === 'string' && fromRuntime) return fromRuntime;
  const fromBuild = (import.meta.env as Record<string, unknown>)[key];
  return typeof fromBuild === 'string' ? fromBuild : '';
}
