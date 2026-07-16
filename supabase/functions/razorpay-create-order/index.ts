// razorpay-create-order
// Creates a Razorpay order for the items in the cart. The charge amount is
// computed HERE from the prices stored in Supabase (never trusted from the
// client), converted USD -> INR, and expressed in paise. Returns the public
// key_id + order_id for Razorpay Checkout to open on the browser.
//
// Secrets (set in Supabase -> Edge Functions -> Manage secrets):
//   RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET
// Auto-provided by Supabase: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

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
// Called only when Razorpay refuses to create an order — i.e. checkout can't
// even begin — not for expected 4xx like an item already being taken.
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
      server_name: "razorpay-create-order", environment: "production",
      tags: { fn: "razorpay-create-order" },
      extra: { ...extra, ...(isErr && err.stack ? { stack: err.stack } : {}) },
      exception: { values: [{ type: isErr ? err.name : "Error", value: isErr ? err.message : String(err) }] },
    };
    await fetch(`https://${host}/api/${project}/envelope/?sentry_key=${key}&sentry_version=7`, {
      method: "POST", headers: { "Content-Type": "application/x-sentry-envelope" },
      body: `${JSON.stringify({ event_id: eid, sent_at: now })}\n${JSON.stringify({ type: "event" })}\n${JSON.stringify(event)}\n`,
    });
  } catch { /* monitoring must never break the request */ }
}

async function usdToInrRate(): Promise<number> {
  try {
    const r = await fetch("https://api.frankfurter.app/latest?from=USD&to=INR", {
      signal: AbortSignal.timeout(2000),
    });
    const d = await r.json();
    const rate = d?.rates?.INR;
    if (typeof rate === "number" && rate > 0) return rate;
  } catch (_) { /* fall through to fallback */ }
  return 83; // indicative fallback, matches the site's defensive pattern
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

  let skus: string[];
  try {
    const body = await req.json();
    skus = Array.isArray(body?.skus) ? body.skus.map(String) : [];
  } catch {
    return json({ error: "Bad request" }, 400);
  }
  if (skus.length === 0) return json({ error: "No items given" }, 400);

  // Fetch prices/status from the DB (service role, bypasses RLS).
  const inList = skus.map((s) => `"${s.replace(/"/g, "")}"`).join(",");
  const res = await fetch(
    `${SB_URL}/rest/v1/products?select=sku,price,status&sku=in.(${inList})`,
    { headers: { apikey: SB_SERVICE, Authorization: `Bearer ${SB_SERVICE}` } },
  );
  const rows: Array<{ sku: string; price: number; status: string }> = await res.json();

  // Every requested item must exist and still be available.
  for (const sku of skus) {
    const row = rows.find((r) => r.sku === sku);
    if (!row) return json({ error: `Unknown item ${sku}` }, 400);
    if (row.status !== "available") {
      return json({ error: `Item ${sku} is no longer available` }, 409);
    }
  }

  const usdTotal = rows
    .filter((r) => skus.includes(r.sku))
    .reduce((sum, r) => sum + Number(r.price || 0), 0);
  if (usdTotal <= 0) return json({ error: "Price unavailable" }, 400);

  const rate = await usdToInrRate();
  const amountPaise = Math.round(usdTotal * rate * 100);

  // Create the Razorpay order.
  const auth = btoa(`${KEY_ID}:${KEY_SECRET}`);
  const rp = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      amount: amountPaise,
      currency: "INR",
      receipt: `doku_${Date.now()}`,
      notes: { skus: skus.join(",") },
    }),
  });
  const order = await rp.json();
  if (!rp.ok || !order?.id) {
    await sentry(new Error("Razorpay order creation failed"), {
      skus, amountPaise, status: rp.status, detail: order?.error?.description,
    });
    return json({ error: "Could not create order", detail: order?.error?.description }, 502);
  }

  return json({
    key_id: KEY_ID,
    order_id: order.id,
    amount: amountPaise,
    currency: "INR",
  });
});
