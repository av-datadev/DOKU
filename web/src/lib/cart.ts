// Signed-cookie cart. Replaces the old in-memory JS cart now that the site has
// real, reloading routes (Hard rule 3 forbids localStorage; a server-signed
// httpOnly cookie is the correct multi-page substitute). The cart is only a
// list of SKUs the visitor intends to buy — it reserves nothing. The "sold
// once" guarantee still lives entirely in the place_order() RPC at checkout,
// which locks and verifies availability atomically. So a stale/forged cookie
// can never oversell: worst case checkout rejects an item that was taken.
//
// Signing (HMAC-SHA256 via Web Crypto, available on Workers and in dev) stops
// a visitor from hand-editing the cookie into a malformed value; it is not a
// security boundary around inventory — the database is.

const COOKIE_NAME = 'doku_cart';
const MAX_ITEMS = 12;

function keyMaterial(secret: string) {
  return crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify'],
  );
}

function toB64Url(bytes: ArrayBuffer): string {
  const b = btoa(String.fromCharCode(...new Uint8Array(bytes)));
  return b.replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '');
}

async function sign(payload: string, secret: string): Promise<string> {
  const mac = await crypto.subtle.sign('HMAC', await keyMaterial(secret), new TextEncoder().encode(payload));
  return toB64Url(mac);
}

/** Serialize a list of SKUs into a signed cookie value. */
export async function encodeCart(skus: string[], secret: string): Promise<string> {
  const clean = [...new Set(skus)].filter(Boolean).slice(0, MAX_ITEMS);
  const payload = clean.join(',');
  const sig = await sign(payload, secret);
  return `${payload}.${sig}`;
}

/** Parse and verify a cookie value back into SKUs. Tampered/invalid → []. */
export async function decodeCart(value: string | undefined, secret: string): Promise<string[]> {
  if (!value) return [];
  const dot = value.lastIndexOf('.');
  if (dot < 0) return [];
  const payload = value.slice(0, dot);
  const sig = value.slice(dot + 1);
  if ((await sign(payload, secret)) !== sig) return [];
  return payload ? payload.split(',').slice(0, MAX_ITEMS) : [];
}

export const CART_COOKIE = COOKIE_NAME;
