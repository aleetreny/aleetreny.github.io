do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'anonymous')
     or not exists (select 1 from pg_roles where rolname = 'authenticated') then
    raise exception 'Neon Data API roles are missing. Run `neon deploy` with auth/dataApi enabled before migrations.';
  end if;

  if to_regprocedure('auth.user_id()') is null then
    raise exception 'auth.user_id() is missing. Provision Managed Better Auth and Data API before migrations.';
  end if;
end;
$$;

create or replace function public.is_owner()
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, app_private, auth
as $$
  select exists (
    select 1
    from app_private.owner_accounts
    where auth_user_id = auth.user_id()
      and enabled = true
  );
$$;

revoke all on function public.is_owner() from public;
grant execute on function public.is_owner() to anonymous, authenticated;

revoke all on schema app_private from public, anonymous, authenticated;
revoke all on all tables in schema app_private from public, anonymous, authenticated;
revoke all on all functions in schema app_private from public, anonymous, authenticated;

grant usage on schema public to anonymous, authenticated;
grant select on public.content_entries, public.content_blocks, public.site_settings
  to anonymous;
grant select, insert, update, delete on
  public.content_entries,
  public.content_blocks,
  public.assets,
  public.entry_versions,
  public.site_settings
  to authenticated;

alter table public.content_entries enable row level security;
alter table public.content_blocks enable row level security;
alter table public.assets enable row level security;
alter table public.entry_versions enable row level security;
alter table public.site_settings enable row level security;

drop policy if exists content_entries_public_read on public.content_entries;
create policy content_entries_public_read
on public.content_entries
for select
to anonymous, authenticated
using (status = 'published' and deleted_at is null);

drop policy if exists content_entries_owner_all on public.content_entries;
create policy content_entries_owner_all
on public.content_entries
for all
to authenticated
using (public.is_owner())
with check (public.is_owner());

drop policy if exists content_blocks_public_read on public.content_blocks;
create policy content_blocks_public_read
on public.content_blocks
for select
to anonymous, authenticated
using (
  deleted_at is null
  and exists (
    select 1
    from public.content_entries entry
    where entry.id = entry_id
      and entry.status = 'published'
      and entry.deleted_at is null
  )
);

drop policy if exists content_blocks_owner_all on public.content_blocks;
create policy content_blocks_owner_all
on public.content_blocks
for all
to authenticated
using (public.is_owner())
with check (public.is_owner());

drop policy if exists assets_public_read on public.assets;

drop policy if exists assets_owner_all on public.assets;
create policy assets_owner_all
on public.assets
for all
to authenticated
using (public.is_owner())
with check (public.is_owner());

drop policy if exists entry_versions_owner_all on public.entry_versions;
create policy entry_versions_owner_all
on public.entry_versions
for all
to authenticated
using (public.is_owner())
with check (public.is_owner());

drop policy if exists site_settings_public_read on public.site_settings;
create policy site_settings_public_read
on public.site_settings
for select
to anonymous, authenticated
using (is_public = true);

drop policy if exists site_settings_owner_all on public.site_settings;
create policy site_settings_owner_all
on public.site_settings
for all
to authenticated
using (public.is_owner())
with check (public.is_owner());
