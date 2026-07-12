/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly PUBLIC_SUPABASE_URL: string;
  readonly PUBLIC_SUPABASE_ANON_KEY: string;
  readonly CART_SECRET: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare namespace App {
  interface Locals {
    // Set by middleware.ts once per request. `user` is the verified signed-in
    // customer (or null); `supabase` is that request's cookie-bound client,
    // reusable for authenticated queries without re-validating the JWT.
    user: { id: string; email: string | null } | null;
    supabase: import('@supabase/supabase-js').SupabaseClient;
    // Cloudflare adapter runtime (secrets like CART_SECRET live on runtime.env).
    runtime?: { env?: Record<string, unknown> };
  }
}
