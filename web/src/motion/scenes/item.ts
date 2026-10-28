// /item/:sku — the portrait (spec § "/item/:sku"). The frame either arrives by
// match cut (View Transition from a card) or brackets in from the screen
// corners; the info column lands on eighth-notes with the CTA by ~1.25s (and
// clickable the whole time — only opacity is animated); the sticky frame pushes
// in as you read; story paragraphs light up; specs enter as a ledger.
// Reserved/claimed pieces grade down to --claimed as they land.
// Pieces whose city has a map open with the map film instead (filmScene).

import {
  gsap,
  ScrollTrigger,
  motionOn,
  fontsReady,
  own,
  snapBrackets,
  wipeFrame,
  stamp,
  splitLines,
  readingLamp,
  frameParallax,
  ready,
  batchBothWays,
} from '../core';
import { EIGHTH } from '../beat';
import { prepareStory, playStory, railFor } from './story';

/** The living photo: no footage, just the still breathing — the camera drifts
 *  slowly in and across, and a band of lamplight crosses the surface every
 *  few seconds. Paused whenever the frame is off screen. */
function livingPhoto(frame: HTMLElement, img: HTMLImageElement) {
  const light = document.createElement('span');
  light.className = 'frame-light';
  light.setAttribute('aria-hidden', 'true');
  frame.appendChild(light);

  const drift = gsap.timeline({ repeat: -1, yoyo: true, defaults: { ease: 'sine.inOut' } });
  drift.fromTo(img, { scale: 1.02, xPercent: 0, yPercent: 0 }, { scale: 1.09, xPercent: -1.5, yPercent: -1, duration: 14 });
  const lamp = gsap.timeline({ repeat: -1, repeatDelay: 3.5, delay: 1.8 });
  lamp.fromTo(light, { xPercent: -70 }, { xPercent: 70, duration: 4.5, ease: 'power1.inOut' });

  ScrollTrigger.create({
    trigger: frame,
    start: 'top bottom',
    end: 'bottom top',
    onToggle: (self) => [drift, lamp].forEach((t) => (self.isActive ? t.resume() : t.pause())),
  });
}

/** Story paragraphs light up as they're read; spec rows enter as a ledger. */
function readingScene(root: ParentNode) {
  root.querySelectorAll('.story-block').forEach((block) => gsap.set(block, { opacity: 1 }));
  root.querySelectorAll('.story-block p').forEach((p) =>
    readingLamp(p, { start: 'top 88%', end: 'bottom 60%' }),
  );
  const rows = Array.from(root.querySelectorAll('.spec-row'));
  if (rows.length) {
    gsap.set(rows, { opacity: 0 });
    batchBothWays(rows, {
      start: 'top 92%',
      stagger: EIGHTH / 2,
      make: (el) => gsap.timeline().fromTo(el, { opacity: 0, x: -10 }, { opacity: 1, x: 0, duration: 0.6 }),
    });
  }
}

/** The map film (components/ItemFilm.astro). The markup is the final frame;
 *  this pins it and plays it in from the top: the name alone over a close,
 *  dim city → the city opens out → the pen loops the market → the piece rises
 *  out of the circle → price and action. Native scroll throughout (pin only).
 *  If the frame is taller than the screen it can't pin, so it plays once. */
async function filmScene(film: HTMLElement) {
  const map = film.querySelector<HTMLElement>('.film-map');
  const ring = film.querySelector<SVGElement>('.film-ring');
  const loop = film.querySelector<SVGPathElement>('.film-loop');
  const market = film.querySelector<HTMLElement>('.film-market');
  const head = film.querySelector<HTMLElement>('.film-head');
  const piece = film.querySelector<HTMLElement>('.film-piece');
  const buy = film.querySelector<HTMLElement>('.film-buy');
  const place = film.querySelector<HTMLElement>('.film-place');
  if (!map || !ring || !loop || !head || !piece || !buy || !place) return;
  const frame = document.getElementById('item-frame');
  [map, head, piece, buy, place, frame].forEach((el) => own(el));
  const photo = frame?.querySelector('img');
  if (frame && photo) livingPhoto(frame.querySelector<HTMLElement>('.film-mat-window') ?? frame, photo);

  const len = loop.getTotalLength();
  gsap.set(loop, { strokeDasharray: len, strokeDashoffset: len });

  // Arrived by match cut: the browser already flew the piece into place, so
  // skip the film — draw the loop and bring in the rest round it.
  if (frame?.style.viewTransitionName) {
    gsap.to(loop, { strokeDashoffset: 0, duration: 1.4, ease: 'power2.inOut', delay: 0.3 });
    gsap.fromTo([head, buy, place], { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.7, stagger: EIGHTH / 2, delay: 0.2 });
    return;
  }

  await fontsReady();
  // Where the name and the piece sit in the final frame, relative to the
  // centre of the film (the market, and the loop round it).
  const mid = (el: Element) => { const b = el.getBoundingClientRect(); return b.top + b.height / 2; };
  const centre = mid(film);
  gsap.set(map, { scale: 2.4, opacity: 0.35 });
  gsap.set(ring, { opacity: 1 });
  gsap.set(head, { opacity: 1, y: centre - mid(head), scale: 1.45 });
  gsap.set(piece, { opacity: 0, y: centre - mid(piece), scale: 0.04 });
  gsap.set(buy, { opacity: 0, y: 14 });
  gsap.set(place, { opacity: 0 });
  // The market label travels into the corner caption as the piece rises: the
  // offset from its spot under the circle to the caption's market line.
  const corner = place.querySelector<HTMLElement>('.film-market-name');
  let toCorner = { x: 0, y: 0 };
  if (market && corner) {
    const from = market.getBoundingClientRect();
    const to = corner.getBoundingClientRect();
    toCorner = { x: to.right - from.right, y: to.top - from.top };
    gsap.set(corner, { opacity: 0 });
  }

  const phone = window.innerWidth < 768;
  const header = document.querySelector('header')?.offsetHeight ?? 0;
  const fits = film.offsetHeight <= window.innerHeight - header + 4;
  const tl = gsap.timeline({
    defaults: { ease: 'none' },
    scrollTrigger: fits
      ? { trigger: film, start: `top ${header}px`, end: `+=${window.innerHeight * (phone ? 1.4 : 2.2)}`, scrub: 0.8, pin: true, anticipatePin: 1 }
      : undefined,
  });
  tl.to(head, { y: 0, scale: 1, duration: 1.2, ease: 'power2.inOut' }, 0)
    .to(map, { scale: 1, opacity: 1, duration: 1.6, ease: 'power2.out' }, 0.1)
    .to(loop, { strokeDashoffset: 0, duration: 0.9 }, 1.3)
    .to(market, { opacity: 1, duration: 0.35 }, 1.8)
    .to(place, { opacity: 1, duration: 0.4 }, 1.9)
    .to(market, { ...toCorner, duration: 0.9, ease: 'power2.inOut' }, 2.5)
    .set(corner ?? {}, { opacity: 1 }, 3.4)
    .set(market, { opacity: 0 }, 3.4)
    .to(piece, { y: 0, scale: 1, opacity: 1, duration: 1, ease: 'power3.out' }, 2.5)
    .to(ring, { opacity: 0.35, duration: 1 }, 2.5)
    .to(buy, { opacity: 1, y: 0, duration: 0.5 }, 3.3)
    .to({}, { duration: 0.5 });
  if (!fits) tl.timeScale(1.6);
}

export async function initItem(): Promise<void> {
  // The story's drawn art and its chapter list work with or without motion.
  const story = prepareStory();
  if (!motionOn()) {
    if (story) railFor(story);
    return;
  }

  // ── pieces with a city map: the map film, then the story (or details) ──
  const film = document.querySelector<HTMLElement>('[data-film]');
  if (film) {
    await filmScene(film);
    if (story) {
      playStory(story);
      railFor(story);
    }
    const details = document.querySelector<HTMLElement>('[data-details]');
    if (details) {
      readingScene(details);
      const craft = details.querySelector('.details-craft');
      if (craft) gsap.fromTo(craft.children, { opacity: 0, y: 12 }, {
        opacity: 1, y: 0, duration: 0.8, stagger: EIGHTH / 2,
        scrollTrigger: { trigger: craft, start: 'top 85%' },
      });
    }
    document.querySelectorAll('.grid .frame').forEach(frameParallax);
    return ready();
  }

  const product = document.querySelector<HTMLElement>('.product');
  const frame = document.getElementById('item-frame');
  const info = product?.querySelector<HTMLElement>('.product-info');
  if (!product || !info) return ready();

  const status = product.dataset.status ?? 'available';
  const dull = status === 'reserved' || status === 'claimed';

  // ── the frame ──
  if (frame) {
    own(frame);
    if (frame.style.viewTransitionName) {
      // Arrived by match cut: the browser already flew it into place.
      frame.classList.add('is-in');
      gsap.set(frame.querySelectorAll('.corner'), { opacity: 1 });
    } else {
      wipeFrame(frame);
      snapBrackets(frame, { from: Math.min(window.innerWidth, window.innerHeight) * 0.35, delay: 0.1 });
    }
    if (dull) {
      const img = frame.querySelector('img');
      if (img) gsap.from(img, { filter: 'grayscale(0%) brightness(1) contrast(1) saturate(1)', duration: 1.6, delay: 0.5, ease: 'power2.inOut' });
      gsap.to(frame.querySelectorAll('.corner'), { borderColor: '#6B6258', duration: 1.2, delay: 0.6, ease: 'power2.inOut' });
    }
    const photo = frame.querySelector('img');
    if (photo) livingPhoto(frame, photo);
    if (window.matchMedia('(min-width: 768px)').matches) {
      gsap.fromTo(
        frame,
        { scale: 1 },
        { scale: 1.06, ease: 'none', scrollTrigger: { trigger: product, start: 'top top', end: 'bottom bottom', scrub: true } },
      );
    }
  }

  await fontsReady();

  // ── the info column, on eighth-notes ──
  const kids = Array.from(info.children) as HTMLElement[];
  const reading = kids.filter((k) => k.classList.contains('story-block') || k.classList.contains('specs'));
  const seq = kids.filter((k) => !reading.includes(k));
  const [sealRow, title, origin, priceRow, ...rest] = seq;
  const tl = gsap.timeline();
  if (sealRow) {
    tl.set(sealRow, { opacity: 1 }, 0);
    const seal = sealRow.querySelector('.seal');
    if (seal) tl.add(stamp(seal, { dull }), 0);
    const label = sealRow.querySelector('.seal-status');
    if (label) tl.from(label, { opacity: 0, x: -8, duration: 0.5 }, EIGHTH / 2);
  }
  if (title) {
    tl.set(title, { opacity: 1 }, EIGHTH);
    tl.from(splitLines(title).lines, { yPercent: 105, duration: 0.8, stagger: EIGHTH / 3 }, EIGHTH);
  }
  if (origin) tl.fromTo(origin, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.7 }, EIGHTH * 2);
  if (priceRow) tl.fromTo(priceRow, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.7 }, EIGHTH * 3);
  if (rest.length) tl.fromTo(rest, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.7, stagger: EIGHTH / 2 }, EIGHTH * 4);

  // ── reading: story lamp + spec ledger ──
  readingScene(info);

  // ── "You may not see these again" — same grid treatment as /collection ──
  document.querySelectorAll('.grid .frame').forEach(frameParallax);

  ready();
}
