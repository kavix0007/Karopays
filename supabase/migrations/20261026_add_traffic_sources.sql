-- KaroPays additive traffic_sources migration. Creates a new table only; existing tables/data are untouched.
create table if not exists public.traffic_sources (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references public.profiles(id) on delete cascade,
  platform text not null check (length(platform) between 2 and 40),
  source_name text not null check (length(source_name) between 1 and 120),
  source_url text not null check (length(source_url) between 8 and 2048),
  notes text check (notes is null or length(notes) <= 300),
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  reviewed_at timestamptz,
  reviewed_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists traffic_sources_creator_created_idx on public.traffic_sources(creator_id, created_at desc);
alter table public.traffic_sources enable row level security;
drop policy if exists "Creators can view their own traffic sources" on public.traffic_sources;
create policy "Creators can view their own traffic sources" on public.traffic_sources for select to authenticated using (creator_id = auth.uid());
drop policy if exists "Creators can add their own traffic sources" on public.traffic_sources;
create policy "Creators can add their own traffic sources" on public.traffic_sources for insert to authenticated with check (creator_id = auth.uid() and status = 'pending' and reviewed_at is null and reviewed_by is null);
-- No creator UPDATE/DELETE policy is intentionally provided: creators cannot approve their own sources or alter review status.
-- Admin review should be implemented with a server-checked RPC restricted to public.admin_users; do not grant browser users direct review access.
