-- One durable Instagram publication per CMS item. A publish call is never retried once sent.
create table if not exists public.stadione_ig_publish_attempts (
  content_id uuid primary key references public.stadione_content_items(id) on delete cascade,
  state text not null default 'PREPARING' check (state in ('PREPARING','PROCESSING','READY','PUBLISHING','PUBLISHED','FAILED','UNCERTAIN')),
  child_ids text[] not null default '{}',
  creation_id text,
  media_id text,
  error_message text,
  lease_token uuid,
  leased_until timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.stadione_ig_publish_attempts enable row level security;
revoke all on public.stadione_ig_publish_attempts from public, anon, authenticated;

-- A serialised lease prevents simultaneous requests from creating/publishing twice.
create or replace function public.claim_stadione_ig_publish(p_content_id uuid, p_token uuid)
returns boolean language plpgsql security definer set search_path = public as $$
declare v_attempt public.stadione_ig_publish_attempts%rowtype;
begin
  perform pg_advisory_xact_lock(hashtext(p_content_id::text));
  insert into public.stadione_ig_publish_attempts(content_id) values (p_content_id)
    on conflict (content_id) do nothing;
  select * into v_attempt from public.stadione_ig_publish_attempts where content_id = p_content_id for update;
  if v_attempt.state in ('PUBLISHING','PUBLISHED','UNCERTAIN') or
    (v_attempt.leased_until > now() and v_attempt.lease_token is distinct from p_token) then
    return false;
  end if;
  update public.stadione_ig_publish_attempts set lease_token=p_token,
    leased_until=now() + interval '90 seconds', updated_at=now()
    where content_id=p_content_id;
  return true;
end;
$$;
revoke all on function public.claim_stadione_ig_publish(uuid, uuid) from public, anon, authenticated;
grant execute on function public.claim_stadione_ig_publish(uuid, uuid) to service_role;

-- Reel source files are hosted in the public CMS bucket for Meta to fetch.
update storage.buckets set file_size_limit = 52428800,
  allowed_mime_types = array['image/jpeg','image/png','image/webp','video/mp4']
  where id = 'stadione-cms';
