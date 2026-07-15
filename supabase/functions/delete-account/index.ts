// delete-account
// Lets a signed-in shopper permanently delete their OWN account. The caller's
// JWT (Authorization header) is the identity — we never trust a user id from the
// body. A service-role admin call then hard-deletes that auth user, which
// cascades their saved address + wishlist (both FK auth.users on delete
// cascade). Order rows are intentionally KEPT — they are the sale/receipt record
// (owner's decision), and orders do not reference auth.users, so nothing
// orphans. Called server-to-server from /api/account/delete, never the browser.
//
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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const SB_URL = Deno.env.get("SUPABASE_URL");
  const ANON = Deno.env.get("SUPABASE_ANON_KEY");
  const SB_SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!SB_URL || !ANON || !SB_SERVICE) return json({ error: "Server not configured" }, 500);

  const authHeader = req.headers.get("Authorization") ?? "";
  if (!authHeader.toLowerCase().startsWith("bearer ")) return json({ error: "Not signed in" }, 401);

  // 1. Identify the caller from their own token — the security boundary.
  const userRes = await fetch(`${SB_URL}/auth/v1/user`, {
    headers: { Authorization: authHeader, apikey: ANON },
  });
  const user = await userRes.json();
  if (!userRes.ok || !user?.id) return json({ error: "Not signed in" }, 401);

  // 2. Hard-delete that auth user with the service role. Cascades
  //    customer_addresses + wishlists. Orders are kept.
  const del = await fetch(`${SB_URL}/auth/v1/admin/users/${user.id}`, {
    method: "DELETE",
    headers: { apikey: SB_SERVICE, Authorization: `Bearer ${SB_SERVICE}` },
  });
  if (!del.ok) {
    console.error("delete-account:", del.status, await del.text());
    return json({ error: "Could not delete account" }, 500);
  }

  return json({ ok: true });
});
