-- Durable generation runs: separate from discovery quota and Meta publication.
create table if not exists public.stadione_engine_runs (
 run_key text primary key, content_id uuid not null references public.stadione_content_items(id) on delete cascade,
 state text not null default 'RUNNING' check(state in ('RUNNING','COMPLETED','BLOCKED','FAILED')),
 stage text not null default 'ASSIGNMENT', detail jsonb not null default '{}',
 attempt integer not null default 1, lease_token uuid, leased_until timestamptz,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
alter table public.stadione_engine_runs enable row level security;
revoke all on public.stadione_engine_runs from public, anon, authenticated;
create or replace function public.claim_stadione_engine_run(p_key text,p_content_id uuid,p_lease uuid)
returns boolean language plpgsql security definer set search_path=public as $$
declare r public.stadione_engine_runs%rowtype;
begin
 perform pg_advisory_xact_lock(hashtext(p_content_id::text || ':engine'));
 if exists(select 1 from public.stadione_engine_runs where content_id=p_content_id and state='RUNNING' and leased_until>now()) then return false; end if;
 select * into r from public.stadione_engine_runs where run_key=p_key for update;
 if found and (r.state in ('COMPLETED','BLOCKED') or r.attempt>=3 or r.leased_until>now()) then return false; end if;
 insert into public.stadione_engine_runs(run_key,content_id,lease_token,leased_until)
 values(p_key,p_content_id,p_lease,now()+interval '15 minutes')
 on conflict(run_key) do update set state='RUNNING',attempt=stadione_engine_runs.attempt+1,lease_token=p_lease,leased_until=now()+interval '15 minutes',updated_at=now();
 return true;
end $$;
revoke all on function public.claim_stadione_engine_run(text,uuid,uuid) from public,anon,authenticated;
grant execute on function public.claim_stadione_engine_run(text,uuid,uuid) to service_role;
create index if not exists stadione_engine_content_idx on public.stadione_engine_runs(content_id,updated_at desc);
-- Avoid duplicate calendar entries under concurrent seeding (existing duplicates are not removed).
create unique index if not exists stadione_engine_plan_unique on public.stadione_content_items((editorial_meta->>'plan_key')) where editorial_meta->>'origin'='ENGINE_V2_PLAN';
notify pgrst,'reload schema';
