-- Customer accounts (public site) — optional, passwordless.
-- Purely additive: no existing table/data/grant is dropped or altered. Adds
--   (a) an RLS policy letting a signed-in shopper read the orders whose email
--       matches their verified JWT email (order history — no change needed to
--       checkout / Razorpay / place_order_paid, since orders already store the
--       buyer email and a magic link proves ownership of it), and
--   (b) a one-row-per-account saved shipping address table, owner-only via RLS.
-- Mirrors the "CUSTOMER ACCOUNTS" block in schema.sql. See CLAUDE.md
-- "Customer accounts". Guest checkout is unaffected.

-- (a) Order history: authenticated users read only orders matching their
-- verified email (case-insensitive). anon still has no orders policy → denied.
create policy "Buyers read own orders by email" on orders
  for select to authenticated
  using (lower(email) = lower(auth.jwt() ->> 'email'));

-- (b) One saved shipping address per account, keyed by the auth user id.
create table if not exists customer_addresses (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  address text not null,
  city text not null,
  postcode text not null,
  country text not null,
  updated_at timestamptz not null default now()
);
alter table customer_addresses enable row level security;

-- Owner-only on every verb: auth.uid() = id. No account can read or write
-- another's address; anon has no policy → denied.
create policy "Owner reads own address" on customer_addresses
  for select to authenticated using (auth.uid() = id);
create policy "Owner inserts own address" on customer_addresses
  for insert to authenticated with check (auth.uid() = id);
create policy "Owner updates own address" on customer_addresses
  for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);
