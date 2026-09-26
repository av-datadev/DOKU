// /provenance — the film in five chapters (spec § "/provenance"). Hook: two
// hard cuts and a drawn rule. Stats pin for a bar and count up on their own
// beats, then lock. Each chapter's label slams in huge and pulls back to its
// slot; each pull quote pins, grows toward centre and dims everything else;
// "Closed." gets the page's single colour flip; Chapter V counts the archive
// and drains the palette toward /archive.

import { gsap, ScrollTrigger, motionOn, fontsReady, splitLines, countUp, readingLamp, ready } from '../core';
import { BEAT, EIGHTH, isPhone, scrollBeats } from '../beat';

const $$ = <T extends Element = HTMLElement>(sel: string, root: ParentNode = document) =>
  Array.from(root.querySelectorAll<T>(sel));

function heroCuts() {
  const [a, b] = $$('.prov-hero .ph-line');
  const rule = document.querySelector('.prov-rule');
  const tl = gsap.timeline({ delay: 0.15 });
  // hard cuts — no fades: the line is simply there, landing a hair large
  if (a) tl.set(a, { opacity: 1 }, 0).fromTo(a, { scale: 1.05 }, { scale: 1, duration: 0.4 }, 0);
  if (b) tl.set(b, { opacity: 1 }, BEAT * 2).fromTo(b, { scale: 1.05 }, { scale: 1, duration: 0.4 }, BEAT * 2);
  if (rule) tl.fromTo(rule, { opacity: 1, scaleY: 0, transformOrigin: '50% 0%' }, { scaleY: 1, duration: 1 }, BEAT * 3);
}

function stats() {
  const grid = document.querySelector<HTMLElement>('.prov-stats');
  if (!grid) return;
  const nums = $$('.prov-stat-num', grid);
  const tl = gsap.timeline({ paused: true });
  nums.forEach((n, i) => {
    const t = countUp(n, { duration: 1.1 });
    if (t) tl.add(t, i * BEAT); // re-parented into the paused timeline
  });
  // the lock: all three cells take a gold hairline on the same beat
  tl.fromTo(grid, { boxShadow: 'inset 0 0 0 0px rgba(176,141,87,0)' }, { boxShadow: 'inset 0 0 0 1px rgba(176,141,87,0.9)', duration: 0.18 }, nums.length * BEAT + EIGHTH);
  ScrollTrigger.create({
    trigger: grid,
    start: 'center center',
    end: scrollBeats(4),
    pin: !isPhone(),
    onEnter: () => tl.play(),
  });
}

function chapter(ch: HTMLElement) {
  const label = ch.querySelector<HTMLElement>('.prov-chapter-no');
  const h2 = ch.querySelector('h2');
  const tl = gsap.timeline({ paused: true });
  if (label) tl.fromTo(label, { scale: isPhone() ? 3 : 6, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.55, ease: 'expo.out' }, 0);
  if (h2) tl.from(splitLines(h2).lines, { yPercent: 105, duration: 0.8, stagger: EIGHTH / 3 }, EIGHTH);
  ScrollTrigger.create({ trigger: ch, start: 'top 72%', once: true, onEnter: () => tl.play() });

  const paras = $$(':scope > .prov-chapter-body > p', ch);
  if (paras.length) {
    gsap.set(paras, { opacity: 0 });
    ScrollTrigger.batch(paras, {
      start: 'top 90%',
      once: true,
      onEnter: (els) => gsap.fromTo(els, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.9, stagger: EIGHTH }),
    });
  }

  const items = $$('.prov-criteria li', ch);
  if (items.length) {
    gsap.set(items, { opacity: 0 });
    ScrollTrigger.create({
      trigger: items[0],
      start: 'top 85%',
      once: true,
      onEnter: () => gsap.fromTo(items, { opacity: 0, x: -12 }, { opacity: 1, x: 0, duration: 0.5, stagger: BEAT }),
    });
  }
}

function pullQuotes(veil: HTMLElement) {
  $$('.prov-pull').forEach((q) => {
    const tl = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: { trigger: q, start: 'center center', end: scrollBeats(4), pin: true, scrub: 0.5 },
    });
    tl.to(q, { scale: isPhone() ? 1.08 : 1.28, duration: 0.35, ease: 'power2.out' }, 0)
      .to(veil, { opacity: 0.92, duration: 0.3 }, 0)
      .to({}, { duration: 0.3 })
      .to(q, { scale: 1, duration: 0.35, ease: 'power2.in' })
      .to(veil, { opacity: 0, duration: 0.3 }, '<+0.05');
  });
}

function closedFlash(flash: HTMLElement) {
  const word = document.querySelector('.closed-word');
  if (!word) return;
  ScrollTrigger.create({
    trigger: word,
    start: 'top 55%',
    once: true,
    onEnter: () =>
      gsap
        .timeline()
        .set(flash, { visibility: 'visible' })
        .fromTo(flash, { scale: 1.04 }, { scale: 1, duration: BEAT * 0.8 }, 0)
        .set(flash, { visibility: 'hidden' }, BEAT),
  });
}

function recordAndDrain() {
  const strong = document.querySelector('[data-count]');
  if (strong) ScrollTrigger.create({ trigger: strong, start: 'top 85%', once: true, onEnter: () => countUp(strong, { duration: 1.4 }) });
  const chapters = $$('.prov-chapter');
  const last = chapters[chapters.length - 1];
  const app = document.getElementById('app');
  const glow = document.getElementById('ambient-glow');
  if (!last || !app) return;
  const st = { trigger: last, start: 'top 60%', end: 'bottom 40%', scrub: true };
  gsap.fromTo(app, { '--gold': '#B08D57' }, { '--gold': '#6B6258', ease: 'none', scrollTrigger: st });
  if (glow) gsap.fromTo(glow, { opacity: 1 }, { opacity: 0.3, ease: 'none', scrollTrigger: { ...st } });
}

export async function initProvenance(): Promise<void> {
  if (!motionOn()) return;
  const app = document.getElementById('app');
  const veil = document.createElement('div');
  veil.className = 'm-veil';
  veil.setAttribute('aria-hidden', 'true');
  const flash = document.createElement('div');
  flash.className = 'm-flash';
  flash.setAttribute('aria-hidden', 'true');
  flash.textContent = 'Closed.';
  app?.append(veil, flash);

  heroCuts();
  await fontsReady();
  stats();
  $$('.prov-chapter').forEach(chapter);
  pullQuotes(veil);
  closedFlash(flash);
  recordAndDrain();
  const closing = document.querySelector('.prov-closing [data-lamp]');
  if (closing) readingLamp(closing, { start: 'top 85%', end: 'bottom 55%' });

  ready();
}
