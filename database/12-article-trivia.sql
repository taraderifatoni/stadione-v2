-- Article quizzes and reader points. Correct answers are never public.
create table if not exists public.stadione_article_quizzes (
 article_id uuid primary key references public.stadione_content_items(id) on delete restrict,
 source_digest text not null check(source_digest ~ '^[a-f0-9]{64}$'),
 questions jsonb not null check(jsonb_typeof(questions)='array' and jsonb_array_length(questions) between 1 and 3),
 created_at timestamptz not null default now()
);
create table if not exists public.stadione_trivia_sessions (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 article_id uuid not null references public.stadione_article_quizzes(article_id) on delete cascade,
 captcha_sum integer not null,
 captcha_attempts integer not null default 0 check(captcha_attempts between 0 and 3),
 issued_at timestamptz not null default clock_timestamp(),
 expires_at timestamptz not null default clock_timestamp()+interval '15 minutes',
 verified_at timestamptz,
 last_answer_at timestamptz
);
create index if not exists stadione_trivia_session_rate on public.stadione_trivia_sessions(user_id,issued_at);
create table if not exists public.stadione_trivia_answers (
 user_id uuid not null references auth.users(id) on delete cascade,
 article_id uuid not null references public.stadione_article_quizzes(article_id) on delete restrict,
 question_id text not null,
 choice integer not null check(choice between 0 and 3),
 correct boolean not null,
 points integer not null check(points in(0,1)),
 answered_at timestamptz not null default clock_timestamp(),
 primary key(user_id,article_id,question_id),
 check(correct=(points=1))
);
create table if not exists public.stadione_reader_scores (
 user_id uuid primary key references auth.users(id) on delete cascade,
 display_name text not null,
 points integer not null default 0 check(points>=0),
 updated_at timestamptz not null default clock_timestamp()
);
alter table public.stadione_article_quizzes enable row level security;
alter table public.stadione_trivia_sessions enable row level security;
alter table public.stadione_trivia_answers enable row level security;
alter table public.stadione_reader_scores enable row level security;
revoke all on public.stadione_article_quizzes,public.stadione_trivia_sessions,public.stadione_trivia_answers,public.stadione_reader_scores from anon,authenticated;
grant all on public.stadione_article_quizzes,public.stadione_trivia_sessions,public.stadione_trivia_answers,public.stadione_reader_scores to service_role;
grant select on public.stadione_reader_scores to authenticated;
drop policy if exists "reader own trivia score" on public.stadione_reader_scores;
create policy "reader own trivia score" on public.stadione_reader_scores for select to authenticated using(user_id=auth.uid());

create or replace function public.issue_stadione_trivia_session(p_user uuid,p_article uuid)
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare v_id uuid; a integer; b integer;
begin
 perform pg_advisory_xact_lock(hashtextextended('trivia-session:'||p_user::text,0));
 if not exists(select 1 from public.stadione_content_items c join public.stadione_article_quizzes q on q.article_id=c.id where c.id=p_article and c.kind='ARTICLE' and c.status='PUBLISHED' and not(c.editorial_meta ? 'cms_deleted_at')) then
  return jsonb_build_object('error','Artikel atau trivia tidak tersedia.','code','UNAVAILABLE'); end if;
 if (select count(*) from public.stadione_trivia_sessions where user_id=p_user and issued_at>clock_timestamp()-interval '10 minutes')>=5 then
  return jsonb_build_object('error','Terlalu banyak percobaan. Coba kembali beberapa menit lagi.','code','RATE_LIMIT'); end if;
 delete from public.stadione_trivia_sessions where user_id=p_user and expires_at<clock_timestamp()-interval '7 days';
 a:=1+floor(random()*8)::integer;b:=1+floor(random()*8)::integer;
 insert into public.stadione_trivia_sessions(user_id,article_id,captcha_sum) values(p_user,p_article,a+b) returning id into v_id;
 return jsonb_build_object('session_id',v_id,'left',a,'right',b);
end $$;

create or replace function public.start_stadione_trivia_session(p_user uuid,p_session uuid,p_sum integer,p_honeypot text)
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare s public.stadione_trivia_sessions;
begin
 select * into s from public.stadione_trivia_sessions where id=p_session and user_id=p_user for update;
 if not found or s.expires_at<=clock_timestamp() or s.captcha_attempts>=3 then
  return jsonb_build_object('error','Verifikasi berakhir. Mulai lagi.','code','CHALLENGE_EXPIRED'); end if;
 if s.verified_at is not null then return jsonb_build_object('ok',true,'article_id',s.article_id); end if;
 if clock_timestamp()-s.issued_at<interval '1 second' then return jsonb_build_object('error','Tunggu sebentar lalu kirim jawaban.','code','TOO_FAST'); end if;
 update public.stadione_trivia_sessions set captcha_attempts=captcha_attempts+1 where id=s.id;
 if coalesce(p_honeypot,'')<>'' or p_sum is distinct from s.captcha_sum then
  return jsonb_build_object('error','Jawaban verifikasi belum tepat.','code','CAPTCHA_FAILED'); end if;
 update public.stadione_trivia_sessions set verified_at=clock_timestamp() where id=s.id;
 return jsonb_build_object('ok',true,'article_id',s.article_id);
end $$;

create or replace function public.answer_stadione_article_trivia(p_user uuid,p_session uuid,p_question text,p_choice integer,p_name text)
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare s public.stadione_trivia_sessions; q jsonb; prior public.stadione_trivia_answers; is_correct boolean; total integer; inserted integer;
begin
 select * into s from public.stadione_trivia_sessions where id=p_session and user_id=p_user for update;
 if not found or s.verified_at is null or s.expires_at<=clock_timestamp() then return jsonb_build_object('error','Lakukan verifikasi sebelum menjawab.','code','NOT_VERIFIED'); end if;
 if not exists(select 1 from public.stadione_content_items where id=s.article_id and kind='ARTICLE' and status='PUBLISHED' and not(editorial_meta ? 'cms_deleted_at')) then return jsonb_build_object('error','Artikel tidak lagi tersedia.','code','UNAVAILABLE'); end if;
 select x into q from public.stadione_article_quizzes t,jsonb_array_elements(t.questions) x where t.article_id=s.article_id and x->>'id'=p_question;
 if q is null or p_choice is null or p_choice<0 or p_choice>3 then return jsonb_build_object('error','Soal atau pilihan tidak valid.','code','INVALID_CHOICE'); end if;
 perform pg_advisory_xact_lock(hashtextextended('trivia-answer:'||p_user::text||':'||s.article_id::text,0));
 select * into prior from public.stadione_trivia_answers where user_id=p_user and article_id=s.article_id and question_id=p_question;
 if found then
  select coalesce(points,0) into total from public.stadione_reader_scores where user_id=p_user;
  return jsonb_build_object('correct',prior.correct,'points_earned',0,'already_answered',true,'total_points',coalesce(total,0),'correct_choice',(q->>'answer')::integer,'explanation',q->>'explanation');
 end if;
 if clock_timestamp()-s.verified_at<interval '1 second' or (s.last_answer_at is not null and clock_timestamp()-s.last_answer_at<interval '1 second') then
  return jsonb_build_object('error','Baca soal dahulu, lalu kirim jawaban.','code','TOO_FAST'); end if;
 is_correct:=p_choice=(q->>'answer')::integer;
 insert into public.stadione_trivia_answers(user_id,article_id,question_id,choice,correct,points)
 values(p_user,s.article_id,p_question,p_choice,is_correct,case when is_correct then 1 else 0 end) on conflict do nothing;
 get diagnostics inserted=row_count;
 if inserted=1 then
  insert into public.stadione_reader_scores(user_id,display_name,points)
  values(p_user,left(coalesce(nullif(trim(p_name),''),'Pembaca'),40),case when is_correct then 1 else 0 end)
  on conflict(user_id) do update set points=stadione_reader_scores.points+excluded.points,display_name=excluded.display_name,updated_at=clock_timestamp();
 end if;
 update public.stadione_trivia_sessions set last_answer_at=clock_timestamp() where id=s.id;
 select points into total from public.stadione_reader_scores where user_id=p_user;
 return jsonb_build_object('correct',is_correct,'points_earned',case when inserted=1 and is_correct then 1 else 0 end,'already_answered',false,'total_points',coalesce(total,0),'correct_choice',(q->>'answer')::integer,'explanation',q->>'explanation');
end $$;
revoke all on function public.issue_stadione_trivia_session(uuid,uuid),public.start_stadione_trivia_session(uuid,uuid,integer,text),public.answer_stadione_article_trivia(uuid,uuid,text,integer,text) from public,anon,authenticated;
grant execute on function public.issue_stadione_trivia_session(uuid,uuid),public.start_stadione_trivia_session(uuid,uuid,integer,text),public.answer_stadione_article_trivia(uuid,uuid,text,integer,text) to service_role;

create or replace function public.stadione_trivia_leaderboard()
returns table(rank bigint,display_name text,points integer)
language sql stable security definer set search_path=public,pg_temp as $$
 select row_number() over(order by points desc,updated_at,user_id),display_name,points
 from public.stadione_reader_scores where points>0 order by points desc,updated_at,user_id limit 10;
$$;
revoke all on function public.stadione_trivia_leaderboard() from public;
grant execute on function public.stadione_trivia_leaderboard() to anon,authenticated,service_role;
