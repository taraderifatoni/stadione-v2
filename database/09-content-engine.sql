-- Stadione editorial and social content engine.
-- Tables are namespaced because Stadione shares infrastructure with other products.

create extension if not exists pgcrypto;

create table if not exists public.stadione_content_items (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid references public.stadione_content_items(id) on delete set null,
  kind text not null check (kind in ('ARTICLE','SOCIAL')),
  format text not null check (format in ('ARTICLE','CAROUSEL','REEL','SINGLE_IMAGE','STORY','VIDEO')),
  title text not null,
  slug text unique,
  excerpt text,
  body text,
  caption text,
  hashtags text[] not null default '{}',
  platforms text[] not null default '{}',
  category text,
  status text not null default 'DRAFT' check (status in ('DRAFT','PENDING_REVIEW','SCHEDULED','PUBLISHED','REJECTED','ARCHIVED')),
  source_url text,
  source_name text,
  source_snapshot jsonb not null default '{}'::jsonb,
  assets jsonb not null default '[]'::jsonb,
  editorial_meta jsonb not null default '{}'::jsonb,
  scheduled_at timestamptz,
  published_at timestamptz,
  archived_at timestamptz,
  external_post_id text,
  external_url text,
  publish_error text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_stadione_content_status_updated on public.stadione_content_items(status, updated_at desc);
create index if not exists idx_stadione_content_kind_updated on public.stadione_content_items(kind, updated_at desc);
create index if not exists idx_stadione_content_schedule on public.stadione_content_items(scheduled_at) where status = 'SCHEDULED';
create index if not exists idx_stadione_content_parent on public.stadione_content_items(parent_id);

create table if not exists public.stadione_content_activity (
  id uuid primary key default gen_random_uuid(),
  content_id uuid not null references public.stadione_content_items(id) on delete cascade,
  action text not null,
  from_status text,
  to_status text,
  actor_id uuid references auth.users(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_stadione_content_activity_created on public.stadione_content_activity(created_at desc);

create table if not exists public.stadione_trend_snapshots (
  id uuid primary key default gen_random_uuid(),
  cache_key text not null unique,
  engine text not null,
  query text,
  payload jsonb not null default '{}'::jsonb,
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_stadione_trend_expiry on public.stadione_trend_snapshots(expires_at desc);

create table if not exists public.stadione_editorial_runs (
  id uuid primary key default gen_random_uuid(),
  run_date date not null,
  status text not null check (status in ('RUNNING','COMPLETED','FAILED')),
  pool jsonb not null default '{}'::jsonb,
  error_message text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create index if not exists idx_stadione_editorial_runs_date on public.stadione_editorial_runs(run_date desc, created_at desc);

create table if not exists public.stadione_api_usage (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  engine text not null,
  request_key text,
  success boolean not null default false,
  status_code integer,
  duration_ms integer,
  error_message text,
  created_at timestamptz not null default now()
);

create index if not exists idx_stadione_api_usage_month on public.stadione_api_usage(provider, created_at desc);

create or replace function public.touch_stadione_content_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_stadione_content_updated on public.stadione_content_items;
create trigger trg_stadione_content_updated before update on public.stadione_content_items
for each row execute function public.touch_stadione_content_updated_at();

drop trigger if exists trg_stadione_trend_updated on public.stadione_trend_snapshots;
create trigger trg_stadione_trend_updated before update on public.stadione_trend_snapshots
for each row execute function public.touch_stadione_content_updated_at();

alter table public.stadione_content_items enable row level security;
alter table public.stadione_content_activity enable row level security;
alter table public.stadione_trend_snapshots enable row level security;
alter table public.stadione_editorial_runs enable row level security;
alter table public.stadione_api_usage enable row level security;

drop policy if exists "platform admins manage stadione content" on public.stadione_content_items;
create policy "platform admins manage stadione content" on public.stadione_content_items for all to authenticated
using (exists (select 1 from public.venue_roles vr where vr.user_id = auth.uid() and vr.role = 'platform_admin'))
with check (exists (select 1 from public.venue_roles vr where vr.user_id = auth.uid() and vr.role = 'platform_admin'));

drop policy if exists "platform admins manage stadione activity" on public.stadione_content_activity;
create policy "platform admins manage stadione activity" on public.stadione_content_activity for all to authenticated
using (exists (select 1 from public.venue_roles vr where vr.user_id = auth.uid() and vr.role = 'platform_admin'))
with check (exists (select 1 from public.venue_roles vr where vr.user_id = auth.uid() and vr.role = 'platform_admin'));

drop policy if exists "platform admins read stadione trends" on public.stadione_trend_snapshots;
create policy "platform admins read stadione trends" on public.stadione_trend_snapshots for select to authenticated
using (exists (select 1 from public.venue_roles vr where vr.user_id = auth.uid() and vr.role = 'platform_admin'));

drop policy if exists "platform admins read stadione runs" on public.stadione_editorial_runs;
create policy "platform admins read stadione runs" on public.stadione_editorial_runs for select to authenticated
using (exists (select 1 from public.venue_roles vr where vr.user_id = auth.uid() and vr.role = 'platform_admin'));

drop policy if exists "platform admins read stadione api usage" on public.stadione_api_usage;
create policy "platform admins read stadione api usage" on public.stadione_api_usage for select to authenticated
using (exists (select 1 from public.venue_roles vr where vr.user_id = auth.uid() and vr.role = 'platform_admin'));

drop policy if exists "public reads published stadione articles" on public.stadione_content_items;
create policy "public reads published stadione articles" on public.stadione_content_items for select to anon
using (kind = 'ARTICLE' and status = 'PUBLISHED' and published_at is not null);

notify pgrst, 'reload schema';
