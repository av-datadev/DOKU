-- DOKU — schema of record. Applied via two migrations (initial products
-- table, then orders_and_reserve_flow) — this file is the current-state
-- reference, not a replay log. Re-running it is safe (idempotent).

create table if not exists products (
  sku text primary key,
  title text not null,
  origin text,
  year text,
  price numeric,
  status text not null check (status in ('available','coming-soon','claimed')),
  story jsonb,
  specs jsonb,
  teaser text,
  epitaph text,
  image text,
  reference_image boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

alter table products enable row level security;

-- Anyone can read the catalog. Nobody can write from the browser directly —
-- the only mutation path is place_order() below. Day-to-day catalog edits
-- (new items, real photography, promoting a reserved item to claimed)
-- happen from the Supabase dashboard (Table Editor / SQL), not from client
-- code, until there's a real admin panel with its own auth.
create policy "Public read access" on products
  for select using (true);

-- 'reserved' = someone completed the front-end checkout simulation.
-- It is NOT a verified sale (see CLAUDE.md Hard rule 4) — promote to
-- 'claimed' by hand once payment is actually confirmed out-of-band.
alter table products drop constraint if exists products_status_check;
alter table products add constraint products_status_check
  check (status in ('available','coming-soon','claimed','reserved'));

-- orders — never directly readable/writable by anon; all access goes
-- through place_order() below.
create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  order_code text not null,
  sku text not null references products(sku),
  title text not null,
  price numeric not null,
  currency text not null default 'USD',
  full_name text not null,
  email text not null,
  address text not null,
  city text not null,
  postcode text not null,
  country text not null,
  created_at timestamptz not null default now()
);

alter table orders enable row level security;
-- Deliberately no policies: RLS with zero policies denies all access to
-- anon/authenticated. Writes happen only via the SECURITY DEFINER function
-- below, which runs as the function owner and bypasses RLS. orders holds
-- buyer name/email/address — nothing in the browser should ever be able
-- to list or scrape it.

-- Atomically checks every item in a checkout is still available, reserves
-- all of them, and records one order row per item under a shared order
-- code. All-or-nothing: if any item was already taken, nothing changes.
create or replace function place_order(
  p_skus text[],
  p_full_name text,
  p_email text,
  p_address text,
  p_city text,
  p_postcode text,
  p_country text,
  p_currency text
) returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order_code text := 'DOKU-' || upper(substr(md5(random()::text || clock_timestamp()::text), 1, 6));
  v_sku text;
  v_row products%rowtype;
begin
  if p_skus is null or array_length(p_skus, 1) is null then
    raise exception 'No items given';
  end if;

  foreach v_sku in array p_skus loop
    select * into v_row from products where sku = v_sku for update;
    if not found then
      raise exception 'Unknown item %', v_sku;
    end if;
    if v_row.status <> 'available' then
      raise exception 'Item % is no longer available', v_sku;
    end if;
  end loop;

  foreach v_sku in array p_skus loop
    update products set status = 'reserved' where sku = v_sku;
    insert into orders (order_code, sku, title, price, currency, full_name, email, address, city, postcode, country)
    select v_order_code, sku, title, price, p_currency, p_full_name, p_email, p_address, p_city, p_postcode, p_country
    from products where sku = v_sku;
  end loop;

  return v_order_code;
end;
$$;

revoke all on function place_order(text[], text, text, text, text, text, text, text) from public;
grant execute on function place_order(text[], text, text, text, text, text, text, text) to anon;

-- ── ADMIN (admin.html) ──────────────────────────────────────────────
-- Allowlist of admin user IDs. Write access to the catalog and read access
-- to orders is gated on membership HERE, not on merely being 'authenticated'
-- — so public signups (if ever enabled) can never grant a random account
-- access. To add an admin: create the user in Supabase Auth, then insert
-- their auth.users.id into this table. (The first admin account was created
-- via a one-time seed in the admin_auth_and_write_policies migration; it is
-- deliberately NOT reproduced here, since this file carries no credentials.)
create table if not exists admins (
  id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table admins enable row level security;
-- No policies on admins: deny all direct API access. Membership is only ever
-- read through is_admin() below, which is SECURITY DEFINER.

create or replace function is_admin() returns boolean
language sql security definer stable set search_path = public
as $$ select exists (select 1 from admins where id = auth.uid()); $$;
revoke all on function is_admin() from public;
grant execute on function is_admin() to authenticated;  -- not anon

-- Catalog writes: admins only. anon stays read-only (Public read access).
create policy "Admins insert products" on products
  for insert to authenticated with check (is_admin());
create policy "Admins update products" on products
  for update to authenticated using (is_admin()) with check (is_admin());
create policy "Admins delete products" on products
  for delete to authenticated using (is_admin());

-- Orders hold buyer PII: admins can read, anon never can (no anon policy).
create policy "Admins read orders" on orders
  for select to authenticated using (is_admin());
