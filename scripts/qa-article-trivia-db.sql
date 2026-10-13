-- Run inside a transaction after migration; rollback all fixtures.
do $$
declare
 u uuid='00000000-0000-4000-9000-000000001211';v uuid='00000000-0000-4000-9000-000000001212';
 a uuid='00000000-0000-4000-9000-000000001213';s uuid;bad uuid;r jsonb;i integer;
begin
 if exists(select 1 from auth.users where id in(u,v)) or exists(select 1 from public.stadione_content_items where id=a) then raise exception 'Fixture collision';end if;
 if has_function_privilege('anon','public.answer_stadione_article_trivia(uuid,uuid,text,integer,text)','execute') or has_function_privilege('authenticated','public.issue_stadione_trivia_session(uuid,uuid)','execute') then raise exception 'Public scoring RPC exposed';end if;
 if has_table_privilege('anon','public.stadione_article_quizzes','select') or has_table_privilege('authenticated','public.stadione_reader_scores','insert') or has_table_privilege('authenticated','public.stadione_trivia_answers','insert') then raise exception 'Answers/score writable or leaked';end if;
 insert into auth.users(id,email) values(u,'qa-trivia-1211@example.invalid'),(v,'qa-trivia-1212@example.invalid');
 insert into public.stadione_content_items(id,kind,format,title,body,status) values(a,'ARTICLE','ARTICLE','QA trivia fixture','QA factual text','PUBLISHED');
 insert into public.stadione_article_quizzes(article_id,source_digest,questions) values(a,repeat('a',64),'[
 {"id":"q1","question":"Deadline?","options":["one","two","three","four"],"answer":0,"explanation":"One week."},
 {"id":"q2","question":"Place?","options":["Batang","Solo","Jakarta","Bogor"],"answer":0,"explanation":"Batang."},
 {"id":"q3","question":"Option?","options":["one","two","three","four"],"answer":0,"explanation":"One."}]');
 r:=public.issue_stadione_trivia_session(u,a);s:=(r->>'session_id')::uuid;
 r:=public.answer_stadione_article_trivia(u,s,'q1',0,'Reader');if r->>'code'<>'NOT_VERIFIED' then raise exception 'Captcha bypass';end if;
 r:=public.start_stadione_trivia_session(v,s,0,'');if r->>'code'<>'CHALLENGE_EXPIRED' then raise exception 'Cross-account session';end if;
 update public.stadione_trivia_sessions set issued_at=clock_timestamp()-interval '2 seconds' where id=s;
 r:=public.start_stadione_trivia_session(u,s,-1,'');if r->>'code'<>'CAPTCHA_FAILED' then raise exception 'Wrong captcha accepted';end if;
 r:=public.start_stadione_trivia_session(u,s,(select captcha_sum from public.stadione_trivia_sessions where id=s),'bot');if r->>'code'<>'CAPTCHA_FAILED' then raise exception 'Honeypot ignored';end if;
 r:=public.start_stadione_trivia_session(u,s,(select captcha_sum from public.stadione_trivia_sessions where id=s),'');if not(r->>'ok')::boolean then raise exception 'Valid captcha rejected';end if;
 r:=public.answer_stadione_article_trivia(u,s,'q1',0,'Reader');if r->>'code'<>'TOO_FAST' then raise exception 'Answer rate bypass';end if;
 update public.stadione_trivia_sessions set verified_at=clock_timestamp()-interval '2 seconds' where id=s;
 r:=public.answer_stadione_article_trivia(u,s,'q1',0,'Reader');if (r->>'points_earned')::integer<>1 or (r->>'total_points')::integer<>1 then raise exception 'Correct answer scoring';end if;
 r:=public.answer_stadione_article_trivia(u,s,'q1',0,'Reader');if (r->>'points_earned')::integer<>0 or not(r->>'already_answered')::boolean then raise exception 'Duplicate points';end if;
 update public.stadione_trivia_sessions set last_answer_at=clock_timestamp()-interval '2 seconds' where id=s;
 r:=public.answer_stadione_article_trivia(u,s,'q2',1,'Reader');if (r->>'points_earned')::integer<>0 or (r->>'correct')::boolean then raise exception 'Wrong answer rewarded';end if;
 r:=public.answer_stadione_article_trivia(u,s,'q2',0,'Reader');if (r->>'points_earned')::integer<>0 or (r->>'correct')::boolean then raise exception 'Retry wrong answer farmed';end if;
 r:=public.answer_stadione_article_trivia(u,s,'q3',4,'Reader');if r->>'code'<>'INVALID_CHOICE' then raise exception 'Invalid answer accepted';end if;
 update public.stadione_content_items set status='ARCHIVED' where id=a;
 r:=public.answer_stadione_article_trivia(u,s,'q3',0,'Reader');if r->>'code'<>'UNAVAILABLE' then raise exception 'Archived article rewarded';end if;
 update public.stadione_content_items set status='PUBLISHED' where id=a;
 update public.stadione_trivia_sessions set expires_at=clock_timestamp()-interval '1 second' where id=s;
 r:=public.answer_stadione_article_trivia(u,s,'q3',0,'Reader');if r->>'code'<>'NOT_VERIFIED' then raise exception 'Expired captcha session';end if;
 for i in 1..4 loop r:=public.issue_stadione_trivia_session(u,a);end loop;
 r:=public.issue_stadione_trivia_session(u,a);if r->>'code'<>'RATE_LIMIT' then raise exception 'Session rate cap absent';end if;
 if(select points from public.stadione_reader_scores where user_id=u)<>(select sum(points) from public.stadione_trivia_answers where user_id=u) then raise exception 'Counter diverges';end if;
 if (select count(*) from public.stadione_trivia_answers where user_id=u)<>2 then raise exception 'Replay ledger count';end if;
 if not exists(select 1 from public.stadione_trivia_leaderboard() where display_name='Reader' and points=1) then raise exception 'Ranking missing';end if;
 raise notice 'QA trivia passed: auth grants, captcha, honeypot, account binding, delay, first-attempt points, replay, expiry, archive, rate and ledger.';
end $$;
set local role authenticated;
do $$ begin
 begin perform * from public.stadione_article_quizzes;raise exception 'Authenticated answers leaked';exception when insufficient_privilege then null;end;
 begin insert into public.stadione_reader_scores(user_id,display_name,points) values('00000000-0000-4000-9000-000000001212','Spoof',999);raise exception 'Direct points write accepted';exception when insufficient_privilege then null;end;
end $$;
reset role;
