// /collection — the lineup (spec § "/collection"). Heading hook + live count
// roll, filter pills on eighth-notes, cards land row by row (core sweep),
// image parallax inside each frame, sketches draw. Filtering itself is
// choreographed with Flip from the page script (withFlip).

import { gsap, motionOn, fontsReady, headHook, countUp, frameParallax, drawSketch, ready } from '../core';
import { BEAT, EIGHTH } from '../beat';

export async function initCollection(): Promise<void> {
  if (!motionOn()) return;
  await fontsReady();

  const head = document.querySelector('[data-scene="head"]');
  if (head) headHook(head);

  const count = document.getElementById('collection-count');
  if (count) countUp(count, { delay: BEAT, duration: 1.4 });

  const pills = Array.from(document.querySelectorAll('.filter-pill'));
  gsap.fromTo(pills, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.6, stagger: EIGHTH / 2, delay: BEAT });

  document.querySelectorAll('#collection-grid .frame, [data-scene="soon"] .frame').forEach(frameParallax);
  document.querySelectorAll('[data-scene="soon"] .frame-sketch').forEach((f) => drawSketch(f));

  ready();
}
