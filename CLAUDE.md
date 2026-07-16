# DOKU — Project Context

## Why this exists
DOKU is a premium marketplace for one-of-one objects — every item is genuinely
unique, rare, and may never restocked. The brand's entire value proposition rests
on authenticity. That makes one rule more important than any styling
preference below: **never let the site imply DOKU has an object it doesn't
actually have.** See "Hard rules."

## What it is
The public site is an **Astro 5 SSR app on Cloudflare Workers**, living in
`web/` (`web/src/pages/` — real routes, no hash router: `/`, `/collection`,
`/item/:sku`, `/cart`, `/checkout`, `/confirmation`, `/archive`,
`/provenance`, `/inquire`, `/privacy`). **Live at https://discoverdoku.com**,
served by the `doku-web` Cloudflare Worker (Custom Domain, see
`web/wrangler.jsonc`) — cut over from the old single-file site on 2026-07-12.
Every page is server-rendered per request: Astro fetches the live product
catalog from Supabase before HTML reaches the browser, so `/item/:sku` pages
are real, indexable URLs — the actual SEO win over the old `#/item/:sku`
hash routing.

Cart state is a **signed httpOnly cookie** (HMAC-SHA256, `web/src/lib/cart.ts`),
verified server-side on every request — not in-memory JS, since real page
reloads don't preserve that the way the old never-reloading SPA did. Currency
choice is a separate plain (unsigned, display-only) cookie. Neither is
`localStorage`/`sessionStorage` — see Hard rule 3. The catalog and orders live
in Supabase (see "Data model"), with a separate authenticated admin page
(`web/public/admin.html`, see "Admin") for managing them.

**Legacy, now deleted:** the pre-migration single-file SPA and its deploy
artifacts — `doku-site_8.html`, `doku-site_9.html`, `index.html`, the root
`admin.html` copy, the root `wrangler.jsonc`, and `.assetsignore` — were
removed from the repo on 2026-07-12 (cleanup pass after the Astro cutover
proved stable). The live admin page is `web/public/admin.html`. The old root
`doku` Worker (which served nothing after the cutover — `discoverdoku.com` is
served by `doku-web`) was **deleted from Cloudflare on 2026-07-15**; the
account's Workers & Pages list now contains only `doku-web`. No migration
cleanup debt remains, repo- or Cloudflare-side.

## Brand voice — apply to all copy, not just marketing pages
Six traits, treated as a literal editorial standard, originally framed by the
owner as hiring criteria for who gets to write for DOKU:
- **Clarity** — compress the thought, fewer words wins
- **Presence** — comfortable with silence; whitespace and pauses are content
- **Precision** — one exact word over three approximate ones
- **Frame** — control the angle of a statement instead of just describing
- **Observation** — name a pattern the reader hadn't noticed
- **Restraint** — end the sentence before it over-explains
Every button label, error state, and form field should be written to this
standard — not generic e-commerce copy ("Add to cart" became "Hold this
DOKU" for exactly this reason).

## Design system
- Colors: `--bg #0E0C0A` `--bg-card #161310` `--ivory #EDE6D6` `--gold #B08D57`
  `--hairline #2B2620` `--claimed #6B6258`
- Type: **Fraunces** (serif — display, headings, quotes) + **Archivo** (sans —
  body/UI). Never Inter or Roboto — that swap was deliberate, made explicitly
  to avoid the most common "unstyled" default on the web.
- Motion: `cubic-bezier(.16,1,.3,1)`, slow and deliberate. Nothing bouncy,
  nothing playful.
- Signature device: a gold corner-bracket "vitrine" frame, used for any
  product that doesn't have a real photo yet.
- Ambient effects (restored 2026-07-16 after being dropped in the Astro port):
  a drifting **golden background glow** (two slow radial-gradient blobs, pure
  CSS — `web/src/styles/ambient.css`), **rising gold "dust" motes** (20 tiny
  particles drifting up through the glow, sizes/speeds/columns randomized
  server-side in `web/src/components/Ambient.astro`, pure-CSS `rise` animation),
  and a **custom trailing cursor** (gold ring that lags the pointer, grows over
  interactive elements, and shows a word label — View / Hold / Checkout / etc.,
  from a `data-cursor` attribute on the primary CTAs — desktop/fine-pointer
  only). All restored
  WITHOUT the old momentum/weighted scroll they were originally bundled with —
  that scroll-hijack is what actually conflicted with real multi-page SSR loads
  and stays out. Both honor `prefers-reduced-motion`; the cursor hides on
  touch/coarse pointers (native cursor kept there).
- Scroll reveals (added 2026-07-16, `web/src/styles/reveal.css` +
  `web/src/components/Reveal.astro`): as elements scroll into view, product
  **vitrine frames unmask left-to-right** (clip-path wipe) and a **gold hairline
  draws in** under each section heading. One shared `IntersectionObserver`
  toggles an `.is-in` class. Progressive enhancement — the hidden initial states
  apply only under a `.js` class set in `<head>` before first paint, so no-JS
  visitors (or any observer failure) get everything visible; reduced-motion
  collapses to the final look with no animation.

## Hard rules — do not relax without the owner explicitly overriding in chat
1. **Never display an image of an object DOKU doesn't physically own**, even
   as a placeholder, unless it carries a visible "Reference image — not the
   actual piece" disclosure. Pinterest screenshots / unlicensed images are
   not acceptable under any framing, disclosed or not.
2. Unsourced items use `status:'coming-soon'` and get an original hand-drawn
   gold-line SVG sketch (`SKETCHES` object, keyed by sku) instead of a photo,
   unless a properly-licensed, disclosed reference photo has been approved.
3. No `localStorage`/`sessionStorage`, ever. On the live Astro site, cart
   state is a **signed httpOnly cookie** — server-verified, unreadable and
   unwritable by page JS — and currency choice is a plain display-only
   cookie. This is the "real backend session" this rule always said a
   multi-page site would eventually need, now that `discoverdoku.com` is one.
   The rule was never anti-cookie — it's anti client-readable persistent
   storage that could fingerprint a visitor or quietly accumulate PII.
4. Checkout on the **live** site now runs a real Razorpay flow (create-order
   → Checkout modal → signature-verified reserve via `place_order_paid()`) —
   but Razorpay is still in **test mode only** (KYC/PAN not complete, no live
   keys exist). The owner explicitly confirmed going live knowing this on
   2026-07-12 — real customer cards will fail until live keys are swapped in
   (see "Payments"). The old free/no-payment `place_order()` path has been
   revoked from `anon`; Razorpay is now the *only* reserve path, not a staged
   alternative. Never let copy imply Razorpay is processing live payments
   until `RAZORPAY_KEY_ID`/`RAZORPAY_KEY_SECRET` are actually live values.

## Data model
Catalog data lives in a Supabase Postgres table, `public.products`
(project `mudyipmizlvihcldzrvh`, schema in `supabase/schema.sql`). Fields:
`sku`, `title`, `status` (`'available'` | `'coming-soon'` | `'claimed'` |
`'reserved'`), `price`, `story` (jsonb array), `specs` (jsonb object),
`origin`, `year`, `teaser`, `epitaph`, `image`, `reference_image` (bool),
`sort_order`.

**Checkout reserves, it does not claim.** Submitting the checkout form runs
the Razorpay flow (create-order → Checkout modal → verify), which on a
verified payment calls the Postgres RPC `place_order_paid(p_skus,
p_full_name, p_email, p_address, p_city, p_postcode, p_country,
p_razorpay_order_id, p_razorpay_payment_id, p_amount_inr)` — a `SECURITY
DEFINER`, **server-only** function (called from the `razorpay-verify-payment`
Edge Function with the service-role key, never directly from the browser)
that, in one transaction: locks every item in the cart, verifies each is
still `'available'`, flips them to `'reserved'`, and writes one row per item
into `public.orders` under a shared `order_code`. `'reserved'` means "a
verified Razorpay payment came in" — it is **not yet** a fulfilled sale (see
Hard rule 4). Promote a reserved item to `'claimed'` (and write a real
epitaph) from `web/public/admin.html` once you've fulfilled it.

The older `place_order()` RPC (the pre-Razorpay free/no-payment reserve path)
still exists in the schema but its `anon` execute grant was **revoked on
2026-07-12**, right after the cutover — it is dead code from the client's
perspective now, kept only so the schema history reads cleanly. Do not
re-grant it to `anon` without a specific reason; doing so would let anyone
reserve an item for free, bypassing Razorpay entirely.

Neither `anon` nor `authenticated` can read, insert, or update `orders`
directly — RLS is enabled with zero policies (deny-all). The only way in is
through `place_order_paid()`, which bypasses RLS because it's `SECURITY
DEFINER`, and which only the Edge Function (service-role) can call. This is
deliberate: `orders` holds buyer name/email/address, and nothing in the
browser should ever be able to list or scrape it. Likewise `products` has no
public write policy. Schema + functions are both in `supabase/schema.sql`.

`web/src/lib/products.ts`'s `fetchProducts()` (server-side, called from
every SSR page) queries Supabase directly; on failure it falls back to a
small hardcoded `FALLBACK_PRODUCTS` array in the same file — kept in sync
manually as a safety net. RLS on the table allows public `SELECT` only; there
is no public write path from the browser — catalog edits happen from
`web/public/admin.html` or the Supabase dashboard directly.

Add `image:'data-uri-or-path'` (or the `image` column) to any item and it
automatically shows a real photo instead of the placeholder/sketch — see
`frame()`. Claimed items with an image automatically render desaturated.
Set `reference_image: true` alongside a photo that isn't the actual DOKU
piece — `frame()` renders the "Reference image — not the actual piece"
disclosure for it. See Hard rule 1 — this is not optional.

## Payments — Razorpay (LIVE on discoverdoku.com, test mode only)
Live since the 2026-07-12 cutover — `web/src/pages/checkout.astro` is the
real checkout, not a staged alternative. Domestic **INR** only for now.
Razorpay itself is still in **test mode**: KYC/PAN hasn't cleared, so no live
keys exist yet and real customer cards will fail. The owner was told this
explicitly and chose to go live anyway.
- **Why Edge Functions:** Astro's SSR Worker still shouldn't hold the
  Razorpay secret key directly in client-reachable code, so payments run
  through two Supabase Edge Functions (`supabase/functions/`). The secret key
  lives as a Supabase secret (`RAZORPAY_KEY_SECRET`); only the public
  `key_id` ever reaches the browser.
  - `razorpay-create-order` — computes the INR charge **server-side** from
    catalog prices (USD→INR, so the amount can't be tampered with client-side)
    and creates the Razorpay order. CORS locked to `https://discoverdoku.com`.
  - `razorpay-verify-payment` — verifies the HMAC signature, re-confirms with
    Razorpay that the payment captured, then calls `place_order_paid()`.
    CORS locked to `https://discoverdoku.com`.
- **DB:** `place_order_paid()` (migration `razorpay_payments`) forces INR,
  records `razorpay_order_id` / `razorpay_payment_id` / `amount_inr` on
  `orders`, is **idempotent** on payment id, and is **server-only** (`anon`
  has no grant; only `service_role` can call it). The browser can never
  reserve without a verified payment.
- **Client:** `web/src/pages/checkout.astro` does create-order → Razorpay
  Checkout modal → verify → reserve. Card data is entered in Razorpay's
  secure modal — DOKU never sees or stores it.
- **What's still needed to accept real payments:** PAN/KYC completion, then
  swap `RAZORPAY_KEY_ID`/`RAZORPAY_KEY_SECRET` (Supabase → Edge Functions →
  Manage secrets) to live values. Nothing else — CORS is already locked, the
  old free `place_order()` grant is already revoked, and the cutover is done.

## Customer accounts (public site) — passwordless; required to buy
Shoppers sign in with a **magic link** (Supabase Auth, passwordless). **Browsing
and holding items into the cart are fully open to guests** — no account needed to
look or to build a cart. **Completing a purchase requires an account, though:**
`/checkout` gates the final claim behind a passwordless sign-in (owner decision,
2026-07-15 — this **supersedes the earlier "guest checkout is the default"**
model; every order is now tied to an account). The gate is at checkout only, not
at "Hold this DOKU". What an account adds beyond checkout: **see your own past
orders** (with fulfillment status), **save one shipping address** that prefills
checkout, and **keep a wishlist** of pieces you're watching. Accounts are also
self-service **deletable**.
- **Checkout sign-in gate:** a guest at `/checkout` (with a non-empty cart) sees
  an inline sign-in block instead of the payment form — the held items are shown
  and preserved (the cart is an independent signed cookie, untouched by auth). It
  posts to `/api/auth/magic-link` with `next=/checkout`; after the link is
  clicked, `/auth/callback` reads a short-lived httpOnly `doku_auth_next` cookie
  and returns them to `/checkout` (default `/account`). `next` is a local path
  only (open-redirect guard). No Supabase redirect-URL allow-list change was
  needed — the destination rides a cookie, not `emailRedirectTo`.
- **Phone sign-in (built, shipped OFF).** A second passwordless method — SMS
  6-digit OTP (`/api/auth/phone-otp`: `signInWithOtp({phone})` → `verifyOtp`,
  entered on-page, no `/auth/callback` round-trip). `/login` shows Email/Mobile
  tabs and the checkout gate offers a "mobile code" link **only when the
  `PHONE_AUTH_ENABLED` Worker var is `"true"`** (`web/src/lib/flags.ts`,
  `phoneAuthEnabled()`); default off, and the `phone-otp` route is guarded so it's
  inert when off. **Why off:** SMS can't send until an SMS provider (Twilio/MSG91/
  etc.) is configured in Supabase Auth — and for +91 numbers, **DLT registration**
  — else codes never deliver (shipping a dead sign-in path breaks Hard rule 4's
  spirit). **Before enabling, also resolve:** order history matches on the verified
  JWT *email* ("Buyers read own orders by email"), so a phone-only account (no
  email) won't see email-keyed orders until we also capture/link an email; saved
  address + wishlist (keyed on `auth.uid()`) are unaffected.
- **Session storage:** unlike `admin.html` (Supabase's default `localStorage`,
  allowed there because it's a separate non-public page), the public-site
  session lives in **httpOnly cookies** via `@supabase/ssr`
  (`web/src/lib/auth.ts` → `supabaseServer()`), server-set and server-verified,
  unreadable by page JS. This is the only session storage Hard rule 3 permits
  on the public site — same reasoning as the cart cookie.
- **Middleware** (`web/src/middleware.ts`) resolves the signed-in user once per
  request into `locals.user` (+ the bound `locals.supabase` client). Anonymous
  visitors cost no network round-trip (it cheap-outs when no `sb-…-auth-token`
  cookie is present).
- **Routes:** `/login` (request link, works without JS) → `/api/auth/magic-link`
  (POST, `signInWithOtp`) → email link → `/auth/callback` (`exchangeCodeForSession`,
  PKCE) → `/account`. `/api/auth/signout` (POST) clears the session.
  `/account` is protected (guests redirect to `/login`).
- **Order history needs NO change to checkout / Razorpay / `place_order_paid`.**
  Orders already store the buyer's `email`; a magic link proves the user owns
  that email, so `/account` reads back orders whose email matches their verified
  JWT (RLS policy "Buyers read own orders by email", case-insensitive). A guest
  who later signs in with the same email retroactively sees those orders. The
  account page shows the **real `amount_inr` charged** (paise → ₹), never the
  per-row USD `price` that `place_order_paid` mislabels `'INR'`.
- **Saved address:** `customer_addresses` table, one row per account keyed by
  `auth.users.id`, RLS owner-only on every verb (`auth.uid() = id`). Saved from
  `/account` (`/api/account/address`) or via a "save this address" checkbox at
  checkout (persisted server-side in `/api/checkout-complete`, since the browser
  can't write the httpOnly session). Prefills the checkout form when signed in.
- **Ops steps to make magic links actually deliver — DONE (2026-07-15):** (1)
  `https://discoverdoku.com/auth/callback` (and `http://localhost:4321/auth/callback`
  for dev) are allow-listed in Supabase → Auth → URL Configuration → Redirect URLs;
  (2) **custom SMTP** is configured (Supabase's built-in auth email was heavily
  rate-limited and test-grade). Magic links now deliver — the flow is fully live,
  no longer gated on an ops step.
- **Wishlist (not a hold):** `wishlists` table, one row per `(user_id, sku)`,
  RLS owner-only (`auth.uid() = user_id`), cascades on account deletion. A
  wishlist **never** changes a product's status — the piece stays purchasable by
  anyone; only a paid Razorpay order reserves a one-of-one. Toggled from the item
  page (signed-in) via `/api/account/wishlist`; shown under "Watching" on
  `/account`. Items already reserved/claimed instead offer a **Web3Forms
  "notify me if it frees up" waitlist** (email only, no DB row) — same transport
  as "Notify me". Guests see a "Sign in to keep a list" prompt.
- **Order status:** `orders.order_status` (`reserved` → `confirmed` → `shipped`
  → `delivered`, default `reserved`) + `orders.tracking_note`, shared across all
  rows of an `order_code`. Admins advance it from `admin.html` (Orders panel;
  "Admins update orders" RLS policy); the buyer sees a 4-step indicator + the
  tracking note (once shipped) on `/account`. Buyers stay read-only. This is the
  customer-visible layer over the manual `reserved`→`claimed` product promotion.
- **Self-service deletion:** `/account` → `/api/account/delete` (requires an
  explicit confirm) → the **`delete-account` Edge Function** (service-role, the
  only way to delete an auth user; CORS locked to `discoverdoku.com`, identifies
  the caller from their own JWT). Deleting the auth user cascades their saved
  address + wishlist. **Order rows are KEPT** as the sale/receipt record (orders
  don't reference `auth.users`, so nothing orphans) — owner's decision. On
  success the session is cleared and the shopper lands on `/?farewell=1`.
- Schema (`customer_addresses`, `wishlists`, the orders own-email read policy +
  `order_status`/`tracking_note` + admin update policy) is in
  `supabase/schema.sql` under "CUSTOMER ACCOUNTS" and "WISHLIST + ORDER STATUS".

## Admin — `web/public/admin.html`
A **separate, standalone page** (not part of the Astro app's routes, not
linked from the public site) for managing the catalog and viewing orders.
Kept separate on purpose: it needs a persistent auth session, which means
Supabase's default `localStorage` — allowed here precisely because it is NOT
the public site that Hard rule 3 governs. It's served as a plain static
asset by the `doku-web` Worker (via `web/public/`, which Astro copies
verbatim into the build), not rendered by Astro itself — do not fold it into
the Astro app's routing. **A duplicate copy still sits at the repo root**
(`admin.html`) from before the cutover — that copy is dead (no longer
served) and is cleanup debt; edit `web/public/admin.html` only.
- **Auth:** Supabase Auth (email/password). Admin accounts are the rows in the
  `admins` allowlist — currently `apoorvverma0396@gmail.com` and
  `admin@discoverdoku.com`. Write access is gated on `admins` membership via
  the `is_admin()` SECURITY DEFINER helper — being merely `authenticated` is
  NOT enough, so leaving public signups on can't grant a stranger access. The
  login flow also re-checks `is_admin()` and signs out non-admins.
  **Gotcha:** create admin users via the Supabase dashboard / Admin API, NOT a
  raw `INSERT` into `auth.users` — a raw insert leaves GoTrue's token columns
  (`confirmation_token`, `recovery_token`, …) NULL and every login 500s with
  "Database error querying schema" until they're all set to `''`.
- **What it does:** create / edit / delete products (all fields, incl.
  `story`/`specs`/`image`), promote a `reserved` item to `claimed` with a
  hand-written epitaph (the manual step Session 8 left open), and read
  orders with buyer details. All via the same anon key as the public site —
  RLS is what distinguishes them, never a secret in the file.
- **Access:** on the live site, `discoverdoku.com/admin.html` sits behind a
  **Cloudflare Access** (Zero Trust) gate — an edge identity check (allow-list
  by email; team `soft-firefly-9a4f.cloudflareaccess.com`) that runs BEFORE the
  page loads, so admin is double-gated (Cloudflare Access → Supabase login).
  The page also carries `noindex,nofollow` and isn't linked from the main site.
  The anon key alone grants no write/order access without an admin session.
- Schema (the `admins` table, `is_admin()`, and the admin RLS policies) is
  in `supabase/schema.sql`.

## Data & privacy — actual current behavior
- **No `localStorage`/`sessionStorage` anywhere.** Cart is a signed httpOnly
  cookie; currency is a plain display-only cookie; consent state is
  unpersisted (reappears each session). See Hard rule 3.
- **Checkout transmits buyer/shipping data plus a verified Razorpay payment —
  never raw card data.** `web/src/pages/checkout.astro` sends name/email/
  address to `place_order_paid()` only after `razorpay-verify-payment`
  confirms the charge; card details are entered in Razorpay's own secure
  modal and never reach DOKU's code at all.
- **Currency & region.** `RegionBar.astro` maps the visitor's guessed country/
  region to a currency (USD/EUR/GBP/INR/JPY, USD fallback) via a plain,
  unsigned, display-only cookie (`web/src/lib/currency.ts` / `currency-client.ts`) —
  never a trust boundary, since the real charge is always computed
  server-side from catalog USD prices. Conversion uses live Frankfurter API
  rates with hardcoded fallbacks.
- **"Inquire" (and "Notify me" on item pages) DO submit** — to Web3Forms
  (`api.web3forms.com`), carrying whatever name/email/message the visitor
  enters (`WEB3FORMS_KEY` in `web/src/lib/forms.ts`, a public/domain-scoped
  key by Web3Forms' design, not a secret). Both disclose this inline via
  `.fine-print`, linking to `/privacy`.
- **Google Analytics (GA4, ID `G-S1MKLYC4QS`) is consent-gated.** `Base.astro`'s
  `<head>` snippet defines a `gtag` stub and `loadAnalytics()` but doesn't
  load the GA script or fire `config` on page load. `ConsentBar.astro` only
  calls `loadAnalytics()` on Accept; Decline (or ignoring the bar) means no
  GA request ever fires.
- `/privacy` (`web/src/pages/privacy.astro`) is the single source of truth
  for what's collected and where it goes — keep it in sync if any of the
  above changes.

## Monitoring — Sentry (error alerting)
Error monitoring runs through **Sentry** (free Developer plan; EU-hosted
project, DSN `…@o4511745144061952.ingest.de.sentry.io/4511745519779920`).
Deliberately **no Sentry SDK** — a dependency-free helper POSTs an error
*envelope* over `fetch`, so nothing is added to the payment-path bundle or
cold start. Two mirror copies of the same tiny helper:
- **SSR Worker:** `web/src/lib/sentry.ts` (`captureError()`), wired into
  `web/src/middleware.ts` — any unhandled SSR throw or 5xx response is
  captured. DSN read from the `SENTRY_DSN` Worker var (`web/wrangler.jsonc`
  `vars`), with a hardcoded fallback. A Sentry DSN is a write-only ingest key,
  safe to expose — it is **not** a secret (same class as a browser DSN).
- **Edge Functions:** an inline `sentry()` helper in `razorpay-verify-payment`,
  `razorpay-refund`, and `razorpay-create-order` — all three **deployed live
  2026-07-16** with the capture in place. Reads `SENTRY_DSN` from Deno env with
  the same fallback.
- **What's captured (deliberately narrow, to avoid alert fatigue + free-tier
  quota burn):** money-critical faults only — `paid_but_unreserved` (a
  captured payment that failed to reserve — the single most important alert),
  a Razorpay refund that failed or succeeded-but-wasn't-recorded, a Razorpay
  order-creation failure, and unhandled SSR 5xx. Expected 4xx (bad signature,
  not-an-admin, item-already-taken) are **not** captured — they're noise.
- Alerts go to **email** (Sentry's built-in default). SMS later can reuse the
  same Twilio account the phone-OTP flag will need.

## Known gaps / likely next steps
- No real product photography yet — placeholders and sketches throughout.
  **Object storage now exists for this:** a Cloudflare **R2** bucket
  `doku-product-images` was created 2026-07-16 and bound into the Worker as
  `PRODUCT_IMAGES` (`web/wrangler.jsonc`). Nothing reads/writes it yet — the
  `admin.html` upload path and an image-serving route are still to build.
  Chosen over Supabase Storage: R2's free tier is larger (10GB vs 1GB),
  permanent, egress-free, and native to the existing Cloudflare stack.
- **🔴 OPEN SECURITY ISSUE — payment bypass.** `place_order_paid()` (and the
  old free `place_order()`) are still directly executable by `anon`/
  `authenticated` via PostgREST, despite `revoke ... from public` in their
  migrations — Supabase grants EXECUTE directly to those roles on function
  creation, and revoking from the `PUBLIC` pseudo-role never touched those
  grants. Confirmed live via `has_function_privilege()`. Impact: anyone can
  call `place_order_paid` with fabricated Razorpay ids and reserve a one-of-one
  for free, bypassing payment entirely — breaks Hard rule 4's core guarantee.
  Fix is a two-line restrictive migration (`revoke all ... from anon,
  authenticated` on both functions; re-grant `place_order_paid` to
  `service_role` only). **FIXED 2026-07-16** — migration
  `fix_place_order_paid_privilege_leak` applied live; `has_function_privilege()`
  now returns false for `anon` and `authenticated` on both functions (only
  `service_role`, which the verify-payment Edge Function uses, can execute).
- **Refunds — capability built.** A `razorpay-refund` Edge Function (admin-
  gated: verifies the caller's JWT, re-checks `is_admin()`, calls Razorpay's
  refund API, records `refund_id`/`refunded_amount_inr`/`refunded_at` +
  `order_status:'refunded'`), invoked from a **Refund** button per order in
  `admin.html`; `/account` shows a refunded order as "Refunded" instead of the
  step tracker. Migration `20260716_refunds.sql` + the function are **deployed
  live**; the `admin.html`/`account.astro` UI is code, live on next Worker
  deploy. Full refunds only (each order is one one-of-one piece). `'refunded'`
  is reachable ONLY through the button (a real Razorpay refund), never the
  plain status dropdown — so the column can't claim money moved that didn't.
  **Returns *policy* still undecided** — this is the mechanism, not a customer-
  facing returns flow.
- **Razorpay real payments not yet possible.** The integration itself is
  live and correct (see "Payments") but running in test mode — PAN/KYC isn't
  done, so no live keys exist. Real customer cards will fail at checkout
  until that clears and `RAZORPAY_KEY_ID`/`RAZORPAY_KEY_SECRET` are swapped
  to live values. Domestic INR only even then — international cards need
  separate Razorpay activation.
- **Customer accounts are fully live and now required to buy.** The passwordless
  flow (login, order history + fulfillment status, saved address, wishlist/
  waitlist, self-service deletion) is built; magic-link delivery works (custom
  SMTP + the allow-listed callback redirect URL, done 2026-07-15). **As of
  2026-07-15 the final checkout is gated behind sign-in** (browsing + holding
  stay open to guests) — this replaced the earlier guest-checkout default at the
  owner's request. See "Customer accounts". Still not built: a functional
  off-market "hold" (deliberately — conflicts with the one-of-one + "reserved =
  paid" model). Order status now includes `refunded` (see Monitoring/refunds
  above) — the refund *mechanism* exists, but a customer-facing returns *flow*/
  policy is still undecided.
- No domain email yet — `enquiry@` / `admin@discoverdoku.com` mailboxes
  (Google Workspace) are planned but not set up, so `admin@` password-reset
  emails can't be delivered (rotate the password in-app instead).
- Leaked-password protection (HaveIBeenPwned) is off in Supabase Auth — it's a
  Pro-plan feature, parked (not worth a plan upgrade on its own).
- **Cleanup debt from the migration: done.** The dead repo files
  (`doku-site_8/9.html`, root `index.html`/`admin.html`/`wrangler.jsonc`,
  `.assetsignore`) were deleted on 2026-07-12, and the old root `doku`
  Cloudflare Worker (which served nothing) was deleted from the dashboard on
  2026-07-15. Nothing left outstanding here.