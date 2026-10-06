-- Run inside BEGIN/ROLLBACK after the insights migration. No fixtures persist.
do $$
declare v_id uuid:=gen_random_uuid(); v_token uuid:=gen_random_uuid();
begin
  if has_table_privilege('anon','public.stadione_content_insights','SELECT') then raise exception 'anon insights access'; end if;
  if not has_table_privilege('service_role','public.stadione_content_insights','SELECT') then raise exception 'service role missing'; end if;
  insert into public.stadione_content_items(id,kind,format,title,status,editorial_meta,platforms)
    values(v_id,'SOCIAL','CAROUSEL','QA rollback management assertions','PUBLISHED','{}',array['INSTAGRAM']);
  insert into public.stadione_ig_publish_attempts(content_id,state,media_id,leased_until) values(v_id,'PUBLISHED','qa-not-a-real-media',now()+interval '1 hour');
  if not public.claim_stadione_content_management(v_id,v_token) then raise exception 'published attempt blocked management'; end if;
  if public.claim_stadione_content_management(v_id,gen_random_uuid()) then raise exception 'parallel management allowed'; end if;
  update public.stadione_content_items set editorial_meta='{}',status='ARCHIVED' where id=v_id;
  if public.claim_stadione_ig_publish(v_id,gen_random_uuid()) then raise exception 'archived republish allowed'; end if;
  update public.stadione_content_items set status='SCHEDULED' where id=v_id;
  if public.claim_stadione_content_management(v_id,gen_random_uuid()) then raise exception 'scheduled management allowed'; end if;
  update public.stadione_content_items set status='DRAFT' where id=v_id;
  delete from public.stadione_ig_publish_attempts where content_id=v_id;
  if not public.claim_stadione_ig_publish(v_id,gen_random_uuid()) then raise exception 'normal publisher lease failed'; end if;
  if public.claim_stadione_content_management(v_id,gen_random_uuid()) then raise exception 'active publisher management allowed'; end if;
  update public.stadione_ig_publish_attempts set state='PUBLISHED',leased_until=null where content_id=v_id;
  update public.stadione_content_items set editorial_meta=jsonb_build_object('cms_deleted_at',now()) where id=v_id;
  if public.claim_stadione_ig_publish(v_id,gen_random_uuid()) then raise exception 'tombstone republish allowed'; end if;
  raise notice 'SQL assertions passed: RLS grants, published management, concurrent management, archive/tombstone no republish, scheduled/active publisher block, normal publisher';
end;
$$;
