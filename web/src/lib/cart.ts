// Signed-cookie cart. Replaces the old in-memory JS cart now that the site has
// real, reloading routes (Hard rule 3 forbids localStorage; a server-signed
// httpOnly cookie is the correct multi-page substitute). The cart is only a
// list of SKUs the visitor intends to buy — it reserves nothing. The "sold
// once" guarantee still lives entirely in the place_order() RPC at checkout,
// which locks and verifies availability atomically. So a stale/forged cookie
// can never oversell: worst case checkout rejects an item that was taken.
import { signValue, unsignValue } from './signed';

const COOKIE_NAME = 'doku_cart';
const MAX_ITEMS = 12;

/** Serialize a list of SKUs into a signed cookie value. */
export async function encodeCart(skus: string[], secret: string): Promise<string> {
  const clean = [...new Set(skus)].filter(Boolean).slice(0, MAX_ITEMS);
  return signValue(clean.join(','), secret);
}

/** Parse and verify a cookie value back into SKUs. Tampered/invalid → []. */
export async function decodeCart(value: string | undefined, secret: string): Promise<string[]> {
  const payload = await unsignValue(value, secret);
  if (payload == null) return [];
  return payload ? payload.split(',').slice(0, MAX_ITEMS) : [];
}

export const CART_COOKIE = COOKIE_NAME;
