// Currency conversion — shared between server (SSR initial render) and client
// (the currency switcher / region bar re-render prices in place, no reload).
// Isomorphic on purpose: no server-only APIs, so the exact same formatting
// logic runs both places and can never drift.
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

// Live rates, same 1.5s-timeout-then-fallback shape as fetchProducts().
export async function fetchRates(): Promise<Record<string, number>> {
  try {
    const ctl = new AbortController();
    const tid = setTimeout(() => ctl.abort(), 1500);
    const res = await fetch('https://api.frankfurter.app/latest?from=USD&to=EUR,GBP,INR,JPY', { signal: ctl.signal });
    clearTimeout(tid);
    const data = (await res.json()) as { rates?: Record<string, number> };
    if (data?.rates) return { USD: 1, ...data.rates };
  } catch {
    /* keep hardcoded fallback */
  }
  return FALLBACK_RATES;
}
