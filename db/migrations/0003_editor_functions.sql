create or replace function app_private.entry_snapshot(p_entry_id uuid)
returns jsonb
language sql
stable
security definer
set search_path = pg_catalog, public, app_private
as $$
  select jsonb_build_object(
    'entry', to_jsonb(entry),
    'blocks', coalesce(
      (
        select jsonb_agg(to_jsonb(block) order by block.position)
        from public.content_blocks block
        where block.entry_id = entry.id
          and block.deleted_at is null
      ),
      '[]'::jsonb
    )
  )
  from public.content_entries entry
  where entry.id = p_entry_id;
$$;

create or replace function app_private.entry_payload(p_entry_id uuid)
returns jsonb
language sql
stable
security definer
set search_path = pg_catalog, public, app_private
as $$
  select jsonb_build_object(
    'id', entry.id,
    'slug', entry.slug,
    'title', entry.title,
    'summary', entry.summary,
    'entryType', entry.entry_type,
    'status', entry.status,
    'publishedAt', entry.published_at,
    'version', entry.version,
    'metadata', entry.metadata,
    'blocks', coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'id', block.id,
            'type', block.block_type,
            'position', block.position,
            'props', block.props,
            'layout', block.layout
          )
          order by block.position
        )
        from public.content_blocks block
        where block.entry_id = entry.id
          and block.deleted_at is null
      ),
      '[]'::jsonb
    )
  )
  from public.content_entries entry
  where entry.id = p_entry_id
    and entry.deleted_at is null;
$$;

revoke all on function app_private.entry_snapshot(uuid) from public, anonymous, authenticated;
revoke all on function app_private.entry_payload(uuid) from public, anonymous, authenticated;

create or replace function public.save_content_entry(
  p_entry_id uuid,
  p_expected_version integer,
  p_entry jsonb,
  p_blocks jsonb,
  p_reason text default 'editor save'
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, app_private, auth
as $$
declare
  existing_entry public.content_entries%rowtype;
  requested_block jsonb;
  requested_block_id uuid;
  v_entry_status text;
  v_entry_type text;
  v_entry_title text;
  v_entry_slug text;
  v_entry_summary text;
  v_entry_metadata jsonb;
  v_published_at timestamptz;
  v_next_version integer;
  v_owner_id text;
begin
  if not public.is_owner() then
    raise exception 'Owner access required' using errcode = '42501';
  end if;

  if p_entry_id is null or p_expected_version is null or p_expected_version < 0 then
    raise exception 'Entry id and a non-negative expected version are required' using errcode = '22023';
  end if;
  if jsonb_typeof(p_entry) <> 'object' or jsonb_typeof(p_blocks) <> 'array' then
    raise exception 'Entry must be an object and blocks must be an array' using errcode = '22023';
  end if;

  v_owner_id := auth.user_id();
  v_entry_title := nullif(btrim(p_entry ->> 'title'), '');
  v_entry_slug := nullif(btrim(p_entry ->> 'slug'), '');
  v_entry_summary := coalesce(p_entry ->> 'summary', '');
  v_entry_type := coalesce(nullif(p_entry ->> 'entryType', ''), 'custom');
  v_entry_status := coalesce(nullif(p_entry ->> 'status', ''), 'draft');
  v_entry_metadata := coalesce(p_entry -> 'metadata', '{}'::jsonb);

  if v_entry_title is null or v_entry_slug is null then
    raise exception 'Title and slug are required' using errcode = '23514';
  end if;
  if jsonb_typeof(v_entry_metadata) <> 'object' then
    raise exception 'Metadata must be an object' using errcode = '22023';
  end if;

  if v_entry_status = 'published' then
    v_published_at := coalesce(nullif(p_entry ->> 'publishedAt', '')::timestamptz, now());
  else
    v_published_at := nullif(p_entry ->> 'publishedAt', '')::timestamptz;
  end if;

  if p_expected_version = 0 then
    insert into public.content_entries (
      id, owner_id, slug, title, summary, entry_type, status, metadata, version, published_at
    ) values (
      p_entry_id, v_owner_id, v_entry_slug, v_entry_title, v_entry_summary, v_entry_type,
      v_entry_status, v_entry_metadata, 1, v_published_at
    );
    v_next_version := 1;
  else
    select * into existing_entry
    from public.content_entries
    where id = p_entry_id and deleted_at is null
    for update;

    if not found then
      raise exception 'Entry not found' using errcode = 'P0002';
    end if;
    if existing_entry.version <> p_expected_version then
      raise exception 'Version conflict: expected %, current %', p_expected_version, existing_entry.version
        using errcode = '40001';
    end if;

    insert into public.entry_versions (entry_id, version, snapshot, reason, created_by)
    values (
      p_entry_id,
      existing_entry.version,
      app_private.entry_snapshot(p_entry_id),
      coalesce(nullif(p_reason, ''), 'editor save'),
      v_owner_id
    );

    v_next_version := existing_entry.version + 1;
    update public.content_entries
    set slug = v_entry_slug,
        title = v_entry_title,
        summary = v_entry_summary,
        entry_type = v_entry_type,
        status = v_entry_status,
        metadata = v_entry_metadata,
        version = v_next_version,
        published_at = v_published_at
    where id = p_entry_id;
  end if;

  -- Temporarily deactivate the current set so position swaps cannot violate the
  -- partial unique index while blocks are reinserted in their new order.
  update public.content_blocks
  set deleted_at = now()
  where entry_id = p_entry_id
    and deleted_at is null;

  for requested_block in select value from jsonb_array_elements(p_blocks)
  loop
    if jsonb_typeof(requested_block) <> 'object' then
      raise exception 'Every block must be an object' using errcode = '22023';
    end if;
    requested_block_id := coalesce(nullif(requested_block ->> 'id', '')::uuid, gen_random_uuid());
    if exists (
      select 1 from public.content_blocks
      where id = requested_block_id and entry_id <> p_entry_id
    ) then
      raise exception 'Block id belongs to another entry' using errcode = '23505';
    end if;

    insert into public.content_blocks (
      id, entry_id, block_type, position, props, layout, version, deleted_at
    ) values (
      requested_block_id,
      p_entry_id,
      coalesce(nullif(requested_block ->> 'type', ''), 'text'),
      coalesce((requested_block ->> 'position')::integer, 0),
      coalesce(requested_block -> 'props', '{}'::jsonb),
      coalesce(requested_block -> 'layout', '{}'::jsonb),
      1,
      null
    )
    on conflict (id) do update set
      block_type = excluded.block_type,
      position = excluded.position,
      props = excluded.props,
      layout = excluded.layout,
      version = public.content_blocks.version + 1,
      deleted_at = null;
  end loop;

  return app_private.entry_payload(p_entry_id);
end;
$$;

create or replace function public.soft_delete_content_entry(
  p_entry_id uuid,
  p_expected_version integer
)
returns boolean
language plpgsql
security definer
set search_path = pg_catalog, public, app_private, auth
as $$
declare
  existing_entry public.content_entries%rowtype;
begin
  if not public.is_owner() then
    raise exception 'Owner access required' using errcode = '42501';
  end if;

  select * into existing_entry
  from public.content_entries
  where id = p_entry_id and deleted_at is null
  for update;

  if not found then
    raise exception 'Entry not found' using errcode = 'P0002';
  end if;
  if existing_entry.version <> p_expected_version then
    raise exception 'Version conflict: expected %, current %', p_expected_version, existing_entry.version
      using errcode = '40001';
  end if;

  insert into public.entry_versions (entry_id, version, snapshot, reason, created_by)
  values (
    p_entry_id,
    existing_entry.version,
    app_private.entry_snapshot(p_entry_id),
    'soft delete',
    auth.user_id()
  );

  update public.content_entries
  set deleted_at = now(), version = version + 1
  where id = p_entry_id;
  update public.content_blocks
  set deleted_at = now(), version = version + 1
  where entry_id = p_entry_id and deleted_at is null;
  return true;
end;
$$;

create or replace function public.restore_content_entry_version(
  p_entry_id uuid,
  p_version integer,
  p_expected_version integer
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, app_private, auth
as $$
declare
  existing_entry public.content_entries%rowtype;
  version_snapshot jsonb;
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
  where id = p_entry_id and deleted_at is null
  for update;
  if not found then
    raise exception 'Entry not found' using errcode = 'P0002';
  end if;
  if existing_entry.version <> p_expected_version then
    raise exception 'Version conflict: expected %, current %', p_expected_version, existing_entry.version
      using errcode = '40001';
  end if;

  select snapshot into version_snapshot
  from public.entry_versions
  where entry_id = p_entry_id and version = p_version;
  if version_snapshot is null then
    raise exception 'Version snapshot not found' using errcode = 'P0002';
  end if;

  insert into public.entry_versions (entry_id, version, snapshot, reason, created_by)
  values (
    p_entry_id,
    existing_entry.version,
    app_private.entry_snapshot(p_entry_id),
    format('before restoring version %s', p_version),
    auth.user_id()
  );

  snapshot_entry := version_snapshot -> 'entry';
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

  for snapshot_block in select value from jsonb_array_elements(version_snapshot -> 'blocks')
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

create or replace function public.register_uploaded_asset(
  p_bucket text,
  p_object_key text,
  p_public_url text,
  p_mime_type text,
  p_byte_size bigint,
  p_alt_text text default ''
)
returns public.assets
language plpgsql
security definer
set search_path = pg_catalog, public, auth
as $$
declare
  owner_id text;
  stored_asset public.assets%rowtype;
begin
  if not public.is_owner() then
    raise exception 'Owner access required' using errcode = '42501';
  end if;

  owner_id := auth.user_id();
  if p_bucket <> 'portfolio-assets'
     or p_object_key is null
     or not starts_with(p_object_key, owner_id || '/') then
    raise exception 'Invalid asset location' using errcode = '22023';
  end if;
  if p_mime_type not in ('image/avif', 'image/gif', 'image/jpeg', 'image/png', 'image/webp')
     or p_byte_size <= 0
     or p_byte_size > 10485760 then
    raise exception 'Invalid asset type or size' using errcode = '22023';
  end if;

  insert into public.assets (
    owner_id, bucket, object_key, public_url, mime_type, byte_size, alt_text
  ) values (
    owner_id, p_bucket, p_object_key, p_public_url, p_mime_type, p_byte_size,
    coalesce(p_alt_text, '')
  )
  returning * into stored_asset;

  return stored_asset;
end;
$$;

revoke all on function public.save_content_entry(uuid, integer, jsonb, jsonb, text)
  from public, anonymous;
revoke all on function public.soft_delete_content_entry(uuid, integer)
  from public, anonymous;
revoke all on function public.restore_content_entry_version(uuid, integer, integer)
  from public, anonymous;
revoke all on function public.register_uploaded_asset(text, text, text, text, bigint, text)
  from public, anonymous;
grant execute on function public.save_content_entry(uuid, integer, jsonb, jsonb, text)
  to authenticated;
grant execute on function public.soft_delete_content_entry(uuid, integer)
  to authenticated;
grant execute on function public.restore_content_entry_version(uuid, integer, integer)
  to authenticated;
grant execute on function public.register_uploaded_asset(text, text, text, text, bigint, text)
  to authenticated;
