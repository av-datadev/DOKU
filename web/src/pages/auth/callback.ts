import type { APIRoute } from 'astro';
import { supabaseServer } from '../../lib/auth';

// Landing point for the magic link. Supabase redirects here with ?code=… (PKCE).
// exchangeCodeForSession pairs that code with the code-verifier cookie set when
// the link was requested, and on success writes the real session as httpOnly
// cookies (again via the server client's cookie adapter). Then we send the
// shopper on — to the `next` they were headed for (e.g. /checkout, stashed as an
// httpOnly cookie when the link was requested), or /account by default. If the
// exchange fails — link reused, expired, or opened on a different device where
// the verifier cookie isn't present — bounce back to /login with an error.
const AUTH_NEXT_COOKIE = 'doku_auth_next';

export const GET: APIRoute = async ({ request, cookies, url }) => {
  const code = url.searchParams.get('code');
  const authError = url.searchParams.get('error_description') || url.searchParams.get('error');

  const redirect = (to: string) => new Response(null, { status: 303, headers: { Location: to } });

  if (authError) return redirect('/login?error=link');
  if (!code) return redirect('/login?error=link');

  const supabase = supabaseServer({ cookies, request });
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    console.error('auth callback exchange:', error.message);
    return redirect('/login?error=link');
  }

  const nextRaw = cookies.get(AUTH_NEXT_COOKIE)?.value ?? '';
  const next = /^\/(?!\/)/.test(nextRaw) ? nextRaw : '/account';
  cookies.delete(AUTH_NEXT_COOKIE, { path: '/' });
  return redirect(next);
};
