begin;
do $$
declare v_id uuid:=gen_random_uuid(); v_token uuid:=gen_random_uuid();
begin
 if has_table_privilege('anon','public.stadione_social_mirrors','SELECT') then raise exception 'anon mirror access'; end if;
 if has_function_privilege('authenticated','public.claim_stadione_social_mirror(uuid,text,uuid,text)','EXECUTE') then raise exception 'authenticated worker rpc access'; end if;
 insert into public.stadione_content_items(id,kind,format,title,status,published_at,external_post_id,editorial_meta,platforms) values(v_id,'SOCIAL','CAROUSEL','QA rollback social mirror','PUBLISHED',now(),'qa-original-instagram','{}',array['INSTAGRAM']);
 update public.stadione_social_mirror_settings set started_at=now()-interval '1 minute',enabled=true where platform='FACEBOOK';
 if not public.claim_stadione_social_mirror(v_id,'FACEBOOK',v_token,'qa-digest') then raise exception 'eligible new claim failed'; end if;
 if public.claim_stadione_social_mirror(v_id,'FACEBOOK',gen_random_uuid(),'qa-digest') then raise exception 'parallel claim allowed'; end if;
 if public.claim_stadione_content_management(v_id,gen_random_uuid()) then raise exception 'management during mirror allowed'; end if;
 if public.mark_stadione_mirror_publishing(v_id,'FACEBOOK',gen_random_uuid()) then raise exception 'wrong token publish allowed'; end if;
 if not public.mark_stadione_mirror_publishing(v_id,'FACEBOOK',v_token) then raise exception 'valid mark failed'; end if;
 update public.stadione_social_mirrors set leased_until=null,lease_token=null where content_id=v_id;
 if public.claim_stadione_social_mirror(v_id,'FACEBOOK',gen_random_uuid(),'qa-digest') then raise exception 'PUBLISHING replay allowed'; end if;
 if public.claim_stadione_content_management(v_id,gen_random_uuid()) then raise exception 'management during publish allowed'; end if;
 update public.stadione_social_mirrors set state='PUBLISHED' where content_id=v_id;
 if public.claim_stadione_social_mirror(v_id,'FACEBOOK',gen_random_uuid(),'qa-digest') then raise exception 'published replay allowed'; end if;
 if not public.claim_stadione_content_management(v_id,gen_random_uuid()) then raise exception 'normal published management blocked'; end if;
 update public.stadione_content_items set status='ARCHIVED',editorial_meta='{}' where id=v_id;
 update public.stadione_social_mirrors set state='CREATED' where content_id=v_id;
 if public.claim_stadione_social_mirror(v_id,'FACEBOOK',gen_random_uuid(),'qa-digest') then raise exception 'archive mirror allowed'; end if;
 update public.stadione_content_items set status='PUBLISHED',editorial_meta=jsonb_build_object('cms_deleted_at',now()) where id=v_id;
 if public.claim_stadione_social_mirror(v_id,'FACEBOOK',gen_random_uuid(),'qa-digest') then raise exception 'tombstone mirror allowed'; end if;
 update public.stadione_content_items set editorial_meta='{}',published_at=now()-interval '1 year' where id=v_id;
 if public.claim_stadione_social_mirror(v_id,'FACEBOOK',gen_random_uuid(),'qa-digest') then raise exception 'historical mirror allowed'; end if;
 raise notice 'SQL mirror tests passed: RLS/grants, cutoff, one lease, mark CAS, terminal no replay, concurrent management, archive/tombstone.';
end $$;
rollback;
