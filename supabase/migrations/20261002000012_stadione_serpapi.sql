-- Move Stadione CMS discovery usage from SearchAPI.io to SerpApi.
-- Keep each provider's usage history intact and enforce a hard 93-call monthly cap.
create or replace function public.reserve_stadione_search_request(p_engine text, p_request_key text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_used integer;
  v_id uuid;
  v_month_start timestamptz := date_trunc('month', now() at time zone 'Asia/Jakarta') at time zone 'Asia/Jakarta';
begin
  perform pg_advisory_xact_lock(hashtext('stadione_serpapi_monthly_budget'));

  select count(*) into v_used
    from public.stadione_api_usage
   where provider = 'SERPAPI' and created_at >= v_month_start;

  if v_used >= 93 then return null; end if;

  insert into public.stadione_api_usage(provider, engine, request_key, success, error_message)
    values ('SERPAPI', p_engine, p_request_key, false, 'REQUEST_RESERVED')
    returning id into v_id;

  return v_id;
end;
$$;

revoke all on function public.reserve_stadione_search_request(text, text) from public, anon, authenticated;
grant execute on function public.reserve_stadione_search_request(text, text) to service_role;
