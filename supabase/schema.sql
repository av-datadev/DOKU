-- DOKU — products table
-- Run this first, once, in Supabase SQL Editor.

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

-- Anyone can read the catalog. Nobody can write from the browser —
-- catalog edits happen from the Supabase dashboard (Table Editor / SQL),
-- not from client code, until there's a real admin panel with its own auth.
create policy "Public read access" on products
  for select using (true);
