-- Supabase schema for places
create extension if not exists postgis;

create table if not exists public.places (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text not null,
  notes text,
  latitude double precision,
  longitude double precision,
  user_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists places_gix on public.places using gist (
  (case when latitude is null or longitude is null then null else ST_SetSRID(ST_MakePoint(longitude, latitude), 4326) end)
);

-- RLS
alter table public.places enable row level security;

drop policy if exists "places_select_all" on public.places;
create policy "places_select_all" on public.places for select using (true);

drop policy if exists "places_insert_auth" on public.places;
create policy "places_insert_auth" on public.places for insert with check (auth.uid() = user_id);

drop policy if exists "places_update_owner" on public.places;
create policy "places_update_owner" on public.places for update using (auth.uid() = user_id);

drop policy if exists "places_delete_owner" on public.places;
create policy "places_delete_owner" on public.places for delete using (auth.uid() = user_id);
