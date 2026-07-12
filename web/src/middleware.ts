import { defineMiddleware } from 'astro:middleware';
import { getUser } from './lib/auth';

// Every page is SSR (astro.config output:'server'). This runs once per request
// and does two things:
//
//  1. Resolve the signed-in customer (if any) ONCE and stash it on locals, so
//     the header, the account page, and any protected route read the same
//     verified user without each re-validating the JWT. Anonymous visitors —
//     the majority — cost nothing here (getUser cheap-outs when no auth cookie
//     is present). The bound client is stashed too so the account page can
//     query orders/address as the user without a second network round-trip.
//
//  2. Tell browsers to always revalidate the HTML document before reusing it,
//     so a deploy is picked up on the next load instead of a stale cached copy
//     lingering — the reason the consent/region bar fix looked "not live" to
//     repeat visitors while incognito (empty cache) saw it correctly.
//     Content-hashed files in /_astro/* are served by the ASSETS binding, not
//     through here, so they keep their immutable caching.
export const onRequest = defineMiddleware(async (context, next) => {
  const { client, user } = await getUser({ cookies: context.cookies, request: context.request });
  context.locals.supabase = client;
  context.locals.user = user;

  const response = await next();
  const type = response.headers.get('content-type') || '';
  if (type.includes('text/html')) {
    response.headers.set('Cache-Control', 'no-cache');
  }
  return response;
});
