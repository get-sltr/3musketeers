-- Migration: create/patch places & groups with RLS and FKs
create extension if not exists postgis;

-- places
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

alter table public.places enable row level security;
drop policy if exists "places_select_all" on public.places;
create policy "places_select_all" on public.places for select using (true);
drop policy if exists "places_insert_auth" on public.places;
create policy "places_insert_auth" on public.places for insert with check (auth.uid() = user_id);
drop policy if exists "places_update_owner" on public.places;
create policy "places_update_owner" on public.places for update using (auth.uid() = user_id);
drop policy if exists "places_delete_owner" on public.places;
create policy "places_delete_owner" on public.places for delete using (auth.uid() = user_id);

-- ensure FK exists (idempotent)
alter table public.places add column if not exists user_id uuid;
alter table public.places drop constraint if exists places_user_id_fkey;
alter table public.places add constraint places_user_id_fkey foreign key (user_id) references auth.users(id) on delete set null;

-- groups
create table if not exists public.groups (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  time timestamptz,
  description text,
  host_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.groups enable row level security;
drop policy if exists "groups_select_all" on public.groups;
create policy "groups_select_all" on public.groups for select using (true);
drop policy if exists "groups_insert_auth" on public.groups;
create policy "groups_insert_auth" on public.groups for insert with check (auth.uid() = host_id);
drop policy if exists "groups_update_owner" on public.groups;
create policy "groups_update_owner" on public.groups for update using (auth.uid() = host_id);
drop policy if exists "groups_delete_owner" on public.groups;
create policy "groups_delete_owner" on public.groups for delete using (auth.uid() = host_id);

-- ensure FK exists (idempotent)
alter table public.groups add column if not exists host_id uuid;
alter table public.groups drop constraint if exists groups_host_id_fkey;
alter table public.groups add constraint groups_host_id_fkey foreign key (host_id) references auth.users(id) on delete set null;
