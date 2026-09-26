// /item/:sku — the portrait (spec § "/item/:sku"). The frame either arrives by
// match cut (View Transition from a card) or brackets in from the screen
// corners; the info column lands on eighth-notes with the CTA by ~1.25s (and
// clickable the whole time — only opacity is animated); the sticky frame pushes
// in as you read; story paragraphs light up; specs enter as a ledger.
// Reserved/claimed pieces grade down to --claimed as they land.

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
} from '../core';
import { EIGHTH } from '../beat';

export async function initItem(): Promise<void> {
  if (!motionOn()) return;
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
  reading.forEach((block) => gsap.set(block, { opacity: 1 }));
  info.querySelectorAll('.story-block p').forEach((p) =>
    readingLamp(p, { start: 'top 88%', end: 'bottom 60%' }),
  );
  const rows = Array.from(info.querySelectorAll('.spec-row'));
  if (rows.length) {
    gsap.set(rows, { opacity: 0 });
    ScrollTrigger.batch(rows, {
      start: 'top 92%',
      once: true,
      onEnter: (els) => gsap.fromTo(els, { opacity: 0, x: -10 }, { opacity: 1, x: 0, duration: 0.6, stagger: EIGHTH / 2 }),
    });
  }

  // ── "You may not see these again" — same grid treatment as /collection ──
  document.querySelectorAll('.grid .frame').forEach(frameParallax);

  ready();
}
