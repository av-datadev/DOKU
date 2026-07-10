// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import cloudflare from '@astrojs/cloudflare';

// DOKU public site — SSR on Cloudflare Workers so we can:
//   • server-render /item/[sku] for real, indexable URLs (kills hash routing)
//   • sign/verify the cart cookie server-side (no localStorage — Hard rule 3)
// The Supabase backend, Razorpay edge functions, and admin.html are unchanged.
export default defineConfig({
  site: 'https://discoverdoku.com',
  output: 'server',
  adapter: cloudflare({ imageService: 'passthrough' }),
  integrations: [react()],
});
