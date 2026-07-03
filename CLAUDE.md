# DOKU — Project Context

## Why this exists
DOKU is a premium marketplace for one-of-one objects — every item is genuinely
unique, sold once, never restocked. The brand's entire value proposition rests
on authenticity. That makes one rule more important than any styling
preference below: **never let the site imply DOKU has an object it doesn't
actually have.** See "Hard rules."

## What it is
A single self-contained file, `index.html` — a client-side SPA with
hash-based routing (`#/`, `#/collection`, `#/item/:sku`, `#/cart`,
`#/checkout`, `#/confirmation`, `#/archive`, `#/provenance`, `#/inquire`,
`#/privacy`). No build step, no framework. Cart and currency selection live
in plain JS variables (in-memory only) — that's intentional, not a missing
feature, see Hard rules. The catalog itself now lives in Supabase (see
"Data model") — that's the one piece of real backend the site has; there is
still no auth, no order persistence, and no payment processor.

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
4. Checkout is a front-end-only simulation. There is no payment processor
   wired up. Never let copy or behavior imply a real charge happened.

## Data model
Catalog data lives in a Supabase Postgres table, `public.products`
(project `mudyipmizlvihcldzrvh`, schema in `supabase/schema.sql`). Fields:
`sku`, `title`, `status` (`'available'` | `'coming-soon'` | `'claimed'`),
`price`, `story` (jsonb array), `specs` (jsonb object), `origin`, `year`,
`teaser`, `epitaph`, `image`, `reference_image` (bool), `sort_order`.

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

## Data & privacy — actual current behavior
- **No `localStorage`/`sessionStorage` anywhere** — cart, currency, and
  consent state are in-memory JS only. See Hard rule 3.
- **Checkout card fields are never transmitted or stored.** The submit
  handler only runs a local `setTimeout`, flips item status, and redirects —
  no `fetch` call touches payment data. Consistent with Hard rule 4.
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
- Checkout needs a real backend + payment processor before going live
- Currency conversion rates are hardcoded/indicative, not a live feed
- No admin UI for the catalog — edits go through the Supabase dashboard
- No auth, no user accounts, no order persistence — Supabase currently
  backs the catalog only, not orders