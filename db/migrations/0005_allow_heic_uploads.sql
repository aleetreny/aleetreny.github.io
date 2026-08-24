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
  if p_mime_type not in (
    'image/avif', 'image/gif', 'image/heic', 'image/heic-sequence',
    'image/heif', 'image/heif-sequence', 'image/jpeg', 'image/png', 'image/webp'
  ) or p_byte_size <= 0 or p_byte_size > 10485760 then
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

revoke all on function public.register_uploaded_asset(text, text, text, text, bigint, text)
  from public, anonymous;
grant execute on function public.register_uploaded_asset(text, text, text, text, bigint, text)
  to authenticated;
