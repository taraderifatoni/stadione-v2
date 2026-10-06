-- Separate cache: insight refresh never changes the story, approval digest or schedule.
create table if not exists public.stadione_content_insights (
  content_id uuid primary key references public.stadione_content_items(id) on delete cascade,
  media_id text not null,
  format text not null,
  published_at timestamptz,
  metrics jsonb not null default '{}',
  unavailable text[] not null default '{}',
  permalink text,
  fetched_at timestamptz,
  last_attempt_at timestamptz not null default now(),
  last_error text
);
alter table public.stadione_content_insights enable row level security;
revoke all on public.stadione_content_insights from public, anon, authenticated;
grant all on public.stadione_content_insights to service_role;

-- Management and publisher share the existing advisory lock. Published attempts
-- are historical records, not an active publishing lock.
create or replace function public.claim_stadione_content_management(p_content_id uuid, p_token uuid)
returns boolean language plpgsql security definer set search_path=public as $$
declare v_item public.stadione_content_items%rowtype;
begin
  perform pg_advisory_xact_lock(hashtext(p_content_id::text));
  select * into v_item from public.stadione_content_items where id=p_content_id for update;
  if not found or v_item.status in ('SCHEDULED','PUBLISHING') then return false; end if;
  if coalesce((v_item.editorial_meta->'management_lease'->>'until')::timestamptz, '-infinity') > now() then return false; end if;
  if exists(select 1 from public.stadione_ig_publish_attempts where content_id=p_content_id and
    (state in ('PREPARING','PROCESSING','READY','PUBLISHING','UNCERTAIN') or (state<>'PUBLISHED' and leased_until>now()))) then return false; end if;
  update public.stadione_content_items set editorial_meta=coalesce(editorial_meta,'{}'::jsonb)||jsonb_build_object(
    'management_lease',jsonb_build_object('token',p_token,'until',now()+interval '90 seconds')) where id=p_content_id;
  return true;
end;
$$;
revoke all on function public.claim_stadione_content_management(uuid,uuid) from public,anon,authenticated;
grant execute on function public.claim_stadione_content_management(uuid,uuid) to service_role;

create or replace function public.claim_stadione_ig_publish(p_content_id uuid, p_token uuid)
returns boolean language plpgsql security definer set search_path = public as $$
declare v_attempt public.stadione_ig_publish_attempts%rowtype; v_item public.stadione_content_items%rowtype;
begin
  perform pg_advisory_xact_lock(hashtext(p_content_id::text));
  select * into v_item from public.stadione_content_items where id=p_content_id for update;
  if not found or v_item.status not in ('DRAFT','PENDING_REVIEW','SCHEDULED') or
    v_item.editorial_meta->>'cms_deleted_at' is not null or
    coalesce((v_item.editorial_meta->'management_lease'->>'until')::timestamptz,'-infinity')>now() then return false; end if;
  insert into public.stadione_ig_publish_attempts(content_id) values(p_content_id) on conflict(content_id) do nothing;
  select * into v_attempt from public.stadione_ig_publish_attempts where content_id=p_content_id for update;
  if v_attempt.state in ('PUBLISHING','PUBLISHED','UNCERTAIN') or
    (v_attempt.leased_until>now() and v_attempt.lease_token is distinct from p_token) then return false; end if;
  update public.stadione_ig_publish_attempts set lease_token=p_token,leased_until=now()+interval '90 seconds',updated_at=now() where content_id=p_content_id;
  return true;
end;
$$;
revoke all on function public.claim_stadione_ig_publish(uuid,uuid) from public,anon,authenticated;
grant execute on function public.claim_stadione_ig_publish(uuid,uuid) to service_role;

notify pgrst, 'reload schema';
