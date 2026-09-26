// The tempo grid every scene is cut to (spec: docs/superpowers/specs/
// 2026-09-26-scroll-motion-design.md). There is no audio — the "music" is this
// fixed 96 BPM grid. Time-based hits are measured in beats; scrubbed scenes
// are measured in beats of scroll distance (1 beat = 12vh, shorter on phones).

export const BPM = 96;
export const BEAT = 60 / BPM; // 0.625s
export const EIGHTH = BEAT / 2; // 0.3125s
export const BAR = BEAT * 4; // 2.5s

const BEAT_VH = 12;
const PHONE_FACTOR = 0.6;

export const isPhone = (): boolean => window.matchMedia('(max-width: 767px)').matches;

/** Scroll distance, in px, of `n` beats at the current viewport size. */
export const beatPx = (n: number): number =>
  Math.round(n * BEAT_VH * (window.innerHeight / 100) * (isPhone() ? PHONE_FACTOR : 1));

/** ScrollTrigger `end` for a scene lasting `n` beats — a function, so it
 *  recomputes on every ScrollTrigger.refresh() (resize, font load, filter). */
export const scrollBeats = (n: number) => (): string => '+=' + beatPx(n);
