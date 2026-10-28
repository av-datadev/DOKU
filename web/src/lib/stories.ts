import data from './stories.json';

// The item page's story: a sequence of chapters, each a `kind` that
// components/ItemStory.astro knows how to lay out and motion/scenes/story.ts
// knows how to play. Every line is drawn from the product's own story, specs
// and city notes — a chapter may restate them, never add a fact (no invented
// makers, dates, signatures or purchase places). Strings may carry <em>.
//
// A piece with no entry here keeps the plain details section.
export interface Chapter {
  kind: 'hook' | 'bench' | 'place' | 'layers' | 'sentence' | 'kiln' | 'shelf' | 'lines' | 'loom' | 'strikes' | 'angles' | 'craft' | 'record' | 'finale';
  /** "II · How it was made" — shown on the page, and the chapter list is built from it. */
  title: string;
  line?: string;
  after?: string;
  marks?: string[];
  steps?: string[];
  /** For `sentence`: words wrapped in *asterisks* are the ones that stay lit. */
  words?: string;
  shots?: string[];
  lines?: string[];
  last?: string;
  struck?: string[];
  blurred?: string;
  kept?: string;
  note?: string;
  sub?: string;
}

const STORIES = data as Record<string, Chapter[]>;

export const storyFor = (sku: string): Chapter[] | null => STORIES[sku] ?? null;
