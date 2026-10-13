-- Facebook mirrors have their own durable ledger; existing content/IG attempts are untouched.
begin;
create table if not exists public.stadione_social_mirror_settings (
 platform text primary key check (platform='FACEBOOK'),
 enabled boolean not null default true,
 started_at timestamptz not null default now()
);
insert into public.stadione_social_mirror_settings(platform) values('FACEBOOK') on conflict do nothing;
create table if not exists public.stadione_social_mirrors (
 content_id uuid not null references public.stadione_content_items(id) on delete cascade,
 platform text not null check(platform='FACEBOOK'),
 state text not null default 'CREATED' check(state in ('CREATED','UPLOADING','READY','PUBLISHING','FINALIZING','PUBLISHED','FAILED','UNCERTAIN','DELETING','DELETED','REMOVAL_FAILED','REMOVAL_UNCERTAIN')),
 payload_digest text not null,
 content_updated_at timestamptz not null,
 page_id text,
 child_ids text[] not null default '{}',
 creation_id text,
 external_id text,
 external_url text,
 error_message text,
 lease_token uuid,
 leased_until timestamptz,
 published_at timestamptz,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 primary key(content_id,platform)
);
create index if not exists stadione_social_mirrors_state_idx on public.stadione_social_mirrors(platform,state);
create index if not exists stadione_social_published_idx on public.stadione_content_items(published_at) where kind='SOCIAL' and status='PUBLISHED';
alter table public.stadione_social_mirrors enable row level security;
alter table public.stadione_social_mirror_settings enable row level security;
revoke all on public.stadione_social_mirrors,public.stadione_social_mirror_settings from anon,authenticated;
grant select on public.stadione_social_mirrors,public.stadione_social_mirror_settings to authenticated;
grant all on public.stadione_social_mirrors,public.stadione_social_mirror_settings to service_role;
drop policy if exists "admins read mirrors" on public.stadione_social_mirrors;
create policy "admins read mirrors" on public.stadione_social_mirrors for select to authenticated using(exists(select 1 from public.venue_roles vr where vr.user_id=auth.uid() and vr.role='platform_admin'));
drop policy if exists "admins read mirror settings" on public.stadione_social_mirror_settings;
create policy "admins read mirror settings" on public.stadione_social_mirror_settings for select to authenticated using(exists(select 1 from public.venue_roles vr where vr.user_id=auth.uid() and vr.role='platform_admin'));
create or replace function public.list_stadione_mirror_due(p_platform text,p_limit integer default 1)
returns table(content_id uuid) language sql security definer set search_path=public,pg_temp as $$
 select i.id from public.stadione_content_items i
 join public.stadione_social_mirror_settings s on s.platform=p_platform and s.enabled
 left join public.stadione_social_mirrors m on m.content_id=i.id and m.platform=p_platform
 where i.kind='SOCIAL' and i.status='PUBLISHED' and i.published_at>=s.started_at
 and i.external_post_id is not null and i.platforms @> array['INSTAGRAM']::text[]
 and i.archived_at is null and i.editorial_meta->>'cms_deleted_at' is null
 and coalesce(i.editorial_meta->>'mirror_disabled','false')<>'true'
 and (m.content_id is null or (m.state in ('CREATED','UPLOADING','READY','FINALIZING') and coalesce(m.leased_until,'epoch'::timestamptz)<=now()))
 order by i.published_at,i.id limit least(greatest(p_limit,1),3)
$$;
create or replace function public.claim_stadione_social_mirror(p_content_id uuid,p_platform text,p_token uuid,p_digest text)
returns boolean language plpgsql security definer set search_path=public,pg_temp as $$
declare i public.stadione_content_items; s public.stadione_social_mirror_settings; m public.stadione_social_mirrors;
begin
 select * into i from public.stadione_content_items where id=p_content_id for update;
 select * into s from public.stadione_social_mirror_settings where platform=p_platform;
 if not found or not s.enabled or i.id is null or i.kind<>'SOCIAL' or i.status<>'PUBLISHED' or i.published_at is null or i.published_at<s.started_at or i.external_post_id is null or not(i.platforms @> array['INSTAGRAM']::text[]) or i.archived_at is not null or i.editorial_meta->>'cms_deleted_at' is not null or coalesce(i.editorial_meta->>'mirror_disabled','false')='true' then return false; end if;
 if coalesce((i.editorial_meta->'management_lease'->>'until')::timestamptz,'epoch')>now() then return false; end if;
 insert into public.stadione_social_mirrors(content_id,platform,payload_digest,content_updated_at) values(i.id,p_platform,p_digest,i.updated_at) on conflict do nothing;
 select * into m from public.stadione_social_mirrors where content_id=i.id and platform=p_platform for update;
 if m.state not in ('CREATED','UPLOADING','READY','FINALIZING') or coalesce(m.leased_until,'epoch')>now() or m.payload_digest<>p_digest then return false; end if;
 update public.stadione_social_mirrors set lease_token=p_token,leased_until=now()+interval '90 seconds',updated_at=now() where content_id=i.id and platform=p_platform;
 return true;
end $$;
create or replace function public.mark_stadione_mirror_publishing(p_content_id uuid,p_platform text,p_token uuid)
returns boolean language plpgsql security definer set search_path=public,pg_temp as $$
declare i public.stadione_content_items; m public.stadione_social_mirrors;
begin
 select * into i from public.stadione_content_items where id=p_content_id for update;
 select * into m from public.stadione_social_mirrors where content_id=p_content_id and platform=p_platform for update;
 if not found or m.lease_token is distinct from p_token or m.state not in ('CREATED','UPLOADING','READY') or i.id is null or i.status<>'PUBLISHED' or i.archived_at is not null or i.editorial_meta->>'cms_deleted_at' is not null or i.updated_at<>m.content_updated_at or coalesce((i.editorial_meta->'management_lease'->>'until')::timestamptz,'epoch')>now() then return false; end if;
 if not exists(select 1 from public.stadione_social_mirror_settings s where s.platform=p_platform and s.enabled and i.published_at>=s.started_at) then return false; end if;
 update public.stadione_social_mirrors set state='PUBLISHING',leased_until=now()+interval '90 seconds',updated_at=now() where content_id=p_content_id and platform=p_platform;
 return true;
end $$;
revoke all on function public.list_stadione_mirror_due(text,integer),public.claim_stadione_social_mirror(uuid,text,uuid,text),public.mark_stadione_mirror_publishing(uuid,text,uuid) from public,anon,authenticated;
grant execute on function public.list_stadione_mirror_due(text,integer),public.claim_stadione_social_mirror(uuid,text,uuid,text),public.mark_stadione_mirror_publishing(uuid,text,uuid) to service_role;
create or replace function public.claim_stadione_content_management(p_content_id uuid,p_token uuid)
returns boolean language plpgsql security definer set search_path=public as $$
declare v_item public.stadione_content_items%rowtype;
begin
 perform pg_advisory_xact_lock(hashtext(p_content_id::text));
 select * into v_item from public.stadione_content_items where id=p_content_id for update;
 if not found or v_item.status in ('SCHEDULED','PUBLISHING') then return false; end if;
 if coalesce((v_item.editorial_meta->'management_lease'->>'until')::timestamptz,'-infinity')>now() then return false; end if;
 if exists(select 1 from public.stadione_ig_publish_attempts where content_id=p_content_id and (state in ('PREPARING','PROCESSING','READY','PUBLISHING','UNCERTAIN') or (state<>'PUBLISHED' and leased_until>now()))) then return false; end if;
 if exists(select 1 from public.stadione_social_mirrors where content_id=p_content_id and (state in ('PUBLISHING','FINALIZING','DELETING') or leased_until>now())) then return false; end if;
 update public.stadione_content_items set editorial_meta=coalesce(editorial_meta,'{}'::jsonb)||jsonb_build_object('management_lease',jsonb_build_object('token',p_token,'until',now()+interval '90 seconds')) where id=p_content_id;
 return true;
end $$;

notify pgrst,'reload schema';
commit;
