// The item story (components/ItemStory.astro) as a run of pinned, scrubbed
// chapters — native scroll only (pin, no snap). One builder per chapter kind;
// each animates FROM a hidden state TO the markup as written, so the static
// page is always the finished story. A chapter taller than the screen can't
// pin, so it simply reveals as it scrolls in.
//
// prepareStory() runs on every visit (motion or not): it draws the loom and
// the kiln's sparks, and builds the chapter list. playStory() is motion only.

import { gsap, ScrollTrigger } from '../core';
import { scrollBeats } from '../beat';

const E = 'power3.out';
const NS = 'http://www.w3.org/2000/svg';

/** The art that is drawn rather than written: the loom's warp and weave. */
function drawLoom(root: ParentNode) {
  root.querySelectorAll<SVGElement>('.st-loom').forEach((svg) => {
    const warps = svg.querySelector('.st-warps');
    const wefts = svg.querySelector('.st-wefts');
    if (!warps || !wefts || warps.childElementCount) return;
    for (let x = 20; x <= 280; x += 9.3) {
      const l = document.createElementNS(NS, 'line');
      l.setAttribute('class', 'st-warp');
      for (const [k, v] of Object.entries({ x1: x, x2: x, y1: 10, y2: 350 })) l.setAttribute(k, String(v));
      warps.appendChild(l);
    }
    // rows of weft in a diamond pattern, woven from the bottom up
    for (let r = 0; r < 30; r++) {
      const row = document.createElementNS(NS, 'g');
      row.setAttribute('class', 'st-weft');
      for (let c = 0; c < 28; c++) {
        const d = Math.abs(((c + r) % 14) - 7) + Math.abs(((c - r + 140) % 14) - 7);
        const rect = document.createElementNS(NS, 'rect');
        const fill = d < 3 ? '#B08D57' : d < 6 ? '#8a3b22' : '#3a2318';
        for (const [k, v] of Object.entries({ x: 20 + c * 9.3, y: 338 - r * 10.6, width: 9.3, height: 10.6, fill })) rect.setAttribute(k, String(v));
        row.appendChild(rect);
      }
      wefts.appendChild(row);
    }
  });
}

/** The chapter list: built from the chapter titles on the page, so the two
 *  can't disagree. Clicking lands where a chapter has finished arriving. It
 *  shows only while the story is on screen, and steps aside for the photos. */
function buildRail(story: HTMLElement) {
  const chapters = Array.from(story.querySelectorAll<HTMLElement>('.st'));
  if (!chapters.length) return;
  const rail = document.createElement('nav');
  rail.className = 'st-rail';
  rail.setAttribute('aria-label', 'Chapters');
  document.body.appendChild(rail);

  const items = chapters.map((sec) => {
    const title = sec.querySelector('.st-title')?.textContent?.trim() ?? '';
    const [numeral, ...rest] = title.split(' · ');
    const a = document.createElement('a');
    a.href = `#${sec.id}`;
    a.innerHTML = `<span>${numeral}</span><span class="t">${rest.join(' · ')}</span>`;
    rail.appendChild(a);
    // a pinned chapter's span on the page is its pin-spacer (chapter + hold)
    const span = () => (sec.parentElement?.classList.contains('pin-spacer') ? sec.parentElement : sec);
    a.addEventListener('click', (e) => {
      e.preventDefault();
      const header = document.querySelector('header')?.offsetHeight ?? 0;
      const pin = ScrollTrigger.getAll().find((t) => t.pin === sec);
      const top = pin ? pin.start + (pin.end - pin.start) * 0.9 : span().getBoundingClientRect().top + window.scrollY - header;
      window.scrollTo({ top, behavior: 'smooth' });
    });
    return { sec, a, span };
  });

  // Which chapter holds the middle of the screen, read live from the layout —
  // positions measured up front go stale as the pins above stretch the page.
  let queued = false;
  const sync = () => {
    queued = false;
    const mid = window.innerHeight / 2;
    let current: (typeof items)[number] | undefined;
    for (const it of items) {
      const r = it.span().getBoundingClientRect();
      if (r.top <= mid && r.bottom > mid) current = it;
    }
    items.forEach((it) => it.a.classList.toggle('on', it === current));
    // shown only inside the story, and never over the photographs
    rail.classList.toggle('is-on', !!current && current.sec.dataset.ch !== 'angles');
  };
  const queue = () => { if (!queued) { queued = true; requestAnimationFrame(sync); } };
  window.addEventListener('scroll', queue, { passive: true });
  window.addEventListener('resize', queue);
  sync();
}

type Build = (tl: gsap.core.Timeline, s: HTMLElement) => void;
const $ = (s: HTMLElement, sel: string) => Array.from(s.querySelectorAll<HTMLElement>(sel));
const title = (tl: gsap.core.Timeline, s: HTMLElement) => tl.from($(s, '.st-title'), { opacity: 0, y: 10, duration: 0.3 }, 0);

/** Word by word, for the big lines. */
function words(el: HTMLElement): HTMLElement[] {
  if (!el.dataset.split) {
    el.innerHTML = el.innerHTML.replace(/(<em>.*?<\/em>|[^\s<]+)/g, '<span class="w" style="display:inline-block">$1</span>');
    el.dataset.split = '1';
  }
  return $(el, '.w');
}

const BUILDERS: Record<string, { beats: number; build: Build }> = {
  hook: { beats: 9, build: (tl, s) => {
    title(tl, s);
    tl.from(words(s.querySelector('.st-big')!), { yPercent: 60, opacity: 0, filter: 'blur(8px)', stagger: 0.25, duration: 0.6, ease: E }, 0.1).to({}, { duration: 0.6 });
  } },
  bench: { beats: 11, build: (tl, s) => {
    title(tl, s);
    tl.from(words(s.querySelector('.st-big')!), { yPercent: 60, opacity: 0, stagger: 0.25, duration: 0.6, ease: E }, 0.1)
      .from($(s, '.st-wood'), { scaleX: 0, duration: 1.4 }, 0.6)
      .from($(s, '.st-marks span'), { opacity: 0, y: 8, stagger: 0.4, duration: 0.4 }, 1.0).to({}, { duration: 0.5 });
  } },
  place: { beats: 11, build: (tl, s) => {
    tl.from($(s, '.st-map'), { scale: 1.6, opacity: 0, duration: 1.6, ease: 'power2.out' }, 0);
    title(tl, s);
    tl.from($(s, '.st-h'), { opacity: 0, y: 30, filter: 'blur(6px)', duration: 0.8, ease: E }, 0.5)
      .from($(s, '.st-after'), { opacity: 0, y: 14, duration: 0.6 }, 1.3)
      .to($(s, '.st-map'), { opacity: 0.22, duration: 0.6 }, 1.6).to({}, { duration: 0.3 });
  } },
  layers: { beats: 14, build: (tl, s) => {
    title(tl, s);
    gsap.set($(s, '.st-step'), { opacity: 0.12 });
    tl.from($(s, '.st-coat'), { scaleX: 0, opacity: 0, stagger: 0.18, duration: 0.5, ease: E, transformOrigin: 'left center' }, 0);
    $(s, '.st-step').forEach((p, i) => tl.to(p, { opacity: 1, duration: 0.3 }, 0.1 + i * 0.5));
    tl.from($(s, '.st-gild'), { opacity: 0, duration: 0.5 }, 1.6).to({}, { duration: 0.4 });
  } },
  sentence: { beats: 13, build: (tl, s) => {
    title(tl, s);
    tl.from($(s, '.st-sentence span'), { opacity: 0, y: 20, stagger: 0.08, duration: 0.4, ease: E }, 0.1)
      .to($(s, '.st-sentence span:not(.keep)'), { opacity: 0.1, duration: 0.6 }, 1.4)
      .from($(s, '.st-sentence .keep'), { color: '#EDE6D6', duration: 0.6 }, 1.4)
      .from($(s, '.st-after'), { opacity: 0, y: 16, duration: 0.6 }, 2.0).to({}, { duration: 0.4 });
  } },
  kiln: { beats: 12, build: (tl, s) => {
    tl.fromTo($(s, '.st-ember'), { scale: 0.4, opacity: 0 }, { scale: 1.1, opacity: 1, duration: 1.4, ease: 'power2.out' }, 0);
    title(tl, s);
    tl.from($(s, '.st-h'), { opacity: 0, y: 24, duration: 0.6, ease: E }, 0.5);
    $(s, '.st-spark').forEach((sp, i) =>
      tl.fromTo(sp, { y: 0, opacity: 0 }, { y: -window.innerHeight * (0.5 + Math.random() * 0.6), x: (Math.random() - 0.5) * 80, opacity: 1, duration: 1.2 }, 0.2 + (i % 9) * 0.12));
    tl.to($(s, '.st-spark'), { opacity: 0, duration: 0.4 }, 1.6).to({}, { duration: 0.3 });
  } },
  shelf: { beats: 11, build: (tl, s) => {
    // seven places on the kiln shelf; all but one go dark
    tl.from($(s, '.st-shelf i'), { opacity: 0, y: 20, stagger: 0.08, duration: 0.4, ease: E }, 0)
      .to($(s, '.st-shelf i:not(.one)'), { opacity: 0.15, duration: 0.5 }, 0.8)
      .fromTo($(s, '.st-shelf .one'), { scale: 1 }, { scale: 1.12, duration: 0.6 }, 0.9)
      .from($(s, '.st-title, .st-h'), { opacity: 0, y: 20, stagger: 0.25, duration: 0.5 }, 1.0).to({}, { duration: 0.4 });
  } },
  lines: { beats: 15, build: (tl, s) => {
    title(tl, s);
    const ls = $(s, '.st-line');
    ls.forEach((l, i) => {
      tl.from(l, { opacity: 0, y: 26, duration: 0.5, ease: E }, 0.2 + i * 0.7);
      if (i > 0) tl.to(ls[i - 1], { opacity: 0.3, duration: 0.4 }, 0.2 + i * 0.7);
    });
    tl.to({}, { duration: 0.6 });
  } },
  loom: { beats: 16, build: (tl, s) => {
    title(tl, s);
    tl.from($(s, '.st-warp'), { scaleY: 0, transformOrigin: 'top', stagger: 0.015, duration: 0.4 }, 0)
      .from($(s, '.st-weft'), { opacity: 0, stagger: 0.04, duration: 0.1 }, 0.5)
      .from($(s, '.st-h'), { opacity: 0, y: 24, duration: 0.5, ease: E }, 0.6)
      .from($(s, '.st-after'), { opacity: 0, y: 14, duration: 0.5 }, 1.6).to({}, { duration: 0.4 });
  } },
  strikes: { beats: 15, build: (tl, s) => {
    title(tl, s);
    $(s, '.st-strike').forEach((r, i) => {
      tl.from(r, { opacity: 0, y: 22, color: '#EDE6D6', duration: 0.4, ease: E }, 0.2 + i * 0.6)
        .from(r, { '--w': '0%', duration: 0.3 }, 0.55 + i * 0.6);
    });
    const n = $(s, '.st-strike').length;
    tl.from($(s, '.st-blur'), { opacity: 0, y: 22, duration: 0.4, ease: E }, 0.2 + n * 0.6)
      .fromTo($(s, '.st-blur'), { filter: 'blur(0px)' }, { filter: 'blur(4px)', duration: 0.5 }, 0.55 + n * 0.6)
      .from($(s, '.st-after'), { opacity: 0, y: 16, duration: 0.5 }, 0.9 + n * 0.6).to({}, { duration: 0.4 });
  } },
  angles: { beats: 16, build: (tl, s) => {
    const track = s.querySelector<HTMLElement>('.st-track')!;
    gsap.set(track, { overflow: 'visible' });
    tl.from($(s, '.st-angles-head'), { opacity: 0, y: 16, duration: 0.3 }, 0)
      .fromTo(track, { x: () => window.innerWidth * 0.15 }, { x: () => -(track.scrollWidth - window.innerWidth * 0.85), duration: 2 }, 0.2);
  } },
  craft: { beats: 8, build: (tl, s) => {
    tl.from($(s, '.st-c > *'), { opacity: 0, y: 18, stagger: 0.3, duration: 0.5, ease: E }, 0).to({}, { duration: 0.5 });
  } },
  record: { beats: 12, build: (tl, s) => {
    title(tl, s);
    tl.from($(s, '.st-struck span'), { opacity: 0, y: 24, stagger: 0.3, duration: 0.5, ease: E }, 0.1)
      .from($(s, '.st-struck .x'), { '--w': '0%', stagger: 0.3, duration: 0.4 }, 0.6)
      .from($(s, '.st-after'), { opacity: 0, y: 14, duration: 0.5 }, 1.3)
      .from($(s, '.st-ledger div'), { opacity: 0, x: -14, stagger: 0.15, duration: 0.4 }, 1.4).to({}, { duration: 0.4 });
  } },
};

export function prepareStory(): HTMLElement | null {
  const story = document.querySelector<HTMLElement>('[data-story]');
  if (!story) return null;
  drawLoom(story);
  story.querySelectorAll('.stc-kiln').forEach((k) => {
    for (let i = 0; i < 26; i++) {
      const sp = document.createElement('span');
      sp.className = 'st-spark';
      sp.style.left = `${10 + Math.random() * 80}%`;
      k.appendChild(sp);
    }
  });
  return story;
}

/** Pin and play every chapter, then build the chapter list over the pins. */
export function playStory(story: HTMLElement): void {
  story.querySelectorAll<HTMLElement>('.st').forEach((s) => {
    const kind = s.dataset.ch ?? '';
    if (kind === 'finale') {
      gsap.from($(s, '.st-title, .st-mat'), { opacity: 0, scale: 0.92, duration: 1.2, ease: E, scrollTrigger: { trigger: s, start: 'top 60%' } });
      gsap.from($(s, '.st-finale span, .st-hold, .st-sub, .st-gone'), { opacity: 0, y: 20, stagger: 0.25, duration: 1, ease: E, scrollTrigger: { trigger: s, start: 'top 45%' } });
      return;
    }
    const b = BUILDERS[kind];
    if (!b) return;
    const header = document.querySelector('header')?.offsetHeight ?? 0;
    const fits = s.offsetHeight <= window.innerHeight - header + 4;
    const tl = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: fits
        ? { trigger: s, start: `top ${header}px`, end: scrollBeats(b.beats), scrub: 0.8, pin: true, anticipatePin: 1, invalidateOnRefresh: true }
        : { trigger: s, start: 'top 75%' }, // plays in both ways (BOTH_WAYS default)
    });
    b.build(tl, s);
    if (!fits) tl.timeScale(1.8);
  });
  ScrollTrigger.refresh();
}

export function railFor(story: HTMLElement): void {
  buildRail(story);
}
