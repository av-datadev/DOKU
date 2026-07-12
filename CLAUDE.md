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

**Legacy, no longer live:** `doku-site_9.html`, `index.html` (repo root), the
root `doku` Cloudflare Worker, and the repo-root copy of `admin.html` are the
pre-migration single-file SPA and its deploy artifacts. They still exist in
the repo (nothing was deleted) but `discoverdoku.com` no longer points to any
of them — do not edit them expecting changes to reach production. The live
admin page is `web/public/admin.html`; the root copy is dead weight pending
cleanup.

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

## Known gaps / likely next steps
- No real product photography yet — placeholders and sketches throughout
- **Razorpay real payments not yet possible.** The integration itself is
  live and correct (see "Payments") but running in test mode — PAN/KYC isn't
  done, so no live keys exist. Real customer cards will fail at checkout
  until that clears and `RAZORPAY_KEY_ID`/`RAZORPAY_KEY_SECRET` are swapped
  to live values. Domestic INR only even then — international cards need
  separate Razorpay activation.
- No *customer* accounts — buyers still check out as guests (by design).
  Admin auth exists (see Admin), but shoppers have no login.
- No domain email yet — `enquiry@` / `admin@discoverdoku.com` mailboxes
  (Google Workspace) are planned but not set up, so `admin@` password-reset
  emails can't be delivered (rotate the password in-app instead).
- Leaked-password protection (HaveIBeenPwned) is off in Supabase Auth — it's a
  Pro-plan feature, parked (not worth a plan upgrade on its own).
- **Cleanup debt from the migration:** `doku-site_9.html`, root `index.html`,
  the root `doku` Cloudflare Worker/`wrangler.jsonc`, and the root
  `admin.html` copy are all dead now that `discoverdoku.com` serves
  `doku-web` from `web/`. Nothing was deleted during the cutover itself
  (lower-risk to leave them and confirm stability first) — worth an explicit
  pass to remove them once the Astro site has been live a while without issues.