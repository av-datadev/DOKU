// Shared motion layer for the "full" pages (home, collection, item, archive,
// provenance). Only those pages import this module, so GSAP never ships to
// cart / checkout / login / account (spec: "Payment path untouched").
//
// Contract with Base.astro: the head script puts `html.motion` on the page only
// when it's a full page AND the visitor hasn't asked for reduced motion. Every
// hidden initial state lives under `.motion` (motion.css). If this module never
// calls ready() within 3.5s, the head watchdog strips `.motion` and the page
// falls back to the plain, fully visible site.
//
// Rules this file enforces for every scene: native scroll only (no snap, no
// smooth-scroll, no wheel interception), house easing, no bounce/overshoot.

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { Flip } from 'gsap/Flip';
import { BEAT, EIGHTH } from './beat';

gsap.registerPlugin(ScrollTrigger, SplitText, Flip);
// Hits snap in and settle (house curve); scrubbed moves stay linear so the
// scroll wheel *is* the easing.
gsap.defaults({ ease: 'expo.out' });

export { gsap, ScrollTrigger, SplitText, Flip };

// Dev-only handle so a backgrounded preview (paused rAF) can be stepped by hand.
if (import.meta.env.DEV) (window as unknown as { __gsap: typeof gsap }).__gsap = gsap;

declare global {
  interface Window {
    __dokuMotionReady?: boolean;
  }
}

export const motionOn = (): boolean => document.documentElement.classList.contains('motion');

/** Resolve when webfonts are in (so splits use real Fraunces metrics), but
 *  never block the film on a slow font — cap at 800ms. */
export const fontsReady = (): Promise<void> =>
  Promise.race([
    document.fonts ? document.fonts.ready.then(() => undefined) : Promise.resolve(),
    new Promise<void>((r) => setTimeout(r, 800)),
  ]);

/** Mark an element as choreographed by a scene, so the generic sweep in
 *  ready() leaves it alone. */
export const own = <T extends Element>(el: T | null | undefined): T | null | undefined => {
  if (el instanceof HTMLElement) el.dataset.m = '1';
  return el;
};

/** Claim every match up front (before ready()), for elements a scene will
 *  reveal later from a batch/trigger. */
export const ownAll = (selector: string, root: ParentNode = document): Element[] => {
  const els = Array.from(root.querySelectorAll(selector));
  els.forEach((el) => own(el));
  return els;
};

const CORNER_DIRS: Record<string, [number, number]> = {
  tl: [-1, -1],
  tr: [1, -1],
  bl: [-1, 1],
  br: [1, 1],
};

/** The signature hit: the four vitrine corners snap in from outside. */
export function snapBrackets(root: Element, opts: { from?: number; delay?: number } = {}): gsap.core.Timeline {
  const d = opts.from ?? 26;
  const tl = gsap.timeline({ delay: opts.delay ?? 0 });
  root.querySelectorAll<HTMLElement>(':scope > .corner, :scope > .frame > .corner').forEach((c) => {
    const key = ['tl', 'tr', 'bl', 'br'].find((k) => c.classList.contains(k)) ?? 'tl';
    const [dx, dy] = CORNER_DIRS[key];
    tl.fromTo(c, { x: dx * d, y: dy * d, opacity: 0 }, { x: 0, y: 0, opacity: 1, duration: EIGHTH * 1.4 }, 0);
  });
  return tl;
}

/** Frame unmasks left→right (same look as reveal.css, but on the beat). */
export function wipeFrame(frame: Element, delay = 0): gsap.core.Tween {
  own(frame);
  return gsap.fromTo(
    frame,
    { clipPath: 'inset(0% 100% 0% 0%)', opacity: 0 },
    {
      clipPath: 'inset(0% 0% 0% 0%)',
      opacity: 1,
      duration: 1.1,
      delay,
      onComplete: () => {
        frame.classList.add('is-in');
        gsap.set(frame, { clearProps: 'clipPath,opacity' });
      },
    },
  );
}

/** Catalogue card entrance: frame wipe + bracket snap + text on eighths. */
export function revealCard(card: Element, delay = 0): gsap.core.Timeline {
  const tl = gsap.timeline({ delay });
  const frame = card.querySelector('.frame');
  own(card);
  own(frame);
  card.classList.add('m-in');
  if (frame) {
    tl.add(wipeFrame(frame), 0);
    tl.add(snapBrackets(frame), 0.12);
  }
  const text = Array.from(card.children).filter((c) => !c.classList.contains('frame'));
  tl.from(text, { y: 14, opacity: 0, duration: 0.9, stagger: EIGHTH / 3 }, 0.18);
  return tl;
}

/** Archive card: the standard entrance, then the gold hairline "signs" under
 *  the epitaph (motion.css `.m-signed`). */
export function revealArchiveCard(card: Element, delay = 0): gsap.core.Timeline {
  const tl = revealCard(card, delay);
  tl.call(() => card.classList.add('m-signed'), [], 0.7);
  return tl;
}

/** Split into words and light them up in reading order as the scroll moves. */
export function readingLamp(el: Element, trigger: ScrollTrigger.Vars): SplitText {
  own(el);
  const split = SplitText.create(el, { type: 'words' });
  el.classList.add('m-split');
  gsap.fromTo(
    split.words,
    { opacity: 0.15 },
    { opacity: 1, ease: 'none', stagger: 0.1, scrollTrigger: { trigger: el, scrub: true, ...trigger } },
  );
  return split;
}

/** Roll the first integer in an element's text up from 0. */
export function countUp(el: Element, opts: { duration?: number; delay?: number } = {}): gsap.core.Tween | null {
  const text = el.textContent ?? '';
  const m = text.match(/\d+/);
  if (!m) return null;
  const target = Number(m[0]);
  const obj = { v: 0 };
  el.textContent = text.replace(/\d+/, '0');
  return gsap.to(obj, {
    v: target,
    duration: opts.duration ?? 1.2,
    delay: opts.delay ?? 0,
    ease: 'expo.out',
    onUpdate: () => {
      el.textContent = text.replace(/\d+/, String(Math.round(obj.v)));
    },
  });
}

/** Gold-line sketches draw themselves, stroke by stroke, with the scroll. */
export function drawSketch(frame: Element, trigger: ScrollTrigger.Vars = {}): void {
  const shapes = frame.querySelectorAll<SVGGeometryElement>(
    '.sketch-art path, .sketch-art line, .sketch-art polyline, .sketch-art polygon, .sketch-art circle, .sketch-art ellipse, .sketch-art rect',
  );
  shapes.forEach((s) => {
    let len = 0;
    try {
      len = s.getTotalLength();
    } catch {
      return;
    }
    if (!len) return;
    gsap.fromTo(
      s,
      { strokeDasharray: len, strokeDashoffset: len },
      {
        strokeDashoffset: 0,
        ease: 'none',
        scrollTrigger: { trigger: frame, start: 'top 90%', end: 'center 45%', scrub: true, ...trigger },
      },
    );
  });
}

/** Wax-seal stamp: lands with a hard stop. `dull` = the claimed/reserved thud. */
export function stamp(el: Element, opts: { dull?: boolean; delay?: number } = {}): gsap.core.Tween {
  return gsap.fromTo(
    el,
    { scale: opts.dull ? 1.12 : 1.3, opacity: 0 },
    { scale: 1, opacity: 1, duration: opts.dull ? 0.16 : 0.24, delay: opts.delay ?? 0, ease: 'power4.out' },
  );
}

/** Characters / lines, masked so they rise out of their own baseline. */
export const splitChars = (el: Element) => SplitText.create(el, { type: 'chars,words', mask: 'words' });
export const splitLines = (el: Element) => SplitText.create(el, { type: 'lines', mask: 'lines' });

/** Draw a section head's gold hairline (reveal.css transition) at a moment. */
export function lineIn(el: Element | null, delay = 0): void {
  if (!el) return;
  own(el);
  gsap.delayedCall(delay, () => el.classList.add('is-in'));
}

/** Section-head hook: title letters rise out of their baseline, the gold
 *  hairline draws on the downbeat. Returns the timeline for sequencing. */
export function headHook(head: Element, delay = 0): gsap.core.Timeline {
  own(head);
  const tl = gsap.timeline({ delay });
  const title = head.querySelector('h1, h2');
  if (title) {
    const split = splitChars(title);
    tl.set(title, { opacity: 1 }).from(split.chars, { yPercent: 110, duration: 0.7, stagger: 0.03 }, 0);
  }
  tl.call(() => head.classList.add('is-in'), [], BEAT);
  return tl;
}

/** The "camera" inside a frame: its image/sketch drifts against the scroll,
 *  so a grid reads as depth without breaking the hairline layout. */
export function frameParallax(frame: Element): void {
  const img = frame.querySelector('img');
  const inner = img ?? frame.querySelector('.sketch-art');
  if (!inner) return;
  gsap.fromTo(
    inner,
    { yPercent: -5, scale: img ? 1.12 : 1 },
    {
      yPercent: 5,
      ease: 'none',
      scrollTrigger: { trigger: frame, start: 'top bottom', end: 'bottom top', scrub: true },
    },
  );
}

/** Choreograph a DOM mutation (filtering): leavers fold away, stayers glide. */
export function withFlip(targets: Element[], mutate: () => void): void {
  if (!motionOn()) {
    mutate();
    return;
  }
  const state = Flip.getState(targets);
  mutate();
  Flip.from(state, {
    duration: 0.6,
    ease: 'expo.out',
    absolute: true,
    onEnter: (els) => gsap.fromTo(els, { opacity: 0, scale: 0.96 }, { opacity: 1, scale: 1, duration: 0.5 }),
    onLeave: (els) => gsap.to(els, { opacity: 0, scale: 0.96, duration: 0.3 }),
    onComplete: () => ScrollTrigger.refresh(),
  });
}

/** Call once a page's scenes are built. Tells the head watchdog we're alive,
 *  then sweeps any [data-reveal] element no scene claimed so nothing can stay
 *  hidden (Reveal.astro stands down on .motion pages). */
export function ready(): void {
  window.__dokuMotionReady = true;
  // Cards no scene claimed: the standard card entrance, a row at a time.
  ScrollTrigger.batch('.item:not([data-m]), .archive-item:not([data-m])', {
    start: 'top 90%',
    once: true,
    onEnter: (els) =>
      els.forEach((el, i) =>
        el.classList.contains('archive-item') ? revealArchiveCard(el, i * EIGHTH * 0.5) : revealCard(el, i * EIGHTH * 0.5),
      ),
  });
  // Batch selectors are resolved once, now — so exclude frames that live inside
  // cards (the card entrance above owns those).
  const loose = Array.from(document.querySelectorAll('[data-reveal]:not([data-m])')).filter(
    (el) => !el.closest('.item, .archive-item'),
  );
  if (loose.length) ScrollTrigger.batch(loose, {
    start: 'top 88%',
    once: true,
    onEnter: (els) =>
      els.forEach((el, i) => {
        if (el.getAttribute('data-reveal') !== 'frame') return el.classList.add('is-in');
        wipeFrame(el, i * EIGHTH * 0.5);
        snapBrackets(el, { delay: 0.12 + i * EIGHTH * 0.5 });
      }),
  });
  ScrollTrigger.refresh();
}
