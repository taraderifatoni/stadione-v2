#!/usr/bin/env bash
# One reproducible entry point: clean staging -> guards -> authenticated HTTP assertions
# -> visual capture -> sanitized logs/SHA -> cleanup. No production deploy or DB changes.
set -euo pipefail
cd "$(git rev-parse --show-toplevel)"

GUIA="root@31.97.49.146"
DB=supabase-db-zurmq2lrm9hj510fmnj1seqr
APP_URL=${JUARA_APP_URL:-http://127.0.0.1:3105}
PROXY_URL=${JUARA_PROXY_URL:-http://127.0.0.1:3104}
case "$APP_URL" in *127.0.0.1*|*localhost*) ;; *) echo "REFUSE non-local app URL"; exit 1;; esac
case "$PROXY_URL" in *127.0.0.1*|*localhost*) ;; *) echo "REFUSE non-local proxy URL"; exit 1;; esac
: "${JUARA_OWNER_PASSWORD:?required}"
: "${JUARA_SD_PASSWORD:?required}"

SHA=$(git rev-parse HEAD)
echo "candidate_sha=$SHA"

# 1. Clean staging, seed nonempty fixture, cutover rehearsal, loopback PostgREST.
scp -o ConnectTimeout=20 database/juara/migrations/*.sql "$GUIA:/tmp/juara-mig-staging/" >/dev/null
scp -o ConnectTimeout=20 scripts/juara/evidence_closure_rehearsal.sh "$GUIA:/tmp/evclose.sh" >/dev/null
ssh -o ConnectTimeout=20 "$GUIA" 'docker rm -f pgrst-evclose >/dev/null 2>&1 || true
docker exec supabase-db-zurmq2lrm9hj510fmnj1seqr psql -U postgres -d postgres -q \
  -c "DROP DATABASE IF EXISTS juara_evclose_stage_fail;" \
  -c "DROP DATABASE IF EXISTS juara_evclose_stage;" \
  -c "DROP ROLE IF EXISTS pgrst_evclose;"
chmod 700 /tmp/evclose.sh && bash /tmp/evclose.sh --keep'
scp -o ConnectTimeout=20 "$GUIA:/tmp/juara-evclose.log" docs/juara/rehearsal-logs/evidence-closure-runner.log >/dev/null

# 2. Local boundary: auth -> production GoTrue, REST -> isolated staging PostgREST.
ssh -o ConnectTimeout=15 -N -L 3103:127.0.0.1:3103 "$GUIA" >/tmp/opencode/entry-tunnel.log 2>&1 &
TUNNEL=$!
JUARA_REST_PORT=3103 JUARA_PROXY_PORT=3104 node scripts/juara/local-supabase-proxy.js >/tmp/opencode/entry-proxy.log 2>&1 &
PROXY=$!
npm run start -- -p 3105 >/tmp/opencode/entry-app.log 2>&1 &
APP=$!
trap 'kill $APP $PROXY $TUNNEL 2>/dev/null || true; ssh -o ConnectTimeout=20 "$GUIA" "docker rm -f pgrst-evclose >/dev/null 2>&1 || true; docker exec supabase-db-zurmq2lrm9hj510fmnj1seqr psql -U postgres -d postgres -q -c \\"DROP DATABASE IF EXISTS juara_evclose_stage_fail;\\" -c \\"DROP DATABASE IF EXISTS juara_evclose_stage;\\" -c \\"DROP ROLE IF EXISTS pgrst_evclose;\\"" >/dev/null 2>&1 || true' EXIT

for i in $(seq 1 30); do
  curl -fsS -o /dev/null "$APP_URL/juara/login" && break
  sleep 1
done

python3 scripts/juara/http_assertions.py

# 3. Visual capture is documented in docs/juara/screenshots/evidence-final/MANIFEST.md.
echo "HTTP_ASSERTIONS_DONE sha=$SHA"
