import type { APIRoute } from 'astro';
import { supabaseServer } from '../../../lib/auth';

// Save (upsert) the signed-in shopper's shipping address. Written through the
// request's authenticated client, so RLS enforces auth.uid() = id — a caller
// can only ever write their OWN row, never another account's. The row id IS the
// auth user id, so upsert on conflict(id) keeps it one-address-per-account.
export const POST: APIRoute = async ({ request, cookies }) => {
  const supabase = supabaseServer({ cookies, request });
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return new Response(null, { status: 303, headers: { Location: '/login' } });

  const form = await request.formData();
  const field = (k: string) => String(form.get(k) ?? '').trim();
  const row = {
    id: auth.user.id,
    full_name: field('fullName'),
    address: field('address'),
    city: field('city'),
    postcode: field('postcode'),
    country: field('country'),
    updated_at: new Date().toISOString(),
  };

  // Every field required — a half-saved address would just misfire at checkout.
  if (!row.full_name || !row.address || !row.city || !row.postcode || !row.country) {
    return new Response(null, { status: 303, headers: { Location: '/account?error=address' } });
  }

  const { error } = await supabase.from('customer_addresses').upsert(row, { onConflict: 'id' });
  if (error) {
    console.error('save address:', error.message);
    return new Response(null, { status: 303, headers: { Location: '/account?error=address' } });
  }
  return new Response(null, { status: 303, headers: { Location: '/account?saved=1' } });
};
