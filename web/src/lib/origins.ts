import places from './origins.json';
import rendered from './origin-maps.json';

// The item page's Origin chapter: the city an object comes from, its craft,
// and the market where that craft still lives. The street map for each sku is
// pre-rendered from OpenStreetMap by scripts/build-origin-maps.mjs into
// public/origins/<sku>.svg, centred on the market.
//
// The market is "where this craft still lives" — never "where we bought it".
// Naming a place of purchase we can't stand behind would be a made-up record.
export interface Origin {
  city: string;
  region: string;
  lat: number;
  lon: number;
  km: number;
  alleys?: boolean;
  craft: string;
  market: string;
  marketNote: string;
}

const ORIGINS = places as Record<string, Origin>;

// Only skus whose map has been rendered (written by the build script).
const HAS_MAP = new Set<string>(rendered);

export const originFor = (sku: string): Origin | null => (HAS_MAP.has(sku) && ORIGINS[sku]) || null;

/** "Oslo, Oslo, Norway" → "Norway": the region without parts repeating the city. */
export const regionOf = (o: Origin): string =>
  o.region.split(', ').filter((part) => !part.startsWith(o.city)).join(', ');

