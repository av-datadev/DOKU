/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly PUBLIC_SUPABASE_URL: string;
  readonly PUBLIC_SUPABASE_ANON_KEY: string;
  readonly CART_SECRET: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
