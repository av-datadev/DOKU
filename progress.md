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

## Session 5 — 2026-06-30

### Hero & Provenance — brand-voice reframe (scarcity → resemblance)
- Owner's read: the old copy ("Found once. Never repeated.") leaned entirely on loss/FOMO. The intended hook is resemblance — a DOKU object mirrors the kind of person who buys it (someone who's built or found something once, without a template).
- Hero headline: *"Found once. Never repeated."* → **"Only one. So are you."** Eyebrow: → **"For objects — and people — that exist exactly once."**
- Homepage "Available now" and `/collection` subtext both reworked to tie the closure-fact to the reader, without dropping the literal scarcity statement (still required — DOKU never overstates availability).
- New **Provenance Chapter IV — "The Resemblance"** inserted between "The Claim" and "The Record" (which shifted to Chapter V). States directly who DOKU is for; closes with "If the paragraph above sounds like you, you already understand what we sell."
- Left untouched on purpose: `prov-closing` operational promises, footer tagline, manifesto block — factual, not persuasion copy.

### Hero scroll indicator
- Replaced the literal "Scroll" text label with a thin gold SVG chevron that points down by default and flips 180° (0.5s ease) the instant the user scrolls upward — tracked via a dedicated `scroll` listener diffing consecutive `window.scrollY` reads.

### Homepage carousel — "Available now"
- Converted the homepage's Available Now grid (only — `/collection` and item-detail's "related" grid stayed plain grids) into a horizontal scroller: fixed 300px cards, real gaps (28px desktop / 18px mobile) with each card individually bordered, instead of the old touching-tile "hairline grid" trick.
- The site's existing wheel-scroll system intercepts all wheel input on `window` for the vertical parallax effect. Taught it to redirect into `carousel.scrollLeft` when the cursor is over `.carousel` — and critically, to **fall through to normal vertical scroll once the carousel hits either edge**, so the page doesn't get stuck requiring the user to move the mouse off the carousel to keep scrolling.
- `scroll-snap-type` was tried and reverted — it fought the wheel handler's programmatic `scrollLeft` increments and intermittently cancelled them. Plain `overflow-x:auto` is what's live.

### Mobile product-detail padding fix
- `viewProduct()`'s wrapper had `style="padding-left:0; padding-right:0;"` inline — that silently overrode `.product`'s own class-based side padding (48px desktop / 24px mobile) at every screen size, since inline styles always win over stylesheet rules. On mobile, text was touching the bezels. Removed the dead inline override; `.product`'s own padding (which already had correct values for both breakpoints) now applies normally.

### Hero-invisible-on-reload fix
- The hero's scroll-parallax fades `hero-inner` to `opacity:0` past 480px of scroll. Browsers restore scroll position on reload by default — if a visitor reloaded while scrolled past that point, the hero painted invisible before they ever touched the scrollbar, looking like it had vanished entirely.
- Fix: `history.scrollRestoration = 'manual'` + `window.scrollTo(0,0)` at the very top of the script, so every load starts clean regardless of prior scroll state. Reproduced the original bug (scroll to 1500px, reload) and confirmed it's gone.

### Coming-soon catalog — expanded from 1 to 3 objects
- Added **020 — The Murano weight** (Italy, hand-blown glass) and **021 — The Trondheim rya** (Norway, knotted textile), each with brand-voice teaser copy and an original gold-line SVG sketch in `SKETCHES`, matching 019's style.
- **Fixed a real hard-rule violation found along the way:** SKU 019 ("The Damascus Pair") was `status:'coming-soon'` but had an undisclosed photo wired in via `image:` — no "Reference image" label renders for coming-soon items, and 019's own teaser says "we haven't found who folds it yet." Removed the `image` field so it falls back to the gold-line sketch that was already authored for it and just unused.

### Explored and reverted: intro video
- Owner provided a "clutter morphs into logo reveal" clip (`Videos/Clutter_morphs_into_logo_reveal_202606301845.mp4`, 8s, 1080p). Built and verified a full-bleed `100svh` section above the hero, autoplay/muted/once, with a `prefers-reduced-motion` fallback to native controls — it worked correctly in every check.
- Reverted at the owner's request (`git checkout`) before committing. Open finding worth knowing if this comes back up: the video's own final frame already shows a "DOKU" wordmark + "Found. Not made." in the site's own type style, identical to what the hero displays immediately after it — the two reveals currently read as a duplicate, not a sequence.
- The video file itself is still sitting in `Videos/`, just not wired into the page.

### Brand domain research (no code)
- Discussed domain options for launch. Short list favors meaning over decoration: `doku.one` (literalizes "1 of 1," doubles as a future community/membership name), `doku.estate` (matches the actual sourcing story — provenance copy already describes estate clearances), `doku.maison`, `doku.gallery`, `doku.living`. Ruled out `buydoku.com` (reads like a coupon site) and `isitdoku.com` (gimmicky). Not yet decided; availability unverified.

---

## Session 6 — 2026-07-02

### Delta 4 audit — copy fixes at the moments that matter most
- Walked through Kunal Shah's Delta 4 framework (perceived improvement has to be dramatic, not incremental, to earn trust/premium/retention — and the delta has to be real, not staged) and mapped it against DOKU's trust, status, and presence vectors. Owner's takeaway: the framework itself doesn't need documenting here, but it surfaced two real gaps worth fixing.
- Audited copy across the whole site. Almost everything already holds the six-trait voice standard. Found exactly two spots where it dropped to generic boilerplate — both at moments of friction, which is where trust is actually won or lost:
  1. **Real claims got a placeholder epitaph, not a real one.** The seeded archive items (003, 007, 009, 012) have hand-written epitaphs with a specific "epistemic distance" device ("We were not told the address," "We were not invited to watch"). Every real checkout instead ran `p.epitaph = p.epitaph || 'Claimed moments ago.'` — one static, identical line for every SKU, every buyer, forever. Fixed: added a `GENERIC_EPITAPHS` pool (6 lines, same device, one interpolates the item's `origin`) and `pickEpitaph(p)`, picked randomly at claim time. Verified live — claiming N°014 through the real checkout form produced *"It left Kyoto, Japan once, to reach us. Where it went next, we weren't told,"* correctly displayed on the item page afterward.
  2. **Form failure copy read as generic SaaS boilerplate.** `_submitForm()`'s success messages were already on-voice ("Message received. We read everything ourselves."), but its error paths were "Something went wrong. Please try again." and "Could not send. Check your connection and try again." Replaced with "Didn't send. Try again." (server-reported failure, still yields to `data.message` when Web3Forms returns one) and "Couldn't reach us. Try again in a moment." (network/catch failure). Verified via simulated fetch rejection.
- Both changes are in `doku-site_9.html`, verified live in the browser preview (full checkout flow end-to-end, plus a simulated network failure).

---

## Session 7 — 2026-07-03

### Consent bar & privacy page (carried over from uncommitted work, now documented)
- New `#/privacy` route, a bottom consent bar gating GA4 behind explicit Accept, and inline disclosure on Inquire/Notify forms that submissions route through Web3Forms. `CLAUDE.md` got a new "Data & privacy" section documenting the actual current behavior.

### Supabase — catalog moved off the hardcoded array
- Created a Supabase project (`mudyipmizlvihcldzrvh`, `ap-southeast-2`) and a `public.products` table — schema in `supabase/schema.sql`, RLS on with public `SELECT` only, no public write path.
- Migrated all 12 existing products (5 available, 4 claimed, 3 coming-soon) into the table via `supabase/seed.sql`, generated directly from the live `PRODUCTS` array — including the two full-size reference-image data URIs for SKUs 017/018, byte-for-byte.
- `doku-site_9.html`: old `PRODUCTS` array renamed to `FALLBACK_PRODUCTS` (kept as the safety net). Added the Supabase JS client via CDN (no build step) and a `_productsReady` fetch — 2.5s timeout, same defensive pattern as the currency-rate fetch — that populates `PRODUCTS` from the live table, mapping `reference_image`/`sort_order` back to the JS shape the rest of the app expects. `DOMContentLoaded` now awaits both `_ratesReady` and `_productsReady` before the first `render()`.
- Verified end-to-end in the browser preview: confirmed the 404-then-fallback behavior before the migration ran, then confirmed a live 200 fetch and correct rendering (including N°017's reference image and disclosure label) after.
- Catalog edits from here happen in the Supabase dashboard (Table Editor or SQL Editor), not by hand-editing the HTML — closes part of the "no admin panel" gap from the architecture review, though there's still no dedicated admin UI or auth.
- Scope deliberately left out of this pass: orders, payments, and auth are still untouched — Supabase backs the catalog only for now.

---

## Session 8 — 2026-07-04

### Order persistence — checkout now reserves for real, catalog-wide
**Decision point:** persisting orders meant deciding what a completed (simulated) checkout should actually do to the shared catalog — previously "claimed" only lived in one browser tab, so two visitors could both "buy" the same one-of-one object and neither would know. Owner chose **reserve, not claim**: checkout immediately and atomically pulls the item from "available" for everyone, but doesn't show it as a genuine sold/claimed piece with an epitaph — that's a deliberate manual step from the Supabase dashboard once payment is actually confirmed out-of-band. Keeps Hard rule 4 ("never imply a real charge happened") literally true.
- New `orders` table in Supabase — `sku`, `title`, `price`, `currency`, `full_name`, `email`, `address`, `city`, `postcode`, `country`, `order_code`, `created_at`. RLS enabled with **zero policies**, so `anon`/`authenticated` cannot read, insert, or update it directly under any circumstance — the table holds buyer PII and nothing in the browser should ever be able to list or scrape it.
- New Postgres function `place_order(p_skus, p_full_name, p_email, p_address, p_city, p_postcode, p_country, p_currency)`, `SECURITY DEFINER`, callable by `anon` via RPC. In one transaction: locks every item in the cart, verifies each is still `'available'` (all-or-nothing — if any item was taken first, nothing changes), flips them to a new `'reserved'` status, and writes one order row per item under a shared `order_code`. This is the *only* way `products` or `orders` can be mutated from the client — no raw table `UPDATE`/`INSERT` policy exists for either.
- `products.status` check constraint extended to allow `'reserved'`.
- `doku-site_9.html`: checkout form's submit handler now calls `_supabase.rpc('place_order', …)` instead of mutating `PRODUCTS` locally. Added `checkValidity()`/`reportValidity()` before submit (was missing — every other form on the site already had this). On success, shows the real `order_code` from Postgres (previously a client-generated random string) and fires a new `reserve_order` GA4 event (not `purchase` — that event name carries revenue-recognition semantics GA4 assumes are real, which this isn't yet). On failure (item taken by someone else, or Supabase unreachable), shows an on-brand inline error instead of silently "succeeding" — this used to always succeed locally with a `setTimeout`, which was a lie waiting to happen once state was shared.
- `viewProduct()` and `frame()` now handle `'reserved'` as its own state — "Held — pending confirmation" / "This DOKU is spoken for. We're finishing the details," not the "Claimed" copy (which now only shows for the real, manually-promoted `'claimed'` status).
- Confirmation page copy changed from "It's yours now" (overstated — implies a completed sale) to "Held. Only for you." — accurate to what actually happened.
- `GENERIC_EPITAPHS`/`pickEpitaph()` (Session 6) are no longer called automatically at checkout, since claiming is now a deliberate manual step. Left in place as a starting point for writing the real epitaph when you promote a `reserved` row to `claimed`.
- **Verified live, full loop:** ran an actual checkout through the browser UI (SKU 015, fake buyer) → confirmed the order row landed in Supabase with correct buyer/item/price data and the product flipped to `reserved` → confirmed a second `place_order` call for the same SKU was rejected server-side ("Item 015 is no longer available") → confirmed `anon` cannot `SELECT` the `orders` table at all (empty result, no error — RLS silently denies) → cleaned up the test order and reset SKU 015 back to `available` afterward so the real catalog wasn't left in a test state.
- `supabase/schema.sql` updated to the current-state schema (products + orders + `place_order()`); applied to the live project via migration `orders_and_reserve_flow`.

---

## Session 9 — 2026-07-04

### Admin UI — separate authenticated page (`admin.html`)
**Requirements walked through first:** auth (nothing on the site had a login), a scoped write path (products had zero write policies, orders denied all access), and a real collision with Hard Rule 3 — Supabase Auth persists sessions in `localStorage`, which the public SPA forbids. Owner's call: **build it as a separate page + Supabase Auth**, which sidesteps the storage conflict cleanly — Hard Rule 3 was written for the public never-reloading SPA, not a distinct authenticated admin surface.
- **New `admins` allowlist table + `is_admin()` SECURITY DEFINER helper.** Write access to `products` and read access to `orders` are gated on *allowlist membership*, not on merely being `authenticated` — so even if public signups are left on, a random new account gets zero access. `admins` itself has RLS with no policies (deny-all direct access); membership is only ever read through `is_admin()`, which bypasses that. `is_admin()` execute revoked from `anon` (only the logged-in admin page calls it).
- **RLS policies added:** admins can insert/update/delete `products` and select `orders`. The public site (`anon`) stays exactly as it was — read-only catalog, no order access, checkout only via `place_order()`.
- **Single admin account created** (email `apoorvverma0396@gmail.com`) via a one-time SQL seed with a **temporary password** — the admin page has a "Change password" action; rotate on first login. No credentials live in any committed file.
- **`admin.html`** — standalone, on-brand (same palette/type as the site, lighter on animation), `noindex,nofollow`, not linked from the public site. Login wall → three tabs: **Catalog** (create / edit / delete every product field incl. story/specs/image, and the `reserved`→`claimed`-with-epitaph promotion Session 8 left manual), **Orders** (buyer details, grouped by order code), **Account** (change password, sign out). Uses the same public anon key as the main site — RLS is the only thing separating admin from public, never a secret in the file.
- **Verified live, full loop:** logged in with the temp password → dashboard loaded all 12 products → edited a product through the UI and confirmed it persisted to Supabase → promoted a product to `claimed` with an epitaph and confirmed → **confirmed an anonymous client cannot write products (0 rows, RLS-blocked), cannot read orders, and gets `is_admin()=false`** → restored the test product to its exact original state afterward.
- **Security advisor:** remaining lints are all expected/benign (the deliberate `admins` deny-all RLS; the known public `place_order`/managed `rls_auto_enable` functions). One worth acting on: **leaked-password protection is off** in Supabase Auth — a one-click dashboard toggle, more relevant now that a real admin login exists.
- `supabase/schema.sql` updated with the admins table, `is_admin()`, and admin policies. Applied live via migrations `admin_auth_and_write_policies` + `restrict_is_admin_to_authenticated`.

---

## Session 10 — 2026-07-07

### Live deployment — Cloudflare Workers (static assets)
- Installed the Cloudflare plugin/skills marketplace for Claude Code (`claude plugin marketplace add cloudflare/skills` + `claude plugin install cloudflare@cloudflare`), for future Cloudflare-aware sessions.
- Added `index.html` (copy of `doku-site_9.html`) as the deploy entry point — hosts expect `index.html` by default, and the site was previously only reachable via the versioned filename.
- Added `wrangler.jsonc` — configures the repo as a Workers static-assets project (`assets.directory: "./"`, `not_found_handling: "single-page-application"` so hash-routing works cleanly).
- Added `.assetsignore` — keeps `supabase/`, `Images/`, `*.md`, `*.pdf`, `.claude/`, `.git`, and the pre-`index.html` site versions out of the public deploy bundle. Confirmed live: only 4 files uploaded (`index.html`, `admin.html`, plus Wrangler's own no-op worker files) out of 112 in the repo.
- Created a Cloudflare Workers & Pages project connected via Git to `av-datadev/DOKU` on `main`, no build command, deploy command `npx wrangler deploy`. First deploy succeeded — live at `https://doku.pushpak1999gupta.workers.dev`.

### Domain — discoverdoku.com connected
- Domain was purchased directly through Cloudflare Registrar (zone already active, no nameserver migration needed).
- Attaching it as a Custom Domain on the Worker initially failed: "Hostname already has externally managed DNS records." The zone had 4 leftover records from a prior, unused Shopify setup (root `A`/`AAAA` pointing at Shopify's IPs, plus `dns-verification.shopify.com` and `shops.myshopify.com` CNAMEs).
- Confirmed the Shopify store was leftover/unused, deleted all 4 records, then successfully attached `discoverdoku.com` as a Custom Domain on the `doku` Worker.

---

## Session 11 — 2026-07-07

### Domain-based admin account — `admin@discoverdoku.com`
- Created a second admin, `admin@discoverdoku.com`, alongside the existing Gmail admin (both remain in the `admins` allowlist so there's no lock-out risk). Email pre-confirmed (`email_confirmed_at` set) so it can log in immediately without a working mailbox — Google Workspace email is still paused, so password-reset emails have nowhere to land yet; **the password must be rotated in-app, not via a reset link.**
- **Bug found and fixed — raw `auth.users` INSERT left GoTrue token columns NULL.** Creating the user directly in SQL (rather than via the Supabase Add-User flow / Admin API) left `confirmation_token`, `recovery_token`, `email_change`, `email_change_token_new`, `email_change_token_current`, `phone_change`, `phone_change_token`, and `reauthentication_token` as `NULL`. GoTrue scans these into non-nullable Go strings and 500s with *"error finding user: converting NULL to string is unsupported"* → surfaced to the client as *"Database error querying schema"* and, in `admin.html`, the generic *"That didn't open. Check the email and password."* This broke login **only for that user** (the Gmail admin, created properly with `''`, was unaffected). Fixed by `COALESCE`-ing all eight columns to `''`. Diagnosed via the auth-service logs + a deliberately-wrong-password probe of `/auth/v1/token` (confirmed the 500 became a clean `400 invalid_credentials` after the fix). **Takeaway: create Supabase auth users via the dashboard/Admin API, not raw INSERT.**
- Verified end-to-end: password validates, email confirmed, identity row present, in `admins` — and the owner logged into the live admin dashboard successfully.

### admin.html hardening — Cloudflare Access (chosen over a subdomain)
- Put a **Cloudflare Access** (Zero Trust) self-hosted application in front of `discoverdoku.com/admin.html` — an identity gate at Cloudflare's edge *before* the request reaches the Supabase login, so `/admin.html` is now double-gated (Cloudflare Access → DOKU/Supabase). Team domain `soft-firefly-9a4f.cloudflareaccess.com`.
- Chose Access over the alternative (moving admin to an `admin.discoverdoku.com` subdomain): a subdomain only changes *where* the page lives and adds no auth, whereas Access adds a real second authentication layer. Both are free; Access is the one that actually secures it.
- Policy is allow-list by email. Login method is the org's default **"Sign in with Cloudflare"** (the owner's own Cloudflare account), not one-time-PIN — the policy allows the owner's Cloudflare-account email. Verified the gate live: a fresh request to `/admin.html` 302-redirects to the Access login; the public site and product pages are unaffected (no prompt).
- One-time-PIN was offered as an alternative login method but not enabled; can be added later under Zero Trust → Settings → Authentication if a non-Cloudflare-account login is ever wanted.

### Domain security & leaked-password — status
- **Registry lock:** corrected an earlier overstatement — true registry lock is Cloudflare **Enterprise-only** for `.com`. Self-serve protection is **registrar lock** (`clientTransferProhibited`, on by default) plus hardening the Cloudflare **account with 2FA** (the account login is the real attack surface). Owner actioned this pass.
- **Leaked-password protection:** parked — it's a Supabase **Pro-plan** feature (HaveIBeenPwned), not worth a plan upgrade on its own right now.

### Email — paused
- Decided on **Google Workspace** for `enquiry@` + `admin@` mailboxes (Zoho's free tier is discontinued for new signups). Full DNS playbook (MX/SPF/DKIM/DMARC, `enquiry@` as a free alias on one paid seat) was written up but **not yet applied** — owner paused this step until the site matures.

---

## Current State

| File | Status | Notes |
|---|---|---|
| `doku-site_8.html` | Baseline | Original version, kept intact |
| `doku-site_9.html` | **Active** | Public site — all shopper-facing changes live here |
| `admin.html` | **New** | Authenticated admin page — catalog + orders management |
| `CLAUDE.md` | Updated | Now documents the admin page + auth model |
| `design.md` | Updated | Living design system |
| `progress.md` | Updated | This file |
| `supabase/schema.sql` | Updated | products, orders, place_order(), admins, is_admin(), admin policies |
| `supabase/seed.sql` | Existing | One-time catalog migration (already applied) |
| `images/` | Existing | Reference photos for SKUs 017 and 018 (also now in Supabase) |
| `Videos/` | Existing, unused | Logo-reveal clip — built and reverted Session 5 |
| `.claude/launch.json` | Fixed | Serves from `/Applications/Repos/Repo/DOKU` |
| `index.html` | **New** | Deploy entry point (copy of `doku-site_9.html`) |
| `wrangler.jsonc` | **New** | Cloudflare Workers static-assets config |
| `.assetsignore` | **New** | Excludes non-site files from the public deploy bundle |

**5 available objects** — 014, 015, 016, 017, 018. SKUs 017 and 018 show reference images with disclosure label.

**3 coming-soon objects** — 019, 020, 021. All three use gold-line SVG sketches, no undisclosed photos.

**Live integrations:** Supabase (product catalog + order persistence), Web3Forms (forms → email), Frankfurter API (currency rates), GA4 (analytics, consent-gated).

---

## Next Steps

### Content
- [x] **Add more catalog items** — 020, 021 added to coming-soon this session. Still open: more *available* (priced, in-stock) items.
- [x] **SVG sketches for 019+** — done for 019, 020, 021. Repeat for any new coming-soon SKU.
- [ ] **Real product photography** — Replace reference images with owned photos when available

### Brand
- [x] **Pick the domain** — `discoverdoku.com` purchased via Cloudflare Registrar and connected, Session 10.
- [ ] **Decide on the intro video** — built and works, reverted pending a fix for the duplicate "DOKU / Found. Not made." reveal (see Session 5). Asset is in `Videos/` if revisited.
- [x] **Domain-based admin account** — `admin@discoverdoku.com` created and added to the `admins` allowlist alongside the Gmail admin, Session 11 (incl. the NULL-token GoTrue fix). Password-reset emails won't work until Google Workspace is set up; rotate the password in-app for now.
- [ ] **Email — Google Workspace** (paused) — `enquiry@` + `admin@` mailboxes on the domain. DNS playbook ready (MX/SPF/DKIM/DMARC; `enquiry@` as a free alias on one paid seat). Needed for password-reset delivery and customer inquiries. Deferred until the site matures.

### Infrastructure (before going live)
- [x] **Product catalog database** — Live in Supabase as of Session 7.
- [x] **Order persistence** — Live in Supabase as of Session 8. Checkout reserves atomically; see Session 8 for the reserve-vs-claim decision.
- [ ] **Real payment processor** — `place_order()` never verifies a charge happened; this is still the honest gap before real money can be involved. Needs Stripe or similar wired in, at which point a successful charge is what should trigger `place_order()` (or a variant of it) rather than a bare form submit.
- [ ] **Promote-to-claimed workflow** — currently a manual Supabase dashboard edit (flip `reserved`→`claimed`, write a real epitaph). Fine at low volume; worth a small admin action if volume grows.
- [x] **Admin UI** — Built in Session 9 as a separate authenticated page (`admin.html`). Catalog CRUD, reserved→claimed promotion with epitaph, and order viewing all done there now.
- [x] **Promote-to-claimed workflow** — now a first-class action in `admin.html` (was a manual Supabase dashboard edit). Still a human decision, but no longer raw SQL.
- [x] **Admin page hardening** — Cloudflare Access gate added in front of `/admin.html` (Session 11), so it's double-gated (Access → Supabase). Chose Access over a subdomain.
- [~] **Enable leaked-password protection** — parked: it's a Supabase **Pro-plan** feature, not worth a plan upgrade alone (revisit if already on Pro for other reasons).
- [~] **Domain security** — registrar lock is on by default; account 2FA actioned Session 11. True registry lock is Enterprise-only, not pursued.
- [x] **Web3Forms** — Key live (`bcd721f3-…`). Inquire and Notify forms send real emails.
- [x] **Domain + hosting** — Live on Cloudflare Workers (static assets) at `discoverdoku.com`, Session 10.
- [x] **Analytics** — GA4 live (`G-S1MKLYC4QS`), consent-gated behind the privacy bar. New `reserve_order` event fires on a successful checkout.
