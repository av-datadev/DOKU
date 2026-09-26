# Scroll-driven motion ("the site as a film") — design

Status: approved in chat 2026-09-26 (storyboards for home + all browsing pages).
Owner decisions: browsing pages get full motion, transactional pages stay calm;
energy = "hard cuts, luxury holds"; no audio (visual beat grid only);
engine = GSAP + ScrollTrigger (approach A).

## Goal
Visiting discoverdoku.com should feel like watching a motion-graphics film whose
playhead is the scroll position — a hook in the first second, a build through
distinct techniques (typography, shape play, camera moves, colour shifts), and a
clean final frame — without hijacking scroll, and without changing any copy,
data, or the rules that protect authenticity (Hard rules 1–4).

## Non-negotiables
- **No scroll hijack.** Native scroll only. No smooth-scroll libraries, no
  ScrollTrigger `snap`, no wheel interception. Pinned scenes (GSAP `pin`) are
  allowed: they hold a section while native scroll advances its timeline.
- **No storage.** Nothing is remembered between visits (Hard rule 3) — so the
  home hook is short enough (~1.6s) to play every time, and skippable.
- **Brand motion.** House easing `--ease` (`cubic-bezier(.16,1,.3,1)`, GSAP
  equivalent `expo.out`-ish custom ease `doku`). No bounce, no elastic, no
  overshoot. Rhythm comes from contrast: instant cuts vs. slow scrubbed holds.
- **Images.** Motion only transforms what `Frame.astro` already renders. It
  never introduces imagery (Hard rules 1 & 2). Sketches may animate their own
  strokes.
- **Copy unchanged** except purely presentational wrappers (spans around words).
- **CTAs are always clickable** — entrance animation is visual only, and every
  primary CTA is on screen within ~1.2s of landing.
- **Payment path untouched.** GSAP is never loaded on cart / checkout / login /
  account / confirmation / inquire / legal pages.

## The beat grid (`src/motion/beat.ts`)
- 96 BPM → `BEAT = 0.625s`, `EIGHTH = 0.3125s`, `BAR = 4 beats`.
- Scroll length: 1 beat = 12vh of scroll (desktop), ×0.6 on phones
  (`< 768px`). Helper `scrollBeats(n)` returns a ScrollTrigger `end` function
  (`() => '+=' + px`) so it recomputes on refresh/resize.
- Two kinds of motion, used deliberately:
  - **Scrubbed** (tied to scroll): camera pushes, pans, reading-lamp reveals,
    colour drains, sketch draws.
  - **Hits** (time-based, triggered once when scroll crosses a point, lengths in
    beats): bracket snaps, stamps, type slams, the final lock. These are the
    "cut to music" moments.

## Progressive enhancement & fallbacks
- `Base.astro` gets a `motion?: 'full' | 'calm'` prop (default `'calm'`).
- An inline `<head>` script adds `html.motion` **only** when the page is
  `full` AND `prefers-reduced-motion` is not `reduce`. All hidden initial states
  live under `.motion` in `src/styles/motion.css`.
- Watchdog: the same inline script, after 3.5s, checks
  `window.__dokuMotionReady`; if unset (GSAP failed/blocked), it removes
  `.motion` and adds `.is-in` to every `[data-reveal]` → the page is exactly
  today's site. No-JS visitors never get `.motion` at all.
- Reduced motion: no `.motion` class, scene modules early-return, page cuts
  become a 200ms crossfade.
- `Reveal.astro` keeps working on calm pages; on `.motion` pages the scene code
  owns `[data-reveal]` elements (adds `.is-in` itself at the right beat) and
  frame transitions are disabled so GSAP and CSS never fight.
- SplitText runs after `document.fonts.ready` (capped at 800ms) so line splits
  match the real Fraunces metrics.

## Page cuts — cross-document View Transitions (all pages, CSS + tiny inline JS)
- `@view-transition { navigation: auto; }` in `motion.css`.
- **Hairline wipe**: new page revealed top→down under a moving 1px gold line
  (~0.55s, house ease). Implemented by clipping `::view-transition-old(root)` /
  `-new(root)` with a 2px gap and painting the gold line as the
  `::view-transition` pseudo's background, keyframed in lockstep.
- Header is `view-transition-name: site-header` so it holds still.
- **Match cut**: clicking an item card morphs its frame into the item page's
  big frame (and back). An inline render-blocking script in `<head>` handles
  `pageswap` (name the clicked card's `.frame` `frame-<sku>`) and `pagereveal`
  (name the matching frame on the new page, using `navigation.activation.from`),
  clearing names when the transition finishes. Unsupported browsers just
  navigate.

## Home (`/`) — scenes
0. **Hook** (load, time-based, ~1.6s): gold hairline slashes centre → giant
   Fraunces "1" cuts in (0.3s) → "/1" slams (0.6s), hold one beat → "1/1"
   collapses into the DOKU wordmark (1.2s) while four vitrine brackets fly to the
   hero corners → "Found. Not made." word-by-word + CTA live (1.6s). Any wheel /
   touch / key / pointer input jumps to the end state. Existing CSS `heroUp`
   entrances are disabled under `.motion`.
1. **Push through the O** (pinned, 2 bars, scrubbed): wordmark scales around the
   centre of its "O" until the counter fills the screen; tagline/CTA/brackets
   fall away; the hero warms `--bg → --bg-card`; the h1 "Only one. / *So are
   you.*" (absolutely centred under `.motion`) assembles letter by letter, the
   italic line landing on the downbeat.
2. **Kinetic cuts** (pinned, 6 beats, scrubbed with instant `set` cuts): the six
   marquee words each own the full screen for one beat; background/colour invert
   every other beat (ivory-on-black ↔ black-on-gold); "THEN GONE" letters rise
   and dissolve. The ticker marquee is hidden under `.motion` (it returns in
   fallback).
3. **Manifesto** (pinned, 2 bars, scrubbed): words go 15% → 100% ivory in
   reading order; "go looking" and "will not repeat" resolve in gold; four
   corner brackets close in around the paragraph.
4. **Available now — tracking shot** (desktop: pinned, length = track overflow;
   scrubbed horizontal pan of `.carousel-track`): each card's brackets snap +
   frame wipes as it reaches centre (ScrollTrigger `containerAnimation`); the
   last card's brackets expand to the viewport as the match cut out. Phones keep
   the native swipe carousel with per-card snaps.
5. **Coming soon** — sketch strokes draw via `stroke-dashoffset`, scrubbed.
6. **Archive** — colour drain: section's `--gold` tweens to `--claimed`, ambient
   glow dims to ~30%; cards enter desaturated, epitaphs fade in slowly.
7. **Final frame** (new `.finale` section, rendered for everyone): black, one
   centred vitrine frame with a small "1/1", "Only one.", and "Explore the
   collection". Brackets start at the viewport corners and lock onto the frame on
   a single hit (0.35s) when it reaches centre; then it holds. Footer follows.
Empty sections (no available / coming-soon / claimed) skip their scene cleanly.

## /collection
- Hook: "The collection" letters in; heading hairline draws on the downbeat;
  count "{n} objects" rolls up from 0.
- Filter pills stagger in on eighth-notes.
- Filtering uses GSAP Flip: leaving cards fade/shrink, staying cards glide to
  new positions (existing filter logic unchanged; wrapped in `withFlip()`).
- Grid: `ScrollTrigger.batch` — per row, brackets snap then frames wipe.
  "Camera parallax" = the image/sketch inside each frame drifts ±6% (scrubbed)
  so the hairline grid itself never breaks.
- Coming soon: sketch draw.

## /item/:sku
- Hook: match cut if arriving from a card; otherwise brackets fly in from the
  viewport corners and collapse onto the frame.
- Info column on eighth-notes: seal N° stamps (scale 1.3 → 1, hard stop), title
  splits by line, origin, price, then Hold/Notify — CTA visible by ~1.2s and
  clickable throughout.
- Scroll: sticky frame (already sticky) pushes in 1 → 1.06, scrubbed across the
  product section; story paragraphs reading-lamp; spec rows enter as a ledger
  (hairline, then label/value, one per eighth).
- Status grade: reserved/claimed frames desaturate as they land; the seal stamps
  with a short dull thud (no overshoot).
- "You may not see these again" grid behaves like /collection.

## /archive
- Opens in the drained palette (dim glow, `--gold` → `--claimed` on the page).
- Subhead fades word by word, slowest on the site.
- Cards enter desaturated; epitaph fades in; a small gold hairline signs under
  each epitaph. Search behaviour unchanged.

## /provenance
- Hook: "We do not make things." hard-cuts on beat 1, "We find them." on beat 3,
  rule draws.
- Stats pinned 1 bar; each number counts up from 0 to its live value on its own
  beat, then all lock.
- Chapters I–V: the chapter label slams in huge then shrinks to its slot (camera
  pull-back); body lines reveal; each pull quote pins for a bar, scales up
  toward centre while a veil dims everything else, then releases.
- Chapter II criteria tick in one per beat with a gold bracket mark.
- Chapter III: *"Closed."* triggers one single-beat gold full-screen card with
  "Closed." in black (the page's only colour flip; no strobing).
- Chapter V: archive count counts up; page drains toward the archive palette.

## Calm pages
cart, checkout, login, account, inquire, confirmation, privacy, terms,
refund-policy, shipping, auth/*: page cut + a 300ms CSS fade-up of `main`.
No GSAP. Confirmation: four corner brackets lock around the order code (CSS
keyframes); copy unchanged ("Held. Only for you.").

## Files
- `web/package.json` — add `gsap` (free incl. SplitText/Flip since 2025).
- `web/src/motion/beat.ts` — tempo constants, `scrollBeats`, `isPhone`.
- `web/src/motion/core.ts` — plugin registration, custom ease, `ready()`
  (marks `__dokuMotionReady`), `fontsReady()`, shared primitives:
  `snapBrackets`, `wipeFrame`, `readingLamp`, `countUp`, `drawSketch`, `stamp`,
  `splitChars/Lines`, `withFlip`.
- `web/src/motion/scenes/{home,collection,item,archive,provenance}.ts`.
- `web/src/styles/motion.css` — `.motion` hidden states, finale/hook/cuts
  styles, view-transition CSS, calm entrance, confirmation brackets.
- `web/src/layouts/Base.astro` — `motion` prop, head scripts (class + watchdog,
  VT match-cut handlers), import motion.css, header VT name.
- Pages: `index.astro` (hook, cuts section, manifesto spans + brackets,
  finale), `collection.astro`, `item/[sku].astro`, `archive.astro`,
  `provenance.astro` (wrap "Closed.", mark scenes), `confirmation.astro`
  (brackets). `Reveal.astro` skips `.motion` pages.

## Verification
- `npm run build` and `npx astro check` clean.
- Dev server: each full page scrolled top→bottom — no console errors; scenes
  play; pinned sections release; CTAs clickable during entrance.
- Fallback: remove `.motion` via JS → all content visible and styled as today.
- Reduced motion reasoning checked in code (class never set, VT → fade).
- Phone viewport (375×812): no horizontal page scroll, carousel swipes natively,
  pins shorter.
- Calm pages: no `gsap` chunk requested (network panel).
