-- Move only the black hole; keep every owner-edited object and its order intact.
update public.site_settings as settings
set value = (
  select jsonb_agg(
    case
      when object->>'id' = 'blackhole'
        then object || '{"x":2324,"y":1090,"scale":1.4}'::jsonb
      else object
    end
    order by ordinal
  )
  from jsonb_array_elements(settings.value) with ordinality as objects(object, ordinal)
),
updated_at = now()
where settings.key = 'board.objects'
  and jsonb_typeof(settings.value) = 'array'
  and settings.value @> '[{"id":"blackhole"}]'::jsonb;
