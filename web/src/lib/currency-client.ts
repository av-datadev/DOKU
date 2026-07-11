import { CURRENCY_COOKIE, currencyFromCookieValue, fetchRates, formatMoney, type CurrencyCode } from './currency';

// Client-side currency switch: writes the cookie (so the NEXT page navigation
// SSRs in that currency — replaces the old in-memory currentCurrency, which
// reset on every page since the site no longer never-reloads) and rewrites
// every [data-usd] element on THIS page in place, so switching still feels
// instant like the original single-page site, not a reload.
let ratesCache: Record<string, number> | null = null;

async function rates(): Promise<Record<string, number>> {
  if (!ratesCache) ratesCache = await fetchRates();
  return ratesCache;
}

async function repaint(cur: CurrencyCode) {
  const r = await rates();
  document.querySelectorAll<HTMLElement>('[data-usd]').forEach((el) => {
    const usd = Number(el.dataset.usd);
    if (!Number.isNaN(usd)) el.textContent = formatMoney(usd, cur, r);
  });
  const label = document.getElementById('currency-label');
  if (label) label.textContent = cur;
  document.querySelectorAll<HTMLElement>('.currency-option').forEach((o) => {
    o.classList.toggle('active', o.dataset.cur === cur);
  });
}

export async function applyCurrency(cur: string, { persist = true } = {}) {
  const code = currencyFromCookieValue(cur);
  if (persist) {
    document.cookie = `${CURRENCY_COOKIE}=${code}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
  }
  await repaint(code);
  return code;
}
