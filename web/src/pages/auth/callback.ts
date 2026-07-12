import type { APIRoute } from 'astro';
import { supabaseServer } from '../../lib/auth';

// Landing point for the magic link. Supabase redirects here with ?code=… (PKCE).
// exchangeCodeForSession pairs that code with the code-verifier cookie set when
// the link was requested, and on success writes the real session as httpOnly
// cookies (again via the server client's cookie adapter). Then we send the
// shopper to /account. If the exchange fails — link reused, expired, or opened
// on a different device where the verifier cookie isn't present — bounce back to
// /login with an error rather than a blank page.
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
  return redirect('/account');
};
