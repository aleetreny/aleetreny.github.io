-- The board's other half: what visitors leave behind.
--
-- Four things people can add to this board without an account — a note, a
-- plant, an answer to an open question, and one vote — and one rule that
-- shapes every policy below: an anonymous visitor may add their own row and
-- read nothing that identifies anybody else. The owner reads and moderates
-- everything, through the editor they already have.
--
-- Where a visitor genuinely needs to read something back — their own plant,
-- the state of the plot, the running tally of the vote — they go through a
-- `security definer` function that returns exactly that and nothing else,
-- rather than through a table grant that would have to be fenced in afterwards.

create extension if not exists pgcrypto;

do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'anonymous')
     or not exists (select 1 from pg_roles where rolname = 'authenticated') then
    raise exception 'Neon Data API roles are missing. Run `neon deploy` before migrations.';
  end if;

  if to_regprocedure('public.is_owner()') is null then
    raise exception 'public.is_owner() is missing. Apply 0002_data_api_permissions.sql first.';
  end if;
end;
$$;

-- ---------------------------------------------------------------- notes

create table if not exists public.visitor_notes (
  id uuid primary key default gen_random_uuid(),
  body text not null,
  lang text not null default '',
  visitor text not null default '',
  hidden boolean not null default false,
  created_at timestamptz not null default now(),
  constraint visitor_notes_body_length check (char_length(body) between 1 and 600),
  constraint visitor_notes_lang_format check (lang ~ '^[a-z]{0,8}$'),
  constraint visitor_notes_visitor_length check (char_length(visitor) <= 64)
);

create index if not exists visitor_notes_recent_idx on public.visitor_notes (created_at desc);

-- ---------------------------------------------------------------- the garden

create table if not exists public.garden_plants (
  id uuid primary key default gen_random_uuid(),
  visitor text not null unique,
  species text not null,
  planted_at timestamptz not null default now(),
  watered_at timestamptz not null default now(),
  waterings integer not null default 0,
  removed boolean not null default false,
  constraint garden_species_format check (species ~ '^[a-z][a-z0-9-]{0,31}$'),
  constraint garden_visitor_length check (char_length(visitor) between 4 and 64),
  constraint garden_waterings_sane check (waterings between 0 and 100000)
);

-- Everything a visitor is allowed to know about the plot: what is growing and
-- since when. Never who planted it.
create or replace function public.garden_plot()
returns jsonb
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', id,
    'species', species,
    'plantedAt', planted_at,
    'wateredAt', watered_at,
    'waterings', waterings
  ) order by planted_at), '[]'::jsonb)
  from public.garden_plants
  where removed = false;
$$;

-- One plant per visitor, decided here rather than hoped for in the client.
-- Planting again is a no-op that returns what they already have.
create or replace function public.garden_plant(p_visitor text, p_species text)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  row public.garden_plants;
begin
  if char_length(p_visitor) < 4 or char_length(p_visitor) > 64 then
    raise exception 'bad visitor';
  end if;
  if p_species !~ '^[a-z][a-z0-9-]{0,31}$' then
    raise exception 'bad species';
  end if;

  select * into row from public.garden_plants where visitor = p_visitor and removed = false;
  if found then
    return to_jsonb(row) - 'visitor';
  end if;

  insert into public.garden_plants (visitor, species)
  values (p_visitor, p_species)
  on conflict (visitor) do update
    set species = excluded.species, planted_at = now(), watered_at = now(), waterings = 0, removed = false
  returning * into row;
  return to_jsonb(row) - 'visitor';
end;
$$;

-- Watering is rate limited in the database, not in the browser: at most once
-- every four hours, whatever the visitor's console says.
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
  if row.watered_at > now() - interval '4 hours' then
    return to_jsonb(row) - 'visitor';
  end if;
  update public.garden_plants
    set watered_at = now(), waterings = waterings + 1
    where id = row.id
    returning * into row;
  return to_jsonb(row) - 'visitor';
end;
$$;

create or replace function public.garden_mine(p_visitor text)
returns jsonb
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select to_jsonb(p) - 'visitor'
  from public.garden_plants p
  where p.visitor = p_visitor and p.removed = false;
$$;

-- ---------------------------------------------------------------- curiosity

create table if not exists public.curiosity_questions (
  id uuid primary key default gen_random_uuid(),
  prompt jsonb not null,
  active boolean not null default true,
  position integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.curiosity_answers (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.curiosity_questions (id) on delete cascade,
  body text not null,
  lang text not null default '',
  visitor text not null default '',
  hidden boolean not null default false,
  created_at timestamptz not null default now(),
  constraint curiosity_body_length check (char_length(body) between 1 and 1200),
  constraint curiosity_visitor_length check (char_length(visitor) <= 64)
);

create index if not exists curiosity_answers_question_idx
  on public.curiosity_answers (question_id, created_at desc);

-- ---------------------------------------------------------------- the vote

create table if not exists public.world_votes (
  id uuid primary key default gen_random_uuid(),
  visitor text not null unique,
  choice text not null,
  created_at timestamptz not null default now(),
  constraint world_votes_choice check (choice in ('cooperate', 'betray')),
  constraint world_votes_visitor_length check (char_length(visitor) between 4 and 64)
);

create index if not exists world_votes_recent_idx on public.world_votes (created_at desc);

-- Counts, and only counts. A visitor learns what everybody chose without ever
-- being handed a list of who chose it.
create or replace function public.world_vote_tally()
returns jsonb
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select jsonb_build_object(
    'cooperate', count(*) filter (where choice = 'cooperate'),
    'betray', count(*) filter (where choice = 'betray')
  )
  from public.world_votes;
$$;

-- Cast once. Voting again returns the standing tally and changes nothing, which
-- is the honest behaviour for an experiment with no accounts behind it.
create or replace function public.world_vote(p_visitor text, p_choice text)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
begin
  if p_choice not in ('cooperate', 'betray') then
    raise exception 'bad choice';
  end if;
  if char_length(p_visitor) < 4 or char_length(p_visitor) > 64 then
    raise exception 'bad visitor';
  end if;
  insert into public.world_votes (visitor, choice)
  values (p_visitor, p_choice)
  on conflict (visitor) do nothing;
  return public.world_vote_tally();
end;
$$;

-- ---------------------------------------------------------------- permissions

revoke all on function
  public.garden_plot(),
  public.garden_plant(text, text),
  public.garden_water(text),
  public.garden_mine(text),
  public.world_vote_tally(),
  public.world_vote(text, text)
  from public;

grant execute on function
  public.garden_plot(),
  public.garden_plant(text, text),
  public.garden_water(text),
  public.garden_mine(text),
  public.world_vote_tally(),
  public.world_vote(text, text)
  to anonymous, authenticated;

-- Anonymous adds; it never reads a table directly.
grant select on public.curiosity_questions to anonymous, authenticated;
grant insert on public.visitor_notes, public.curiosity_answers to anonymous, authenticated;
grant select, insert, update, delete on
  public.visitor_notes,
  public.garden_plants,
  public.curiosity_questions,
  public.curiosity_answers,
  public.world_votes
  to authenticated;

alter table public.visitor_notes enable row level security;
alter table public.garden_plants enable row level security;
alter table public.curiosity_questions enable row level security;
alter table public.curiosity_answers enable row level security;
alter table public.world_votes enable row level security;

-- Notes: write-only for a visitor, everything for the owner.
drop policy if exists visitor_notes_anon_write on public.visitor_notes;
create policy visitor_notes_anon_write
on public.visitor_notes for insert to anonymous, authenticated
with check (char_length(body) between 1 and 600 and hidden = false);

drop policy if exists visitor_notes_owner_all on public.visitor_notes;
create policy visitor_notes_owner_all
on public.visitor_notes for all to authenticated
using (public.is_owner()) with check (public.is_owner());

-- The garden is reached only through the functions above, so the table itself
-- answers to the owner and to nobody else.
drop policy if exists garden_owner_all on public.garden_plants;
create policy garden_owner_all
on public.garden_plants for all to authenticated
using (public.is_owner()) with check (public.is_owner());

-- Questions: anyone reads the live ones, the owner writes them.
drop policy if exists curiosity_questions_read on public.curiosity_questions;
create policy curiosity_questions_read
on public.curiosity_questions for select to anonymous, authenticated
using (active = true or public.is_owner());

drop policy if exists curiosity_questions_owner_all on public.curiosity_questions;
create policy curiosity_questions_owner_all
on public.curiosity_questions for all to authenticated
using (public.is_owner()) with check (public.is_owner());

-- Answers: the same shape as the notes.
drop policy if exists curiosity_answers_anon_write on public.curiosity_answers;
create policy curiosity_answers_anon_write
on public.curiosity_answers for insert to anonymous, authenticated
with check (char_length(body) between 1 and 1200 and hidden = false);

drop policy if exists curiosity_answers_owner_all on public.curiosity_answers;
create policy curiosity_answers_owner_all
on public.curiosity_answers for all to authenticated
using (public.is_owner()) with check (public.is_owner());

-- The vote: cast through the function, counted through the function, listed by
-- the owner alone.
drop policy if exists world_votes_owner_all on public.world_votes;
create policy world_votes_owner_all
on public.world_votes for all to authenticated
using (public.is_owner()) with check (public.is_owner());
