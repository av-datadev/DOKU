// Customer-account auth for the PUBLIC site. Unlike admin.html (which uses
// Supabase's default localStorage session — allowed there because it is a
// separate, non-public page), shoppers sign in on the SSR site, so the session
// must live in **httpOnly cookies** the browser JS can neither read nor write.
// That is exactly what @supabase/ssr's createServerClient gives us, and it is
// the only session storage Hard rule 3 permits on the public site: server-set,
// server-verified, invisible to page scripts.
//
// The session is passwordless (magic link). Accounts are opt-in convenience —
// guest checkout is untouched. See supabase/schema.sql "CUSTOMER ACCOUNTS".
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import type { AstroCookies } from 'astro';
import type { SupabaseClient } from '@supabase/supabase-js';

// These are the same public values the rest of the site already ships to the
// browser (anon key + project URL). RLS — not secrecy of the key — is what
// protects data; a customer only ever sees their own orders/address because the
// policies key on auth.uid()/JWT email. No service_role here, ever.
const url = import.meta.env.PUBLIC_SUPABASE_URL;
const anonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

/** Parse a raw Cookie header into the {name,value}[] shape @supabase/ssr wants. */
function parseCookieHeader(header: string | null): { name: string; value: string }[] {
  if (!header) return [];
  return header.split(';').map((pair) => {
    const eq = pair.indexOf('=');
    const name = (eq < 0 ? pair : pair.slice(0, eq)).trim();
    const value = eq < 0 ? '' : decodeURIComponent(pair.slice(eq + 1).trim());
    return { name, value };
  }).filter((c) => c.name);
}

interface Ctx {
  cookies: AstroCookies;
  request: Request;
}

/**
 * A Supabase client bound to THIS request's cookies. Reads restore the session
 * from the httpOnly cookies; auth calls (sign-in, exchange, sign-out) and token
 * refreshes write updated cookies back through Astro. Every auth cookie is
 * forced httpOnly + lax + path '/' (and secure over https) so it can never be
 * read from page JS — Hard rule 3.
 */
export function supabaseServer({ cookies, request }: Ctx): SupabaseClient {
  if (!url || !anonKey) {
    throw new Error('Missing PUBLIC_SUPABASE_URL / PUBLIC_SUPABASE_ANON_KEY');
  }
  const secure = new URL(request.url).protocol === 'https:';
  return createServerClient(url, anonKey, {
    // PKCE so the magic-link code exchange is bound to the browser that asked
    // for it (the code-verifier is one of these httpOnly cookies).
    auth: { flowType: 'pkce' },
    cookies: {
      getAll: () => parseCookieHeader(request.headers.get('cookie')),
      setAll: (toSet: { name: string; value: string; options: CookieOptions }[]) => {
        for (const { name, value, options } of toSet) {
          cookies.set(name, value, {
            ...options,
            httpOnly: true,
            sameSite: 'lax',
            secure,
            path: '/',
          });
        }
      },
    },
  });
}

/**
 * Resolve the signed-in user for this request, or null. Uses getUser() (which
 * validates the JWT with Supabase) rather than getSession() so it is a real
 * trust check, not just a cookie read. Cheap-outs to null when no Supabase auth
 * cookie is present, so anonymous visitors — the vast majority — pay no network
 * round-trip. Returns the client too, so a caller that needs it can reuse the
 * same instance for a follow-up query.
 */
export async function getUser(ctx: Ctx): Promise<{
  client: SupabaseClient;
  user: { id: string; email: string | null } | null;
}> {
  const client = supabaseServer(ctx);
  const cookie = ctx.request.headers.get('cookie') || '';
  if (!/sb-[^=]*-auth-token/.test(cookie)) {
    return { client, user: null };
  }
  const { data, error } = await client.auth.getUser();
  if (error || !data.user) return { client, user: null };
  return { client, user: { id: data.user.id, email: data.user.email ?? null } };
}
