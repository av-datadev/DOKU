# DOKU — Project Context

## Why this exists
DOKU is a premium marketplace for one-of-one objects — every item is genuinely
unique, rare, and may never restocked. The brand's entire value proposition rests
on authenticity. That makes one rule more important than any styling
preference below: **never let the site imply DOKU has an object it doesn't
actually have.** See "Hard rules."

## What it is
A client-side SPA (a single self-contained HTML page) with hash-based routing
(`#/`, `#/collection`, `#/item/:sku`, `#/cart`, `#/checkout`, `#/confirmation`,
`#/archive`, `#/provenance`, `#/inquire`, `#/privacy`). No build step, no
framework. **Live at https://discoverdoku.com**, served from Cloudflare
Workers (static assets, `wrangler.jsonc`), auto-deployed from `main`. Cart and
currency selection live in plain JS variables (in-memory only) — that's
intentional, not a missing feature, see Hard rules. The catalog and orders
live in Supabase (see "Data model"), with a separate authenticated admin page
(`admin.html`, see "Admin") for managing them — that's the real backend the
site has. NOTE: the in-memory / no-storage rule (Hard rule 3) applies to the
public SPA only, NOT to `admin.html`, which is a distinct authenticated page
and deliberately uses Supabase's default localStorage session — see Admin.

**File layout — important.** The public site is authored in `doku-site_9.html`
(the active source); `index.html` at the repo root is its deploy copy. They
**currently diverge by exactly the payment code**: `index.html` (live) runs
the reserve-only checkout, while `doku-site_9.html` additionally has the
Razorpay payment flow staged in **test mode** (see "Payments"). Mirror any
*non-payment* change into both files; the two reconcile at the payment
go-live cutover.

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
3. No `localStorage`/`sessionStorage`. Cart and currency are in-memory JS
   state by design — this only works because the whole site is one
   never-reloading page. If this ever becomes a real multi-page site, that
   needs a backend session, not browser storage.
4. Checkout on the **live** site is a reserve-only simulation — no real charge
   happens. A Razorpay (domestic INR) integration is built but runs in **test
   mode only** and is staged in `doku-site_9.html`, not deployed (see
   "Payments"). Never let copy or behavior on the live site imply a real charge
   happened. This rule gets rewritten — with the owner's explicit sign-off —
   only at the payment go-live cutover.

## Data model
Catalog data lives in a Supabase Postgres table, `public.products`
(project `mudyipmizlvihcldzrvh`, schema in `supabase/schema.sql`). Fields:
`sku`, `title`, `status` (`'available'` | `'coming-soon'` | `'claimed'` |
`'reserved'`), `price`, `story` (jsonb array), `specs` (jsonb object),
`origin`, `year`, `teaser`, `epitaph`, `image`, `reference_image` (bool),
`sort_order`.

**Checkout reserves, it does not claim.** Submitting the checkout form calls
the Postgres RPC `place_order(p_skus, p_full_name, p_email, p_address,
p_city, p_postcode, p_country, p_currency)` — a `SECURITY DEFINER` function
that, in one transaction: locks every item in the cart, verifies each is
still `'available'` (all-or-nothing — if any item was taken first, nothing
changes and the client shows an error), flips them to `'reserved'`, and
writes one row per item into `public.orders` under a shared `order_code`.
`'reserved'` means "someone completed the front-end simulation" — it is
**not** a verified sale (see Hard rule 4). Promote a reserved item to
`'claimed'` (and write a real epitaph) from the Supabase dashboard yourself
once you've actually confirmed/received payment out-of-band.

Neither `anon` nor `authenticated` can read, insert, or update `orders`
directly — RLS is enabled with zero policies (deny-all). The only way in is
through `place_order()`, which bypasses RLS because it's `SECURITY
DEFINER`. This is deliberate: `orders` holds buyer name/email/address, and
nothing in the browser should ever be able to list or scrape it. Likewise
`products` has no public write policy — `anon` can only mutate a row via
`place_order()`, never with a raw `UPDATE`. Schema + function are both in
`supabase/schema.sql`.

On load, `<script>` fetches from Supabase (`_productsReady`, 2.5s timeout)
into `PRODUCTS`. If the fetch fails or times out, `PRODUCTS` stays on
`FALLBACK_PRODUCTS` — a hardcoded array kept in sync manually as a safety
net, same defensive pattern as the currency-rate fetch. Row Level Security
on the table allows public `SELECT` only; there is no public write path, no
auth, and no admin UI — catalog edits happen from the Supabase dashboard
(Table Editor or SQL Editor) directly.

Add `image:'data-uri-or-path'` (or the `image` column) to any item and it
automatically shows a real photo instead of the placeholder/sketch — see
`frame()`. Claimed items with an image automatically render desaturated.
Set `reference_image: true` alongside a photo that isn't the actual DOKU
piece — `frame()` renders the "Reference image — not the actual piece"
disclosure for it. See Hard rule 1 — this is not optional.

## Payments — Razorpay (test mode, staged; NOT live)
Built in test mode, staged in `doku-site_9.html` only — the live `index.html`
still uses the reserve-only checkout. Domestic **INR** only for now.
- **Why Edge Functions:** the static site can't hold a secret, so payments run
  through two Supabase Edge Functions. The Razorpay **secret key** lives as a
  Supabase secret (`RAZORPAY_KEY_SECRET`); only the public `key_id` ever
  reaches the browser.
  - `razorpay-create-order` — computes the INR charge **server-side** from
    catalog prices (USD→INR, so the amount can't be tampered with client-side)
    and creates the Razorpay order.
  - `razorpay-verify-payment` — verifies the HMAC signature, re-confirms with
    Razorpay that the payment captured, then reserves.
- **DB:** `place_order_paid()` (migration `razorpay_payments`) mirrors
  `place_order` but forces INR, records `razorpay_order_id` /
  `razorpay_payment_id` / `amount_inr` on `orders`, is **idempotent** on
  payment id, and is **server-only** (revoked from `anon`; granted to
  `service_role`). The browser can never reserve without a verified payment.
- **Client:** checkout does create-order → Razorpay Checkout modal → verify →
  reserve. Card data is entered in Razorpay's secure modal — DOKU never sees or
  stores it (the old simulated card fields were removed from `doku-site_9.html`).
- **Go-live checklist** (needs owner + PAN/KYC): flip to live keys, revoke the
  `anon` grant on the old `place_order` (so payment becomes the *only* reserve
  path), lock the Edge Function CORS to `discoverdoku.com`, rewrite Hard rule 4
  and the on-site "simulation" copy, and copy `doku-site_9.html` → `index.html`.

## Admin — `admin.html`
A **separate, standalone page** (not part of the public SPA, not linked from
it) for managing the catalog and viewing orders. Kept separate on purpose:
it needs a persistent auth session, which means Supabase's default
`localStorage` — allowed here precisely because it is NOT the public
never-reloading SPA that Hard rule 3 was written for. Do not fold this into
`doku-site_9.html`.
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
- **No `localStorage`/`sessionStorage` anywhere** — cart, currency, and
  consent state are in-memory JS only. See Hard rule 3.
- **On the live site, checkout transmits only buyer/shipping data, never card
  data.** The submit handler calls the `place_order()` RPC (name/email/address
  → `orders`); the card fields it collects go nowhere (reserve-only, Hard rule
  4). The staged Razorpay build (`doku-site_9.html`) removes the card fields
  entirely — card data is entered in Razorpay's modal, never touching DOKU.
- **Currency & region.** On entry a region bar (`#region-bar`) maps the
  visitor's country/region to a currency (USD/EUR/GBP/INR/JPY), and USD for
  anything unsupported; it's locale-guessed and stores nothing (so it reappears
  each session, per Hard rule 3). Conversion uses live rates from the
  Frankfurter API with hardcoded fallbacks; `setCurrency()` is the shared entry
  point for both the region bar and the manual switcher.
- **"Inquire" and "Notify me" forms DO submit** — to Web3Forms
  (`api.web3forms.com`), carrying whatever name/email/message the visitor
  enters (`WEB3FORMS_KEY` near the top of `<script>`, a public/domain-scoped
  key by Web3Forms' design, not a secret). Both forms disclose this inline
  via `.fine-print`, linking to `#/privacy`.
- **Google Analytics (GA4, ID `G-S1MKLYC4QS`) is consent-gated.** The `<head>`
  snippet defines a `gtag` stub and a `loadAnalytics()` function but does
  *not* load the GA script or fire `config` on page load. The
  `#consent-bar` UI only calls `loadAnalytics()` if the visitor clicks
  Accept; Decline (or ignoring the bar) means no GA request ever fires.
  Because there's no storage, the bar reappears each session — same
  intentional tradeoff as Hard rule 3.
- `#/privacy` is the single source of truth for what's collected and where
  it goes — keep it in sync if any of the above changes.

## Known gaps / likely next steps
- No real product photography yet — placeholders and sketches throughout
- **Payments not live.** Razorpay is built + verified in test mode (see
  "Payments") but staged in `doku-site_9.html`; going live needs PAN/KYC, live
  keys, and the cutover checklist. Domestic INR only — international cards need
  separate Razorpay activation.
- No *customer* accounts — buyers still check out as guests (by design).
  Admin auth exists (see Admin), but shoppers have no login.
- No domain email yet — `enquiry@` / `admin@discoverdoku.com` mailboxes
  (Google Workspace) are planned but not set up, so `admin@` password-reset
  emails can't be delivered (rotate the password in-app instead).
- Leaked-password protection (HaveIBeenPwned) is off in Supabase Auth — it's a
  Pro-plan feature, parked (not worth a plan upgrade on its own).