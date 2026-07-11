// One HMAC-SHA256 signing primitive for every signed cookie on the site (the
// cart, the post-checkout order handoff). Web Crypto — available on Cloudflare
// Workers and in dev. Signing stops a visitor hand-editing a cookie into a
// value the server would trust; it is NOT a security boundary around inventory
// or orders — the database (RLS + place_order) is. See [[Hard rule 3]].

const encoder = new TextEncoder();

function toB64Url(bytes: ArrayBuffer): string {
  const b = btoa(String.fromCharCode(...new Uint8Array(bytes)));
  return b.replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '');
}

function keyMaterial(secret: string) {
  return crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
}

async function hmac(payload: string, secret: string): Promise<string> {
  const mac = await crypto.subtle.sign('HMAC', await keyMaterial(secret), encoder.encode(payload));
  return toB64Url(mac);
}

/** Serialize a payload string into `payload.signature`. */
export async function signValue(payload: string, secret: string): Promise<string> {
  return `${payload}.${await hmac(payload, secret)}`;
}

/** Verify a `payload.signature` string; returns the payload or null if tampered. */
export async function unsignValue(value: string | undefined, secret: string): Promise<string | null> {
  if (!value) return null;
  const dot = value.lastIndexOf('.');
  if (dot < 0) return null;
  const payload = value.slice(0, dot);
  const sig = value.slice(dot + 1);
  return (await hmac(payload, secret)) === sig ? payload : null;
}

/** Sign a small JSON object into a cookie-safe string. */
export async function signJson(obj: unknown, secret: string): Promise<string> {
  const payload = toB64Url(encoder.encode(JSON.stringify(obj)));
  return signValue(payload, secret);
}

/** Verify + parse a signed JSON cookie; returns the object or null. */
export async function unsignJson<T>(value: string | undefined, secret: string): Promise<T | null> {
  const payload = await unsignValue(value, secret);
  if (!payload) return null;
  try {
    let b64 = payload.replaceAll('-', '+').replaceAll('_', '/');
    b64 += '='.repeat((4 - (b64.length % 4)) % 4); // restore stripped padding
    return JSON.parse(atob(b64)) as T;
  } catch {
    return null;
  }
}
