// razorpay-refund
// Lets a signed-in DOKU admin issue a Razorpay refund (full, by default) for
// an order. Caller identity comes from their own JWT, then is_admin() is
// re-checked server-side — being merely authenticated is not enough (same
// posture as admin.html's write access). Money-moving, so nothing here is
// ever reachable from a plain browser session that isn't an admin's.
//
// Secrets: RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET
// Auto-provided: SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY

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
// Called only for money-critical faults — a refund that failed at Razorpay, or
// (worse) one that succeeded but couldn't be recorded — never for expected
// 4xx like "not an admin" or "already refunded".
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
      server_name: "razorpay-refund", environment: "production",
      tags: { fn: "razorpay-refund" },
      extra: { ...extra, ...(isErr && err.stack ? { stack: err.stack } : {}) },
      exception: { values: [{ type: isErr ? err.name : "Error", value: isErr ? err.message : String(err) }] },
    };
    await fetch(`https://${host}/api/${project}/envelope/?sentry_key=${key}&sentry_version=7`, {
      method: "POST", headers: { "Content-Type": "application/x-sentry-envelope" },
      body: `${JSON.stringify({ event_id: eid, sent_at: now })}\n${JSON.stringify({ type: "event" })}\n${JSON.stringify(event)}\n`,
    });
  } catch { /* monitoring must never break the request */ }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const KEY_ID = Deno.env.get("RAZORPAY_KEY_ID");
  const KEY_SECRET = Deno.env.get("RAZORPAY_KEY_SECRET");
  const SB_URL = Deno.env.get("SUPABASE_URL");
  const ANON = Deno.env.get("SUPABASE_ANON_KEY");
  const SB_SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!KEY_ID || !KEY_SECRET || !SB_URL || !ANON || !SB_SERVICE) {
    return json({ error: "Server not configured" }, 500);
  }

  const authHeader = req.headers.get("Authorization") ?? "";
  if (!authHeader.toLowerCase().startsWith("bearer ")) return json({ error: "Not signed in" }, 401);

  // 1. Identify the caller from their own token — the security boundary.
  const userRes = await fetch(`${SB_URL}/auth/v1/user`, {
    headers: { Authorization: authHeader, apikey: ANON },
  });
  const user = await userRes.json();
  if (!userRes.ok || !user?.id) return json({ error: "Not signed in" }, 401);

  // 2. Confirm admin membership.
  const adminRes = await fetch(`${SB_URL}/rest/v1/rpc/is_admin`, {
    method: "POST",
    headers: { Authorization: authHeader, apikey: ANON, "Content-Type": "application/json" },
    body: "{}",
  });
  const isAdmin = await adminRes.json();
  if (!adminRes.ok || isAdmin !== true) return json({ error: "Admin access required" }, 403);

  let b: any;
  try { b = await req.json(); } catch { return json({ error: "Bad request" }, 400); }
  const order_code = String(b?.order_code ?? "");
  if (!order_code) return json({ error: "order_code is required" }, 400);

  // 3. Look up the payment behind this order.
  const rowsRes = await fetch(
    `${SB_URL}/rest/v1/orders?order_code=eq.${encodeURIComponent(order_code)}&select=razorpay_payment_id,refund_id&limit=1`,
    { headers: { apikey: SB_SERVICE, Authorization: `Bearer ${SB_SERVICE}` } },
  );
  const rows = await rowsRes.json();
  const row = rows?.[0];
  if (!rowsRes.ok || !row) return json({ error: "Order not found" }, 404);
  if (!row.razorpay_payment_id) return json({ error: "Order has no Razorpay payment on file" }, 404);
  if (row.refund_id) return json({ error: "This order was already refunded" }, 409);

  // 4. Issue a full refund at Razorpay. (Partial refunds aren't exposed here —
  //    every order is a single one-of-one piece, so a refund is always the
  //    whole thing.)
  const auth = btoa(`${KEY_ID}:${KEY_SECRET}`);
  const refundRes = await fetch(
    `https://api.razorpay.com/v1/payments/${row.razorpay_payment_id}/refund`,
    {
      method: "POST",
      headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/json" },
      body: JSON.stringify({ speed: "normal" }),
    },
  );
  const refund = await refundRes.json();
  if (!refundRes.ok) {
    console.error("razorpay-refund:", refundRes.status, refund);
    await sentry(new Error("refund failed at Razorpay"), {
      order_code, razorpay_payment_id: row.razorpay_payment_id,
      status: refundRes.status, detail: refund?.error?.description,
    });
    return json({ error: refund?.error?.description ?? "Refund failed at Razorpay" }, 502);
  }

  // 5. Record it on every row of this order and mark fulfillment refunded.
  const upd = await fetch(
    `${SB_URL}/rest/v1/orders?order_code=eq.${encodeURIComponent(order_code)}`,
    {
      method: "PATCH",
      headers: {
        apikey: SB_SERVICE, Authorization: `Bearer ${SB_SERVICE}`,
        "Content-Type": "application/json", Prefer: "return=minimal",
      },
      body: JSON.stringify({
        refund_id: refund.id,
        refunded_amount_inr: refund.amount,
        refunded_at: new Date().toISOString(),
        order_status: "refunded",
      }),
    },
  );
  if (!upd.ok) {
    const detail = await upd.text();
    console.error("razorpay-refund: refund succeeded but DB update failed", detail);
    // Worst case: money was returned at Razorpay but the order still reads as
    // paid/reserved here. Must be reconciled by hand — always alert.
    await sentry(new Error("refunded_but_unrecorded: Razorpay refund succeeded but DB update failed"), {
      order_code, refund_id: refund.id, refunded_amount_inr: refund.amount, detail,
    });
    return json({ error: "refunded_but_unrecorded", refund_id: refund.id }, 500);
  }

  return json({ ok: true, refund_id: refund.id, amount_inr: refund.amount });
});
