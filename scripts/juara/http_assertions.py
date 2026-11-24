#!/usr/bin/env python3
"""Authenticated HTTP assertions for JUARA staging. Exits nonzero on any false positive.

Requires: local candidate app at JUARA_APP_URL, proxy at JUARA_PROXY_URL, staging DB
created by evidence_closure_rehearsal.sh --keep. Auth is production GoTrue; REST is
isolated staging PostgREST — that boundary is stated in the log.
"""
import base64
import hashlib
import json
import os
import secrets
import subprocess
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

from cryptography.hazmat.primitives.ciphers.aead import AESGCM

AB = "/home/taradfs/.nvm/versions/node/v24.16.0/bin/agent-browser"
APP = os.environ.get("JUARA_APP_URL", "http://127.0.0.1:3105")
PROXY = os.environ.get("JUARA_PROXY_URL", "http://127.0.0.1:3104")
OWNER_EMAIL = os.environ.get("JUARA_OWNER_EMAIL", "demo@juara.stadione.pro")
OWNER_PW = os.environ.get("JUARA_OWNER_PASSWORD", "")
SD_EMAIL = os.environ.get("JUARA_SD_EMAIL", "http-sd-uat@stadione.pro")
SD_PW = os.environ.get("JUARA_SD_PASSWORD", "")
VPS = "root@31.97.49.146"
DBCONTAINER = "supabase-db-zurmq2lrm9hj510fmnj1seqr"
STAGE = "juara_evclose_stage"
LOG = Path("docs/juara/rehearsal-logs/http-assertions.log")


def guard():
    for url in (APP, PROXY):
        host = url.split("://", 1)[-1].split(":", 1)[0]
        assert host in ("127.0.0.1", "localhost"), f"refusing non-local endpoint: {url}"
    assert Path(".env.production.local").exists(), "preview env missing"


def run(cmd, stdin=None, timeout=90):
    return subprocess.run(cmd, input=stdin, text=True, capture_output=True, timeout=timeout)


def ssh_psql(sql):
    path = Path("/tmp/opencode/assert-seed.sql")
    path.write_text(sql)
    r = run(["scp", "-o", "ConnectTimeout=20", str(path), f"{VPS}:/tmp/assert-seed.sql"])
    assert r.returncode == 0, r.stderr
    r = run(["ssh", "-o", "ConnectTimeout=20", VPS,
             f"docker cp /tmp/assert-seed.sql {DBCONTAINER}:/tmp/assert-seed.sql && "
             f"docker exec {DBCONTAINER} psql -U postgres -d {STAGE} -tA -q -v ON_ERROR_STOP=1 -f /tmp/assert-seed.sql"])
    assert r.returncode == 0, f"psql failed: {r.stderr[-300:]}"
    return r.stdout.strip()


def db_query(sql):
    r = run(["ssh", "-o", "ConnectTimeout=20", VPS,
             f"docker exec {DBCONTAINER} psql -U postgres -d {STAGE} -tA -q -c \"{sql}\""])
    assert r.returncode == 0, r.stderr
    return r.stdout.strip()


def ab(*args, stdin=None):
    r = run([AB, "--session", "httpassert", *args], stdin)
    assert r.returncode == 0, f"agent-browser failed: {args}: {r.stderr[-300:]}"
    return r.stdout


def ev(js):
    out = ab("eval", "--stdin", stdin=js)
    start, end = out.find("{"), out.rfind("}")
    assert start >= 0 and end > start, f"no JSON: {out[-300:]}"
    return json.loads(out[start:end + 1])


def anon_key():
    return next(l.split("=", 1)[1] for l in Path(".env.production.local").read_text().splitlines()
                if l.startswith("NEXT_PUBLIC_SUPABASE_ANON_KEY="))


def keyring():
    text = Path(".env.production.local").read_text()
    keys = json.loads(next(l.split("=", 1)[1] for l in text.splitlines() if l.startswith("JUARA_ENCRYPTION_KEYS=")))
    kid = next(l.split("=", 1)[1] for l in text.splitlines() if l.startswith("JUARA_ACTIVE_KEY_ID="))
    return kid, base64.b64decode(keys[kid])


def encrypted(value, column, club_id):
    kid, key = keyring()
    aad = f"{club_id}|juara_clubs|{column}|{club_id}|{kid}".encode()
    nonce = secrets.token_bytes(12)
    ct = AESGCM(key).encrypt(nonce, json.dumps(value).encode(), aad)
    return "\\x" + (bytes([1, len(kid)]) + kid.encode() + nonce + ct).hex()


def rest(path, token=None, method="GET", body=None):
    headers = {"apikey": anon_key()}
    if token:
        headers["Authorization"] = "Bearer " + token
    if body is not None:
        headers["Content-Type"] = "application/json"
    r = run(["curl", "-sS", "-o", "/tmp/opencode/rest.out", "-w", "%{http_code}",
             "--max-time", "25", "-X", method, f"{PROXY}/rest/v1/{path}",
             *sum((["-H", f"{k}: {v}"] for k, v in headers.items()), []),
             *(["-d", json.dumps(body)] if body is not None else [])])
    return int(r.stdout.strip() or 0), Path("/tmp/opencode/rest.out").read_text()


def token_for(email, password):
    r = run(["curl", "-sS", "-X", "POST", f"{PROXY}/auth/v1/token?grant_type=password",
             "-H", f"apikey: {anon_key()}", "-H", "Content-Type: application/json",
             "-d", json.dumps({"email": email, "password": password})])
    data = json.loads(r.stdout)
    assert data.get("access_token"), "token missing"
    return data["access_token"], data["user"]["id"]


def main():
    guard()
    started = time.monotonic()
    lines = [f"# HTTP assertions {datetime.now(timezone.utc).isoformat()}",
             f"app={APP} proxy={PROXY}",
             "isolation: auth=production GoTrue; REST=isolated staging PostgREST; no club real data"]
    sha = run(["git", "rev-parse", "HEAD"]).stdout.strip()
    lines.append(f"candidate_sha={sha}")
    try:
        assert OWNER_PW and SD_PW, "missing QA passwords"
        owner_token, owner_id = token_for(OWNER_EMAIL, OWNER_PW)
        sd_token, sd_id = token_for(SD_EMAIL, SD_PW)
        ids = db_query("select id from juara_clubs order by name")
        club_rows = [x for x in ids.splitlines() if x]
        assert len(club_rows) >= 2, "fixture clubs missing"
        club, other = club_rows[0], club_rows[1]
        ssh_psql(f"INSERT INTO auth.users (id,email) VALUES ('{owner_id}','{OWNER_EMAIL}'),('{sd_id}','{SD_EMAIL}') ON CONFLICT (id) DO NOTHING;\n"
                 f"INSERT INTO juara_club_members (user_id,club_id,role) VALUES "
                 f"('{owner_id}','{club}','OWNER'),('{sd_id}','{club}','SPORTING_DIRECTOR') "
                 f"ON CONFLICT (user_id,club_id) DO UPDATE SET role=EXCLUDED.role;\n")

        own_code, own_body = rest(f"juara_clubs?id=eq.{club}&select=id,name", owner_token)
        own = json.loads(own_body)
        assert own_code == 200 and len(own) == 1, (own_code, own_body)
        other_code, other_body = rest(f"juara_clubs?id=eq.{other}&select=id,name", owner_token)
        assert other_code == 200 and json.loads(other_body) == [], (other_code, other_body)
        w_code, _ = rest(f"juara_clubs?id=eq.{other}", owner_token, "PATCH", {"name": "HACK"})
        assert w_code in (401, 403), w_code
        unchanged = db_query(f"select name from juara_clubs where id='{other}'")
        assert unchanged != "HACK", unchanged
        lines.append(f"TENANT_OWN_CLUB={own_code} rows=1 OTHER_READ={other_code} rows=0 OTHER_WRITE={w_code} unchanged={unchanged}")

        sd_role = db_query(f"select role from juara_club_members where user_id='{sd_id}' and club_id='{club}'")
        assert sd_role == "SPORTING_DIRECTOR", sd_role
        lines.append(f"TENANT_SD_ROLE={sd_role}")

        # Legacy-only encrypted fixture, SD rejected, Owner backfill without equity.
        legacy = encrypted({"leagueTier": "LIGA_2", "horizonYears": 1, "targetOutcome": "CHAMPION",
                            "tacticalDna": "HIGH_PRESSING", "formationMode": "AUTO", "baseFormation": "",
                            "philosophy": {"star": 25, "competitive": 45, "academy": 30},
                            "guardrails": {"equity": 100, "scrMax": 65}}, "vision_draft_enc", club)
        ssh_psql(f"UPDATE juara_clubs SET vision_draft_enc='{legacy}'::bytea, vision_finance_enc=NULL, "
                 f"vision_revision=0, vision_legacy_migrated=false WHERE id='{club}'::uuid;\n")
        args = {"p_club_id": club, "p_blob": "\\\\x00", "p_finance_blob": None, "p_expected_revision": 0}
        sd_code, sd_body = rest("rpc/juara_set_vision_draft", sd_token, "POST", args)
        assert "LEGACY_NOT_MIGRATED" in sd_body, (sd_code, sd_body)
        lines.append(f"LEGACY_SD_REJECTED={sd_code} code=LEGACY_NOT_MIGRATED")
        # Owner backfill must omit equity; use encrypted payload captured from fixture via app GET.
        ab("set", "viewport", "1440", "900")
        ab("open", f"{APP}/juara/login")
        ab("wait", "--load", "networkidle")
        ab("find", "label", "Email", "fill", OWNER_EMAIL)
        ab("find", "label", "Kata sandi", "fill", OWNER_PW)
        ab("find", "role", "button", "click", "--name", "Masuk")
        ab("wait", "--load", "networkidle")
        g = ev("(async()=>{const r=await fetch('/api/juara/v1/vision/draft',{cache:'no-store'});const b=await r.json();return {status:r.status,rev:b.revision,draft:b.draft}})()")
        assert g["status"] == 200 and g["draft"], g
        omitted = ev(f"""(async()=>{{const d={json.dumps(g['draft'])};delete d.guardrails.equity;const r=await fetch('/api/juara/v1/vision/draft',{{method:'PUT',headers:{{'Content-Type':'application/json'}},body:JSON.stringify({{draft:d,expectedRevision:{g['rev']}}})}});return {{status:r.status,body:await r.json()}}}})()""")
        assert omitted["status"] == 200, omitted
        owner_equity = ev("(async()=>{const r=await fetch('/api/juara/v1/vision/draft',{cache:'no-store'});const b=await r.json();return {equity:b.draft.guardrails.equity}})()")["equity"]
        assert owner_equity == 100, owner_equity
        lines.append(f"LEGACY_OWNER_BACKFILL={omitted['status']} equity={owner_equity}")

        # Concurrent HTTP with state assertion.
        rev = int(owner_equity and omitted["body"]["revision"])
        concurrent = ev(f"""(async()=>{{const api='/api/juara/v1/vision/draft';const g=await fetch(api,{{cache:'no-store'}});const b=await g.json();const put=async(s)=>{{const d={{...b.draft,philosophy:{{star:s,competitive:45,academy:100-45-s}}}};const r=await fetch(api,{{method:'PUT',headers:{{'Content-Type':'application/json'}},body:JSON.stringify({{draft:d,expectedRevision:{rev}}})}});return {{status:r.status,body:await r.json()}}}};const [a,c]=await Promise.all([put(31),put(22)]);const g2=await fetch(api,{{cache:'no-store'}});const f=await g2.json();return {{codes:[a.status,c.status],bodies:[a.body,c.body],final:f.revision,star:f.draft.philosophy.star}}}})()""")
        codes = sorted(concurrent["codes"])
        assert codes == [200, 409], concurrent
        winner = 31 if 31 in [b.get("philosophy", {}).get("star") for b in concurrent["bodies"]] else concurrent["final"]
        assert concurrent["final"] == rev + 1, (concurrent, rev)
        assert concurrent["star"] == 31, concurrent
        lines.append(f"PARALLEL={concurrent['codes']} final_revision={concurrent['final']} winner_star={concurrent['star']}")

        # Malformed finance: keep valid payload/revision, then corrupt ciphertext and PUT same valid payload.
        g = ev("(async()=>{const r=await fetch('/api/juara/v1/vision/draft',{cache:'no-store'});const b=await r.json();return {rev:b.revision,draft:b.draft}})()")
        cached_draft, cached_rev = json.dumps(g["draft"]), g["rev"]
        ssh_psql(f"UPDATE juara_clubs SET vision_finance_enc='\\xdeadbeef'::bytea WHERE id='{club}'::uuid;\n")
        malformed = ev(f"""(async()=>{{const r=await fetch('/api/juara/v1/vision/draft',{{method:'PUT',headers:{{'Content-Type':'application/json'}},body:JSON.stringify({{draft:{cached_draft},expectedRevision:{cached_rev}}})}});return {{status:r.status,body:await r.json()}}}})()""")
        db_rev = db_query(f"select vision_revision from juara_clubs where id='{club}'")
        assert malformed["status"] == 500 and malformed["body"].get("error") == "Draf lama tidak dapat dibaca", malformed
        assert db_rev == str(cached_rev), (db_rev, cached_rev)
        lines.append(f"MALFORMED_FINANCE={malformed['status']} error={malformed['body'].get('error')} revision_unchanged={db_rev}")

        lines.append(f"ELAPSED={time.monotonic()-started:.2f}s")
        lines.append("ASSERTIONS_PASS")
        rc = 0
    except Exception as e:
        import traceback
        lines.append(f"ASSERT_FAIL {type(e).__name__}: {e}")
        lines.append(traceback.format_exc().splitlines()[-2])
        lines.append(f"ELAPSED={time.monotonic()-started:.2f}s")
        rc = 1
    LOG.parent.mkdir(parents=True, exist_ok=True)
    LOG.write_text("\n".join(lines) + "\n")
    print("\n".join(lines))
    return rc


if __name__ == "__main__":
    sys.exit(main())
