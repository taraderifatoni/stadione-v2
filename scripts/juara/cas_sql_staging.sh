#!/usr/bin/env bash
set -euo pipefail
DB=supabase-db-zurmq2lrm9hj510fmnj1seqr
STAGE=juara_cas_stage
MIG=/tmp/juara-mig-staging
OWNER=$(python3 -c 'import uuid;print(uuid.uuid4())')
SD=$(python3 -c 'import uuid;print(uuid.uuid4())')
FIN=$(python3 -c 'import uuid;print(uuid.uuid4())')
OTHER=$(python3 -c 'import uuid;print(uuid.uuid4())')
CLUB=$(python3 -c 'import uuid;print(uuid.uuid4())')
OTHERCLUB=$(python3 -c 'import uuid;print(uuid.uuid4())')

apply() {
  docker cp "$1" "$DB:/tmp/_m.sql" >/dev/null
  docker exec "$DB" psql -U postgres -d "$STAGE" -q -v ON_ERROR_STOP=1 -f /tmp/_m.sql >/tmp/apply.out 2>&1 || { echo "FAIL $(basename $1)"; cat /tmp/apply.out; exit 1; }
  echo "OK $(basename $1)"
}

docker exec "$DB" psql -U postgres -d postgres -q -c "DROP DATABASE IF EXISTS $STAGE;" -c "CREATE DATABASE $STAGE;"
docker exec -i "$DB" psql -U postgres -d "$STAGE" -q -v ON_ERROR_STOP=1 <<'SQL'
CREATE EXTENSION IF NOT EXISTS pgcrypto;
DO $$ BEGIN
 IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='anon') THEN CREATE ROLE anon NOLOGIN; END IF;
 IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='authenticated') THEN CREATE ROLE authenticated NOLOGIN; END IF;
 IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='service_role') THEN CREATE ROLE service_role NOLOGIN BYPASSRLS; END IF;
END $$;
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
CREATE SCHEMA IF NOT EXISTS auth;
CREATE TABLE IF NOT EXISTS auth.users (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), email TEXT);
CREATE OR REPLACE FUNCTION auth.uid() RETURNS UUID LANGUAGE sql STABLE AS $$
 SELECT NULLIF(current_setting('request.jwt.claim.sub', true), '')::uuid;
$$;
CREATE TABLE IF NOT EXISTS public.academies (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), name TEXT);
SQL

# Urutan produksi aktual: M00..M13 -> M15 -> M14 -> M16 rekonsiliasi
for f in $(ls "$MIG"/2026112[34]0000{00..13}*.sql 2>/dev/null | sort); do apply "$f"; done
apply "$MIG/20261124000015_juara_draft_finance_split.sql"
apply "$MIG/20261124000014_juara_action_policies.sql"
echo "--- overload sebelum M16 ---"
docker exec "$DB" psql -U postgres -d "$STAGE" -tA -c "select p.oid::regprocedure from pg_proc p join pg_namespace n on n.oid=p.pronamespace where p.proname='juara_set_vision_draft' and n.nspname='public';"
apply "$MIG/20261124000016_juara_draft_cas_reconcile.sql"
echo "--- overload sesudah M16 ---"
docker exec "$DB" psql -U postgres -d "$STAGE" -tA -c "select p.oid::regprocedure from pg_proc p join pg_namespace n on n.oid=p.pronamespace where p.proname='juara_set_vision_draft' and n.nspname='public';"

docker exec -i "$DB" psql -U postgres -d "$STAGE" -q -v ON_ERROR_STOP=1 <<SQL
INSERT INTO auth.users (id,email) VALUES ('$OWNER','owner@stage.test'),('$SD','sd@stage.test'),('$FIN','fin@stage.test'),('$OTHER','other@stage.test');
INSERT INTO juara_clubs (id,name,league_tier,vision_draft_enc) VALUES
 ('$CLUB','Legacy Club','LIGA_2',convert_to('{"guardrails":{"equity":15000000000,"scrMax":65}}','UTF8')),
 ('$OTHERCLUB','Other Club','LIGA_3',NULL);
INSERT INTO juara_club_members (user_id,club_id,role) VALUES
 ('$OWNER','$CLUB','OWNER'),('$SD','$CLUB','SPORTING_DIRECTOR'),('$FIN','$CLUB','FINANCE_CONTROLLER'),
 ('$OTHER','$OTHERCLUB','OWNER');
GRANT SELECT ON ALL TABLES IN SCHEMA public TO authenticated, anon;
SQL

run() {
 local label="$1" sql="$2" rc
 set +e
 docker exec "$DB" psql -U postgres -d "$STAGE" -tA -q -c "$sql" >/tmp/case.out 2>&1
 rc=$?
 set -e
 echo "$label RC=$rc :: $(head -c 170 /tmp/case.out | tr '\n' ' ')"
}

run "NEG_sd_before_migration" "SET ROLE authenticated; SET request.jwt.claim.sub='$SD'; SELECT juara_set_vision_draft('$CLUB'::uuid, convert_to('{}','UTF8'), NULL, 0);"
run "OK_owner_backfill" "SET ROLE authenticated; SET request.jwt.claim.sub='$OWNER'; SELECT juara_set_vision_draft('$CLUB'::uuid, convert_to('{\"guardrails\":{\"scrMax\":65}}','UTF8'), '\\xbb'::bytea, 0);"
docker exec "$DB" psql -U postgres -d "$STAGE" -tA -q -c "SELECT 'after_owner_rev='||vision_revision||' migrated='||vision_legacy_migrated||' finance='||encode(vision_finance_enc,'hex') FROM juara_clubs WHERE id='$CLUB';"
run "OK_sd_existing_finance_preserved" "SET ROLE authenticated; SET request.jwt.claim.sub='$SD'; SELECT juara_set_vision_draft('$CLUB'::uuid, convert_to('{\"x\":1}','UTF8'), '\\xdd'::bytea, 1);"
docker exec "$DB" psql -U postgres -d "$STAGE" -tA -q -c "SELECT 'after_sd_rev='||vision_revision||' finance='||encode(vision_finance_enc,'hex') FROM juara_clubs WHERE id='$CLUB';"
run "NEG_fin_direct_rpc" "SET ROLE authenticated; SET request.jwt.claim.sub='$FIN'; SELECT juara_set_vision_draft('$CLUB'::uuid, convert_to('{}','UTF8'), NULL, 2);"
run "NEG_cross_tenant" "SET ROLE authenticated; SET request.jwt.claim.sub='$OTHER'; SELECT count(*) FROM juara_clubs WHERE id='$CLUB';"

# CAS paralel: dua request dengan expectedRevision=2
set +e
docker exec "$DB" psql -U postgres -d "$STAGE" -tA -q -c "SET ROLE authenticated; SET request.jwt.claim.sub='$OWNER'; SELECT juara_set_vision_draft('$CLUB'::uuid, convert_to('{}','UTF8'), NULL, 2);" >/tmp/cas1.out 2>&1 & P1=$!
docker exec "$DB" psql -U postgres -d "$STAGE" -tA -q -c "SET ROLE authenticated; SET request.jwt.claim.sub='$OWNER'; SELECT juara_set_vision_draft('$CLUB'::uuid, convert_to('{}','UTF8'), NULL, 2);" >/tmp/cas2.out 2>&1 & P2=$!
wait $P1; R1=$?; wait $P2; R2=$?
set -e
echo "CAS_PARALLEL_RC=$R1/$R2"
echo "CAS1=$(head -c 150 /tmp/cas1.out | tr '\n' ' ')"; echo "CAS2=$(head -c 150 /tmp/cas2.out | tr '\n' ' ')"
docker exec "$DB" psql -U postgres -d "$STAGE" -tA -q -c "SELECT 'final_revision='||vision_revision FROM juara_clubs WHERE id='$CLUB';"
docker exec "$DB" psql -U postgres -d "$STAGE" -tA -F'|' -q -c "select tablename||':'||cmd from pg_policies where tablename like 'juara_%' order by 1;"
docker exec "$DB" psql -U postgres -d postgres -q -c "DROP DATABASE $STAGE;"
echo STAGE_DROPPED
