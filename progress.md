# DOKU — Project Progress

## What DOKU Is

A premium marketplace for one-of-one objects. Every item is genuinely unique, sold once, never restocked. The entire brand rests on that authenticity. The site is a single self-contained HTML file — client-side SPA with hash routing, no build step, no backend, no framework.

---

## Session 1

### 1. Project Initialization
- Created `CLAUDE.md` — documents the brand voice, design system, hard rules (no placeholder images, no localStorage, checkout is a simulation), data model, and known gaps. Future Claude sessions will inherit this context automatically.

### 2. Skills Installed
Two design skills are now active for this project under `.claude/skills/`:

| Skill | Source | What it does |
|---|---|---|
| `frontend-design` | Official Anthropic skills repo | Design-lead guidance — typography, palette, distinctive visual direction |
| `ui-ux-pro-max` | npm `ui-ux-pro-max-cli` | 67 UI styles, 161 palettes, 57 font pairings, 99 UX rules, searchable via `python3 .claude/skills/ui-ux-pro-max/scripts/search.py` |

### 3. Built `doku-site_9.html` — The $10K Upgrade
Built on top of `doku-site_8.html`. All existing functionality is preserved (routing, cart, currency, checkout simulation). What changed:

**Hero**
- Full-viewport hero at `100svh`
- Fraunces at `clamp(68px, 10.5vw, 140px)` weight 200, italic gold *Never repeated.*
- Staggered entrance animations — eyebrow → headline → rule → meta → CTA → scroll hint, each offset 250ms
- Count of live available objects rendered dynamically

**Animations**
- Hero text parallax: drifts up at 0.28× scroll speed, fades to 0 by 500px of scroll
- Scroll-aware nav: transparent at top → frosted glass (`backdrop-filter: blur(16px)`) after 60px
- CTA buttons: gold fill sweeps in from left (`translateX` slide, not opacity)
- Product cards: inset gold border on hover, image scales 1.03×, corner brackets expand, price row lifts 2px
- All animations disabled cleanly under `prefers-reduced-motion`

**New Sections**
- Marquee strip: infinite horizontal scroll — ONE OF ONE · NOT REPRODUCED · FOUND ONCE · NEVER RESTOCKED · HELD ONCE · THEN GONE
- Manifesto block: full-width editorial quote in italic Fraunces

**Checkout**
- 3-step progress indicator (Review → Ship to → Confirm)

**Footer**
- Now includes full nav row (Collection / Archive / Provenance / Inquire)

**Custom Cursor & Scroll**
- Magnetic cursor with labeled state (gold ring expands, shows action label)
- Weighted scroll with momentum easing (desktop/mouse only)

---

## Session 2 — 2026-06-29

### Documentation
- Created `design.md` — living design system record. Captures the full color palette, typography scale, motion rules, layout specs, component inventory, signature devices, brand voice standard, and hard rules. Updated every session going forward.
- `progress.md` (this file) updated with session log and current state refresh.

---

## Session 3 — 2026-06-30

### Mobile Nav — Slide-from-right panel
- Replaced flat opacity fade with a proper slide-in panel (`translateX(100%) → 0`) using brand easing
- Panel is `min(360px, 100vw)` wide, `bg-card` background, hairline left border
- Gold left-edge accent line fades in after panel arrives (gradient via `::before`)
- Blurred backdrop overlay (`rgba + backdrop-filter:blur(4px)`) covers the rest of the page — click to close
- Nav links stagger in one by one (60ms offsets) after the panel lands
- Body scroll locks while menu is open
- Reduced-motion: all transitions suppressed cleanly

### Product Detail — Sticky 2-column desktop layout
- Left column (image): `position:sticky; top:88px; height:calc(100vh - 120px); max-height:820px` — sticks as you scroll the right column
- Right column (info): `padding-bottom:120px` so content never cuts off behind the sticky frame
- Mobile (`max-width:900px`): sticky unset, image returns to `aspect-ratio:4/5` stacked layout
- `object-position:center top` on detail images to favour the top of portrait photos

### Currency Switcher — Custom dropdown (replaced native `<select>`)
- Button shows current currency code + chevron that rotates 180° when open
- Dropdown panel slides down with brand easing, `bg-card` background, hairline border
- Each option: code left (Archivo), symbol right (Fraunces gold)
- Active option highlighted in gold; clicking closes and re-renders prices
- Closes on outside click; `aria-expanded` toggled for accessibility
- Fully cross-browser consistent — no native `<select>` anywhere

### Catalog — SKUs 017 & 018 promoted to available
- **017 — The Folded Ear Cuff** — `available`, $2,800. Polished silver sheet, folded once by hand. Full story + specs.
- **018 — The Sleeping Face Table** — `available`, $18,500. Carved limestone face holding smoked glass. Full story + specs.
- Both carry `referenceImage: true`; `frame()` updated to use this flag (not `coming-soon` status) to trigger the "Reference image — not the actual piece" disclosure label
- Reference photos embedded as compressed JPEG data URIs (~155KB each, resized to 900px max)

### Collection Page — Filter bar
- Origin pills: dynamically generated from live available products
- Price pills: All / Under $2k / $2k–$5k / $5k+
- Object count updates live as filters change ("2 of 5 objects")
- "Clear ×" button appears when any filter is active
- Filters reset when navigating away from the collection
- Empty state with inline clear link if no items match
- Mobile: horizontally scrollable filter bar

### Archive Page — Live text search
- Search input above the grid — hairline bottom border, no box, Archivo 13px
- Live filtering on title, origin, and epitaph text as you type
- Result count updates ("3 of 4 objects")
- × clear button appears when query is non-empty
- Items fade + scale down when hidden (`opacity:0; transform:scale(0.97)`)
- On-brand empty state with inline clear link

### Provenance Page — Full editorial expansion
- Replaced 4-paragraph stub with a deep 4-chapter editorial piece
- **Hero**: large italic Fraunces display headline + gold vertical rule
- **Live stats block**: objects encountered / claimed–gone / directions open — pulled dynamically from `PRODUCTS`
- **Chapter I — The Search**: how objects are found; pull-quote in gold left-border block
- **Chapter II — The Standard**: qualifying criteria as a gold-dash list; pull-quote
- **Chapter III — The Claim**: what claiming means; the "closed not sold-out" distinction; pull-quote
- **Chapter IV — The Record**: the archive's purpose; live claimed count woven into copy
- **Closing statement**: "The only rule" — DOKU's three hard commitments
- Layout: 2-column chapter grid (chapter label left, body right) collapses to single column on mobile

### Infrastructure fix
- `/Applications/DOKU/.claude/launch.json` updated to point preview server at `/Applications/Repos/Repo/DOKU` — was silently serving the old directory

---

## Session 4 — 2026-06-30

### "Notify me" & "Inquire" forms — wired to Web3Forms
- Both forms now POST to `https://api.web3forms.com/submit` via `fetch` (no backend, no SDK)
- `WEB3FORMS_KEY` constant at the top of the script — paste in the access key from web3forms.com to activate
- `_submitForm()` helper handles: button disabled + "Sending…" state, success message + form reset, error messaging (generic failure + network error cases), restores button on completion
- All form inputs now carry `name` attributes (were missing — FormData requires them)
- Hidden inputs injected per-form: `access_key`, `subject`, `from_name`; notify form also includes `sku` and `item` so each notification email identifies the object
- Validation runs `checkValidity()` before fetch — browser-native field errors surface before any network call

### Live currency rates — Frankfurter API
- `_ratesReady` promise fires immediately when the script parses, fetching `https://api.frankfurter.app/latest?from=USD&to=EUR,GBP,INR,JPY`
- Abort controller caps the wait at 1.5 seconds; fetch errors are silently caught
- `DOMContentLoaded` now `await`s `_ratesReady` before calling `render()` — first paint already has live rates if the API responds in time
- No re-render, no flicker; fallback to hardcoded rates if fetch fails or times out
- No API key required (Frankfurter is free and open)

### Analytics — Google Analytics 4
- GA4 snippet added to `<head>` (`G-S1MKLYC4QS`), loaded async
- `send_page_view: false` on init — prevents double-counting the first load
- `page_view` event fired manually on every `render()` call with `page_path` from `location.hash` — covers all SPA route changes
- `add_to_cart` event fires when "Hold this DOKU" is clicked — includes `item_id` (SKU), `item_name`, `value` (USD price), `currency`
- `generate_lead` fires on successful Inquire form submission
- `notify_request` fires on successful Notify me submission — includes the item name
- All `gtag` calls guarded with `typeof gtag !== 'undefined'` — safe if the script fails to load (ad blockers, network)

---

## Current State

| File | Status | Notes |
|---|---|---|
| `doku-site_8.html` | Baseline | Original version, kept intact |
| `doku-site_9.html` | **Active** | All changes live here |
| `CLAUDE.md` | Done | Project context for Claude sessions |
| `design.md` | Updated | Living design system — updated this session |
| `images/` | Existing | Reference photos for SKUs 017 and 018 |
| `.claude/launch.json` | Fixed | Serves from `/Applications/Repos/Repo/DOKU` |

**5 available objects** — 014, 015, 016, 017, 018. SKUs 017 and 018 show reference images with disclosure label.

**Live integrations:** Web3Forms (forms → email), Frankfurter API (currency rates), GA4 (analytics — confirmed active in Realtime dashboard).

---

## Next Steps

### Content
- [ ] **Add more catalog items** — Extend the `PRODUCTS` array with new entries
- [ ] **SVG sketches for 019+** — Coming-soon items need gold-line SVG sketches in the `SKETCHES` object
- [ ] **Real product photography** — Replace reference images with owned photos when available

### Infrastructure (before going live)
- [ ] **Real backend + payment processor** — Checkout is currently a simulation. Needs Stripe or similar wired to an actual order endpoint.
- [x] **Web3Forms** — Key live (`bcd721f3-…`). Inquire and Notify forms send real emails.
- [ ] **Domain + hosting** — The site is a single HTML file; can be served from any static host (Vercel, Netlify, Cloudflare Pages).
- [x] **Analytics** — GA4 live (`G-S1MKLYC4QS`). Pageviews, add-to-cart, form leads all tracked.
