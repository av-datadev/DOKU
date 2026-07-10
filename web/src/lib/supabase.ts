import { createClient } from '@supabase/supabase-js';

// The public site only ever uses the anon key — RLS is what protects the data
// (orders are deny-all; products are read-only to anon; the only write path is
// the place_order() RPC). Same key that already ships in the live site, so it
// is safe in the browser. No service_role here, ever — that lives only in the
// Supabase Edge Functions.
const url = import.meta.env.PUBLIC_SUPABASE_URL;
const anonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

export function supabase() {
  if (!url || !anonKey) {
    throw new Error('Missing PUBLIC_SUPABASE_URL / PUBLIC_SUPABASE_ANON_KEY');
  }
  return createClient(url, anonKey, {
    auth: { persistSession: false }, // Hard rule 3: no browser storage.
  });
}
