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
  "Access-Control-Allow-Origin": "*", // tighten to https://discoverdoku.com before go-live
  "Access-Control-Allow-Headers": "authorization, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });

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
    return json({ error: "Could not create order", detail: order?.error?.description }, 502);
  }

  return json({
    key_id: KEY_ID,
    order_id: order.id,
    amount: amountPaise,
    currency: "INR",
  });
});
