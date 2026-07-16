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

## Session 12 — 2026-07-07

### Razorpay payments (domestic INR) — built and verified in test mode
**Decision:** Razorpay over Stripe (India-based, no PAN yet → test mode, which needs no KYC). Domestic INR only to start; other currencies stay display-only until international activation (Video KYC + IEC) is worth doing.
- **Architecture** — the static site had no backend for secrets, so payments run through **two Supabase Edge Functions** (secret key lives as a Supabase secret, never in the HTML; only the public `key_id` reaches the browser):
  - `razorpay-create-order` — computes the INR charge **server-side** from catalog prices (USD→INR via Frankfurter, fallback 83), so the amount can't be tampered client-side; creates the Razorpay order.
  - `razorpay-verify-payment` — verifies the HMAC signature, independently confirms with Razorpay that the payment is captured/authorized and belongs to the order, then reserves.
- **DB** — new `place_order_paid()` (migration `razorpay_payments`): mirrors `place_order` but forces INR, records `razorpay_order_id`/`razorpay_payment_id`/`amount_inr` (paise) on `orders`, is **idempotent** on payment id, and is **server-only** (`revoke from public; grant to service_role`) — the browser can never reserve without a verified payment.
- **Client** (`doku-site_9.html`) — checkout now does create-order → Razorpay Checkout → verify → reserve. **Removed the simulated card fields** (Razorpay collects the card in its secure modal; DOKU never touches card data). GA4 event upgraded `reserve_order`→`purchase`. Added `loadRazorpay()` (on-demand script) and `invokeFn()` (unwraps supabase-js's hidden non-2xx error bodies).
- **Verified:** create-order returns a real order with the correct ₹ amount; forged signature rejected (400); `place_order_paid` reserves + is idempotent (double-call → one row); the real Razorpay **test modal opened** with correct DOKU branding, gold theme, and ₹1,74,744.80. Fixed a CORS preflight failure (added `x-client-info` to `Access-Control-Allow-Headers`). Confirmed the **failure path is clean** — an international-card decline left no order and no false confirmation. **Still untested:** one *successful* captured payment (blocked by international-card decline; needs a domestic test method — UPI `success@razorpay`).
- **Not live:** all Razorpay work is staged in `doku-site_9.html` only. `index.html` (live) keeps the pre-Razorpay reserve-simulation checkout, so real visitors never see a test-mode payment. Cutover = copy dev→`index.html`, live keys, revoke anon `place_order`, lock CORS to `discoverdoku.com`, rewrite the "simulation" copy + Hard Rule 4.

### Region → currency bar — live on discoverdoku.com
- New top bar shown on **every entry** (no storage, per Hard rule 3): pick a country/region → prices convert to that currency; **anything unsupported falls back to USD**. Locale/timezone-guessed default so prices are right even if ignored. Reused via a new shared `setCurrency()` that also backs the manual switcher.
- Ported to the **live `index.html`** with checkout left untouched (0 Razorpay refs there) — so the two files now differ *only* in payment code. Verified live: bar renders on-brand, region→currency correct (₹/€/£/¥), USD fallback works, no console errors.

---

## Session 13 — 2026-07-11/12 — Astro migration + cutover

**The single-file HTML SPA has been fully replaced.** `discoverdoku.com` now
serves an **Astro 5 SSR app on Cloudflare Workers** (`web/`), not
`doku-site_9.html`/`index.html`. Full detail lives in the `feat/astro-migration`
commit history and Claude project memory; summarized here.

### Why
Real per-item URLs (`/item/014`, not `#/item/014`) for actual SEO, and a
signed server-verified cart cookie instead of in-memory JS state that only
worked because the old site never reloaded a route.

### Steps 1–5 (2026-07-11)
Ported shell (header/footer/nav/mobile drawer), catalogue (`Frame` vitrine
enforcing Hard rules 1–2, `/collection` filters, SSR `/item/[sku]`), cart +
`POST /api/cart` (signed httpOnly cookie), full staged Razorpay checkout
(`/cart` → `/checkout` → `/confirmation`), and currency/region/consent
(`lib/currency.ts`, `RegionBar`, `ConsentBar`, GA4 gated on Accept).

### Step 6 — real content, not placeholders
Replaced the "Astro migration — scaffold" homepage and four `Placeholder`-
component stub pages with the real ported content: hero/marquee/manifesto/
carousel on `index.astro`; `archive.astro` (live client-side search);
`provenance.astro` (full 5-chapter editorial + live stats); `inquire.astro`
(Web3Forms, validation, `generate_lead` event); `privacy.astro` (rewritten
for the actual cookie-based architecture, not copied verbatim from the old
in-memory-JS framing). Fixed a real gap found along the way: `.serif` was
used throughout `ItemCard`/`Frame` but never defined in the port.

### Step 7 — the actual cutover
1. Locked Razorpay Edge Function CORS from `*` to `https://discoverdoku.com` (Supabase, both v5).
2. Merged `feat/astro-migration` → `main` (confirmed inert at the time — the live Worker still deployed from the root static config).
3. **Cloudflare account split discovered mid-cutover:** the domain + old `doku` Worker live under a Cloudflare account owned/billed under a different email than the operator's own login (the operator is an admin *member* of that account). Pinned `account_id` explicitly in `web/wrangler.jsonc` once confirmed via `wrangler deployments list --name doku`, so the deploy couldn't land in the wrong account.
4. `CLOUDFLARE_API_TOKEN` only works from `~/.zshenv`, not `~/.zshrc` — zsh only sources `.zshrc` for interactive shells; the automation runs non-interactive ones.
5. Added `routes: [{ pattern: "discoverdoku.com", custom_domain: true }]` to `web/wrangler.jsonc` — one `wrangler deploy` both ships the build and claims the domain from the old Worker (Cloudflare allows only one Worker per custom domain), so no manual dashboard step was needed.
6. First deploy attempt failed: wrangler refuses to upload a `_worker.js` directory as a public asset (would expose server source). Fixed with `web/public/.assetsignore` (containing `_worker.js`) — placed under `public/` specifically so it survives every rebuild, unlike putting it in `dist/` directly.
7. Set `CART_SECRET` as a real Cloudflare Worker secret (`wrangler secret put`) — previously only a local-`.env` build-time fallback.
8. Deployed. Verified live: `/`, `/collection`, `/item/014`, `/archive`, `/provenance`, `/inquire`, `/privacy` all 200 with real Astro markup.
9. **Regression caught post-deploy:** `admin.html` only ever lived at the repo root, which the new Worker never served. The Cloudflare Access gate still 302'd correctly (zone-level, unaffected by the Worker swap), but anyone who authenticated would have hit a 404. Fixed by copying it into `web/public/admin.html` and redeploying. The repo-root copy is now dead weight — cleanup item, not maintained in parallel.
10. **Only after confirming the domain switch was live**, revoked `anon`'s execute grant on the old `place_order()` RPC in Supabase — closes the free-reservation bypass the pre-Astro checkout depended on. Deliberately sequenced last: doing it earlier would have broken the still-live old site mid-migration.

### What's still open
Razorpay is live in **test mode only** — KYC/PAN isn't done, so no live keys exist and real customer cards will fail at checkout. The owner was told this explicitly before confirming go-live and chose to proceed anyway. Swapping `RAZORPAY_KEY_ID`/`RAZORPAY_KEY_SECRET` to live values whenever KYC clears is the only remaining step — everything else from the original migration scope is done.

---

## Session 14 — 2026-07-12 — Customer accounts (passwordless) + migration cleanup

**Customer accounts, built.** Shoppers can now **optionally** sign in with a
**magic link** (Supabase Auth, passwordless) to (a) see their own past orders
and (b) save one shipping address that prefills checkout. **Guest checkout is
unchanged and remains the default** — nothing about buying requires an account.

### Design decisions that kept it low-risk
- **Session in httpOnly cookies, not localStorage** (`@supabase/ssr`,
  `web/src/lib/auth.ts` → `supabaseServer()`). Unlike `admin.html`'s default
  localStorage session (fine there — separate non-public page), the public-site
  session is server-set/server-verified and unreadable by page JS. This is the
  only session storage Hard rule 3 permits on the public site — same reasoning
  as the cart cookie.
- **Order history matches on email — zero changes to checkout / Razorpay /
  `place_order_paid`.** Orders already store the buyer email; a magic link proves
  the user owns that email, so `/account` reads back orders whose email matches
  their verified JWT (new RLS policy "Buyers read own orders by email",
  case-insensitive). A guest who later signs in with the same email
  retroactively sees those orders. The account page shows the **real
  `amount_inr` charged** (paise → ₹), never the per-row USD `price` that
  `place_order_paid` mislabels `'INR'`.
- **Saved address:** new `customer_addresses` table, one row per account keyed by
  `auth.users.id`, RLS owner-only on every verb. Written server-side (the browser
  can't touch the httpOnly session) from `/account` or a "save this address"
  checkbox at checkout.

### What was added
- **DB** (`supabase/migrations/20260712_customer_accounts.sql`, mirrored into
  `schema.sql`): `customer_addresses` + owner-only RLS; the orders own-email read
  policy. Purely additive — no existing table/grant altered. **Not yet applied to
  the live Supabase** (additive but touches an RLS policy on the orders PII
  table — left for a deliberate apply).
- **Auth flow:** `/login` (no-JS form) → `POST /api/auth/magic-link`
  (`signInWithOtp`) → emailed link → `GET /auth/callback` (`exchangeCodeForSession`,
  PKCE) → `/account`. `POST /api/auth/signout` clears it. Middleware resolves the
  user once per request into `locals.user` (anon visitors pay no round-trip).
- **`/account`** (protected; guests redirect to `/login`): order history, saved-
  address form, sign out. **Checkout** prefills from the saved address/email when
  signed in and offers to remember a new one. **Header** shows Account / Sign in.
- **Docs:** `/privacy` gained rows for account email + saved address; `CLAUDE.md`
  gained a "Customer accounts" section.

### Gated on ops (same posture as Razorpay live keys)
Magic-link **delivery** needs (1) `https://discoverdoku.com/auth/callback`
(+ `http://localhost:4321/auth/callback` for dev) added to Supabase → Auth →
URL Configuration → Redirect URLs, and (2) **custom SMTP** — Supabase's built-in
auth email is rate-limited/test-grade and DOKU has no domain email yet. The code
is complete; links won't reliably arrive until both are done.

### Verified
`/login` renders on-brand, `/account` bounces guests to sign-in, `astro build`
clean, no console errors. The magic-link email round-trip itself can only be
tested once SMTP + redirect URLs are configured.

### Migration cleanup (the debt Session 13 left open)
Deleted the dead pre-migration artifacts from the repo:
`doku-site_8.html`, `doku-site_9.html`, root `index.html`, root `admin.html`,
root `wrangler.jsonc`, and `.assetsignore`. Nothing live references them
(only docs, now updated). The live admin page remains `web/public/admin.html`.
**Resolved 2026-07-15, Cloudflare-side:** the old root `doku` Worker (serving
nothing after the cutover) was deleted from the dashboard. The account's
Workers & Pages list now shows only `doku-web`. No migration cleanup debt
remains.

---

## Session 15 — 2026-07-15 — Customer-accounts migration applied + cutover cleanup
Applied the customer-accounts DB migration (`20260712_customer_accounts.sql`) to
Supabase (`mudyipmizlvihcldzrvh`, as migration `customer_accounts`):
`customer_addresses` + owner-only RLS, and the orders own-email read policy.
Completed the magic-link ops gates — `/auth/callback` redirect URLs allow-listed
and custom SMTP configured, so links now deliver. Deleted the old root `doku`
Cloudflare Worker (served nothing); the account now shows only `doku-web`.

## Session 16 — 2026-07-15 — Wishlist + waitlist, order status, self-service deletion
Built the three remaining account features (owner decisions captured up front:
wishlist+waitlist not an off-market hold; stages reserved→confirmed→shipped→
delivered; deletion keeps order records).
- **Schema** (`20260715_wishlist_order_status.sql`, mirrored in `schema.sql`,
  applied live): `wishlists` (owner-only RLS, cascades on account deletion);
  `orders.order_status` (`reserved`→`confirmed`→`shipped`→`delivered`, default
  `reserved`) + `orders.tracking_note`; an "Admins update orders" RLS policy.
- **Wishlist (not a hold):** `/api/account/wishlist` (add/remove, RLS-scoped,
  progressive-enhancement). Item page: a "Keep an eye on this" toggle for
  available/coming-soon (signed-in; guests get "Sign in to keep a list");
  "Watching" section on `/account`. Reserved/claimed items instead show a
  Web3Forms "notify me if it frees up" waitlist — no DB row, same transport as
  Notify.
- **Order status:** buyer sees a 4-step indicator + tracking note on `/account`;
  admins advance it per `order_code` from `admin.html`'s Orders panel.
- **Self-service deletion:** `delete-account` Edge Function (service-role, CORS
  locked, identifies the caller by their own JWT) deployed; `/api/account/delete`
  (explicit confirm → Edge Fn → clear session → `/?farewell=1`). Deletes the auth
  user + address + wishlist (cascade); **order rows kept** as receipts.
- `/privacy` updated (wishlist + deletion). Guest checkout untouched.

### Verified
`astro build` clean; guest item pages render the wishlist prompt + waitlist form;
`/account` and the wishlist API bounce guests to `/login`; the `delete-account`
Edge Function rejects an invalid JWT (401); schema objects confirmed via SQL. The
signed-in surfaces (wishlist toggle persistence, Watching list, order-status
stepper, deletion round-trip) need a live magic-link session to exercise fully —
built on the proven `address.ts` / orders-read pattern, left for a signed-in
click-through.

## Session 17 — 2026-07-15 — Checkout now requires sign-in (guest checkout retired)
Owner decision, an explicit override of the "guest checkout is the default"
principle: an account is now **required to complete a purchase**. Chosen gate
point: **at checkout**, not at "Hold this DOKU" — browsing and building a cart
stay fully guest-open; only the final claim is gated.
- **`/checkout`**: a guest with a non-empty cart now sees an inline passwordless
  sign-in gate (held items shown + preserved — the cart cookie is independent of
  auth) instead of the payment form. Signed-in shoppers get the form as before.
- **Return-to-checkout**: the gate posts to `/api/auth/magic-link` with
  `next=/checkout`; the destination is stashed in a short-lived httpOnly
  `doku_auth_next` cookie (set in magic-link, read + cleared in `/auth/callback`)
  — so **no Supabase redirect-URL allow-list change** was needed. `next` is a
  local path only (open-redirect guard in magic-link, callback, and login).
- **`/login`** threads `?next=` through the form + resend link and shows
  checkout-specific copy; a signed-in visitor with `?next=` skips straight there.
- Docs updated: `CLAUDE.md` ("Customer accounts" retitled/rewritten + Known
  gaps), `/privacy`. Verified on dev: guest can still hold; `/checkout` shows the
  gate (no payment form) with items preserved; `/login?next=/checkout` renders
  the threaded field + copy; `//evil.com` open-redirect is rejected; `astro
  build` clean.

---

## Session 18 — 2026-07-15 — Phone (SMS OTP) sign-in, built but shipped OFF
Added a second passwordless method alongside email magic links, at the owner's
request — but gated OFF until its infrastructure exists, so nothing broken ships.
- **Flow:** `/api/auth/phone-otp` (`action=send` → `signInWithOtp({phone})`,
  `action=verify` → `verifyOtp({phone,token,type:'sms'})`). Two no-JS form posts;
  the code is entered on-page and verifyOtp sets the session directly — no
  `/auth/callback` round-trip, so it's a nicer on-page flow than the email link.
  `next` threads through (open-redirect guarded), so checkout return works too.
- **UI:** `/login` shows Email/Mobile tabs; the checkout gate adds a "mobile code"
  link. Both render **only when `PHONE_AUTH_ENABLED` = "true"** (Worker var, read
  per request via `web/src/lib/flags.ts`). Default off → email-only, exactly as
  before; the phone-otp route is guarded to 303 when off.
- **Why off:** phone OTP can't send until an SMS provider (Twilio/MSG91/etc.) is
  configured in Supabase Auth, plus **DLT registration** for +91 numbers. Flip the
  Worker var to enable once that's live — no code change.
- **Known limitation before enabling:** order history keys on the verified JWT
  email, so phone-only accounts won't see email-based orders until we also
  capture/link an email. Saved address + wishlist (auth.uid()) are unaffected.
- Verified on dev: flag off → email-only, phone route guarded; flag on → tabs +
  phone form + checkout mobile link render on-brand; `astro build` clean.

---

## Session 19 — 2026-07-16 — Refunds, Sentry monitoring, R2 bucket + a live vuln
Marketplace-architecture review against a generic multi-vendor diagram, then
turned the identified gaps into work. Prioritised P0/P1/P2 (see chat), and:

### Refunds (P1 — mechanism built, deployed)
- **`supabase/migrations/20260716_refunds.sql`** — adds `refund_id`,
  `refunded_amount_inr`, `refunded_at` to `orders`; extends `order_status` to
  allow `'refunded'`. **Applied live** (migration `refunds`).
- **`supabase/functions/razorpay-refund/`** — admin-gated Edge Function
  (verifies caller JWT → re-checks `is_admin()` → Razorpay refund API →
  records the result). Idempotent (refuses to re-refund an order with a
  `refund_id`). Full refunds only (one one-of-one piece per order).
  **Deployed live** (`verify_jwt:true` — first push mistakenly had it `false`,
  caught + redeployed).
- **`web/public/admin.html`** — a **Refund** button per order card (only when a
  Razorpay payment is on file), behind a confirm, calling the function with the
  admin's own session. **`web/src/pages/account.astro`** — a refunded order
  shows "Refunded — the charge was reversed" instead of the step tracker. UI is
  code, live on next Worker deploy.
- Deliberately: `'refunded'` is reachable ONLY via the button (a real Razorpay
  refund), never the plain status dropdown — the column can't imply money moved
  that didn't (Hard rule 4 spirit). Returns *policy* still undecided.

### 🔴 Live vulnerability found (P0 — NOT yet fixed)
- While reviewing Supabase security advisories after the refund migration:
  `place_order_paid()` and the old `place_order()` are **directly executable by
  `anon`/`authenticated`** via PostgREST, despite `revoke ... from public` in
  their migrations. Root cause: Supabase grants EXECUTE directly to those roles
  on function creation; revoking from the `PUBLIC` pseudo-role never removed
  those direct grants. Confirmed via `has_function_privilege()` (all true).
- **Impact:** anyone can `POST /rest/v1/rpc/place_order_paid` with fabricated
  Razorpay ids and reserve a one-of-one **for free** — bypasses payment,
  breaks Hard rule 4's core guarantee. Open since the 2026-07-12 cutover.
- **FIXED** (migration `fix_place_order_paid_privilege_leak`, applied live on
  owner go-ahead): `revoke all ... from anon, authenticated` on both functions,
  re-grant `place_order_paid` to `service_role`. Verified via
  `has_function_privilege()` — `anon`/`authenticated` now false on both, only
  `service_role` (which the verify-payment Edge Function uses) can execute.

### Sentry monitoring (P0-adjacent — built, edge deploys pending)
- Dependency-free error capture (envelope POST over `fetch`, no SDK):
  `web/src/lib/sentry.ts` + `web/src/middleware.ts` wrap on the SSR side;
  inline `sentry()` helpers in `razorpay-verify-payment`, `razorpay-refund`,
  `razorpay-create-order`. DSN in `web/wrangler.jsonc` `vars` (`SENTRY_DSN`) +
  hardcoded fallback (a DSN is a write-only ingest key, not a secret).
- Captures money-critical faults only (paid_but_unreserved, refund
  failures, order-creation failure, SSR 5xx) — expected 4xx excluded to spare
  the free-tier quota + avoid alert fatigue. Email alerts (Sentry default).
- **Deploy state:** the three Edge Function redeploys with capture are **live**
  (`razorpay-create-order` v6, `razorpay-verify-payment` v6, `razorpay-refund`
  v3, all `verify_jwt:true`, deployed 2026-07-16 on owner go-ahead). The Astro
  side (middleware wrap + `SENTRY_DSN` var) is code, live on next
  `wrangler deploy`. `astro build` clean.

### R2 object storage (P1 groundwork)
- Owner enabled R2 on the Cloudflare account hosting `doku-web`; created bucket
  **`doku-product-images`** and bound it as `PRODUCT_IMAGES` in
  `web/wrangler.jsonc`. Nothing reads/writes it yet — upload path + serving
  route still to build, for when real photography exists.

### Ambient effects restored (owner noticed they were missing on live)
- Two effects from the old single-file site were **intentionally dropped in the
  Astro port** (Session 13) — documented in a `hero.css` comment ("custom
  cursor, scroll parallax, weighted scroll — intentionally left out"). Root
  cause: the cursor was bundled into the same RAF as a **weighted momentum
  scroll** that assumed a never-reloading SPA; that scroll-hijack fights real
  multi-page SSR loads, so the whole bundle was culled to de-risk the cutover —
  the cursor + glow went along as collateral though they weren't the problem.
- **Restored, without the momentum scroll:** the drifting **golden glow**
  (`web/src/styles/ambient.css`, pure CSS, values ported verbatim), the **rising
  gold "dust" motes** (20 particles, sizes/speeds/columns randomized server-side
  in `web/src/components/Ambient.astro`, pure-CSS `rise` animation — the owner
  specifically remembered these; they were the last piece still missing after
  the first pass restored only the glow), and the **custom trailing cursor**
  (self-contained mousemove RAF — never touches scrolling). Wired into
  `Base.astro`; `#app` lifted to `z-index:1` so content sits above the fixed
  glow + dust. Reduced-motion + touch guards kept.
- **Verified in the dev preview:** glow renders behind the hero (screenshot),
  cursor ring tracks the pointer with eased lag, grows to 42px over links and
  clears on mouse-out, no console errors, `astro build` clean.
- **Cursor labels + two new scroll reveals** (owner asked for the labels back
  and picked reveals #1 + #2 from a proposed menu):
  - **Cursor word-labels restored** — `data-cursor` on the primary CTAs (logo
    "Home", item card "View"/"Preview", hero "Explore", Hold, Notify, Confirm,
    Send, Checkout); the ring shows the label over them. Verified: hovering the
    hero CTA shows "Explore" in the ring.
  - **#1 Frame wipe** — product vitrine frames unmask left-to-right (clip-path)
    when scrolled into view. `data-reveal="frame"` on all three Frame variants.
  - **#2 Hairline draw-on** — a gold rule under each section heading draws in
    from the centre. `data-reveal="line"` on the section-heads + a
    `.section-head::after` rule.
  - Shared `IntersectionObserver` (`Reveal.astro`) toggles `.is-in`; states in
    `reveal.css`. Progressive-enhanced via a `.js` class set in `<head>` before
    paint (no FOUC, no-JS shows everything); reduced-motion collapses to final.
  - Verified: `.js` set, 8 frames + section-heads wired and correctly masked
    until `.is-in`; with transitions stripped, `.is-in` resolves to the right
    end-states (frame `inset(0)`, hairline `scaleX(1)`); no console errors;
    `astro build` clean. (Scroll-triggered motion only animates in a
    foregrounded tab — the preview pane is backgrounded, which pauses IO +
    transitions; not a code issue.)
- All of the above is code — live on next `wrangler deploy`.

### Docs
- CLAUDE.md: added "Monitoring — Sentry", refund + R2 + the vuln (now FIXED)
  entries under Known gaps, and the ambient-effects note under Design system.
  progress.md: this entry. README.md left untouched (it's a logo design brief,
  not a technical readme). Notion "DOKU" page: added Session 18 + 19.

---

## Current State

**`discoverdoku.com` is live on Astro (`doku-web` Cloudflare Worker), as of Session 13 (2026-07-12).** The single-file HTML SPA is retired from production.

| Path | Status | Notes |
|---|---|---|
| `web/` | **Live** | Astro 5 SSR app — this is what `discoverdoku.com` actually serves |
| `web/src/pages/*.astro` | Live | Real routes: `/`, `/collection`, `/item/[sku]`, `/cart`, `/checkout`, `/confirmation`, `/archive`, `/provenance`, `/inquire`, `/privacy` |
| `web/public/admin.html` | **Live** | Authenticated admin page — catalog + orders management. Served as a static asset by `doku-web`, not part of Astro's routing |
| `web/src/lib/auth.ts`, `web/src/pages/{login,account}.astro`, `.../api/auth/*`, `.../auth/callback.ts`, `.../api/account/{address,wishlist,delete}.ts` | **Live (Session 14/16)** | Passwordless customer accounts — magic-link sign-in (httpOnly cookie session), order history + fulfillment status, saved address, wishlist/waitlist, self-service deletion |
| `supabase/migrations/20260715_wishlist_order_status.sql` | **Applied live 2026-07-15** | `wishlists` (owner-only RLS), `orders.order_status`/`tracking_note`, "Admins update orders" policy. Mirrored in `schema.sql` under "WISHLIST + ORDER STATUS" |
| `supabase/functions/delete-account/` | **Live, CORS locked** | Service-role Edge Function for self-service account deletion; identifies caller by their own JWT; cascades address + wishlist, keeps orders |
| `web/wrangler.jsonc` | Live config | `account_id` pinned (domain lives under a different Cloudflare account than the operator's default), `routes: custom_domain:true` for `discoverdoku.com` |
| `web/public/.assetsignore` | Live | Excludes `_worker.js` (server code) from being served as a public static file |
| `CART_SECRET` | Live Cloudflare secret | Set via `wrangler secret put`, not baked into the build |
| `supabase/migrations/20260712_customer_accounts.sql` | **Applied live 2026-07-15** | `customer_addresses` + owner-only RLS, and the orders own-email read policy. Applied to project `mudyipmizlvihcldzrvh` as migration `customer_accounts` |
| ~~`doku-site_8/9.html`, root `index.html`/`admin.html`/`wrangler.jsonc`, `.assetsignore`~~ | **Deleted (Session 14)** | Pre-migration SPA + its deploy artifacts, removed once the Astro site proved stable. Old root `doku` Cloudflare Worker (served nothing) **deleted from the dashboard 2026-07-15** — no cleanup debt remains |
| `supabase/schema.sql` | Updated | `products`, `orders`, `place_order()` (anon grant **revoked** post-cutover), `place_order_paid()` (server-only, the live reserve path), `admins`, `is_admin()`, admin policies |
| `supabase/functions/razorpay-create-order/`, `razorpay-verify-payment/` | Live, CORS locked | Both locked to `https://discoverdoku.com` (was `*` pre-cutover) |
| `supabase/seed.sql` | Existing | One-time catalog migration (already applied) |
| `images/` | Existing | Reference photos for SKUs 017 and 018 (also in Supabase) |
| `.claude/launch.json` | Updated (Session 14) | Single `doku-web` config — `npm run dev` in `web/`, port 4321. The old root-static-site config was removed with the dead files |

**5 available objects** — 014, 015, 016, 017, 018. SKUs 017 and 018 show reference images with disclosure label.

**3 coming-soon objects** — 019, 020, 021. All three use gold-line SVG sketches, no undisclosed photos.

**Live integrations:** Supabase (product catalog + order persistence), Razorpay (checkout, **test mode only**), Web3Forms (forms → email), Frankfurter API (currency rates), GA4 (analytics, consent-gated).

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
- [~] **Real payment processor** — **Razorpay (domestic INR) live on `discoverdoku.com`** (Session 13 cutover): two Edge Functions + `place_order_paid()`, CORS locked, old free `place_order` revoked from `anon`. Only remaining: PAN/KYC completion, then swap `RAZORPAY_KEY_ID`/`RAZORPAY_KEY_SECRET` to live values — real customer cards fail until then.
- [x] **Astro migration + cutover** — `discoverdoku.com` moved from the single-file HTML SPA to Astro 5 SSR on Cloudflare Workers (Session 13, 2026-07-12). See Session 13 above for the full sequence.
- [x] **Migration cleanup** — dead pre-migration files deleted from the repo (Session 14), and the old root `doku` Cloudflare Worker deleted from the dashboard (2026-07-15). Fully done, nothing outstanding.
- [x] **Customer accounts** — passwordless magic-link sign-in, order history + fulfillment status, saved address, wishlist/waitlist, and self-service deletion (guest checkout unchanged). DB migrations `20260712_customer_accounts.sql` + `20260715_wishlist_order_status.sql` **applied live**; magic-link delivery works (SMTP + redirect URLs, 2026-07-15). Deliberately NOT built: a functional off-market "hold" (conflicts with one-of-one + "reserved = paid"). Order status stops at `delivered` (no returns flow yet).
- [x] **Region → currency bar** — live on `discoverdoku.com` (Session 12): region select on entry → currency, USD fallback, no storage.
- [ ] **Promote-to-claimed workflow** — currently a manual Supabase dashboard edit (flip `reserved`→`claimed`, write a real epitaph). Fine at low volume; worth a small admin action if volume grows.
- [x] **Admin UI** — Built in Session 9 as a separate authenticated page (`admin.html`). Catalog CRUD, reserved→claimed promotion with epitaph, and order viewing all done there now.
- [x] **Promote-to-claimed workflow** — now a first-class action in `admin.html` (was a manual Supabase dashboard edit). Still a human decision, but no longer raw SQL.
- [x] **Admin page hardening** — Cloudflare Access gate added in front of `/admin.html` (Session 11), so it's double-gated (Access → Supabase). Chose Access over a subdomain.
- [~] **Enable leaked-password protection** — parked: it's a Supabase **Pro-plan** feature, not worth a plan upgrade alone (revisit if already on Pro for other reasons).
- [~] **Domain security** — registrar lock is on by default; account 2FA actioned Session 11. True registry lock is Enterprise-only, not pursued.
- [x] **Web3Forms** — Key live (`bcd721f3-…`). Inquire and Notify forms send real emails.
- [x] **Domain + hosting** — Live on Cloudflare Workers (static assets) at `discoverdoku.com`, Session 10.
- [x] **Analytics** — GA4 live (`G-S1MKLYC4QS`), consent-gated behind the privacy bar. New `reserve_order` event fires on a successful checkout.
