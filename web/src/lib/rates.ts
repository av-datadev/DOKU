import { cached } from './edge-cache';
import { FALLBACK_RATES, loadRates } from './currency';

// Server-side rates for SSR pages, through the edge cache: they move once a
// day, so an hour is plenty. (lib/currency.ts stays browser-safe.)
export async function fetchRates(): Promise<Record<string, number>> {
  return (await cached('rates', 3600, loadRates)) ?? FALLBACK_RATES;
}
