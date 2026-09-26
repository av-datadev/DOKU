// Home — the flagship film (spec § "Home"). Scenes, in page order:
//   0 hook (time) · 1 push through the O · 2 kinetic cuts · 3 manifesto ·
//   4 tracking shot · 5 sketches draw · 6 archive drain · 7 final frame.
// Every scene checks its section exists: empty catalogue sections skip cleanly.

import { gsap, ScrollTrigger, SplitText, motionOn, fontsReady, own, ownAll, snapBrackets, drawSketch, revealCard, revealArchiveCard, ready } from '../core';
import { BEAT, EIGHTH, beatPx, scrollBeats } from '../beat';

const $ = <T extends Element = HTMLElement>(sel: string, root: ParentNode = document) => root.querySelector<T>(sel);
const $$ = <T extends Element = HTMLElement>(sel: string, root: ParentNode = document) =>
  Array.from(root.querySelectorAll<T>(sel));

/** Scene 0 — the hook. Time-based, ~1.6s: hairline → "1" → "/1" → collapse
 *  into DOKU while the brackets fly to the corners → tagline + CTA. Any input
 *  skips straight to the end frame (it plays every visit: nothing is stored). */
function hook(hero: HTMLElement): Promise<void> {
  const line = $('.hook-line', hero);
  const one = $('.hook-one', hero);
  const slash = $('.hook-slash', hero);
  const num = $('.hook-num', hero);
  const chars = $$('.hero-brand .ch', hero);
  const brand = $('.hero-brand', hero);
  const brackets = $('.brackets', hero);
  const tagline = $('.hero-tagline', hero);
  const cta = $('.hero-cta', hero);
  const cue = $('.hero-scroll', hero);
  const words = tagline ? SplitText.create(tagline, { type: 'words' }).words : [];

  const tl = gsap.timeline();
  tl.set([brand, tagline], { opacity: 1 })
    .set(words, { opacity: 0 })
    .set(chars, { opacity: 0 })
    .fromTo(line, { scaleX: 0, transformOrigin: '0 50%' }, { scaleX: 1, duration: 0.25 }, 0)
    .to(one, { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.22 }, EIGHTH)
    .to(line, { opacity: 0, duration: 0.3 }, EIGHTH)
    .fromTo(slash, { opacity: 0, x: '0.4em' }, { opacity: 1, x: 0, duration: 0.16, ease: 'power4.out' }, BEAT)
    .to(num, { scale: 0.12, opacity: 0, duration: 0.32, ease: 'power3.in' }, BEAT * 1.6)
    .fromTo(chars, { opacity: 0, scale: 1.6 }, { opacity: 1, scale: 1, duration: 0.45, stagger: 0.04 }, BEAT * 2);
  if (brackets) tl.add(snapBrackets(brackets, { from: 140 }), BEAT * 2);
  tl.to(words, { opacity: 1, y: 0, startAt: { y: 10 }, duration: 0.5, stagger: EIGHTH / 2 }, BEAT * 2.25)
    .fromTo(cta, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.5 }, BEAT * 2.5)
    .fromTo(cue, { opacity: 0 }, { opacity: 1, duration: 0.6 }, BEAT * 3);

  // Dev-only handle for frame-by-frame review of the hook (never in prod builds).
  if (import.meta.env.DEV) (window as unknown as { __dokuHook: gsap.core.Timeline }).__dokuHook = tl;
  const done = new Promise<void>((resolve) => tl.eventCallback('onComplete', () => resolve()));
  const skip = () => tl.progress(1);
  if (window.scrollY > 10) skip();
  for (const ev of ['wheel', 'touchstart', 'keydown', 'pointerdown'] as const) {
    window.addEventListener(ev, skip, { once: true, passive: true });
  }
  return done;
}

/** Scene 1 — camera pushes through the O of DOKU; the h1 assembles inside.
 *  The pin exists from the start (stable layout for every later scene), but the
 *  timeline only takes the wheel once the hook has finished or been skipped —
 *  otherwise a ScrollTrigger refresh would render its start frame (CTA visible)
 *  over the top of the hook. Smoothing mirrors `scrub: 0.6`. */
function pushThroughO(hero: HTMLElement, hookDone: Promise<void>) {
  const brand = $('.hero-brand', hero);
  const o = $('.ch-o', hero);
  const h1 = $('.hero-headline', hero);
  if (!brand || !o || !h1) return;

  const originOfO = () => {
    const b = brand.getBoundingClientRect();
    const r = o.getBoundingClientRect();
    return `${r.left - b.left + r.width / 2}px ${r.top - b.top + r.height * 0.52}px`;
  };
  const split = SplitText.create(h1, { type: 'chars,words', mask: 'words' });
  const italic = split.chars.filter((c) => c.closest('em'));
  const roman = split.chars.filter((c) => !c.closest('em'));
  gsap.set(h1, { opacity: 1 });
  gsap.set(split.chars, { yPercent: 110 });

  const falling = ['.hero-tagline', '.hero-cta', '.hero-scroll', '.brackets']
    .map((s) => $(s, hero))
    .filter((el): el is HTMLElement => !!el);

  const tl = gsap.timeline({ paused: true, defaults: { ease: 'none', immediateRender: false } });
  let live = false;
  const follow = (p: number, duration = 0.6) =>
    gsap.to(tl, { progress: p, duration, ease: 'power3.out', overwrite: true });
  const st = ScrollTrigger.create({
    trigger: hero,
    start: 'top top',
    end: scrollBeats(8),
    pin: true,
    onUpdate: (self) => live && follow(self.progress),
    onRefresh: () => tl.invalidate(),
  });
  hookDone.then(() => {
    live = true;
    tl.progress(st.progress);
  });
  tl.fromTo(falling, { opacity: 1, y: 0 }, { opacity: 0, y: -24, duration: 0.15 }, 0)
    .fromTo(brand, { scale: 1, transformOrigin: originOfO }, { scale: 70, ease: 'power2.in', duration: 0.5 }, 0)
    .fromTo(brand, { opacity: 1 }, { opacity: 0, duration: 0.08 }, 0.44)
    .fromTo(hero, { backgroundColor: '#0E0C0A' }, { backgroundColor: '#161310', duration: 0.25 }, 0.3)
    .fromTo(roman, { yPercent: 110 }, { yPercent: 0, stagger: 0.012, duration: 0.14, ease: 'power3.out' }, 0.48)
    // the downbeat: the italic line lands as one piece
    .fromTo(italic, { yPercent: 110 }, { yPercent: 0, duration: 0.08, ease: 'power4.out' }, 0.76)
    .to({}, { duration: 0.16 }); // hold
}

/** Scene 2 — the six words as full-screen hard cuts, one beat each. */
function kineticCuts(section: HTMLElement) {
  const words = $$('.cut-word', section);
  if (!words.length) return;
  const last = words[words.length - 1];
  const lastText = last.querySelector('.cut-text') ?? last;
  const lastChars = SplitText.create(lastText, { type: 'chars', charsClass: 'char' }).chars;

  const tl = gsap.timeline({
    defaults: { ease: 'none' },
    scrollTrigger: { trigger: section, start: 'top top', end: scrollBeats(words.length + 1), pin: true, scrub: true },
  });
  // The first word is visible from CSS, so the section never arrives empty.
  gsap.set(words[0], { visibility: 'visible' });
  words.forEach((w, i) => {
    if (i > 0) {
      tl.set(w, { visibility: 'visible' }, i);
      tl.set(words[i - 1], { visibility: 'hidden' }, i);
    }
    // each cut lands a hair large and settles — the "hit" inside the cut
    tl.fromTo(w, { scale: 1.06 }, { scale: 1, duration: 0.35, ease: 'expo.out' }, i);
  });
  // THEN GONE — letters lift away like the dust
  tl.to(lastChars, { y: -90, opacity: 0, stagger: 0.05, duration: 0.5, ease: 'power2.in' }, words.length - 0.55);
}

/** Scene 3 — manifesto lit word by word while the vitrine closes around it. */
function manifesto(section: HTMLElement) {
  const p = $('[data-lamp]', section);
  const brackets = $('.brackets', section);
  if (!p) return;
  own(p);
  const split = SplitText.create(p, { type: 'words' });
  p.classList.add('m-split');
  const goldWords = split.words.filter((w) => w.closest('.gold-word'));

  const tl = gsap.timeline({
    defaults: { ease: 'none' },
    scrollTrigger: { trigger: section, start: 'top top', end: scrollBeats(8), pin: true, scrub: 0.4 },
  });
  tl.fromTo(split.words, { opacity: 0.15 }, { opacity: 1, stagger: 0.02, duration: 0.1 }, 0);
  tl.to(goldWords, { color: '#B08D57', duration: 0.1 }, '>-0.05');
  if (brackets) {
    $$('.corner', brackets).forEach((c) => {
      const dx = c.classList.contains('tl') || c.classList.contains('bl') ? -1 : 1;
      const dy = c.classList.contains('tl') || c.classList.contains('tr') ? -1 : 1;
      tl.fromTo(c, { x: dx * 90, y: dy * 70, opacity: 0 }, { x: 0, y: 0, opacity: 1, duration: tl.duration() }, 0);
    });
  }
}

/** Scene 4 — vertical scroll becomes a horizontal camera track (desktop). */
function trackingShot(carousel: HTMLElement) {
  const track = $('.carousel-track', carousel);
  if (!track) return;
  const cards = $$('.item', track);
  const mm = gsap.matchMedia();
  mm.add('(min-width: 768px)', () => {
    const distance = () => Math.max(0, track.scrollWidth - carousel.clientWidth);
    cards.forEach((c) => {
      own(c);
      own(c.querySelector('.frame'));
    });
    const reveal = () =>
      cards.forEach((c, i) => {
        if (c.classList.contains('m-in')) return;
        if (c.getBoundingClientRect().left < window.innerWidth * 0.85) revealCard(c, (i % 3) * EIGHTH * 0.5);
      });

    if (distance() < 40) {
      // Nothing to pan across — just land the cards on the beat.
      ScrollTrigger.create({ trigger: carousel, start: 'top 80%', once: true, onEnter: reveal });
      return;
    }

    // Clip the moving track with its own wrapper, not the carousel, so the exit
    // brackets (a sibling) can open past the carousel's edges to the screen.
    carousel.style.overflow = 'visible';
    const clip = document.createElement('div');
    clip.style.overflow = 'hidden';
    track.before(clip);
    clip.appendChild(track);
    const exit = document.createElement('div');
    exit.className = 'brackets track-exit';
    exit.setAttribute('aria-hidden', 'true');
    exit.innerHTML = '<span class="corner tl"></span><span class="corner tr"></span><span class="corner bl"></span><span class="corner br"></span>';
    carousel.appendChild(exit);
    const lastCard = cards[cards.length - 1];
    const lastFrame = lastCard?.querySelector<HTMLElement>('.frame');

    const tl = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: {
        trigger: carousel,
        start: 'center center',
        end: () => '+=' + (distance() + beatPx(4)),
        pin: true,
        scrub: 0.5,
        invalidateOnRefresh: true,
        onUpdate: reveal,
        onEnter: reveal,
      },
    });
    tl.to(track, { x: () => -distance(), duration: 1 });
    if (lastFrame) {
      // Match cut out: the last frame's brackets open to the whole screen.
      const box = () => carousel.getBoundingClientRect();
      tl.set(exit, { display: 'block' }, 1)
        .fromTo(
          exit,
          {
            left: () => lastCard.offsetLeft + lastFrame.offsetLeft - distance(),
            top: () => lastCard.offsetTop + lastFrame.offsetTop,
            width: () => lastFrame.offsetWidth,
            height: () => lastFrame.offsetHeight,
            opacity: 1,
          },
          {
            left: () => -box().left + 24,
            top: () => -box().top + 24,
            width: () => window.innerWidth - 48,
            height: () => window.innerHeight - 48,
            duration: 0.35,
            ease: 'power2.inOut',
          },
          1.02,
        )
        .to(track, { opacity: 0.25, duration: 0.3 }, 1.05)
        .to(exit, { opacity: 0, duration: 0.12 }, '>');
    }
    return () => {
      carousel.style.overflow = '';
      clip.before(track);
      clip.remove();
      exit.remove();
    };
  });
}

/** Scene 6 — the palette drains as the archive arrives. */
function drain(section: HTMLElement) {
  ownAll('.archive-item', section).forEach((c) => own(c.querySelector('.frame')));
  const st = { trigger: section, start: 'top 85%', end: 'top 25%', scrub: true };
  gsap.fromTo(section, { '--gold': '#B08D57' }, { '--gold': '#6B6258', ease: 'none', scrollTrigger: st });
  const glow = $('#ambient-glow');
  if (glow) gsap.fromTo(glow, { opacity: 1 }, { opacity: 0.3, ease: 'none', scrollTrigger: { ...st } });
  ScrollTrigger.batch($$('.archive-item', section), {
    start: 'top 88%',
    once: true,
    // slower than anywhere else: this is the quiet before the ending
    onEnter: (els) => els.forEach((el, i) => revealArchiveCard(el, i * BEAT * 0.5).timeScale(0.7)),
  });
}

/** Scene 7 — the brackets lock onto the final frame on one hit. */
function finale(section: HTMLElement) {
  const brackets = $('.brackets', section);
  const mark = $('.finale-mark', section);
  const h2 = $('h2', section);
  if (!brackets) return;
  const tl = gsap.timeline({ paused: true });
  tl.add(snapBrackets(brackets, { from: Math.max(window.innerWidth, window.innerHeight) * 0.45 }), 0)
    .from([mark, h2], { opacity: 0, y: 16, duration: 0.8, stagger: EIGHTH }, EIGHTH);
  ScrollTrigger.create({ trigger: section, start: 'center 65%', once: true, onEnter: () => tl.play() });
}

export async function initHome(): Promise<void> {
  if (!motionOn()) return;
  const hero = $('[data-scene="hero"]');
  // The hook needs no text splitting beyond words, so it doesn't wait on fonts:
  // the first second belongs to the hook.
  const hookDone = hero ? hook(hero) : Promise.resolve();
  await fontsReady();

  if (hero) pushThroughO(hero, hookDone);
  const cuts = $('[data-scene="cuts"]');
  if (cuts) kineticCuts(cuts);
  const man = $('[data-scene="manifesto"]');
  if (man) manifesto(man);
  const track = $('[data-scene="track"]');
  if (track) trackingShot(track);
  const soon = $('[data-scene="soon"]');
  if (soon) $$('.frame-sketch', soon).forEach((f) => drawSketch(f));
  const archive = $('[data-scene="archive"]');
  if (archive) drain(archive);
  const fin = $('[data-scene="finale"]');
  if (fin) finale(fin);

  ready();
}
