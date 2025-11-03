-- Supabase schema for groups (events)
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
