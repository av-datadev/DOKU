// Price formatting. Currency conversion (live rates, the switcher, region bar)
// lands in the dedicated currency step — until then everything shows in USD,
// the catalog's base currency. When that step arrives, this becomes the single
// place that reads the chosen currency + rates.
export function money(usd: number | null | undefined): string {
  if (usd == null) return '—';
  return '$' + Math.round(usd).toLocaleString('en-US');
}
