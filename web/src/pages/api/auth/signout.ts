import type { APIRoute } from 'astro';
import { supabaseServer } from '../../../lib/auth';

// Sign out: revoke the session with Supabase and let the server client clear the
// auth cookies. POST-only (a link/GET could be triggered cross-site); the
// account page's sign-out control is a real form submit. Always land home.
export const POST: APIRoute = async ({ request, cookies }) => {
  const supabase = supabaseServer({ cookies, request });
  await supabase.auth.signOut();
  return new Response(null, { status: 303, headers: { Location: '/' } });
};
