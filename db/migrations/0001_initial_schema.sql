create extension if not exists pgcrypto;

create schema if not exists app_private;
revoke all on schema app_private from public;

create table if not exists app_private.owner_accounts (
  auth_user_id text primary key,
  email text,
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint owner_accounts_user_id_not_blank check (length(btrim(auth_user_id)) > 0)
);

create table if not exists public.assets (
  id uuid primary key default gen_random_uuid(),
  owner_id text not null,
  storage_provider text not null default 'neon-object-storage',
  bucket text not null,
  object_key text not null,
  public_url text,
  mime_type text not null,
  byte_size bigint not null default 0,
  width integer,
  height integer,
  alt_text text not null default '',
  metadata jsonb not null default '{}'::jsonb,
  is_public boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint assets_object_key_unique unique (bucket, object_key),
  constraint assets_byte_size_nonnegative check (byte_size >= 0),
  constraint assets_dimensions_positive check (
    (width is null or width > 0) and (height is null or height > 0)
  ),
  constraint assets_metadata_is_object check (jsonb_typeof(metadata) = 'object')
);

create table if not exists public.content_entries (
  id uuid primary key default gen_random_uuid(),
  owner_id text not null,
  slug text not null unique,
  title text not null,
  summary text not null default '',
  entry_type text not null default 'custom',
  status text not null default 'draft',
  cover_asset_id uuid references public.assets(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  version integer not null default 1,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint content_entries_slug_format check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  constraint content_entries_title_not_blank check (length(btrim(title)) > 0),
  constraint content_entries_entry_type check (
    entry_type in ('project', 'case-study', 'experience', 'education', 'note', 'custom')
  ),
  constraint content_entries_status check (status in ('draft', 'published', 'archived')),
  constraint content_entries_version_positive check (version > 0),
  constraint content_entries_metadata_is_object check (jsonb_typeof(metadata) = 'object'),
  constraint content_entries_publish_date check (status <> 'published' or published_at is not null)
);

create table if not exists public.content_blocks (
  id uuid primary key default gen_random_uuid(),
  entry_id uuid not null references public.content_entries(id) on delete cascade,
  block_type text not null,
  position integer not null,
  props jsonb not null default '{}'::jsonb,
  layout jsonb not null default '{}'::jsonb,
  version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint content_blocks_type_not_blank check (length(btrim(block_type)) > 0),
  constraint content_blocks_position_nonnegative check (position >= 0),
  constraint content_blocks_version_positive check (version > 0),
  constraint content_blocks_props_is_object check (jsonb_typeof(props) = 'object'),
  constraint content_blocks_layout_is_object check (jsonb_typeof(layout) = 'object')
);

create table if not exists public.entry_versions (
  id uuid primary key default gen_random_uuid(),
  entry_id uuid not null references public.content_entries(id) on delete cascade,
  version integer not null,
  snapshot jsonb not null,
  reason text not null default '',
  created_by text not null,
  created_at timestamptz not null default now(),
  constraint entry_versions_unique_version unique (entry_id, version),
  constraint entry_versions_version_positive check (version > 0),
  constraint entry_versions_snapshot_is_object check (jsonb_typeof(snapshot) = 'object')
);

create table if not exists public.site_settings (
  key text primary key,
  value jsonb not null,
  is_public boolean not null default false,
  updated_by text not null,
  updated_at timestamptz not null default now(),
  constraint site_settings_key_format check (key ~ '^[a-z][a-z0-9_.-]*$')
);

create unique index if not exists content_blocks_active_position_unique
  on public.content_blocks (entry_id, position)
  where deleted_at is null;
create index if not exists content_entries_public_feed_idx
  on public.content_entries (published_at desc)
  where status = 'published' and deleted_at is null;
create index if not exists content_entries_owner_status_idx
  on public.content_entries (owner_id, status, updated_at desc)
  where deleted_at is null;
create index if not exists content_blocks_entry_idx
  on public.content_blocks (entry_id, position)
  where deleted_at is null;
create index if not exists assets_owner_idx
  on public.assets (owner_id, created_at desc)
  where deleted_at is null;
create index if not exists assets_public_idx
  on public.assets (created_at desc)
  where is_public = true and deleted_at is null;
create index if not exists entry_versions_entry_idx
  on public.entry_versions (entry_id, version desc);

create or replace function app_private.set_updated_at()
returns trigger
language plpgsql
set search_path = pg_catalog
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists owner_accounts_set_updated_at on app_private.owner_accounts;
create trigger owner_accounts_set_updated_at
before update on app_private.owner_accounts
for each row execute function app_private.set_updated_at();

drop trigger if exists assets_set_updated_at on public.assets;
create trigger assets_set_updated_at
before update on public.assets
for each row execute function app_private.set_updated_at();

drop trigger if exists content_entries_set_updated_at on public.content_entries;
create trigger content_entries_set_updated_at
before update on public.content_entries
for each row execute function app_private.set_updated_at();

drop trigger if exists content_blocks_set_updated_at on public.content_blocks;
create trigger content_blocks_set_updated_at
before update on public.content_blocks
for each row execute function app_private.set_updated_at();
