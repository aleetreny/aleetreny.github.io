create or replace function public.restore_deleted_content_entry(
  p_entry_id uuid,
  p_expected_version integer
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, app_private, auth
as $$
declare
  existing_entry public.content_entries%rowtype;
  deleted_snapshot jsonb;
  snapshot_entry jsonb;
  snapshot_block jsonb;
  snapshot_block_id uuid;
  next_version integer;
begin
  if not public.is_owner() then
    raise exception 'Owner access required' using errcode = '42501';
  end if;

  select * into existing_entry
  from public.content_entries
  where id = p_entry_id and deleted_at is not null
  for update;

  if not found then
    raise exception 'Deleted entry not found' using errcode = 'P0002';
  end if;
  if existing_entry.version <> p_expected_version then
    raise exception 'Version conflict: expected %, current %', p_expected_version, existing_entry.version
      using errcode = '40001';
  end if;

  select snapshot into deleted_snapshot
  from public.entry_versions
  where entry_id = p_entry_id
    and reason = 'soft delete'
  order by version desc
  limit 1;

  if deleted_snapshot is null then
    raise exception 'Deletion snapshot not found' using errcode = 'P0002';
  end if;

  -- Preserve a complete, restorable baseline for the version occupied by the
  -- deleted row. The current row has no active blocks, so reuse the immutable
  -- snapshot captured immediately before deletion.
  insert into public.entry_versions (entry_id, version, snapshot, reason, created_by)
  values (
    p_entry_id,
    existing_entry.version,
    deleted_snapshot,
    'before restoring from trash',
    auth.user_id()
  );

  snapshot_entry := deleted_snapshot -> 'entry';
  next_version := existing_entry.version + 1;
  update public.content_entries
  set slug = snapshot_entry ->> 'slug',
      title = snapshot_entry ->> 'title',
      summary = coalesce(snapshot_entry ->> 'summary', ''),
      entry_type = snapshot_entry ->> 'entry_type',
      status = snapshot_entry ->> 'status',
      cover_asset_id = nullif(snapshot_entry ->> 'cover_asset_id', '')::uuid,
      metadata = coalesce(snapshot_entry -> 'metadata', '{}'::jsonb),
      published_at = nullif(snapshot_entry ->> 'published_at', '')::timestamptz,
      version = next_version,
      deleted_at = null
  where id = p_entry_id;

  update public.content_blocks
  set deleted_at = now(), version = version + 1
  where entry_id = p_entry_id and deleted_at is null;

  for snapshot_block in select value from jsonb_array_elements(deleted_snapshot -> 'blocks')
  loop
    snapshot_block_id := (snapshot_block ->> 'id')::uuid;
    insert into public.content_blocks (
      id, entry_id, block_type, position, props, layout, version, deleted_at
    ) values (
      snapshot_block_id,
      p_entry_id,
      snapshot_block ->> 'block_type',
      (snapshot_block ->> 'position')::integer,
      coalesce(snapshot_block -> 'props', '{}'::jsonb),
      coalesce(snapshot_block -> 'layout', '{}'::jsonb),
      coalesce((snapshot_block ->> 'version')::integer, 1) + 1,
      null
    )
    on conflict (id) do update set
      block_type = excluded.block_type,
      position = excluded.position,
      props = excluded.props,
      layout = excluded.layout,
      version = excluded.version,
      deleted_at = null;
  end loop;

  return app_private.entry_payload(p_entry_id);
end;
$$;

revoke all on function public.restore_deleted_content_entry(uuid, integer)
  from public, anonymous;
grant execute on function public.restore_deleted_content_entry(uuid, integer)
  to authenticated;
