import type { APIRoute } from 'astro';
import { supabaseServer } from '../../../lib/auth';

// Add or remove one item on the signed-in shopper's wishlist. Written through
// the request's authenticated client, so RLS enforces auth.uid() = user_id — a
// caller can only ever touch their OWN rows. A wishlist is NOT a hold: it never
// changes the product's status, so the item stays purchasable by anyone.
//
// Progressive enhancement: without JS the browser POSTs this form and we
// 303-redirect back to `redirect`. With JS the item/account page uses fetch and
// swaps the control in place (we still return a small JSON body for that path).
export const POST: APIRoute = async ({ request, cookies }) => {
  const supabase = supabaseServer({ cookies, request });
  const { data: auth } = await supabase.auth.getUser();

  const form = await request.formData();
  const action = String(form.get('action') ?? '');
  const sku = String(form.get('sku') ?? '').trim();
  const redirect = String(form.get('redirect') ?? '/account');
  const wantsJson = (request.headers.get('accept') ?? '').includes('application/json');

  const fail = (status: number, error: string, location = '/login') =>
    wantsJson
      ? new Response(JSON.stringify({ ok: false, error }), { status, headers: { 'content-type': 'application/json' } })
      : new Response(null, { status: 303, headers: { Location: location } });

  if (!auth.user) return fail(401, 'Not signed in', '/login');
  if (!sku || (action !== 'add' && action !== 'remove')) return fail(400, 'Bad request', redirect);

  if (action === 'add') {
    // Idempotent: the unique(user_id, sku) index means a repeat "add" is a no-op.
    const { error } = await supabase
      .from('wishlists')
      .upsert({ user_id: auth.user.id, sku }, { onConflict: 'user_id,sku', ignoreDuplicates: true });
    if (error) return fail(500, error.message, redirect);
  } else {
    const { error } = await supabase
      .from('wishlists')
      .delete()
      .eq('user_id', auth.user.id)
      .eq('sku', sku);
    if (error) return fail(500, error.message, redirect);
  }

  return wantsJson
    ? new Response(JSON.stringify({ ok: true, watching: action === 'add' }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      })
    : new Response(null, { status: 303, headers: { Location: redirect } });
};
