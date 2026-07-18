-- =============================================================================
-- Marketforyou — Phase 2 schema
-- Seller management, DB-backed cart, order fulfillment, payments, admin,
-- Storage bucket, and a security fix for role escalation.
--
-- Run AFTER schema.sql in the Supabase dashboard: SQL Editor → paste → Run.
-- Safe to re-run: uses "if not exists" / "or replace" / drop-then-create.
-- =============================================================================

-- Enums -----------------------------------------------------------------------
do $$ begin
  create type fulfillment_status as enum ('unfulfilled', 'shipped', 'delivered');
exception when duplicate_object then null; end $$;

-- =============================================================================
-- cart_items — a persistent, per-user cart (replaces localStorage-only cart)
-- One row per (user, product, variant). variant_key makes the same product in
-- two variants two distinct lines.
-- =============================================================================
create table if not exists public.cart_items (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.profiles(id) on delete cascade,
  product_id   uuid not null references public.products(id) on delete cascade,
  quantity     integer not null default 1 check (quantity > 0),
  variant      jsonb,
  variant_key  text not null default '',
  created_at   timestamptz not null default now(),
  unique (user_id, product_id, variant_key)
);
create index if not exists cart_items_user_idx on public.cart_items(user_id);

-- =============================================================================
-- order_items.fulfillment — a seller marks their own line shipped/delivered
-- =============================================================================
alter table public.order_items
  add column if not exists fulfillment fulfillment_status not null default 'unfulfilled';

-- Track whether a paid order's stock has been decremented (idempotent webhooks).
alter table public.orders
  add column if not exists stock_committed boolean not null default false;

-- =============================================================================
-- Security fix: the old profiles_update_own policy let a user set their own
-- role (e.g. to 'admin'). Re-create it so a non-admin cannot change their role.
-- =============================================================================
drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles
  for update
  using (auth.uid() = id or public.is_admin())
  with check (
    public.is_admin()
    or (auth.uid() = id and role = (select role from public.profiles where id = auth.uid()))
  );

-- =============================================================================
-- become_seller() — safe seller onboarding. Promotes the caller to 'seller'
-- and creates their store row atomically. SECURITY DEFINER so it can set the
-- role the row policy otherwise blocks. Idempotent.
-- =============================================================================
create or replace function public.become_seller(
  p_handle       text,
  p_display_name text,
  p_bio          text default null,
  p_location     text default null
)
returns public.sellers
language plpgsql
security definer set search_path = public
as $$
declare
  v_uid    uuid := auth.uid();
  v_seller public.sellers;
begin
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;

  select * into v_seller from public.sellers where owner_id = v_uid;
  if found then
    return v_seller;
  end if;

  if exists (select 1 from public.sellers where handle = p_handle) then
    raise exception 'Handle "%" is already taken', p_handle;
  end if;

  insert into public.sellers (owner_id, handle, display_name, bio, location)
  values (v_uid, p_handle, p_display_name, p_bio, p_location)
  returning * into v_seller;

  update public.profiles set role = 'seller' where id = v_uid and role = 'customer';

  return v_seller;
end;
$$;

-- Helper: the seller_id owned by the current user (null if not a seller).
create or replace function public.current_seller_id()
returns uuid language sql stable security definer set search_path = public as $$
  select id from public.sellers where owner_id = auth.uid() limit 1;
$$;

-- =============================================================================
-- RLS: cart_items — fully private to the owner.
-- =============================================================================
alter table public.cart_items enable row level security;
drop policy if exists cart_items_all_own on public.cart_items;
create policy cart_items_all_own on public.cart_items
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- =============================================================================
-- RLS: sellers see orders containing their products and manage their own lines.
-- =============================================================================

-- orders: seller can read an order if any line item is theirs.
drop policy if exists orders_select_seller on public.orders;
create policy orders_select_seller on public.orders
  for select using (
    id in (
      select order_id from public.order_items
      where seller_id = public.current_seller_id()
    )
  );

-- order_items: seller can read their own line items.
drop policy if exists order_items_select_seller on public.order_items;
create policy order_items_select_seller on public.order_items
  for select using (seller_id = public.current_seller_id() or public.is_admin());

-- order_items: seller can update fulfillment on their own line items.
-- (The WITH CHECK keeps seller_id pinned to theirs so they can't reassign a line.)
drop policy if exists order_items_update_seller on public.order_items;
create policy order_items_update_seller on public.order_items
  for update
  using (seller_id = public.current_seller_id() or public.is_admin())
  with check (seller_id = public.current_seller_id() or public.is_admin());

-- =============================================================================
-- RLS: admin oversight — admins can read/write across users, products, orders.
-- (Catalog reads are already public; these add admin WRITE + full order reads.)
-- =============================================================================
drop policy if exists orders_admin_all on public.orders;
create policy orders_admin_all on public.orders
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists profiles_admin_read on public.profiles;
create policy profiles_admin_read on public.profiles
  for select using (auth.uid() = id or public.is_admin());

-- Note: products_write_own already grants admins full write via is_admin(),
-- so no separate admin product-delete policy is needed.

-- =============================================================================
-- Storage: a public bucket for product images.
-- Public read; authenticated users may write/update/delete only inside a folder
-- named after their own uid (e.g. "<uid>/<file>.jpg").
-- =============================================================================
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

drop policy if exists product_images_public_read on storage.objects;
create policy product_images_public_read on storage.objects
  for select using (bucket_id = 'product-images');

drop policy if exists product_images_owner_write on storage.objects;
create policy product_images_owner_write on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'product-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists product_images_owner_modify on storage.objects;
create policy product_images_owner_modify on storage.objects
  for update to authenticated
  using (
    bucket_id = 'product-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists product_images_owner_delete on storage.objects;
create policy product_images_owner_delete on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'product-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- =============================================================================
-- decrement_stock(order_id) — called after a verified payment. Reduces stock
-- for each line item once, guarded by orders.stock_committed for idempotency.
-- SECURITY DEFINER so the service-role webhook path is simple and consistent.
-- =============================================================================
create or replace function public.commit_order_stock(p_order_id uuid)
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  if exists (select 1 from public.orders where id = p_order_id and stock_committed) then
    return;  -- already committed
  end if;

  update public.products p
     set stock = greatest(0, p.stock - oi.quantity)
    from public.order_items oi
   where oi.order_id = p_order_id
     and oi.product_id = p.id;

  update public.orders set stock_committed = true where id = p_order_id;
end;
$$;

-- =============================================================================
-- Done. Remember to promote yourself to admin once (replace the email):
--   update public.profiles set role = 'admin'
--   where id = (select id from auth.users where email = 'you@example.com');
-- =============================================================================
