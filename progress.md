# DOKU — Project Progress

## What DOKU Is

A premium marketplace for one-of-one objects. Every item is genuinely unique, sold once, never restocked. The entire brand rests on that authenticity. The site is a single self-contained HTML file — client-side SPA with hash routing, no build step, no backend, no framework.

---

## Accomplished This Session

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

## Current State

| File | Status | Notes |
|---|---|---|
| `doku-site_8.html` | Baseline | Original version, kept intact |
| `doku-site_9.html` | **Active** | Enhanced version — use this going forward |
| `CLAUDE.md` | Done | Project context for Claude sessions |
| `.claude/skills/frontend-design` | Installed | Auto-triggers on design tasks |
| `.claude/skills/ui-ux-pro-max` | Installed | Searchable design intelligence |
| `.claude/launch.json` | Done | `python3 -m http.server 7432` for local preview |

**No real photography yet** — items without images show the gold vitrine frame (corner brackets + ambient glow). This is correct per the hard rules in `CLAUDE.md`.

---

## Next Steps

### Immediate
- [ ] **Product photography** — Add `image:` field to any `PRODUCTS` entry once real photos are available. The `frame()` function handles the switch automatically.
- [ ] **Add more catalog items** — Extend the `PRODUCTS` array in `doku-site_9.html` with new `available`, `coming-soon`, or `claimed` entries.
- [ ] **Coming-soon sketches** — Draw SVG sketches for items 019+ and add to the `SKETCHES` object.

### Design
- [ ] **Mobile nav** — The mobile menu opens but could use a more considered animation (slide from right vs. fade).
- [ ] **Product detail on desktop** — Test the 2-column layout at 1200px+ with a real image in the frame.
- [ ] **Dark/light currency switcher styling** — The currency `<select>` is functional but minimal.

### Infrastructure (before going live)
- [ ] **Real backend + payment processor** — Checkout is currently a simulation. Needs Stripe or similar wired to an actual order endpoint.
- [ ] **"Notify me" and "Inquire" forms** — Currently front-end only. Need an email handler (e.g. Resend, Postmark, or a simple serverless function).
- [ ] **Live currency rates** — Rates are hardcoded in `RATES {}`. Should pull from an exchange rate API.
- [ ] **Domain + hosting** — The site is a single HTML file; can be served from any static host (Vercel, Netlify, Cloudflare Pages).
- [ ] **Analytics** — No tracking yet.

### Stretch
- [ ] **Collection filtering** — Filter available items by origin, price range, or material on the collection page.
- [ ] **Archive search** — The archive will grow; a text search would help.
- [ ] **Provenance page expansion** — Could become a deeper editorial piece with imagery.
