// /archive — the ledger (spec § "/archive"). The page opens drained (motion.css
// `.drained`: --gold → --claimed, glow dimmed). The subhead arrives word by
// word, slower than anywhere else on the site; cards enter desaturated and each
// epitaph is "signed" with a small gold hairline. Search is left untouched.

import { gsap, ScrollTrigger, SplitText, motionOn, fontsReady, headHook, ownAll, own, revealArchiveCard, ready } from '../core';
import { BEAT } from '../beat';

export async function initArchive(): Promise<void> {
  if (!motionOn()) return;
  const cards = ownAll('.archive-item');
  cards.forEach((c) => own(c.querySelector('.frame')));
  await fontsReady();

  const head = document.querySelector('[data-scene="head"]');
  if (head) {
    headHook(head);
    const sub = head.querySelector('p');
    if (sub) {
      const words = SplitText.create(sub, { type: 'words' }).words;
      gsap.set(sub, { opacity: 1 });
      gsap.from(words, { opacity: 0, duration: 1.4, stagger: BEAT / 2.5, delay: BEAT * 1.5, ease: 'power1.out' });
    }
  }

  if (cards.length) {
    ScrollTrigger.batch(cards, {
      start: 'top 90%',
      once: true,
      onEnter: (els) => els.forEach((el, i) => revealArchiveCard(el, BEAT * 2 * (i === 0 ? 1 : 0) + i * BEAT * 0.5).timeScale(0.7)),
    });
  }

  ready();
}
