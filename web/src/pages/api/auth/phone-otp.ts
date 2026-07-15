import type { APIRoute } from 'astro';
import { supabaseServer } from '../../../lib/auth';
import { phoneAuthEnabled } from '../../../lib/flags';

// Passwordless phone sign-in (SMS OTP). Two steps, both no-JS form posts:
//   action=send   → signInWithOtp({ phone }) texts a 6-digit code
//   action=verify → verifyOtp({ phone, token }) sets the session, then → `next`
// Unlike the email magic link there's no /auth/callback round-trip: verifyOtp
// returns a session immediately and the server client writes the httpOnly
// cookies, so the code is entered and verified on-page. Gated behind
// phoneAuthEnabled — dead until an SMS provider (+ India DLT) is configured.
const safeNext = (v: string) => (/^\/(?!\/)/.test(v) ? v : '');
// Loose E.164 check: a leading + and 8–15 digits. Real validation is Supabase's.
const isPhone = (v: string) => /^\+[1-9]\d{7,14}$/.test(v);

export const POST: APIRoute = async ({ request, cookies, locals }) => {
  if (!phoneAuthEnabled(locals)) {
    return new Response(null, { status: 303, headers: { Location: '/login' } });
  }

  const form = await request.formData();
  const action = String(form.get('action') ?? '');
  const phone = String(form.get('phone') ?? '').replace(/[\s-]/g, '');
  const token = String(form.get('token') ?? '').trim();
  const next = safeNext(String(form.get('next') ?? ''));

  const q = (params: Record<string, string>) => {
    if (next) params.next = next;
    return `/login?method=phone&${new URLSearchParams(params).toString()}`;
  };
  const redirect = (to: string) => new Response(null, { status: 303, headers: { Location: to } });

  if (!isPhone(phone)) return redirect(q({ error: 'phone' }));

  const supabase = supabaseServer({ cookies, request });

  if (action === 'send') {
    const { error } = await supabase.auth.signInWithOtp({ phone });
    if (error) console.error('phone-otp send:', error.message);
    // Always report "sent" (no enumeration); carry the phone so step 2 can post it.
    return redirect(q({ sent: '1', phone }));
  }

  if (action === 'verify') {
    if (!/^\d{4,8}$/.test(token)) return redirect(q({ sent: '1', phone, error: 'code' }));
    const { error } = await supabase.auth.verifyOtp({ phone, token, type: 'sms' });
    if (error) {
      console.error('phone-otp verify:', error.message);
      return redirect(q({ sent: '1', phone, error: 'code' }));
    }
    // Verified — session cookies are set. Head to the intended destination.
    return redirect(next || '/account');
  }

  return redirect(q({ error: 'phone' }));
};
