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
`#/checkout`, `#/confirmation`, `#/archive`, `#/provenance`, `#/inquire`).
No build step, no framework, no backend. Cart and currency selection live in
plain JS variables (in-memory only) — that's intentional, not a missing
feature, see Hard rules.

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
All catalog data lives in the `PRODUCTS` array near the top of the
`<script>`. Common: `sku`, `title`, `status` (`'available'` |
`'coming-soon'` | `'claimed'`). Status-specific: `price` / `story[]` /
`specs{}` / `origin` / `year` for available items; `teaser` for coming-soon;
`epitaph` for claimed. Add `image:'data-uri-or-path'` to any item and it
automatically shows a real photo instead of the placeholder/sketch — see
`frame()`. Claimed items with an image automatically render desaturated.

## Known gaps / likely next steps
- No real product photography yet — placeholders and sketches throughout
- Checkout needs a real backend + payment processor before going live
- Currency conversion rates are hardcoded/indicative, not a live feed
- "Notify me" and "Inquire" forms don't send anywhere yet — front-end only