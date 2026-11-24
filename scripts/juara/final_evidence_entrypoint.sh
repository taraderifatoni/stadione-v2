#!/usr/bin/env bash
# One reproducible entry point for the remaining release-evidence gates.
# Clean staging -> pinned build -> authenticated HTTP -> rollback app smoke -> cleanup.
set -euo pipefail
ROOT=$(git rev-parse --show-toplevel)
cd "$ROOT"
LOG=docs/juara/rehearsal-logs/entrypoint.log
SOURCE_SHA=$(git rev-parse HEAD)
RUNNER_SHA=$(sha256sum scripts/juara/http_assertions.py scripts/juara/final_evidence_entrypoint.sh | sha256sum | cut -d' ' -f1)
DIRTY=$(git diff --stat | tail -1 | tr -s ' ' | cut -c1-120)
: > "$LOG"
log() { printf '%s\n' "$*" | tee -a "$LOG"; }
fail() { log "ASSERT_FAIL: $*"; exit 1; }

APP_URL=${JUARA_APP_URL:-http://127.0.0.1:3105}
PROXY_URL=${JUARA_PROXY_URL:-http://127.0.0.1:3104}
for u in "$APP_URL" "$PROXY_URL"; do
  host=${u#*://}; host=${host%%:*}
  [ "$host" = "127.0.0.1" ] || [ "$host" = "localhost" ] || fail "non-local endpoint $u"
done
: "${JUARA_OWNER_PASSWORD:?required}"
: "${JUARA_SD_PASSWORD:?required}"
for p in 3103 3104 3105 3106; do
  ss -ltn 2>/dev/null | grep -q ":$p " && fail "port $p already occupied"
done

log "source_sha=$SOURCE_SHA runner_sha256=$RUNNER_SHA dirty=$DIRTY"
log "boundary: auth=production GoTrue; REST/DB=isolated staging juara_evclose_stage"

# 1. Clean staging with target guard + nonempty fixture + cutover rollback proof.
scp -o ConnectTimeout=20 database/juara/migrations/*.sql root@31.97.49.146:/tmp/juara-mig-staging/ >/dev/null
scp -o ConnectTimeout=20 scripts/juara/evidence_closure_rehearsal.sh root@31.97.49.146:/tmp/evclose.sh >/dev/null
ssh -o ConnectTimeout=20 root@31.97.49.146 'docker rm -f pgrst-evclose >/dev/null 2>&1 || true
docker exec supabase-db-zurmq2lrm9hj510fmnj1seqr psql -U postgres -d postgres -q \
  -c "DROP DATABASE IF EXISTS juara_evclose_stage_fail;" \
  -c "DROP DATABASE IF EXISTS juara_evclose_stage;" \
  -c "DROP ROLE IF EXISTS pgrst_evclose;"
chmod 700 /tmp/evclose.sh && bash /tmp/evclose.sh --keep' >>"$LOG" 2>&1 || fail "staging setup"
scp -o ConnectTimeout=20 root@31.97.49.146:/tmp/juara-evclose.log docs/juara/rehearsal-logs/evidence-closure-runner.log >/dev/null
grep -q 'ASSERT_PASS: cutover_atomic' docs/juara/rehearsal-logs/evidence-closure-runner.log || fail "cutover assertion missing"

# 2. Explicit pinned staging env; build before start (never reuse stale .next).
cp .env.local /tmp/opencode/base-env.local
scp -o ConnectTimeout=20 root@31.97.49.146:/opt/stadione/.env.production /tmp/opencode/stadione-env.txt >/dev/null || fail "cannot read staging env source"
chmod 600 /tmp/opencode/stadione-env.txt
python3 - <<'PY' >>"$LOG" 2>&1
from pathlib import Path
remote = Path('/tmp/opencode/stadione-env.txt')
keys = [l for l in remote.read_text().splitlines() if l.startswith(('NEXT_PUBLIC_SUPABASE_ANON_KEY=', 'SUPABASE_SERVICE_ROLE_KEY='))]
local = Path('.env.local').read_text().splitlines()
juara = [l for l in local if l.startswith(('JUARA_ENCRYPTION_KEYS=', 'JUARA_ACTIVE_KEY_ID='))]
out = ['NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:3104'] + keys + juara
Path('.env.production.local').write_text('\n'.join(out) + '\n')
PY
[ -s .env.production.local ] || fail "staging env not pinned"
PATH="/home/taradfs/.nvm/versions/node/v24.16.0/bin:$PATH" npm run build >>"$LOG" 2>&1 || fail "candidate build"
BUILD_ID=$(cat .next/BUILD_ID)
log "candidate_build_id=$BUILD_ID source_sha=$SOURCE_SHA"

ssh -o ConnectTimeout=15 -N -L 3103:127.0.0.1:3103 root@31.97.49.146 >/tmp/opencode/entry-tunnel.log 2>&1 &
TUNNEL=$!
JUARA_REST_PORT=3103 JUARA_PROXY_PORT=3104 /home/taradfs/.nvm/versions/node/v24.16.0/bin/node scripts/juara/local-supabase-proxy.js >/tmp/opencode/entry-proxy.log 2>&1 &
PROXY=$!
PATH="/home/taradfs/.nvm/versions/node/v24.16.0/bin:$PATH" npm run start -- -p 3105 >/tmp/opencode/entry-app.log 2>&1 &
APP=$!
cleanup() {
  kill "$APP" 2>/dev/null || true
  kill "$PROXY" 2>/dev/null || true
  kill "$TUNNEL" 2>/dev/null || true
  ssh -o ConnectTimeout=20 root@31.97.49.146 'docker rm -f pgrst-evclose >/dev/null 2>&1 || true
    docker exec supabase-db-zurmq2lrm9hj510fmnj1seqr psql -U postgres -d postgres -q \
      -c "DROP DATABASE IF EXISTS juara_evclose_stage_fail;" \
      -c "DROP DATABASE IF EXISTS juara_evclose_stage;" \
      -c "DROP ROLE IF EXISTS pgrst_evclose;"' >>"$LOG" 2>&1 || log 'WARN cleanup reported error'
  log "CLEANUP_ATTEMPTED"
}
trap cleanup EXIT

for i in $(seq 1 30); do
  curl -fsS -o /dev/null "$APP_URL/juara/login" && break
  sleep 1
done
curl -fsS -o /dev/null "$APP_URL/juara/login" || fail "app did not bind port 3105"
ANON=$(grep '^NEXT_PUBLIC_SUPABASE_ANON_KEY=' .env.production.local | cut -d= -f2-)
[ "$(curl -s -o /dev/null -w '%{http_code}' --max-time 20 "$PROXY_URL/rest/v1/juara_clubs?select=id&limit=1" -H "apikey: $ANON")" = "200" ] || fail "staging REST proxy not ready"
ss -ltnp 2>/dev/null | grep -q ':3105 ' || fail "port owner not verifiable"
CLUB=$(ssh -o ConnectTimeout=20 root@31.97.49.146 "docker exec supabase-db-zurmq2lrm9hj510fmnj1seqr psql -U postgres -d juara_evclose_stage -tA -q -c \"select name from juara_clubs order by name limit 1;\"")
[ "$CLUB" = "Fixture Club" ] || fail "backend is not staging fixture: $CLUB"
log "runtime_backend=$CLUB build_id=$BUILD_ID port=3105 pid=$APP"

JUARA_APP_URL="$APP_URL" JUARA_PROXY_URL="$PROXY_URL" python3 scripts/juara/http_assertions.py >>"$LOG" 2>&1 || fail "HTTP assertions"
grep -q 'ASSERTIONS_PASS' docs/juara/rehearsal-logs/http-assertions.log || fail "assertion marker missing"

# 3. Actual app rollback rehearsal on pinned compatible artifact.
JUARA_OWNER_PASSWORD="$JUARA_OWNER_PASSWORD" bash scripts/juara/app_rollback_rehearsal.sh >>"$LOG" 2>&1 || fail "rollback app rehearsal"
grep -q 'ROLLBACK_APP_SMOKE_PASS' docs/juara/rehearsal-logs/app-rollback.log || fail "rollback smoke marker missing"

log "ENTRYPOINT_PASS source_sha=$SOURCE_SHA candidate_build=$BUILD_ID"
