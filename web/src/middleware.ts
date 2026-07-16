import { defineMiddleware } from 'astro:middleware';
import { getUser } from './lib/auth';
import { captureError } from './lib/sentry';

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

  // Wrap the request so any unhandled SSR fault reaches Sentry (→ email alert).
  // captureError is fire-and-forget and never throws, so this can't change
  // behaviour — a thrown error is still re-thrown to Astro's own 500 handling.
  // We also flag any 5xx the route returned without throwing. Expected 4xx
  // (validation, auth) are deliberately NOT captured — they'd be noise and burn
  // the free-tier event quota.
  let response: Response;
  try {
    response = await next();
  } catch (err) {
    await captureError(err, { locals: context.locals, request: context.request, tags: { where: 'ssr-throw' } });
    throw err;
  }
  if (response.status >= 500) {
    await captureError(new Error(`SSR responded ${response.status}`), {
      locals: context.locals, request: context.request,
      tags: { where: 'ssr-5xx', status: String(response.status) },
    });
  }

  const type = response.headers.get('content-type') || '';
  if (type.includes('text/html')) {
    response.headers.set('Cache-Control', 'no-cache');
  }
  return response;
});
