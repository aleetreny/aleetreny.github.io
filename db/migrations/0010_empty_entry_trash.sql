create or replace function public.empty_deleted_content_entries()
returns integer
language plpgsql
security definer
set search_path = pg_catalog, public, app_private, auth
as $$
declare
  deleted_count integer;
begin
  if not public.is_owner() then
    raise exception 'Owner access required' using errcode = '42501';
  end if;

  -- Blocks and immutable versions follow their entry through ON DELETE
  -- CASCADE. Assets deliberately remain: a media object may be shared by
  -- another dossier or still be useful to the owner.
  delete from public.content_entries
  where deleted_at is not null;

  get diagnostics deleted_count = row_count;
  return deleted_count;
end;
$$;

revoke all on function public.empty_deleted_content_entries()
  from public, anonymous;
grant execute on function public.empty_deleted_content_entries()
  to authenticated;
