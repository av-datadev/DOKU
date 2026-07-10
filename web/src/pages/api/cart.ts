import type { APIRoute } from 'astro';
import { CART_COOKIE, decodeCart, encodeCart } from '../../lib/cart';
import { serverEnv } from '../../lib/env';
import { fetchProduct } from '../../lib/products';

// Server-side cart mutation. The cart lives in a signed httpOnly cookie
// (Hard rule 3: no localStorage), and only the server holds CART_SECRET, so
// every add/remove must round-trip here. This does NOT reserve anything — the
// "sold once" guarantee stays in the place_order() RPC at checkout. Holding an
// item is pure intent; a stale cookie can never oversell.
//
// Progressive enhancement: a plain <form> POST (no JS) mutates the cookie and
// 303-redirects back. A fetch() with Accept: application/json gets JSON so the
// client can update the badge without a reload.
export const POST: APIRoute = async ({ request, cookies, locals, url }) => {
  const secret = serverEnv(locals, 'CART_SECRET');
  const form = await request.formData();
  const sku = String(form.get('sku') ?? '').trim();
  const action = String(form.get('action') ?? 'hold');
  const redirectTo = String(form.get('redirect') ?? request.headers.get('referer') ?? '/collection');
  const wantsJson = (request.headers.get('accept') ?? '').includes('application/json');

  const current = await decodeCart(cookies.get(CART_COOKIE)?.value, secret);
  let next = current;
  let error: string | null = null;

  if (!sku) {
    error = 'No item given';
  } else if (action === 'release') {
    next = current.filter((s) => s !== sku);
  } else {
    // hold: only add an item that is actually available right now.
    const product = await fetchProduct(sku);
    if (!product) error = 'Unknown item';
    else if (product.status !== 'available') error = 'This DOKU is no longer available';
    else if (!current.includes(sku)) next = [...current, sku];
  }

  if (!error && next !== current) {
    cookies.set(CART_COOKIE, await encodeCart(next, secret), {
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      secure: url.protocol === 'https:',
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });
  }

  if (wantsJson) {
    return new Response(JSON.stringify({ ok: !error, count: next.length, held: next, error }), {
      status: error ? 409 : 200,
      headers: { 'content-type': 'application/json' },
    });
  }
  return new Response(null, { status: 303, headers: { location: redirectTo } });
};
