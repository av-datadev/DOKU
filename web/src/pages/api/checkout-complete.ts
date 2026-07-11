import type { APIRoute } from 'astro';
import { CART_COOKIE, decodeCart } from '../../lib/cart';
import { LAST_ORDER_COOKIE, encodeOrder } from '../../lib/order';
import { serverEnv } from '../../lib/env';

// Called by the checkout client AFTER razorpay-verify-payment has already
// reserved the items server-side (place_order_paid). This does not reserve or
// charge anything — it only hands the confirmation page a signed cookie and
// empties the cart. The order_code comes from verify-payment; the item list
// comes from the server's own cart cookie (not trusted from the client body).
export const POST: APIRoute = async ({ request, cookies, locals, url }) => {
  const secret = serverEnv(locals, 'CART_SECRET');
  const form = await request.formData();
  const code = String(form.get('order_code') ?? '').trim();
  const name = String(form.get('full_name') ?? '').trim().split(' ')[0].slice(0, 60);

  if (!code) {
    return new Response(JSON.stringify({ ok: false, error: 'Missing order code' }), {
      status: 400,
      headers: { 'content-type': 'application/json' },
    });
  }

  const skus = await decodeCart(cookies.get(CART_COOKIE)?.value, secret);

  cookies.set(LAST_ORDER_COOKIE, await encodeOrder({ code, name, skus }, secret), {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    secure: url.protocol === 'https:',
    maxAge: 60 * 60, // 1 hour — long enough to view/refresh the confirmation
  });
  // Empty the cart: the items are reserved now, not held.
  cookies.delete(CART_COOKIE, { path: '/' });

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  });
};
