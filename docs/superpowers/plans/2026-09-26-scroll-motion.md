# Scroll-driven Motion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the browsing pages of discoverdoku.com into a scroll-scrubbed motion film (hook → build → final frame) with native page cuts, keeping transactional pages calm.

**Architecture:** GSAP + ScrollTrigger (+ SplitText, Flip) bundled from npm and imported only by the five "full" pages' scene modules. A shared `src/motion/` layer holds the beat grid and reusable primitives; each page has one scene module. Hidden initial states live under an `html.motion` class that a head script sets only on full pages without reduced motion, with a watchdog that falls back to today's site. Page cuts are CSS cross-document View Transitions plus a tiny render-blocking head script for the card→item match cut.

**Tech Stack:** Astro 5 SSR (Cloudflare adapter), TypeScript, GSAP 3.13+, CSS View Transitions Level 2.

**Spec:** `docs/superpowers/specs/2026-09-26-scroll-motion-design.md`

## Global Constraints
- No scroll hijack: no smooth-scroll libs, no ScrollTrigger `snap`, no wheel/touch interception (input listeners in the hook only *skip* the hook).
- No `localStorage`/`sessionStorage`/cookies for motion state (Hard rule 3).
- House ease only; no bounce/elastic/back eases.
- Motion never adds imagery; copy unchanged except presentational `<span>` wrappers.
- GSAP must not be imported by cart/checkout/login/account/confirmation/inquire/legal/auth pages.
- Beat grid: 96 BPM, 1 beat = 0.625s = 12vh scroll (×0.6 below 768px).
- Everything visible without JS, with reduced motion, and after the 3.5s watchdog fallback.

## Verification harness (used by every task)
- `cd web && npx astro check` → 0 errors.
- `cd web && npm run build` → succeeds.
- Preview (`doku-web` launch config, port 4321): load the page, `read_console_messages onlyErrors` → none; scroll through with `window.scrollTo` steps + screenshots; confirm CTAs are clickable (`document.elementFromPoint`).

---

### Task 1: Foundation — dependency, beat grid, core primitives, Base wiring, motion.css, page cuts

**Files:**
- Modify: `web/package.json` (add `gsap`)
- Create: `web/src/motion/beat.ts`, `web/src/motion/core.ts`, `web/src/styles/motion.css`
- Modify: `web/src/layouts/Base.astro`, `web/src/components/Reveal.astro`, `web/src/styles/shell.css` (header VT name, if header styles live there)

**Interfaces (Produces):**
- `beat.ts`: `BPM=96`, `BEAT=0.625`, `EIGHTH=0.3125`, `BAR=2.5`, `isPhone(): boolean`, `beatPx(n: number): number`, `scrollBeats(n: number): () => string` (`'+=' + beatPx(n)`).
- `core.ts`: `gsap`, `ScrollTrigger`, `SplitText`, `Flip` re-exports; `motionOn(): boolean` (true iff `html.motion`); `ready(): void` (sets `window.__dokuMotionReady = true`); `fontsReady(): Promise<void>` (fonts.ready capped at 800ms); primitives:
  - `snapBrackets(root: Element, opts?: {from?: number, delay?: number}): gsap.core.Timeline` — `.corner` children fly from ±`from` px to rest, one hit.
  - `wipeFrame(frame: Element, delay?: number): gsap.core.Tween` — clip-path `inset(0 100% 0 0)`→`inset(0 0% 0 0)`, then adds `.is-in` and clears props.
  - `revealCard(card: Element, delay?: number): gsap.core.Timeline` — brackets + wipe + text stagger.
  - `readingLamp(el: Element, trigger: ScrollTrigger.Vars): SplitText` — words 0.15→1 opacity scrubbed.
  - `countUp(el: Element, opts?: {duration?: number, delay?: number}): gsap.core.Tween` — integer from 0 to its text value.
  - `drawSketch(frame: Element, trigger?: ScrollTrigger.Vars): void` — `stroke-dashoffset` scrub on every SVGGeometryElement in `.sketch-art`.
  - `stamp(el: Element, opts?: {dull?: boolean}): gsap.core.Tween` — scale 1.3→1 (dull: 1.12→1, shorter), hard stop.
  - `withFlip(targets: Element[], mutate: () => void): void` — Flip state → mutate → `Flip.from` (plain mutate if motion off).
  - `lineIn(el: Element, trigger?): void` — adds `.is-in` to a `[data-reveal=line]` head at the given moment.
- Base prop `motion?: 'full' | 'calm'`; body attribute `data-motion`.

- [ ] Step 1: `cd web && npm i gsap@^3.13` — verify `node_modules/gsap/SplitText.js` and `Flip.js` exist.
- [ ] Step 2: Write `beat.ts` and `core.ts` per interfaces (custom ease `doku` = `CustomEase` not needed; use `expo.out` for hits, `none` for scrubs, `power2.inOut` for camera moves).
- [ ] Step 3: `motion.css` — `.motion [data-reveal='frame']{transition:none}`, `.motion .frame .corner{opacity:0}`, hero/hook/cuts/finale/manifesto base styles (hidden states only under `.motion`), `@view-transition{navigation:auto}`, hairline wipe keyframes on `::view-transition-old/new(root)` + `::view-transition` background line, `site-header` VT name, reduced-motion VT fade, `.calm main` 300ms fade-up, confirmation bracket keyframes.
- [ ] Step 4: Base.astro — prop, inline head script (motion class when full && !reduced; 3.5s watchdog → remove `.motion`, add `.is-in` to `[data-reveal]`), inline VT `pageswap`/`pagereveal` match-cut script, import `motion.css`, `class="calm"`/`data-motion` on body.
- [ ] Step 5: Reveal.astro — return early when `html.motion` (scene code owns reveals).
- [ ] Step 6: Verification harness on `/cart` and `/privacy` (calm: page cut + fade, no gsap chunk in network). Commit.

### Task 2: Home film (scenes 0–7)

**Files:** Create `web/src/motion/scenes/home.ts`; modify `web/src/pages/index.astro`.
**Interfaces:** Consumes Task 1 exports. Produces `initHome(): Promise<void>`.

- [ ] Step 1: Markup — hook layer (`.hook` with `.hook-line`, `.hook-one`, `.hook-slash`), hero brackets, `.hero-brand` letters as spans (D,O,K,U with `.o` marker), `.cuts` section (6 word layers, `aria-hidden`), manifesto corner spans + `.gold-word` spans around "go looking" / "will not repeat", `data-scene` markers on sections, new `.finale` section (1/1, "Only one.", CTA → /collection). `<Base motion="full">`.
- [ ] Step 2: `home.ts` scene 0 hook timeline + skip-on-input; scene 1 O push (pinned, `scrollBeats(8)`); scene 2 cuts (pinned, `scrollBeats(6)`, instant `set` cuts, bg invert, THEN GONE dissolve); scene 3 manifesto lamp + brackets (pinned, `scrollBeats(8)`); scene 4 horizontal track (desktop matchMedia, `containerAnimation` card reveals, bracket expand out); phone: batch card reveals; scene 5 sketch draw; scene 6 drain (`--gold` on section, `#ambient-glow` opacity); scene 7 finale lock hit. Section-head lines via `lineIn`. `ready()` at end.
- [ ] Step 3: Verify: hook plays and skips; scrolling top→bottom at 1440×900 and 375×812 — screenshots per scene; no console errors; fallback test (`document.documentElement.classList.remove('motion')` → everything visible). Commit.

### Task 3: /collection

**Files:** Create `web/src/motion/scenes/collection.ts`; modify `web/src/pages/collection.astro`.
**Interfaces:** Produces `initCollection(): Promise<void>`, uses `withFlip`.

- [ ] Step 1: `<Base motion="full">`; filter script calls `withFlip(cards, apply)` for pill/clear clicks; disable `.grid-filtered .item` fadeIn under `.motion`.
- [ ] Step 2: Scene: heading chars in, line on downbeat, count up, pills eighth stagger, `ScrollTrigger.batch('.grid .item')` → `revealCard`, inner frame parallax ±6%, sketch draws. `ScrollTrigger.refresh()` after each filter.
- [ ] Step 3: Verify filters still filter correctly (count text, no-matches state), cards animate, no errors. Commit.

### Task 4: /item/:sku

**Files:** Create `web/src/motion/scenes/item.ts`; modify `web/src/pages/item/[sku].astro`.
**Interfaces:** Produces `initItem(): Promise<void>`.

- [ ] Step 1: `<Base motion="full">`; `data-status` on `.product`.
- [ ] Step 2: Scene: frame hook (if no active VT: brackets from viewport corners + wipe; if VT: just mark in), info sequence on eighths (seal stamp — dull for reserved/claimed; title lines; origin; price row; CTA ≤1.2s), desktop frame push 1→1.06 scrubbed, story lamp, spec ledger, related grid like collection.
- [ ] Step 3: Verify for an available, a coming-soon, and a claimed sku; Hold button clickable at t=0 (`elementFromPoint`); match cut from /collection card (Chrome). Commit.

### Task 5: /archive + /provenance

**Files:** Create `web/src/motion/scenes/archive.ts`, `web/src/motion/scenes/provenance.ts`; modify `web/src/pages/archive.astro`, `web/src/pages/provenance.astro`.
**Interfaces:** Produces `initArchive()`, `initProvenance()`.

- [ ] Step 1: Archive: `<Base motion="full">`, `.drained` page class (dim glow, `--gold`→`--claimed`), subhead words slow, batch cards: desaturated enter, epitaph fade, `.epitaph::after` hairline sign.
- [ ] Step 2: Provenance markup: wrap hero h1 lines in spans, wrap "Closed." in `.closed-word`, `.veil` + `.flash` overlays (aria-hidden). Scene: hook cuts, stats pin + count ups, chapter label slam→shrink, body line reveals, pull-quote pin/scale/veil, criteria ticks, Closed flash (once), chapter V count + drain.
- [ ] Step 3: Verify both pages desktop + phone; search on archive still works. Commit.

### Task 6: Calm pages, confirmation brackets, final verification

**Files:** Modify `web/src/pages/confirmation.astro` (corner spans around order id); CSS already in motion.css.

- [ ] Step 1: Confirmation brackets markup.
- [ ] Step 2: Full harness: `astro check`, `npm run build`; walk every page; network check that no gsap chunk loads on `/cart`, `/checkout`, `/login`; phone viewport horizontal-overflow check (`document.documentElement.scrollWidth <= innerWidth`) on all five full pages.
- [ ] Step 3: Update CLAUDE.md "Design system" motion notes; commit.
