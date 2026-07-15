import type { APIRoute } from 'astro';
import { supabaseServer } from '../../../lib/auth';

// Send a passwordless magic link. signInWithOtp both emails the link AND writes
// the PKCE code-verifier as an httpOnly cookie (via the server client's cookie
// adapter) — that verifier is what /auth/callback later exchanges, which is why
// the link only completes in the same browser that requested it.
//
// We always redirect back to /login?sent=1 regardless of whether the email
// exists: never reveal which addresses have accounts. emailRedirectTo is built
// from THIS request's origin so it's correct in dev (localhost) and prod
// (discoverdoku.com) without hardcoding — both origins must be in Supabase
// Auth → URL Configuration → Redirect URLs for the link to be accepted.
// A `next` may ride along (e.g. from the checkout sign-in gate) so the link
// lands the shopper back where they were instead of /account. Only a local path
// is honoured (must start with a single '/'), to prevent an open redirect.
const AUTH_NEXT_COOKIE = 'doku_auth_next';
const safeNext = (v: string) => (/^\/(?!\/)/.test(v) ? v : '');

export const POST: APIRoute = async ({ request, cookies, url }) => {
  const form = await request.formData();
  const email = String(form.get('email') ?? '').trim().toLowerCase();
  const next = safeNext(String(form.get('next') ?? ''));

  const back = (params: Record<string, string>) => {
    if (next) params.next = next;
    const q = new URLSearchParams(params).toString();
    return new Response(null, { status: 303, headers: { Location: `/login?${q}` } });
  };

  // Minimal shape check — real validation is Supabase's problem, and we don't
  // want to leak validity either way.
  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return back({ error: 'email' });
  }

  const supabase = supabaseServer({ cookies, request });
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: `${url.origin}/auth/callback` },
  });

  // Remember the post-sign-in destination server-side (read in /auth/callback).
  // Kept out of emailRedirectTo on purpose: a query-string redirect target would
  // need separate Supabase allow-listing; a cookie in the same browser doesn't.
  if (next) {
    cookies.set(AUTH_NEXT_COOKIE, next, {
      path: '/', httpOnly: true, sameSite: 'lax',
      secure: url.protocol === 'https:', maxAge: 60 * 60,
    });
  } else {
    cookies.delete(AUTH_NEXT_COOKIE, { path: '/' });
  }

  // Even on error we report "sent" to avoid account enumeration; a genuinely
  // broken send just means the link never arrives, and the user retries.
  if (error) console.error('magic-link signInWithOtp:', error.message);
  return back({ sent: '1', to: email });
};
