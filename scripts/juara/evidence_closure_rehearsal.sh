#!/usr/bin/env bash
# Evidence closure + conflict recovery + cutover rehearsal (VPS side).
# Usage: evidence_closure_rehearsal.sh [--keep]
# WARNING: target-guarded. Never points at production database; staging only.
set -euo pipefail

DB=supabase-db-zurmq2lrm9hj510fmnj1seqr
CONTAINER=supabase-db-zurmq2lrm9hj510fmnj1seqr
STAGE=juara_evclose_stage
ROLE=pgrst_evclose
PGRST=pgrst-evclose
PORT=3103
MIG=/tmp/juara-mig-staging
LOG=/tmp/juara-evclose.log
KEEP=0
[ "${1:-}" = "--keep" ] && KEEP=1

fail() { echo "ASSERT_FAIL: $1" | tee -a "$LOG"; exit 1; }
pass() { echo "ASSERT_PASS: $1" | tee -a "$LOG"; }
assert_eq() { [ "$1" = "$2" ] || fail "$3 (expected=$2 actual=$1)"; }
assert_contains() { printf '%s' "$1" | grep -q "$2" || fail "$3"; }

cleanup() {
  [ "$KEEP" = "1" ] && { echo "KEEP requested; cleanup NOT executed" | tee -a "$LOG"; return; }
  docker rm -f "$PGRST" >/dev/null 2>&1 || true
  docker exec "$CONTAINER" psql -U postgres -d postgres -q -c "DROP DATABASE IF EXISTS ${STAGE}_fail;" >/dev/null 2>&1 || true
  docker exec "$CONTAINER" psql -U postgres -d postgres -q -c "DROP DATABASE IF EXISTS $STAGE;" || { echo "CLEANUP_FAIL db" | tee -a "$LOG"; return 1; }
  docker exec "$CONTAINER" psql -U postgres -d postgres -q -c "DROP ROLE IF EXISTS $ROLE;" || { echo "CLEANUP_FAIL role" | tee -a "$LOG"; return 1; }
  echo "CLEANUP_DONE" | tee -a "$LOG"
}
trap cleanup EXIT

# Target guard
HOST=$(docker exec "$CONTAINER" hostname 2>/dev/null || true)
[ -n "$HOST" ] || fail "target container tidak ditemukan"
case "$STAGE" in juara_evclose_stage) ;; *) fail "nama staging tidak diizinkan";; esac

: > "$LOG"
echo "TARGET host=$HOST db=$STAGE role=$ROLE port=$PORT" | tee -a "$LOG"

# Unique role; do not ALTER shared pgrst.
PW=$(openssl rand -hex 18)
DBIP=$(docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' "$CONTAINER")
docker exec "$CONTAINER" psql -U postgres -d postgres -q -c "DROP DATABASE IF EXISTS $STAGE;" -c "DROP ROLE IF EXISTS $ROLE;" -c "CREATE ROLE $ROLE LOGIN PASSWORD '$PW';" -c "CREATE DATABASE $STAGE;" >>"$LOG" 2>&1

docker exec -i "$CONTAINER" psql -U postgres -d "$STAGE" -q -v ON_ERROR_STOP=1 <<'SQL' >>"$LOG" 2>&1
CREATE EXTENSION IF NOT EXISTS pgcrypto;
DO $$ BEGIN
 IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='anon') THEN CREATE ROLE anon NOLOGIN; END IF;
 IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='authenticated') THEN CREATE ROLE authenticated NOLOGIN; END IF;
 IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='service_role') THEN CREATE ROLE service_role NOLOGIN BYPASSRLS; END IF;
END $$;
GRANT anon TO pgrst_evclose; GRANT authenticated TO pgrst_evclose;
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role, pgrst_evclose;
CREATE SCHEMA IF NOT EXISTS auth;
CREATE TABLE IF NOT EXISTS auth.users (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), email TEXT);
CREATE OR REPLACE FUNCTION auth.uid() RETURNS UUID LANGUAGE sql STABLE AS $$
 SELECT COALESCE(NULLIF(current_setting('request.jwt.claim.sub',true),'')::uuid,
                 (NULLIF(current_setting('request.jwt.claims',true),'')::jsonb->>'sub')::uuid);
$$;
CREATE TABLE IF NOT EXISTS public.academies (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), name TEXT);
SQL

# Production-like order: M00..M13, M15, then combined M14+M16 in ONE transaction.
for f in $(ls "$MIG"/2026112300000[0-8]_*.sql "$MIG"/20261124000009_*.sql "$MIG"/20261124000010_*.sql "$MIG"/20261124000011_*.sql "$MIG"/20261124000012_*.sql "$MIG"/20261124000013_*.sql "$MIG"/20261124000015_*.sql 2>/dev/null | sort); do
  docker cp "$f" "$CONTAINER:/tmp/_m.sql" >/dev/null
  docker exec "$CONTAINER" psql -U postgres -d "$STAGE" -q -v ON_ERROR_STOP=1 -f /tmp/_m.sql >>"$LOG" 2>&1 || fail "migrasi $(basename "$f")"
done

python3 - <<'PY'
from pathlib import Path
m14=Path('/tmp/juara-mig-staging/20261124000014_juara_action_policies.sql').read_text()
m16=Path('/tmp/juara-mig-staging/20261124000016_juara_draft_cas_reconcile.sql').read_text()
m16=m16.replace('BEGIN;','').replace('COMMIT;','')
combined='BEGIN;\n'+m14+'\n'+m16+'\nCOMMIT;\n'
Path('/tmp/cutover.sql').write_text(combined)
Path('/tmp/cutover_fail.sql').write_text(combined.replace('COMMIT;','SELECT 1/0;\nCOMMIT;'))
PY

# Injected failure on a clone: transaction must leave M15+M14 state untouched.
docker exec "$CONTAINER" psql -U postgres -d postgres -q -c "DROP DATABASE IF EXISTS ${STAGE}_fail;" -c "CREATE DATABASE ${STAGE}_fail TEMPLATE $STAGE;" >>"$LOG" 2>&1
SIG_BEFORE=$(docker exec "$CONTAINER" psql -U postgres -d "${STAGE}_fail" -tA -q -c "select p.oid::regprocedure from pg_proc p join pg_namespace n on n.oid=p.pronamespace where p.proname='juara_set_vision_draft' and n.nspname='public' order by 1;")
GRANTS_BEFORE=$(docker exec "$CONTAINER" psql -U postgres -d "${STAGE}_fail" -tA -q -c "select routine_name||':'||grantee||':'||privilege_type from information_schema.routine_privileges where routine_name='juara_set_vision_draft' order by 1;" 2>/dev/null || true)
POL_BEFORE=$(docker exec "$CONTAINER" psql -U postgres -d "${STAGE}_fail" -tA -q -c "select tablename||':'||cmd from pg_policies where tablename like 'juara_%' order by 1;")
DATA_BEFORE=$(docker exec "$CONTAINER" psql -U postgres -d "${STAGE}_fail" -tA -q -c "select count(*) from juara_clubs;" 2>/dev/null || echo "no-table")
docker cp /tmp/cutover_fail.sql "$CONTAINER:/tmp/cutover_fail.sql" >/dev/null
set +e
docker exec "$CONTAINER" psql -U postgres -d "${STAGE}_fail" -q -v ON_ERROR_STOP=1 -f /tmp/cutover_fail.sql >>"$LOG" 2>&1
RC=$?
set -e
assert_eq "$RC" "3" "injected failure harus gagal"
COLS=$(docker exec "$CONTAINER" psql -U postgres -d "${STAGE}_fail" -tA -q -c "select count(*) from information_schema.columns where table_name='juara_clubs' and column_name in ('vision_revision','vision_legacy_migrated');")
assert_eq "$COLS" "0" "rollback cutover: kolom baru harus absen"
SIG_AFTER=$(docker exec "$CONTAINER" psql -U postgres -d "${STAGE}_fail" -tA -q -c "select p.oid::regprocedure from pg_proc p join pg_namespace n on n.oid=p.pronamespace where p.proname='juara_set_vision_draft' and n.nspname='public' order by 1;")
GRANTS_AFTER=$(docker exec "$CONTAINER" psql -U postgres -d "${STAGE}_fail" -tA -q -c "select routine_name||':'||grantee||':'||privilege_type from information_schema.routine_privileges where routine_name='juara_set_vision_draft' order by 1;" 2>/dev/null || true)
POL_AFTER=$(docker exec "$CONTAINER" psql -U postgres -d "${STAGE}_fail" -tA -q -c "select tablename||':'||cmd from pg_policies where tablename like 'juara_%' order by 1;")
DATA_AFTER=$(docker exec "$CONTAINER" psql -U postgres -d "${STAGE}_fail" -tA -q -c "select count(*) from juara_clubs;" 2>/dev/null || echo "no-table")
assert_eq "$SIG_AFTER" "$SIG_BEFORE" "rollback signature identik"
assert_eq "$GRANTS_AFTER" "$GRANTS_BEFORE" "rollback grants identik"
assert_eq "$POL_AFTER" "$POL_BEFORE" "rollback policies identik"
assert_eq "$DATA_AFTER" "$DATA_BEFORE" "rollback data identik"
echo "ROLLBACK_SNAPSHOT sig=$SIG_AFTER policies=$POL_AFTER data=$DATA_AFTER" | tee -a "$LOG"
docker exec "$CONTAINER" psql -U postgres -d postgres -q -c "DROP DATABASE ${STAGE}_fail;" >>"$LOG" 2>&1
pass "injected_failure_rollback_full"

# Real cutover
docker cp /tmp/cutover.sql "$CONTAINER:/tmp/cutover.sql" >/dev/null
docker exec "$CONTAINER" psql -U postgres -d "$STAGE" -q -v ON_ERROR_STOP=1 -f /tmp/cutover.sql >>"$LOG" 2>&1
COLS=$(docker exec "$CONTAINER" psql -U postgres -d "$STAGE" -tA -q -c "select count(*) from information_schema.columns where table_name='juara_clubs' and column_name in ('vision_revision','vision_legacy_migrated');")
assert_eq "$COLS" "2" "cutover kolom"
SIG=$(docker exec "$CONTAINER" psql -U postgres -d "$STAGE" -tA -q -c "select p.oid::regprocedure from pg_proc p join pg_namespace n on n.oid=p.pronamespace where p.proname='juara_set_vision_draft' and n.nspname='public';")
assert_eq "$SIG" "juara_set_vision_draft(uuid,bytea,bytea,integer)" "cutover signature"
POL=$(docker exec "$CONTAINER" psql -U postgres -d "$STAGE" -tA -q -c "select string_agg(distinct cmd,'|') from pg_policies where tablename like 'juara_%';")
assert_eq "$POL" "SELECT" "cutover policy"
pass "cutover_atomic"

OWNER=2e75becd-7695-48dd-bd84-70bbf6fe2607
CLUB=$(python3 -c 'import uuid;print(uuid.uuid4())')
OTHER=$(python3 -c 'import uuid;print(uuid.uuid4())')
docker exec -i "$CONTAINER" psql -U postgres -d "$STAGE" -q -v ON_ERROR_STOP=1 <<SQL >>"$LOG" 2>&1
INSERT INTO auth.users (id,email) VALUES ('$OWNER','demo@juara.stadione.pro'),('$OTHER','other@stage.test');
INSERT INTO juara_clubs (id,name,league_tier) VALUES ('$CLUB','Stage Club','LIGA_2'),('$OTHER','Other Club','LIGA_3');
INSERT INTO juara_club_members (user_id,club_id,role) VALUES ('$OWNER','$CLUB','OWNER'),('$OTHER','$OTHER','OWNER');
GRANT SELECT ON ALL TABLES IN SCHEMA public TO authenticated, anon;
SQL

JWT=$(docker inspect supabase-kong-zurmq2lrm9hj510fmnj1seqr --format '{{range .Config.Env}}{{println .}}{{end}}' | grep '^PGRST_JWT_SECRET=' | cut -d= -f2-)
docker rm -f "$PGRST" >/dev/null 2>&1 || true
docker run -d --name "$PGRST" --network host \
  -e "PGRST_DB_URI=postgres://${ROLE}:${PW}@${DBIP}:5432/${STAGE}" \
  -e PGRST_DB_ANON_ROLE=anon -e PGRST_DB_SCHEMA=public -e "PGRST_JWT_SECRET=${JWT}" \
  -e PGRST_SERVER_HOST=127.0.0.1 -e PGRST_SERVER_PORT=${PORT} \
  postgrest/postgrest:v14.6 >>"$LOG" 2>&1

for i in $(seq 1 20); do
  CODE=$(curl -s -o /dev/null -w '%{http_code}' "http://127.0.0.1:${PORT}/juara_clubs?select=id&limit=1" -H "apikey: $(grep '^NEXT_PUBLIC_SUPABASE_ANON_KEY=' /opt/stadione/.env.production | cut -d= -f2-)" || true)
  [ "$CODE" = "200" ] && break
  sleep 1
done
assert_eq "$CODE" "200" "PostgREST loopback siap"
pass "staging_ready"
echo "CLUB=$CLUB OWNER=$OWNER" > /tmp/evclose-ids.txt
chmod 600 /tmp/evclose-ids.txt
echo "LOG=$LOG"
