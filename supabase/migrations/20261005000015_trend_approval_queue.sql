begin;
create table if not exists public.stadione_trend_decisions (
  id uuid primary key default gen_random_uuid(),
  candidate_id text not null,
  candidate jsonb not null,
  decision text not null check (decision in ('FEED','REEL','BOTH','REJECT')),
  source_url text,
  actor_id uuid,
  decided_at timestamptz not null default now()
);
create index if not exists stadione_trend_decisions_candidate_idx on public.stadione_trend_decisions(candidate_id,decided_at desc);
alter table public.stadione_trend_decisions enable row level security;
revoke all on public.stadione_trend_decisions from public,anon,authenticated;
notify pgrst,'reload schema';
commit;
