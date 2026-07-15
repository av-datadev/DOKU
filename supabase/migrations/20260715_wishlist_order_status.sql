-- Wishlist + order status + self-service deletion (public site) — additive.
-- Extends the customer-account surface without touching guest checkout or the
-- Razorpay / place_order_paid reserve path. Adds:
--   (a) a per-account wishlist (owner-only, cascades when the account is
--       deleted), for the "keep an eye on this" feature. NOT a hold — an item
--       on someone's wishlist stays purchasable by anyone; only a paid Razorpay
--       order reserves it.
--   (b) a fulfillment status + tracking note on orders
--       (reserved → confirmed → shipped → delivered), set by admins, read back
--       by the buyer on /account.
-- Self-service account deletion needs NO schema change: deleting the auth user
-- cascades customer_addresses and wishlists (both FK auth.users on delete
-- cascade); orders do NOT reference auth.users, so they are retained as the
-- sale record (owner's decision). Mirrors the additions in schema.sql.

-- (a) Wishlist — one row per (account, sku). Owner-only via RLS; anon denied.
create table if not exists wishlists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  sku text not null references products(sku) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, sku)
);
alter table wishlists enable row level security;

create policy "Owner reads own wishlist" on wishlists
  for select to authenticated using (auth.uid() = user_id);
create policy "Owner adds to own wishlist" on wishlists
  for insert to authenticated with check (auth.uid() = user_id);
create policy "Owner removes from own wishlist" on wishlists
  for delete to authenticated using (auth.uid() = user_id);

-- (b) Order fulfillment status. All rows sharing an order_code carry the same
-- value; admins advance it, the buyer sees it. Default 'reserved' matches every
-- existing order (place_order_paid writes rows with the default).
alter table orders add column if not exists order_status text not null default 'reserved';
alter table orders drop constraint if exists orders_order_status_check;
alter table orders add constraint orders_order_status_check
  check (order_status in ('reserved','confirmed','shipped','delivered'));
alter table orders add column if not exists tracking_note text;

-- Admins may advance order status / tracking (buyers stay read-only via the
-- existing "Buyers read own orders by email" select policy). anon has no
-- orders policy → still denied.
create policy "Admins update orders" on orders
  for update to authenticated using (is_admin()) with check (is_admin());
