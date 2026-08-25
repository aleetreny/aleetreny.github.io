-- Watering is a visible desk interaction. It should never be disabled merely
-- because the same visitor watered their plant a moment ago.
create or replace function public.garden_water(p_visitor text)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  row public.garden_plants;
begin
  select * into row from public.garden_plants where visitor = p_visitor and removed = false;
  if not found then
    return null;
  end if;
  update public.garden_plants
    set watered_at = now(), waterings = waterings + 1
    where id = row.id
    returning * into row;
  return to_jsonb(row) - 'visitor';
end;
$$;
