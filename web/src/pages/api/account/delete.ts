import type { APIRoute } from 'astro';
import { supabaseServer } from '../../../lib/auth';

// Self-service account deletion. The browser can't do this — deleting an auth
// user needs the service role, which never lives in the SSR worker (same posture
// as Razorpay). So this route: (1) confirms the caller is signed in and typed
// the explicit confirmation, (2) hands the delete-account Edge Function the
// user's OWN access token (the Edge Function identifies + deletes them with the
// service role, cascading address + wishlist; orders are kept), then (3) clears
// the session cookies and lands home. Destructive + user-initiated.
export const POST: APIRoute = async ({ request, cookies }) => {
  const supabase = supabaseServer({ cookies, request });
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return new Response(null, { status: 303, headers: { Location: '/login' } });

  const form = await request.formData();
  if (form.get('confirm') !== 'delete') {
    return new Response(null, { status: 303, headers: { Location: '/account?error=delete' } });
  }

  const { data: sessionData } = await supabase.auth.getSession();
  const accessToken = sessionData.session?.access_token;
  const url = import.meta.env.PUBLIC_SUPABASE_URL;
  const anonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;
  if (!accessToken || !url || !anonKey) {
    return new Response(null, { status: 303, headers: { Location: '/account?error=delete' } });
  }

  try {
    const res = await fetch(`${url}/functions/v1/delete-account`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        apikey: anonKey,
        'Content-Type': 'application/json',
      },
      body: '{}',
    });
    if (!res.ok) {
      console.error('delete account:', res.status, await res.text());
      return new Response(null, { status: 303, headers: { Location: '/account?error=delete' } });
    }
  } catch (e) {
    console.error('delete account:', (e as Error).message);
    return new Response(null, { status: 303, headers: { Location: '/account?error=delete' } });
  }

  // Account is gone; clear the now-dead session cookies and land home. signOut
  // may fail server-side (the user no longer exists) — the cookie clearing is
  // what matters, so ignore any error.
  try { await supabase.auth.signOut(); } catch { /* user already deleted */ }
  return new Response(null, { status: 303, headers: { Location: '/?farewell=1' } });
};
