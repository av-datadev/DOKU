// Currency conversion — shared between server (SSR initial render) and client
// (the currency switcher / region bar re-render prices in place, no reload).
// Isomorphic on purpose: no server-only APIs, so the exact same formatting
// logic runs both places and can never drift.
import { cached } from './edge-cache';

export const CURRENCIES = ['USD', 'EUR', 'GBP', 'INR', 'JPY'] as const;
export type CurrencyCode = (typeof CURRENCIES)[number];

// Fallback rates used until the live fetch resolves (or if it fails).
export const FALLBACK_RATES: Record<CurrencyCode, number> = { USD: 1, EUR: 0.92, GBP: 0.79, INR: 83.5, JPY: 149.5 };
export const SYMBOLS: Record<CurrencyCode, string> = { USD: '$', EUR: '€', GBP: '£', INR: '₹', JPY: '¥' };
export const LOCALES: Record<CurrencyCode, string> = { USD: 'en-US', EUR: 'de-DE', GBP: 'en-GB', INR: 'en-IN', JPY: 'ja-JP' };

export const CURRENCY_COOKIE = 'doku_currency';

export function isCurrency(x: string | null | undefined): x is CurrencyCode {
  return !!x && (CURRENCIES as readonly string[]).includes(x);
}

export function currencyFromCookieValue(raw: string | null | undefined): CurrencyCode {
  return isCurrency(raw) ? raw : 'USD';
}

export function formatMoney(
  usd: number | null | undefined,
  currency: CurrencyCode = 'USD',
  rates: Record<string, number> = FALLBACK_RATES,
): string {
  if (usd == null) return '—';
  const rate = rates[currency] ?? 1;
  const converted = Math.round(usd * rate);
  return SYMBOLS[currency] + converted.toLocaleString(LOCALES[currency]);
}

// Live rates, cached for an hour (they move once a day). frankfurter.app now
// 301-redirects to frankfurter.dev, so ask .dev directly — the redirect hop
// was costing a round trip on every page. 1.5s timeout, then the fallback.
export async function fetchRates(): Promise<Record<string, number>> {
  const rates = await cached('rates', 3600, async () => {
    try {
      const ctl = new AbortController();
      const tid = setTimeout(() => ctl.abort(), 1500);
      const res = await fetch('https://api.frankfurter.dev/v1/latest?from=USD&to=EUR,GBP,INR,JPY', { signal: ctl.signal });
      clearTimeout(tid);
      const data = (await res.json()) as { rates?: Record<string, number> };
      return data?.rates ? { USD: 1, ...data.rates } : null;
    } catch {
      return null;
    }
  });
  return rates ?? FALLBACK_RATES;
}
