import { serverEnv } from './env';

// Phone / SMS sign-in is fully built but ships OFF. It can't work until an SMS
// provider (Twilio / MSG91 / etc.) is configured in Supabase Auth — and for
// Indian (+91) numbers, DLT registration — otherwise codes never deliver.
// Shipping a visible-but-dead sign-in path would break the DOKU rule about never
// implying a capability that isn't there, so the mobile option stays hidden
// until this flag is flipped.
//
// To enable (once the SMS provider + DLT are live): set the Worker var
// PHONE_AUTH_ENABLED to "true" (wrangler var/secret) — no code change needed;
// it's read per request. Default (unset) = off.
//
// KNOWN LIMITATION to resolve before enabling: order history on /account matches
// on the verified JWT *email* ("Buyers read own orders by email"). A phone-only
// account has no email, so it won't see email-keyed order history until we also
// capture/link an email for phone sign-ups. Saved address + wishlist (keyed on
// auth.uid()) work regardless.
export function phoneAuthEnabled(locals: App.Locals | undefined): boolean {
  return serverEnv(locals, 'PHONE_AUTH_ENABLED') === 'true';
}
