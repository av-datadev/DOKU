// Post-checkout order handoff. After payment is verified and the items are
// reserved server-side, we can't keep the order in memory (Hard rule 3) and the
// orders table is deny-all to the browser (RLS) — so the confirmation page is
// handed a small signed cookie carrying just enough to render: the order code,
// the buyer's first name, and the reserved skus (whose public product rows the
// confirmation page re-reads). No PII beyond the name the buyer just typed.
import { signJson, unsignJson } from './signed';

export const LAST_ORDER_COOKIE = 'doku_last_order';

export interface LastOrder {
  code: string;
  name: string;
  skus: string[];
}

export function encodeOrder(order: LastOrder, secret: string): Promise<string> {
  return signJson(order, secret);
}

export function decodeOrder(value: string | undefined, secret: string): Promise<LastOrder | null> {
  return unsignJson<LastOrder>(value, secret);
}
