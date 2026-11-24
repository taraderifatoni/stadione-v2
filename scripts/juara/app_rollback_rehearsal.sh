#!/usr/bin/env bash
# Actual application rollback rehearsal: pinned compatible build 1a2655c against M-16 staging.
# No production deploy. Exits nonzero if any gate fails.
set -euo pipefail
ROOT=$(git rev-parse --show-toplevel)
cd "$ROOT"
WT=/tmp/juara-rollback
PORT=3106
LOG=docs/juara/rehearsal-logs/app-rollback.log
AB=/home/taradfs/.nvm/versions/node/v24.16.0/bin/agent-browser
: > "$LOG"

cleanup() {
  [ -n "${APP_PID:-}" ] && kill "$APP_PID" 2>/dev/null || true
  git worktree remove --force "$WT" >/dev/null 2>&1 || true
}
trap cleanup EXIT

git worktree remove --force "$WT" >/dev/null 2>&1 || true
git worktree add --detach "$WT" 1a2655c >>"$LOG" 2>&1
cp -a "$ROOT/node_modules" "$WT/node_modules"
cp .env.production.local "$WT/.env.production.local"
PATH="/home/taradfs/.nvm/versions/node/v24.16.0/bin:$PATH" bash -lc "cd '$WT' && npm run build" >>"$LOG" 2>&1
BUILD_ID=$(cat "$WT/.next/BUILD_ID")
echo "rollback_artifact=1a2655c build_id=$BUILD_ID" | tee -a "$LOG"

CLUB=$(ssh -o ConnectTimeout=20 root@31.97.49.146 "docker exec supabase-db-zurmq2lrm9hj510fmnj1seqr psql -U postgres -d juara_evclose_stage -tA -q -c \"select id from juara_clubs order by name limit 1;\"")
ssh -o ConnectTimeout=20 root@31.97.49.146 "docker exec supabase-db-zurmq2lrm9hj510fmnj1seqr psql -U postgres -d juara_evclose_stage -q -v ON_ERROR_STOP=1 -c \"INSERT INTO auth.users (id,email) VALUES ('2e75becd-7695-48dd-bd84-70bbf6fe2607','demo@juara.stadione.pro') ON CONFLICT (id) DO NOTHING; INSERT INTO juara_club_members (user_id,club_id,role) VALUES ('2e75becd-7695-48dd-bd84-70bbf6fe2607','$CLUB'::uuid,'OWNER') ON CONFLICT (user_id,club_id) DO UPDATE SET role=EXCLUDED.role;\""

PATH="/home/taradfs/.nvm/versions/node/v24.16.0/bin:$PATH" bash -lc "cd '$WT' && npm run start -- -p $PORT" >/tmp/opencode/rollback-app.log 2>&1 &
APP_PID=$!
for i in $(seq 1 30); do
  curl -fsS -o /dev/null "http://127.0.0.1:$PORT/juara/login" && break
  sleep 1
done
curl -fsS -o /dev/null "http://127.0.0.1:$PORT/juara/login" || { echo "ASSERT_FAIL rollback health"; exit 1; }

PW=${JUARA_OWNER_PASSWORD:-}
[ -n "$PW" ] || { echo "ASSERT_FAIL missing password"; exit 1; }
$AB --session rb set viewport 1440 900 >/dev/null 2>&1
$AB --session rb open "http://127.0.0.1:$PORT/juara/login" >/dev/null 2>&1
$AB --session rb wait --load networkidle >/dev/null 2>&1
$AB --session rb find label "Email" fill "demo@juara.stadione.pro" >/dev/null 2>&1
$AB --session rb find label "Kata sandi" fill "$PW" >/dev/null 2>&1
$AB --session rb find role button click --name "Masuk" >/dev/null 2>&1
$AB --session rb wait --load networkidle >/dev/null 2>&1
URL=$($AB --session rb get url | tail -1)
case "$URL" in */juara) ;; *) echo "ASSERT_FAIL rollback login $URL" | tee -a "$LOG"; exit 1;; esac

GET=$($AB --session rb eval --stdin 2>/dev/null <<'JS' | tail -4
(async()=>{const r=await fetch('/api/juara/v1/vision/draft',{cache:'no-store'});const b=await r.json();return {status:r.status,rev:b.revision}})()
JS
)
echo "rollback_get=$GET" | tee -a "$LOG"
echo "$GET" | grep -q '"status": 200' || { echo "ASSERT_FAIL rollback GET"; exit 1; }

PUT=$($AB --session rb eval --stdin 2>/dev/null <<'JS' | tail -4
(async()=>{const api='/api/juara/v1/vision/draft';const g=await fetch(api,{cache:'no-store'});const b=await g.json();const d={...b.draft,guardrails:{...b.draft.guardrails,scrMax:64}};const r=await fetch(api,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({draft:d,expectedRevision:b.revision})});const rb=await r.json();return {status:r.status,rev:rb.revision}})()
JS
)
echo "rollback_put=$PUT" | tee -a "$LOG"
echo "$PUT" | grep -q '"status": 200' || { echo "ASSERT_FAIL rollback PUT"; exit 1; }

CAS=$($AB --session rb eval --stdin 2>/dev/null <<'JS' | tail -4
(async()=>{const api='/api/juara/v1/vision/draft';const g=await fetch(api,{cache:'no-store'});const b=await g.json();const r=await fetch(api,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({draft:b.draft,expectedRevision:0})});const rb=await r.json();return {status:r.status,code:rb.code}})()
JS
)
echo "rollback_cas=$CAS" | tee -a "$LOG"
echo "$CAS" | grep -q '"status": 409' || { echo "ASSERT_FAIL rollback CAS"; exit 1; }

echo "ROLLBACK_APP_SMOKE_PASS build_id=$BUILD_ID" | tee -a "$LOG"
