# DOKU — Design System

> Living document. Updated every session. Ground truth for all visual and UX decisions.

---

## Brand Identity

**What DOKU is:** A premium marketplace for one-of-one objects. Every item comes with its own rarity — sold once, may never be restocked. The design must make that scarcity feel real, not marketed.

**Emotional register:** Museum-quiet. The silence of a rare object in a lit case. No bounce, no urgency, no sale energy.

---

## Color Palette

| Token | Hex | Usage |
|---|---|---|
| `--bg` | `#0E0C0A` | Page background — near-black, warm undertone |
| `--bg-card` | `#161310` | Card surfaces, elevated panels, mobile nav panel |
| `--ivory` | `#EDE6D6` | Primary text, UI labels |
| `--muted` | `#9A9086` | Secondary text, captions, metadata |
| `--gold` | `#B08D57` | Accent — interactive elements, highlights, frames |
| `--gold-soft` | `rgba(176,141,87,0.12)` | Subtle gold tints, hover states |
| `--gold-mid` | `rgba(176,141,87,0.25)` | Mid-opacity gold — borders, dividers |
| `--hairline` | `#2B2620` | Structural dividers, card borders |
| `--claimed` | `#6B6258` | Desaturated warm gray — claimed/unavailable items |

---

## Typography

### Typefaces
- **Fraunces** — Display serif. Used for headlines, subheadings, editorial quotes, prices. Weight 200–400. Italic variant used for the hero tagline, manifesto, pull-quotes, and provenance chapters.
- **Archivo** — Geometric sans. Used for all body copy, labels, UI elements, navigation. Weight 300–600. Never Inter or Roboto — this was a deliberate brand decision.

### Scale
| Role | Size | Weight | Family |
|---|---|---|---|
| Hero headline | `clamp(68px, 10.5vw, 140px)` | 200 | Fraunces italic |
| Provenance hero | `clamp(44px, 7vw, 96px)` | 200 | Fraunces italic |
| Section heading | `clamp(32px, 5vw, 56px)` | 300 | Fraunces |
| Chapter heading | `clamp(26px, 3.5vw, 40px)` | 300 | Fraunces |
| Card title | `1.1rem` | 300 | Fraunces |
| Body | `0.9rem` | 400 | Archivo |
| Editorial body | `15px` | 400 | Archivo, line-height 1.95 |
| Pull-quote | `clamp(20px, 2.5vw, 28px)` | 200 | Fraunces italic |
| Label / eyebrow | `0.7rem` | 500 | Archivo, letter-spacing 0.15em |
| Price | `1.1rem` | 300 | Fraunces |
| Nav link | `0.75rem` | 400 | Archivo |

---

## Motion

### Easing
- `--ease: cubic-bezier(.16,1,.3,1)` — Primary. Slow-out, deliberate. Used for most transitions.
- `--ease-out: cubic-bezier(.22,1,.36,1)` — Slightly faster settle. Used for hover micro-interactions.

### Durations
- Page transitions (veil): `350ms` out, `450ms` gold line
- Hero stagger: `250ms` per element, starting at `600ms` delay
- Nav fade: `300ms`
- Card hover: `400ms`
- Mobile nav panel slide: `550ms`
- Mobile nav link stagger: `60ms` per link, starting `180ms` after panel
- Currency dropdown: `300ms` slide + `250ms` opacity
- Filter/search item fade: `350ms`

### Rules
- Nothing bouncy. Nothing playful. Slow and deliberate only.
- All motion disabled cleanly under `prefers-reduced-motion`.
- Parallax (hero text drifts up at `0.28×` scroll speed, fades to 0 by 500px) — desktop only.
- **`history.scrollRestoration = 'manual'` + forced `window.scrollTo(0,0)` runs first thing in the script.** Browsers restore scroll position on reload by default; since the hero's parallax fades `hero-inner` to `opacity:0` past 480px of scroll, a reload while scrolled down would otherwise paint the hero invisible before the user touches anything. Don't remove this.

---

## Layout

### Grid
- Max content width: `1400px`, centered with auto margins.
- Product grid: `repeat(3, 1fr)` on desktop → `repeat(2, 1fr)` at 900px → `1fr` at 600px.
- Section padding: `clamp(80px, 12vw, 160px)` vertical.

### Navigation
- Fixed, full-width. Transparent at top → frosted glass (`backdrop-filter: blur(16px)`) after `60px` scroll.
- Logo: `DOKU` in Fraunces weight 300, `1.35rem`. Tagline: `ONE OF ONE` in Archivo `0.6rem` letter-spacing.
- Nav links: Archivo `0.75rem`, uppercase, `0.12em` spacing.
- Mobile: hamburger at breakpoint, slide-from-right panel (see Mobile Nav below).

### Hero
- Full viewport (`100svh`). Dark background with grain texture and radial glow.
- Staggered entrance: eyebrow → headline → rule → meta → CTA → scroll hint, each `250ms` offset.
- Scroll hint: thin gold SVG chevron at bottom center, no text label. Points down by default; flips 180° (`0.5s` ease) the instant scroll direction reverses — driven by a `scroll` listener diffing consecutive `window.scrollY` reads, independent of position.

### Product Detail
- 2-column grid on desktop: `1.1fr 1fr`, `80px` gap.
- Left column (frame/image): `position:sticky; top:88px; height:calc(100vh - 120px); max-height:820px`.
- Right column (info): `padding-bottom:120px`.
- Mobile (`max-width:900px`): single column, sticky unset, frame returns to `aspect-ratio:4/5`.
- **Guardrail:** side padding comes from `.product`'s own class rule (48px desktop / 24px mobile) — never add an inline `padding-left/right:0` on the wrapper. Inline styles beat stylesheet rules at every breakpoint regardless of media query, and that exact mistake once pinned product-detail text to the mobile bezels.

---

## Components

### Mobile Nav Panel
- Slides in from right: `translateX(100%) → translateX(0)`, `550ms` brand easing.
- Width: `min(360px, 100vw)`. Background: `--bg-card`. Left border: `1px solid var(--hairline)`.
- Gold left-edge accent: `::before` pseudo, gradient `transparent → --gold → transparent`, fades in at `300ms` delay.
- Blurred backdrop: `rgba(14,12,10,0.6) + backdrop-filter:blur(4px)`, click to close.
- Links: stagger in (`translateX(24px) → 0`, `opacity 0 → 1`) at 60ms offsets from `180ms`.
- Body scroll locked while open. Closes on backdrop click, close button, or link tap.

### Currency Switcher
- Custom button + dropdown — no native `<select>`.
- Button: current currency code + chevron SVG (rotates 180° when open). Archivo 11px, 0.14em spacing.
- Dropdown: `bg-card`, `1px hairline` border, slides down `translateY(-6px) → 0`.
- Options: code left (Archivo), symbol right (Fraunces gold 13px). Active option in `--gold`.
- Closes on outside click. `aria-expanded` toggled for accessibility.

### Collection Filter Bar
- Two pill groups: Origin (dynamic from catalog) and Price (fixed ranges).
- Pill at rest: `--muted` text, `--hairline` border. Active: `--gold` text + border. Hover: `--ivory` text.
- Object count in top right, updates live. "Clear ×" appears when any filter is active.
- Filter state held in `collectionFilters { origin, price }`. Resets on route change.
- Mobile: horizontally scrollable, `flex-wrap:nowrap`.

### Archive Search
- Single input, hairline bottom border only — no box.
- Placeholder: "Search the archive". Archivo 13px.
- Live filtering on title + origin + epitaph text. No debounce — immediate.
- Hidden items: `opacity:0; transform:scale(0.97); pointer-events:none`.
- Count and × clear button update in sync with results.

### Claimed Item Epitaphs
- Every claimed item shows an `epitaph` line beneath its status badge (item page and archive).
- Seeded archive items (003, 007, 009, 012) carry hand-written epitaphs using a consistent "epistemic distance" device — the object moves on, DOKU is deliberately not told the details ("We were not told the address," "We were not invited to watch").
- Real purchases generate one at claim time via `pickEpitaph(p)` — picks randomly from the `GENERIC_EPITAPHS` pool (6 lines, same device; one interpolates the item's `origin`). Never falls back to a flat placeholder string.
- **Guardrail:** don't reintroduce a static fallback like `p.epitaph || 'Claimed moments ago.'` — that line shipped on every real order until Session 6 and silently broke the archive's "ledger, not graveyard" premise for every real buyer.

### Home Carousel (Available Now)
- Homepage-only — `/collection` and the item-detail "related" grid stay as plain `.grid`.
- Fixed-width cards (`300px` desktop, `80vw` mobile) in a single row, `overflow-x:auto`. Real gaps (`28px` desktop / `18px` mobile) with each card individually bordered — not the touching-tile hairline-fill trick `.grid` uses elsewhere.
- No `scroll-snap` — tried and reverted; it fought the wheel handler's programmatic `scrollLeft` increments and intermittently cancelled them.
- The site's global wheel handler (for vertical parallax scroll) redirects into `carousel.scrollLeft` when the cursor is over `.carousel`, **and falls through to normal vertical scroll once the carousel hits either edge** — required, or the page gets stuck and the user has to move the mouse off the carousel to keep scrolling.

### Product Card
- Background: `--bg-card`
- Border: `1px solid var(--hairline)` at rest → inset gold border on hover
- Image area: square, 1:1 aspect ratio
- Hover: image scales `1.03×`, corner brackets expand, price row lifts `2px`
- Corner brackets: the gold "vitrine" frame — used for any product without a real photo

### Vitrine Frame (Placeholder)
- `referenceImage: true` on a product triggers the "Reference image — not the actual piece" disclosure label (gradient overlay, bottom of frame). Applies regardless of status.
- Status `coming-soon` without image: uses SVG sketch from `SKETCHES` object + "Sketch — sourcing in progress" label.
- Status `available` without image: gold corner bracket frame with ambient glow.
- Status `claimed`: desaturated (`frame-faded`), `--claimed` color, `CLAIMED` badge overlaid.

### Buttons
- Primary: gold fill sweeps in from left (`translateX` slide) on hover. Text: `--bg`.
- Ghost: gold border, transparent fill. Text: `--gold`.
- Destructive / remove: minimal, text-only.
- Labels follow brand voice — "Hold this DOKU" not "Add to cart".

### Marquee Strip
- Infinite horizontal scroll at `25s` linear.
- Content: `ONE OF ONE · NOT REPRODUCED · FOUND ONCE · NEVER RESTOCKED · HELD ONCE · THEN GONE`
- Gold text on hairline background.

### Manifesto Block
- Full-width editorial section.
- Quote in italic Fraunces, large display size.
- No decorative elements — silence is the design.

### Provenance Page
- Hero: large italic Fraunces headline + gold vertical rule (`1px`, `80px` tall, gradient).
- Stats block: 3-column grid (objects encountered / claimed / directions open), live from `PRODUCTS`. `bg-card` panels, Fraunces display numbers.
- Chapters: 2-column grid (`200px` label left, `1fr` body right). Chapter label in Archivo `0.28em` uppercase. Collapses to single column on mobile.
- Pull-quote: Fraunces italic, `clamp(20px,2.5vw,28px)`, gold `1px` left border, `28px` padding-left.
- Criteria list: gold `—` prefix per item, Archivo `14px`, `1.75` line-height.
- Closing statement: centered, max-width `720px`, Fraunces italic `clamp(22px,3vw,34px)`.

### Forms — Inquire & Notify Me
- Minimal layout: labels above inputs, hairline bottom border only — no box, no background.
- Label style: Archivo `0.7rem`, `0.18em` letter-spacing, uppercase, `--muted` color.
- Input style: Archivo `14px`, `--ivory` text, `1px solid var(--hairline)` bottom border, no outline ring.
- Textarea: same style, `min-height:120px`, resize vertical only.
- Submit button: primary gold (`btn-gold`) — full width on the inquire form.
- **Submission states:**
  - *Idle* — button label as written ("Send" / "Notify me")
  - *In flight* — button disabled, label becomes "Sending…"
  - *Success* — result line appears below form in `--muted`, `14px` Archivo; form resets
  - *Error* — same result line position; on-voice fallback copy, never generic SaaS boilerplate — "Didn't send. Try again." (server-reported failure — yields to `data.message` when Web3Forms returns one) or "Couldn't reach us. Try again in a moment." (network/fetch failure)
- Botcheck honeypot (`<input type="checkbox" name="botcheck" style="display:none">`) present in both forms — invisible to users, required by Web3Forms spam filter.

### Checkout Progress
- 3-step indicator: Review → Ship to → Confirm
- Gold dot = active, hairline dot = inactive.

### Custom Cursor
- Magnetic gold ring. Expands on hover over interactive elements.
- Shows contextual action label (e.g., "View", "Hold").
- Desktop/mouse only — hidden on touch.

---

## Signature Devices

| Device | Usage |
|---|---|
| Gold corner brackets | Product placeholder, vitrine frame |
| Gold vertical rule | Provenance hero divider — `1px`, gradient fade |
| Gold left border | Pull-quotes on provenance page |
| Gold left-edge line | Mobile nav panel accent |
| Grain texture (`#grain`) | Full-screen noise overlay — adds analogue warmth |
| Radial glow | Hero atmosphere, card hover glow |
| Horizontal rule in ivory | Section transitions, hero sub-element |
| Page veil + gold line | Route transitions — black veil, then gold line sweeps across |

---

## Brand Voice (Editorial Standard)

Applied to all copy — not just marketing. Every label, error state, and form field.

| Trait | Meaning |
|---|---|
| **Clarity** | Compress the thought. Fewer words wins. |
| **Presence** | Comfortable with silence. Whitespace and pauses are content. |
| **Precision** | One exact word over three approximate ones. |
| **Frame** | Control the angle of a statement, don't just describe. |
| **Observation** | Name a pattern the reader hadn't noticed. |
| **Restraint** | End the sentence before it over-explains. |

**Positioning principle (added Session 5):** scarcity is a fact about the object, not the hook for the reader. The hook is resemblance — a DOKU object mirrors the kind of person who buys it (someone who's built or found something once, without a template, in their own life or work). Keep the scarcity facts (they're true and required by the hard rules below), but the emotional angle is identification, not FOMO.

**Examples of the standard applied:**
- "Hold this DOKU" — not "Add to cart"
- "Only one. So are you." — the hero headline; not "This is a unique, one-of-a-kind item"
- "Found once. Then gone." — not "Limited availability"
- "Closed. Not sold out." — the listing distinction on the provenance page
- "Limited edition is a marketing term. We do not use it." — pull-quote, Chapter II
- "If the paragraph above sounds like you, you already understand what we sell." — closing line, Provenance Chapter IV ("The Resemblance")
- "It left Kyoto, Japan once, to reach us. Where it went next, we weren't told." — generated epitaph, real claim
- "Didn't send. Try again." — form error state; not "Something went wrong. Please try again."

---

## Hard Rules (Design Enforcement)

1. **No unlicensed images** — ever, even as placeholders. Undisclosed use of reference images is prohibited.
2. **Reference images require disclosure** — `referenceImage: true` on any product triggers the "Reference image — not the actual piece" label automatically via `frame()`.
3. **No real photography = gold vitrine frame or SVG sketch** — correct per brand. `frame()` checks `p.image` before `SKETCHES[p.sku]`, so an `image` field set on a `coming-soon` product silently wins and shows an undisclosed photo with no label — this actually happened to SKU 019 and was fixed in Session 5. When authoring a `coming-soon` product, don't set `image` unless it's a properly licensed, disclosed reference photo.
4. **No localStorage / sessionStorage** — cart is in-memory JS state by design.
5. **Checkout is a simulation** — copy must never imply a real charge occurred.

---

## Integrations

| Service | Purpose | Notes |
|---|---|---|
| **Web3Forms** | Inquire + Notify Me form submissions → email | Free tier. Key stored in `WEB3FORMS_KEY` const. No backend needed — pure client `fetch` POST. |
| **Frankfurter** | Live exchange rates for currency switcher | Free, no API key. Fetched on script parse; 1.5s timeout with hardcoded fallback. |
| **Google Analytics 4** | Pageviews + key events | ID: `G-S1MKLYC4QS`. Tracks: `page_view` (every route), `add_to_cart`, `generate_lead`, `notify_request`. |

---

## File Reference

| File | Role |
|---|---|
| `doku-site_9.html` | Active production file — single-file SPA |
| `doku-site_8.html` | Previous baseline — kept for reference |
| `images/` | Reference photos for SKUs 017 and 018 (embedded as base64 in the HTML) |
| `CLAUDE.md` | Project rules and context for Claude sessions |
| `progress.md` | Session-by-session progress log |
| `design.md` | This file — living design system record |
