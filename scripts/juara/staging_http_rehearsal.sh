#!/usr/bin/env bash
# Isolated staging rehearsal for JUARA draft CAS. Run on VPS 31.97.49.146.
# Creates a throwaway database and PostgREST on port 3101. No production writes.
set -euo pipefail

DB=supabase-db-zurmq2lrm9hj510fmnj1seqr
docker rm -f pgrst-stage >/dev/null 2>&1 || true
STAGE=juara_http_stage
MIG=/tmp/juara-mig-staging
LOG=/tmp/juara-staging-http.log
: > "$LOG"

fail() { echo "ASSERT_FAIL: $1" | tee -a "$LOG"; exit 1; }
assert_eq() { [ "$1" = "$2" ] || fail "$3 (expected=$2 actual=$1)"; }

apply() {
  docker cp "$1" "$DB:/tmp/_r.sql" >/dev/null
  docker exec "$DB" psql -U postgres -d "$STAGE" -q -v ON_ERROR_STOP=1 -1 -f /tmp/_r.sql >>"$LOG" 2>&1 \
    || fail "migration $(basename "$1")"
  echo "OK $(basename "$1")"
}

docker exec "$DB" psql -U postgres -d postgres -q -c "DROP DATABASE IF EXISTS $STAGE;" -c "CREATE DATABASE $STAGE;" >>"$LOG" 2>&1
docker exec -i "$DB" psql -U postgres -d "$STAGE" -q -v ON_ERROR_STOP=1 <<'SQL' >>"$LOG" 2>&1
CREATE EXTENSION IF NOT EXISTS pgcrypto;
DO $$ BEGIN
 IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='anon') THEN CREATE ROLE anon NOLOGIN; END IF;
 IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='authenticated') THEN CREATE ROLE authenticated NOLOGIN; END IF;
 IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='service_role') THEN CREATE ROLE service_role NOLOGIN BYPASSRLS; END IF;
 IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='pgrst') THEN CREATE ROLE pgrst LOGIN; END IF;
END $$;
GRANT anon TO pgrst; GRANT authenticated TO pgrst;
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role, pgrst;
CREATE SCHEMA IF NOT EXISTS auth;
CREATE TABLE IF NOT EXISTS auth.users (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), email TEXT);
CREATE OR REPLACE FUNCTION auth.uid() RETURNS UUID LANGUAGE sql STABLE AS $$
 SELECT NULLIF(current_setting('request.jwt.claim.sub', true), '')::uuid;
$$;
CREATE TABLE IF NOT EXISTS public.academies (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), name TEXT);
SQL

# Urutan produksi aktual: M-15 lebih dulu, lalu M-14, baru M-16 rekonsiliasi.
for f in $(ls "$MIG"/2026112300000[0-8]_*.sql "$MIG"/20261124000009_*.sql "$MIG"/20261124000010_*.sql "$MIG"/20261124000011_*.sql "$MIG"/20261124000012_*.sql "$MIG"/20261124000013_*.sql 2>/dev/null | sort); do apply "$f"; done
apply "$MIG/20261124000015_juara_draft_finance_split.sql"
apply "$MIG/20261124000014_juara_action_policies.sql"
apply "$MIG/20261124000016_juara_draft_cas_reconcile.sql"

OWNER=$(python3 -c 'import uuid;print(uuid.uuid4())')
SD=$(python3 -c 'import uuid;print(uuid.uuid4())')
FIN=$(python3 -c 'import uuid;print(uuid.uuid4())')
OTHER=$(python3 -c 'import uuid;print(uuid.uuid4())')
CLUB=$(python3 -c 'import uuid;print(uuid.uuid4())')
OTHERCLUB=$(python3 -c 'import uuid;print(uuid.uuid4())')

docker exec -i "$DB" psql -U postgres -d "$STAGE" -q -v ON_ERROR_STOP=1 <<SQL >>"$LOG" 2>&1
INSERT INTO auth.users (id,email) VALUES ('$OWNER','owner@stage.test'),('$SD','sd@stage.test'),('$FIN','fin@stage.test'),('$OTHER','other@stage.test');
INSERT INTO juara_clubs (id,name,league_tier) VALUES ('$CLUB','Stage Club','LIGA_2'),('$OTHERCLUB','Other Club','LIGA_3');
INSERT INTO juara_club_members (user_id,club_id,role) VALUES
 ('$OWNER','$CLUB','OWNER'),('$SD','$CLUB','SPORTING_DIRECTOR'),('$FIN','$CLUB','FINANCE_CONTROLLER'),('$OTHER','$OTHERCLUB','OWNER');
GRANT SELECT ON ALL TABLES IN SCHEMA public TO authenticated, anon;
SQL

# Fungsi harus tepat satu overload 4 argumen.
N=$(docker exec "$DB" psql -U postgres -d "$STAGE" -tA -q -c \
  "select count(*) from pg_proc p join pg_namespace n on n.oid=p.pronamespace where p.proname='juara_set_vision_draft' and n.nspname='public';")
assert_eq "$N" "1" "overload harus tepat satu"

DBIP=$(docker inspect -f "{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}" "$DB")
PW=$(openssl rand -hex 18)
docker exec "$DB" psql -U postgres -d "$STAGE" -q -c "ALTER ROLE pgrst PASSWORD '$PW';" >>"$LOG" 2>&1
JWT=$(docker inspect supabase-kong-zurmq2lrm9hj510fmnj1seqr \
  --format '{{range .Config.Env}}{{println .}}{{end}}' | grep '^PGRST_JWT_SECRET=' | cut -d= -f2-)
[ -n "$JWT" ] || fail "JWT secret tidak ditemukan"

docker rm -f pgrst-stage >/dev/null 2>&1 || true
docker run -d --name pgrst-stage --network host \
  -e "PGRST_DB_URI=postgres://pgrst:${PW}@${DBIP}:5432/${STAGE}" \
  -e PGRST_DB_ANON_ROLE=anon \
  -e PGRST_DB_SCHEMA=public \
  -e "PGRST_JWT_SECRET=${JWT}" \
  -e PGRST_SERVER_PORT=3101 \
  postgrest/postgrest:v14.6 >>"$LOG" 2>&1

for i in $(seq 1 20); do
  code=$(curl -s -o /dev/null -w '%{http_code}' "http://127.0.0.1:3101/juara_clubs?select=id&limit=1" \
    -H "apikey: $(grep '^NEXT_PUBLIC_SUPABASE_ANON_KEY=' /opt/stadione/.env.production | cut -d= -f2-)" || true)
  [ "$code" = "200" ] && break
  sleep 1
done
assert_eq "$code" "200" "PostgREST staging tidak siap"

echo "$OWNER $SD $FIN $OTHER $CLUB $OTHERCLUB" > /tmp/juara-stage-ids.txt
chmod 600 /tmp/juara-stage-ids.txt
echo "STAGING_READY port=3101 db=$STAGE" | tee -a "$LOG"
echo "LOG=$LOG"
