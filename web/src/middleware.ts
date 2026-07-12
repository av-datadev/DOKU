import { defineMiddleware } from 'astro:middleware';

// Every page is SSR (astro.config output:'server'). Tell browsers to always
// revalidate the HTML document before reusing it, so a deploy is picked up on
// the next load instead of a stale cached copy lingering — the reason the
// consent/region bar fix looked "not live" to repeat visitors while incognito
// (empty cache) saw it correctly. Content-hashed files in /_astro/* are served
// by the ASSETS binding, not through here, so they keep their immutable caching.
export const onRequest = defineMiddleware(async (_context, next) => {
  const response = await next();
  const type = response.headers.get('content-type') || '';
  if (type.includes('text/html')) {
    response.headers.set('Cache-Control', 'no-cache');
  }
  return response;
});
