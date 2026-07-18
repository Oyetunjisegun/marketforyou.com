-- =============================================================================
-- Marketforyou — Phase 1 schema
-- Run this in the Supabase dashboard: SQL Editor → New query → paste → Run.
-- Safe to re-run: uses "if not exists" / "or replace" throughout.
-- =============================================================================

-- Extensions ------------------------------------------------------------------
create extension if not exists "pgcrypto";  -- gen_random_uuid()

-- Enums -----------------------------------------------------------------------
do $$ begin
  create type listing_type as enum ('fixed', 'auction', 'offer');
exception when duplicate_object then null; end $$;

do $$ begin
  create type product_condition as enum ('new', 'like-new', 'good', 'fair', 'for-parts');
exception when duplicate_object then null; end $$;

do $$ begin
  create type product_kind as enum ('physical', 'digital');
exception when duplicate_object then null; end $$;

do $$ begin
  create type order_status as enum ('pending', 'paid', 'shipped', 'delivered', 'cancelled', 'refunded');
exception when duplicate_object then null; end $$;

do $$ begin
  create type user_role as enum ('customer', 'seller', 'admin');
exception when duplicate_object then null; end $$;

-- =============================================================================
-- profiles — one row per auth user (extends Supabase auth.users)
-- =============================================================================
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text,
  email       text,
  phone       text,
  address     text,
  avatar_url  text,
  role        user_role not null default 'customer',
  created_at  timestamptz not null default now()
);

-- Auto-create a profile row whenever a new auth user signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email)
  values (new.id, new.raw_user_meta_data ->> 'full_name', new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- =============================================================================
-- categories
-- =============================================================================
create table if not exists public.categories (
  slug          text primary key,
  name          text not null,
  icon          text not null,
  accent        text,
  product_count integer default 0
);

-- =============================================================================
-- sellers — a profile that has opened a store
-- =============================================================================
create table if not exists public.sellers (
  id            uuid primary key default gen_random_uuid(),
  owner_id      uuid unique references public.profiles(id) on delete cascade,
  handle        text unique not null,
  display_name  text not null,
  avatar_url    text,
  bio           text,
  location      text,
  rating        numeric(2,1) default 0,
  rating_count  integer default 0,
  response_rate integer default 100,
  joined_at     timestamptz not null default now(),
  is_verified   boolean not null default false,
  is_featured   boolean not null default false,
  total_sales   integer default 0
);

-- =============================================================================
-- products
-- =============================================================================
create table if not exists public.products (
  id             uuid primary key default gen_random_uuid(),
  slug           text unique not null,
  title          text not null,
  description    text not null default '',
  category_slug  text references public.categories(slug),
  kind           product_kind not null default 'physical',
  listing_type   listing_type not null default 'fixed',
  condition      product_condition not null default 'new',
  currency       text not null default 'USD',
  price          numeric(12,2) not null,
  original_price numeric(12,2),
  auction        jsonb,
  video_url      text,
  specs          jsonb not null default '{}'::jsonb,
  variants       jsonb,
  stock          integer not null default 0,
  seller_id      uuid references public.sellers(id) on delete cascade,
  rating         numeric(2,1) default 0,
  rating_count   integer default 0,
  tags           text[] not null default '{}',
  is_sponsored   boolean not null default false,
  is_featured    boolean not null default false,
  free_shipping  boolean not null default false,
  location       text,
  created_at     timestamptz not null default now()
);

create index if not exists products_category_idx on public.products(category_slug);
create index if not exists products_seller_idx   on public.products(seller_id);
create index if not exists products_created_idx  on public.products(created_at desc);

-- =============================================================================
-- product_images
-- =============================================================================
create table if not exists public.product_images (
  id         uuid primary key default gen_random_uuid(),
  product_id uuid references public.products(id) on delete cascade,
  url        text not null,
  alt        text,
  spin       boolean default false,
  position   integer default 0
);
create index if not exists product_images_product_idx on public.product_images(product_id);

-- =============================================================================
-- reviews
-- =============================================================================
create table if not exists public.reviews (
  id                uuid primary key default gen_random_uuid(),
  product_id        uuid references public.products(id) on delete cascade,
  author_id         uuid references public.profiles(id) on delete set null,
  author_name       text not null,
  avatar_url        text,
  rating            integer not null check (rating between 0 and 5),
  title             text,
  body              text not null,
  verified_purchase boolean default false,
  helpful_count     integer default 0,
  created_at        timestamptz not null default now()
);
create index if not exists reviews_product_idx on public.reviews(product_id);

-- =============================================================================
-- orders + order_items
-- =============================================================================
create table if not exists public.orders (
  id             uuid primary key default gen_random_uuid(),
  buyer_id       uuid references public.profiles(id) on delete set null,
  status         order_status not null default 'pending',
  currency       text not null default 'USD',
  subtotal       numeric(12,2) not null default 0,
  total          numeric(12,2) not null default 0,
  shipping_name  text,
  shipping_email text,
  shipping_phone text,
  shipping_addr  text,
  payment_ref    text,          -- Flutterwave tx reference (Phase 3)
  created_at     timestamptz not null default now()
);
create index if not exists orders_buyer_idx on public.orders(buyer_id);

create table if not exists public.order_items (
  id            uuid primary key default gen_random_uuid(),
  order_id      uuid references public.orders(id) on delete cascade,
  product_id    uuid references public.products(id) on delete set null,
  seller_id     uuid references public.sellers(id) on delete set null,
  title         text not null,
  unit_price    numeric(12,2) not null,
  quantity      integer not null default 1,
  variant       jsonb
);
create index if not exists order_items_order_idx on public.order_items(order_id);

-- =============================================================================
-- wishlists
-- =============================================================================
create table if not exists public.wishlists (
  user_id    uuid references public.profiles(id) on delete cascade,
  product_id uuid references public.products(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, product_id)
);

-- =============================================================================
-- Row Level Security
-- Public catalog data is world-readable; personal data is owner-scoped.
-- =============================================================================
alter table public.profiles       enable row level security;
alter table public.sellers        enable row level security;
alter table public.products       enable row level security;
alter table public.product_images enable row level security;
alter table public.categories     enable row level security;
alter table public.reviews        enable row level security;
alter table public.orders         enable row level security;
alter table public.order_items    enable row level security;
alter table public.wishlists      enable row level security;

-- Helper: is the current user an admin?
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  );
$$;

-- profiles: a user sees/edits only their own; admins see all.
drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own on public.profiles
  for select using (auth.uid() = id or public.is_admin());
drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles
  for update using (auth.uid() = id);

-- categories: world-readable.
drop policy if exists categories_read on public.categories;
create policy categories_read on public.categories for select using (true);

-- sellers: world-readable; an owner manages their own store.
drop policy if exists sellers_read on public.sellers;
create policy sellers_read on public.sellers for select using (true);
drop policy if exists sellers_insert_own on public.sellers;
create policy sellers_insert_own on public.sellers
  for insert with check (auth.uid() = owner_id);
drop policy if exists sellers_update_own on public.sellers;
create policy sellers_update_own on public.sellers
  for update using (auth.uid() = owner_id or public.is_admin());

-- products: world-readable; only the owning seller (or admin) can write.
drop policy if exists products_read on public.products;
create policy products_read on public.products for select using (true);
drop policy if exists products_write_own on public.products;
create policy products_write_own on public.products
  for all using (
    public.is_admin() or seller_id in (
      select id from public.sellers where owner_id = auth.uid()
    )
  )
  with check (
    public.is_admin() or seller_id in (
      select id from public.sellers where owner_id = auth.uid()
    )
  );

-- product_images: world-readable; writable by the product's seller.
drop policy if exists product_images_read on public.product_images;
create policy product_images_read on public.product_images for select using (true);
drop policy if exists product_images_write on public.product_images;
create policy product_images_write on public.product_images
  for all using (
    public.is_admin() or product_id in (
      select p.id from public.products p
      join public.sellers s on s.id = p.seller_id
      where s.owner_id = auth.uid()
    )
  );

-- reviews: world-readable; a logged-in user writes their own.
drop policy if exists reviews_read on public.reviews;
create policy reviews_read on public.reviews for select using (true);
drop policy if exists reviews_insert_own on public.reviews;
create policy reviews_insert_own on public.reviews
  for insert with check (auth.uid() = author_id);

-- orders: a buyer sees only their own; admins see all.
drop policy if exists orders_select_own on public.orders;
create policy orders_select_own on public.orders
  for select using (auth.uid() = buyer_id or public.is_admin());
drop policy if exists orders_insert_own on public.orders;
create policy orders_insert_own on public.orders
  for insert with check (auth.uid() = buyer_id);

-- order_items: visible if you can see the parent order.
drop policy if exists order_items_select on public.order_items;
create policy order_items_select on public.order_items
  for select using (
    order_id in (select id from public.orders where buyer_id = auth.uid())
    or public.is_admin()
  );
drop policy if exists order_items_insert on public.order_items;
create policy order_items_insert on public.order_items
  for insert with check (
    order_id in (select id from public.orders where buyer_id = auth.uid())
  );

-- wishlists: fully private to the owner.
drop policy if exists wishlists_all_own on public.wishlists;
create policy wishlists_all_own on public.wishlists
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- =============================================================================
-- Done. Next: run the seed script (npm run seed) to load demo data.
-- =============================================================================
