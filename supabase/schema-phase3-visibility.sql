-- =============================================================================
-- Marketforyou — Phase 3 (visibility columns for SEO / sitemap)
-- Adds publish/active state so the sitemap (and later the dashboards) can
-- exclude drafts, archived/deleted products, and suspended sellers.
--
-- Run AFTER schema.sql and schema-phase2.sql in the Supabase SQL Editor.
-- Safe to re-run: uses "if not exists" / guarded enum creation.
-- Defaults are chosen so ALL existing rows stay publicly visible.
-- =============================================================================

-- product visibility ----------------------------------------------------------
do $$ begin
  create type product_status as enum ('draft', 'published', 'archived');
exception when duplicate_object then null; end $$;

-- Existing products default to 'published' so nothing disappears from the site.
alter table public.products
  add column if not exists status product_status not null default 'published';

create index if not exists products_status_idx on public.products(status);

-- seller visibility -----------------------------------------------------------
-- is_active = the store is publicly listed (active AND approved). Suspending a
-- seller or leaving a signup unapproved = set this false.
alter table public.sellers
  add column if not exists is_active boolean not null default true;

create index if not exists sellers_active_idx on public.sellers(is_active);
