// razorpay-verify-payment
// Verifies the Razorpay signature returned by Checkout, confirms the payment
// is actually captured/authorized at Razorpay, and ONLY THEN reserves the
// item(s) via place_order_paid(). The signature is the security boundary: a
// failed check means a tampered/forged payment and the request is rejected.
//
// Secrets: RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET
// Auto-provided: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

const CORS = {
  "Access-Control-Allow-Origin": "https://discoverdoku.com",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-api-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });

// Fire-and-forget Sentry capture (dependency-free envelope POST). Never throws.
// DSN is a write-only ingest key; read from env with a fallback so it works
// even before the SENTRY_DSN secret is set. We ONLY call this for money-
// critical faults (a captured payment that failed to reserve, or an unexpected
// crash) — never for expected 4xx like a bad signature, which would be noise.
async function sentry(err: unknown, extra: Record<string, unknown> = {}) {
  try {
    const dsn = Deno.env.get("SENTRY_DSN") ??
      "https://c9e59ba11261521cfb64b18666157efb@o4511745144061952.ingest.de.sentry.io/4511745519779920";
    const m = dsn.match(/^https:\/\/([^@]+)@([^/]+)\/(.+)$/);
    if (!m) return;
    const [, key, host, project] = m;
    const eid = crypto.randomUUID().replace(/-/g, "");
    const now = new Date().toISOString();
    const isErr = err instanceof Error;
    const event = {
      event_id: eid, timestamp: now, platform: "javascript", level: "error",
      server_name: "razorpay-verify-payment", environment: "production",
      tags: { fn: "razorpay-verify-payment" },
      extra: { ...extra, ...(isErr && err.stack ? { stack: err.stack } : {}) },
      exception: { values: [{ type: isErr ? err.name : "Error", value: isErr ? err.message : String(err) }] },
    };
    await fetch(`https://${host}/api/${project}/envelope/?sentry_key=${key}&sentry_version=7`, {
      method: "POST", headers: { "Content-Type": "application/x-sentry-envelope" },
      body: `${JSON.stringify({ event_id: eid, sent_at: now })}\n${JSON.stringify({ type: "event" })}\n${JSON.stringify(event)}\n`,
    });
  } catch { /* monitoring must never break the request */ }
}

async function hmacHex(secret: string, msg: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(msg));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

// constant-time string compare
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const KEY_ID = Deno.env.get("RAZORPAY_KEY_ID");
  const KEY_SECRET = Deno.env.get("RAZORPAY_KEY_SECRET");
  const SB_URL = Deno.env.get("SUPABASE_URL");
  const SB_SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!KEY_ID || !KEY_SECRET || !SB_URL || !SB_SERVICE) {
    return json({ error: "Server not configured" }, 500);
  }

  let b: any;
  try { b = await req.json(); } catch { return json({ error: "Bad request" }, 400); }

  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, skus, buyer } = b ?? {};
  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature ||
      !Array.isArray(skus) || skus.length === 0 || !buyer) {
    return json({ error: "Missing fields" }, 400);
  }

  // 1. Signature check — the core security boundary.
  const expected = await hmacHex(KEY_SECRET, `${razorpay_order_id}|${razorpay_payment_id}`);
  if (!safeEqual(expected, String(razorpay_signature))) {
    return json({ error: "Payment could not be verified" }, 400);
  }

  // 2. Independently confirm with Razorpay that the payment is real + captured,
  //    and that it belongs to this order.
  const auth = btoa(`${KEY_ID}:${KEY_SECRET}`);
  const payRes = await fetch(
    `https://api.razorpay.com/v1/payments/${razorpay_payment_id}`,
    { headers: { Authorization: `Basic ${auth}` } },
  );
  const pay = await payRes.json();
  if (!payRes.ok || pay?.order_id !== razorpay_order_id ||
      !["captured", "authorized"].includes(pay?.status)) {
    return json({ error: "Payment not confirmed" }, 400);
  }

  // 3. Reserve the item(s), recording the verified payment. Server-only RPC.
  const rpc = await fetch(`${SB_URL}/rest/v1/rpc/place_order_paid`, {
    method: "POST",
    headers: {
      apikey: SB_SERVICE,
      Authorization: `Bearer ${SB_SERVICE}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      p_skus: skus.map(String),
      p_full_name: String(buyer.full_name ?? ""),
      p_email: String(buyer.email ?? ""),
      p_address: String(buyer.address ?? ""),
      p_city: String(buyer.city ?? ""),
      p_postcode: String(buyer.postcode ?? ""),
      p_country: String(buyer.country ?? ""),
      p_razorpay_order_id: razorpay_order_id,
      p_razorpay_payment_id: razorpay_payment_id,
      p_amount_inr: Number(pay.amount) || null,
    }),
  });
  const order_code = await rpc.json();
  if (!rpc.ok) {
    // Payment succeeded but reservation failed (e.g. item taken between pay
    // and verify). Surface clearly — this needs a manual refund/reconcile.
    // This is the single most important thing to be alerted about: a real
    // charge with no matching order. Fire a Sentry event.
    await sentry(new Error("paid_but_unreserved: captured payment did not reserve"), {
      razorpay_payment_id, razorpay_order_id, skus,
      rpc_message: typeof order_code?.message === "string" ? order_code.message : undefined,
    });
    return json({
      error: "paid_but_unreserved",
      message: typeof order_code?.message === "string" ? order_code.message : "Item unavailable after payment",
      razorpay_payment_id,
    }, 409);
  }

  return json({ order_code });
});
