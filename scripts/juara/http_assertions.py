#!/usr/bin/env python3
"""Authenticated HTTP assertions for JUARA staging. Exits nonzero on failed assertion.

Boundary: auth=production GoTrue; REST/DB=isolated staging. No production writes.
"""
import base64
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
    assert OWNER_PW and SD_PW, "QA passwords required via env"


def run(cmd, stdin=None, timeout=90):
    return subprocess.run(cmd, input=stdin, text=True, capture_output=True, timeout=timeout)


def ab(session, *args, stdin=None):
    r = run([AB, "--session", session, *args], stdin)
    assert r.returncode == 0, f"agent-browser {session} failed: {args}: {r.stderr[-300:]}"
    return r.stdout


def ev(session, js):
    out = ab(session, "eval", "--stdin", stdin=js)
    start, end = out.find("{"), out.rfind("}")
    assert start >= 0 and end > start, f"no JSON from {session}: {out[-300:]}"
    return json.loads(out[start:end + 1])


def login(session, email, password):
    for attempt in range(3):
        ab(session, "close")
        ab(session, "set", "viewport", "1440", "900")
        ab(session, "open", f"{APP}/juara/login")
        ab(session, "wait", "--load", "networkidle")
        ab(session, "find", "label", "Email", "fill", email)
        ab(session, "find", "label", "Kata sandi", "fill", password)
        ab(session, "find", "role", "button", "click", "--name", "Masuk")
        ab(session, "wait", "--load", "networkidle")
        url = ab(session, "get", "url").strip().splitlines()[-1].rstrip("/")
        if url.endswith("/juara"):
            return
    raise AssertionError(f"login failed {session} after 3 attempts: {url}")


def anon_key():
    return next(l.split("=", 1)[1] for l in Path(".env.production.local").read_text().splitlines()
                if l.startswith("NEXT_PUBLIC_SUPABASE_ANON_KEY="))


def token_for(email, password):
    r = run(["curl", "-sS", "-X", "POST", f"{PROXY}/auth/v1/token?grant_type=password",
             "-H", f"apikey: {anon_key()}", "-H", "Content-Type: application/json",
             "-d", json.dumps({"email": email, "password": password})])
    data = json.loads(r.stdout)
    assert data.get("access_token"), f"token missing for {email}"
    return data["access_token"], data["user"]["id"]


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


def ssh_psql(sql):
    p = Path("/tmp/opencode/assert-seed.sql")
    p.write_text(sql)
    assert run(["scp", "-o", "ConnectTimeout=20", str(p), f"{VPS}:/tmp/assert-seed.sql"]).returncode == 0
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


def main():
    guard()
    started = time.monotonic()
    sha = run(["git", "rev-parse", "HEAD"]).stdout.strip()
    runner_sha = run(["sha256sum", str(Path(__file__).resolve())]).stdout.split()[0]
    lines = [f"# HTTP assertions {datetime.now(timezone.utc).isoformat()}",
             f"app={APP} proxy={PROXY} candidate_sha={sha} runner_sha256={runner_sha}",
             "isolation: auth=production GoTrue; REST/DB=isolated staging; no club real data"]
    try:
        club = db_query("select id from juara_clubs order by name limit 1")
        other = db_query("select id from juara_clubs order by name offset 1 limit 1")
        assert club and other and club != other, "fixture clubs missing"

        owner_token, owner_uid = token_for(OWNER_EMAIL, OWNER_PW)
        sd_token, sd_uid = token_for(SD_EMAIL, SD_PW)
        ssh_psql(f"INSERT INTO auth.users (id,email) VALUES ('{owner_uid}','{OWNER_EMAIL}'),('{sd_uid}','{SD_EMAIL}') ON CONFLICT (id) DO NOTHING;\n"
                 f"INSERT INTO juara_club_members (user_id,club_id,role) VALUES "
                 f"('{owner_uid}','{club}','OWNER'),('{sd_uid}','{club}','SPORTING_DIRECTOR') "
                 f"ON CONFLICT (user_id,club_id) DO UPDATE SET role=EXCLUDED.role;\n")

        owner_s, sd_s = "ownerassert", "sdassert"
        login(owner_s, OWNER_EMAIL, OWNER_PW)
        login(sd_s, SD_EMAIL, SD_PW)

        legacy = encrypted({"leagueTier": "LIGA_2", "horizonYears": 1, "targetOutcome": "CHAMPION",
                            "tacticalDna": "HIGH_PRESSING", "formationMode": "AUTO", "baseFormation": "",
                            "philosophy": {"star": 25, "competitive": 45, "academy": 30},
                            "guardrails": {"equity": 100, "scrMax": 65}}, "vision_draft_enc", club)
        ssh_psql(f"UPDATE juara_clubs SET vision_draft_enc='{legacy}'::bytea, vision_finance_enc=NULL, "
                 f"vision_revision=0, vision_legacy_migrated=false WHERE id='{club}'::uuid;\n")

        sd_get = ev(sd_s, "(async()=>{const r=await fetch('/api/juara/v1/vision/draft',{cache:'no-store'});const b=await r.json();return {status:r.status,rev:b.revision,keys:Object.keys(b.draft?.guardrails||{}),draft:b.draft}})()")
        assert sd_get["status"] == 200 and "equity" not in sd_get["keys"], sd_get
        sd_pre = ev(sd_s, f"""(async()=>{{const r=await fetch('/api/juara/v1/vision/draft',{{method:'PUT',headers:{{'Content-Type':'application/json'}},body:JSON.stringify({{draft:{json.dumps(sd_get['draft'])},expectedRevision:{sd_get['rev']}}})}});const b=await r.json();return {{status:r.status,code:b.code,error:b.error}}}})()""")
        assert sd_pre["status"] == 409 and sd_pre["code"] == "LEGACY_NOT_MIGRATED", sd_pre
        lines.append(f"SD_ROUTE_PRE_MIGRATION={sd_pre['status']} code={sd_pre['code']}")

        owner_get = ev(owner_s, "(async()=>{const r=await fetch('/api/juara/v1/vision/draft',{cache:'no-store'});const b=await r.json();return {status:r.status,rev:b.revision,draft:b.draft}})()")
        d = dict(owner_get["draft"])
        d["guardrails"] = dict(d["guardrails"])
        d["guardrails"].pop("equity", None)
        backfill = ev(owner_s, f"""(async()=>{{const r=await fetch('/api/juara/v1/vision/draft',{{method:'PUT',headers:{{'Content-Type':'application/json'}},body:JSON.stringify({{draft:{json.dumps(d)},expectedRevision:{owner_get['rev']}}})}});return {{status:r.status,body:await r.json()}}}})()""")
        assert backfill["status"] == 200, backfill
        owner_equity = ev(owner_s, "(async()=>{const r=await fetch('/api/juara/v1/vision/draft',{cache:'no-store'});const b=await r.json();return {equity:b.draft.guardrails.equity}})()")["equity"]
        assert owner_equity == 100, owner_equity
        lines.append(f"OWNER_BACKFILL={backfill['status']} equity={owner_equity}")

        sd_after_get = ev(sd_s, "(async()=>{const r=await fetch('/api/juara/v1/vision/draft',{cache:'no-store'});const b=await r.json();return {status:r.status,rev:b.revision,draft:b.draft}})()")
        d2 = dict(sd_after_get["draft"])
        d2["guardrails"] = dict(d2["guardrails"])
        d2["guardrails"]["scrMax"] = 63
        sd_after = ev(sd_s, f"""(async()=>{{const r=await fetch('/api/juara/v1/vision/draft',{{method:'PUT',headers:{{'Content-Type':'application/json'}},body:JSON.stringify({{draft:{json.dumps(d2)},expectedRevision:{sd_after_get['rev']}}})}});return {{status:r.status,body:await r.json()}}}})()""")
        assert sd_after["status"] == 200, sd_after
        final_owner = ev(owner_s, "(async()=>{const r=await fetch('/api/juara/v1/vision/draft',{cache:'no-store'});const b=await r.json();return {equity:b.draft.guardrails.equity,scrMax:b.draft.guardrails.scrMax,rev:b.revision}})()")
        assert final_owner["equity"] == 100 and final_owner["scrMax"] == 63, final_owner
        lines.append(f"SD_ROUTE_AFTER_BACKFILL={sd_after['status']} owner_equity={final_owner['equity']} owner_scrMax={final_owner['scrMax']}")

        # Restore public100 + finance200 omitted-equity case.
        pub = encrypted({"leagueTier": "LIGA_2", "horizonYears": 1, "targetOutcome": "CHAMPION",
                         "tacticalDna": "HIGH_PRESSING", "formationMode": "AUTO", "baseFormation": "",
                         "philosophy": {"star": 25, "competitive": 45, "academy": 30},
                         "guardrails": {"equity": 100, "scrMax": 65}}, "vision_draft_enc", club)
        fin = encrypted({"equity": 200}, "vision_finance_enc", club)
        ssh_psql(f"UPDATE juara_clubs SET vision_draft_enc='{pub}'::bytea, vision_finance_enc='{fin}'::bytea, "
                 f"vision_revision=0, vision_legacy_migrated=true WHERE id='{club}'::uuid;\n")
        g = ev(owner_s, "(async()=>{const r=await fetch('/api/juara/v1/vision/draft',{cache:'no-store'});const b=await r.json();return {rev:b.revision,draft:b.draft}})()")
        assert g["draft"]["guardrails"]["equity"] == 200, g
        d3 = dict(g["draft"]); d3["guardrails"] = dict(d3["guardrails"]); d3["guardrails"].pop("equity", None)
        omit = ev(owner_s, f"""(async()=>{{const r=await fetch('/api/juara/v1/vision/draft',{{method:'PUT',headers:{{'Content-Type':'application/json'}},body:JSON.stringify({{draft:{json.dumps(d3)},expectedRevision:{g['rev']}}})}});const b=await r.json();const g2=await fetch('/api/juara/v1/vision/draft',{{cache:'no-store'}});const a=await g2.json();return {{status:r.status,equity:a.draft.guardrails.equity}}}})()""")
        assert omit["status"] == 200 and omit["equity"] == 200, omit
        lines.append(f"FINANCE_100_200_OMITTED={omit['status']} retained={omit['equity']}")

        # Concurrent winner determined from actual 200 response.
        base = ev(owner_s, "(async()=>{const r=await fetch('/api/juara/v1/vision/draft',{cache:'no-store'});const b=await r.json();return {rev:b.revision,draft:b.draft}})()")
        rev = base["rev"]
        conc = ev(owner_s, f"""(async()=>{{const api='/api/juara/v1/vision/draft';const put=async(s)=>{{const d={{...{json.dumps(base['draft'])},philosophy:{{star:s,competitive:45,academy:100-45-s}}}};const r=await fetch(api,{{method:'PUT',headers:{{'Content-Type':'application/json'}},body:JSON.stringify({{draft:d,expectedRevision:{rev}}})}});return {{status:r.status,body:await r.json(),star:s}}}};const [a,b]=await Promise.all([put(31),put(22)]);const g=await fetch(api,{{cache:'no-store'}});const f=await g.json();return {{a:{{status:a.status,code:a.body.code,star:a.star}},b:{{status:b.status,code:b.body.code,star:b.star}},finalRev:f.revision,finalStar:f.draft.philosophy.star}}}})()""")
        responses = [conc["a"], conc["b"]]
        winners = [r for r in responses if r["status"] == 200]
        losers = [r for r in responses if r["status"] == 409]
        assert len(winners) == 1 and len(losers) == 1, conc
        assert losers[0]["code"] == "VERSION_CONFLICT", conc
        assert conc["finalRev"] == rev + 1 and conc["finalStar"] == winners[0]["star"], conc
        lines.append(f"PARALLEL=200/409 winner_star={winners[0]['star']} final_revision={conc['finalRev']} loser_code={losers[0]['code']}")

        # Tenant isolation with authenticated Bearer (Owner) and positive control.
        token = json.loads(run(["curl", "-sS", "-X", "POST", f"{PROXY}/auth/v1/token?grant_type=password",
                                "-H", f"apikey: {anon_key()}", "-H", "Content-Type: application/json",
                                "-d", json.dumps({"email": OWNER_EMAIL, "password": OWNER_PW})]).stdout)["access_token"]
        def rest(path, method="GET", body=None):
            h = ["-H", f"apikey: {anon_key()}", "-H", f"Authorization: Bearer {token}"]
            if body is not None:
                h += ["-H", "Content-Type: application/json"]
            r = run(["curl", "-sS", "-o", "/tmp/opencode/rest.out", "-w", "%{http_code}",
                     "--max-time", "25", "-X", method, f"{PROXY}/rest/v1/{path}", *h,
                     *(["-d", json.dumps(body)] if body is not None else [])])
            return int(r.stdout.strip() or 0), Path("/tmp/opencode/rest.out").read_text()
        own_code, own_body = rest(f"juara_clubs?id=eq.{club}&select=id,name")
        assert own_code == 200 and len(json.loads(own_body)) == 1, (own_code, own_body)
        other_code, other_body = rest(f"juara_clubs?id=eq.{other}&select=id,name")
        assert other_code == 200 and json.loads(other_body) == [], (other_code, other_body)
        w_code, _ = rest(f"juara_clubs?id=eq.{other}", "PATCH", {"name": "HACK"})
        assert w_code in (401, 403), w_code
        assert db_query(f"select name from juara_clubs where id='{other}'") != "HACK"
        lines.append(f"TENANT_OWNER own=200 rows=1 other=200 rows=0 patch={w_code} unchanged=true")

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
