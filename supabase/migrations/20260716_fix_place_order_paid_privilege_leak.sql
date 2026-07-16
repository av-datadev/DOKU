-- CRITICAL FIX (applied live 2026-07-16). place_order and place_order_paid were
-- still directly executable by anon/authenticated despite "revoke all ... from
-- public" in their defining migrations: Supabase's default privileges grant
-- EXECUTE directly to the anon/authenticated roles (not via the PUBLIC
-- pseudo-role) when a function is created in the public schema, so revoking
-- from PUBLIC never touched those direct grants. Confirmed live via
-- has_function_privilege() — anon AND authenticated could call place_order_paid
-- directly through PostgREST with fabricated Razorpay ids and reserve a
-- one-of-one for free, bypassing payment entirely (breaks CLAUDE.md Hard rule 4:
-- "the browser can never reserve without a verified payment"). place_order (the
-- old free path) was likewise still reachable by authenticated.
--
-- Fix: strip the direct grants from both roles on both functions, and re-affirm
-- that only service_role (used by the razorpay-verify-payment Edge Function) may
-- execute place_order_paid. Purely restrictive — it can only tighten access.
-- Verified after: has_function_privilege() now false for anon + authenticated
-- on both functions.

revoke all on function place_order(text[], text, text, text, text, text, text, text) from anon, authenticated;
revoke all on function place_order_paid(text[], text, text, text, text, text, text, text, text, bigint) from anon, authenticated;
grant execute on function place_order_paid(text[], text, text, text, text, text, text, text, text, bigint) to service_role;
