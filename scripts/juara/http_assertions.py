#!/usr/bin/env python3
"""Authenticated HTTP assertions for JUARA draft CAS staging.

Uses agent-browser CLI; writes sanitized log and exits nonzero on any failed
assertion. Does not touch production. Run with the candidate app pointed at the
isolated staging proxy.
"""
import base64
import json
import os
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

AB = "/home/taradfs/.nvm/versions/node/v24.16.0/bin/agent-browser"
BASE = os.environ.get("JUARA_APP_URL", "http://127.0.0.1:3105")
EMAIL = os.environ.get("JUARA_OWNER_EMAIL", "demo@juara.stadione.pro")
PASSWORD = os.environ.get("JUARA_OWNER_PASSWORD", "")
SESSION = "httpassert"
LOG = Path("docs/juara/rehearsal-logs/http-assertions.log")
VPS = "root@31.97.49.146"
DBCONTAINER = "supabase-db-zurmq2lrm9hj510fmnj1seqr"
STAGE = "juara_evclose_stage"


def encrypted(value, column, keyring, club_id):
    from cryptography.hazmat.primitives.ciphers.aead import AESGCM
    import secrets
    kid, key = keyring
    aad = f"{club_id}|juara_clubs|{column}|{club_id}|{kid}".encode()
    nonce = secrets.token_bytes(12)
    ct = AESGCM(key).encrypt(nonce, json.dumps(value).encode(), aad)
    return "\\x" + (bytes([1, len(kid)]) + kid.encode() + nonce + ct).hex()


def seed_remote(sql):
    path = Path("/tmp/opencode/http-seed.sql")
    path.write_text(sql)
    run(["scp", "-o", "ConnectTimeout=20", str(path), f"{VPS}:/tmp/http-seed.sql"])
    r = run(["ssh", "-o", "ConnectTimeout=20", VPS,
             f"docker cp /tmp/http-seed.sql {DBCONTAINER}:/tmp/http-seed.sql && "
             f"docker exec {DBCONTAINER} psql -U postgres -d {STAGE} -q -v ON_ERROR_STOP=1 -f /tmp/http-seed.sql"])
    if r.returncode != 0:
        raise RuntimeError(f"seed failed: {r.stderr[-400:]}")


def load_keyring():
    text = Path(".env.production.local").read_text()
    keys = json.loads(next(l.split("=", 1)[1] for l in text.splitlines() if l.startswith("JUARA_ENCRYPTION_KEYS=")))
    kid = next(l.split("=", 1)[1] for l in text.splitlines() if l.startswith("JUARA_ACTIVE_KEY_ID="))
    return kid, base64.b64decode(keys[kid])


def club_id():
    r = run(["ssh", "-o", "ConnectTimeout=20", VPS, "cat /tmp/evclose-ids.txt"])
    for token in r.stdout.replace("\n", " ").split():
        if token.startswith("CLUB="):
            return token.split("=", 1)[1]
    raise RuntimeError("club id tidak ditemukan")


def db_revision(cid):
    r = run(["ssh", "-o", "ConnectTimeout=20", VPS,
             f"docker exec {DBCONTAINER} psql -U postgres -d {STAGE} -tA -q -c "
             f"\"select vision_revision from juara_clubs where id='{cid}'::uuid;\""])
    return r.stdout.strip()


def other_club_id(current):
    r = run(["ssh", "-o", "ConnectTimeout=20", VPS,
             f"docker exec {DBCONTAINER} psql -U postgres -d {STAGE} -tA -q -c "
             f"\"select id from juara_clubs where id<>'{current}'::uuid limit 1;\""])
    return r.stdout.strip()


def run(cmd, stdin=None):
    return subprocess.run(cmd, input=stdin, text=True, capture_output=True, timeout=90)


def ab(*args, stdin=None):
    r = run([AB, "--session", SESSION, *args], stdin)
    if r.returncode != 0:
        raise RuntimeError(f"agent-browser failed: {args}: {r.stderr[-400:]}")
    return r.stdout


def ev(js):
    out = ab("eval", "--stdin", stdin=js)
    start, end = out.find("{"), out.rfind("}")
    if start < 0 or end <= start:
        raise RuntimeError(f"no JSON from eval: {out[-400:]}")
    return json.loads(out[start:end + 1])


def main():
    LOG.parent.mkdir(parents=True, exist_ok=True)
    lines = [f"# HTTP assertions {datetime.now(timezone.utc).isoformat()}", f"base={BASE}"]
    if not PASSWORD:
        lines.append("ASSERT_FAIL missing JUARA_OWNER_PASSWORD")
        LOG.write_text("\n".join(lines) + "\n")
        return 1
    try:
        ab("set", "viewport", "1440", "900")
        ab("open", f"{BASE}/juara/login")
        ab("wait", "--load", "networkidle")
        ab("find", "label", "Email", "fill", EMAIL)
        ab("find", "label", "Kata sandi", "fill", PASSWORD)
        ab("find", "role", "button", "click", "--name", "Masuk")
        ab("wait", "--load", "networkidle")
        url = ab("get", "url").strip().splitlines()[-1]
        assert url.rstrip("/").endswith("/juara"), f"login failed: {url}"

        g = ev("(async()=>{const r=await fetch('/api/juara/v1/vision/draft',{cache:'no-store'});const b=await r.json();return {status:r.status,revision:b.revision,draft:b.draft}})()")
        assert g["status"] == 200, g
        lines.append(f"GET_status={g['status']} revision={g['revision']}")

        rev = g["revision"]
        put = ev(f"""(async()=>{{const d={{...{json.dumps(g['draft'])},guardrails:{{...{json.dumps(g['draft']['guardrails'])},equity:100}}}};const r=await fetch('/api/juara/v1/vision/draft',{{method:'PUT',headers:{{'Content-Type':'application/json'}},body:JSON.stringify({{draft:d,expectedRevision:{rev}}})}});return {{status:r.status,body:await r.json()}}}})()""")
        assert put["status"] == 200, put
        lines.append(f"PUT_equity100={put['status']} revision={put['body'].get('revision')}")

        after = ev("(async()=>{const r=await fetch('/api/juara/v1/vision/draft',{cache:'no-store'});const b=await r.json();return {status:r.status,revision:b.revision,equity:b.draft.guardrails.equity}})()")
        assert after["equity"] == 100, after
        lines.append(f"GET_after_backfill={after['status']} equity={after['equity']} revision={after['revision']}")

        noeq = ev("(async()=>{const r=await fetch('/api/juara/v1/vision/draft',{cache:'no-store'});const b=await r.json();const d=b.draft;delete d.guardrails.equity;const p=await fetch('/api/juara/v1/vision/draft',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({draft:d,expectedRevision:b.revision})});const g2=await fetch('/api/juara/v1/vision/draft',{cache:'no-store'});const b2=await g2.json();return {status:p.status,revision:b2.revision,equity:b2.draft.guardrails.equity}})()")
        assert noeq["status"] == 200 and noeq["equity"] == 100, noeq
        lines.append(f"PUT_omitted_equity={noeq['status']} equity_retained={noeq['equity']}")

        rev = noeq["revision"]
        concurrent = ev(f"""(async()=>{{const api='/api/juara/v1/vision/draft';const g=await fetch(api,{{cache:'no-store'}});const b=await g.json();const put=async(s)=>{{const d={{...b.draft,philosophy:{{star:s,competitive:45,academy:100-45-s}}}};const r=await fetch(api,{{method:'PUT',headers:{{'Content-Type':'application/json'}},body:JSON.stringify({{draft:d,expectedRevision:{rev}}})}});return {{status:r.status,body:await r.json()}}}};const [a,c]=await Promise.all([put(31),put(22)]);return {{codes:[a.status,c.status],bodies:[a.body,c.body]}}}})()""")
        codes = sorted(concurrent["codes"])
        assert codes == [200, 409], f"parallel expected 200/409, got {concurrent}"
        assert any(b.get("code") == "VERSION_CONFLICT" for b in concurrent["bodies"]), concurrent
        lines.append(f"PARALLEL={concurrent['codes']} conflict_code=VERSION_CONFLICT")

        keyring, cid = load_keyring(), club_id()
        public_hex = encrypted({"guardrails": {"equity": 100, "scrMax": 65}}, "vision_draft_enc", keyring, cid)
        finance_hex = encrypted({"equity": 200}, "vision_finance_enc", keyring, cid)
        seed_remote(
            f"UPDATE juara_clubs SET vision_draft_enc='{public_hex}'::bytea, "
            f"vision_finance_enc='{finance_hex}'::bytea, vision_revision=0, "
            f"vision_legacy_migrated=true WHERE id='{cid}'::uuid;\n"
        )
        before = ev("(async()=>{const r=await fetch('/api/juara/v1/vision/draft',{cache:'no-store'});const b=await r.json();return {status:r.status,revision:b.revision,equity:b.draft.guardrails.equity}})()")
        assert before["equity"] == 200, before
        omitted = ev("(async()=>{const r=await fetch('/api/juara/v1/vision/draft',{cache:'no-store'});const b=await r.json();const d=b.draft;delete d.guardrails.equity;const p=await fetch('/api/juara/v1/vision/draft',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({draft:d,expectedRevision:b.revision})});const g=await fetch('/api/juara/v1/vision/draft',{cache:'no-store'});const a=await g.json();return {status:p.status,equity:a.draft.guardrails.equity}})()")
        assert omitted["status"] == 200 and omitted["equity"] == 200, omitted
        lines.append(f"FINANCE_100_200 before=200 omitted_equity_status={omitted['status']} retained={omitted['equity']}")

        bad_rev = ev("(async()=>{const r=await fetch('/api/juara/v1/vision/draft',{cache:'no-store'});const b=await r.json();return {revision:b.revision}})()")["revision"]
        seed_remote(f"UPDATE juara_clubs SET vision_finance_enc='\\xdeadbeef'::bytea WHERE id='{cid}'::uuid;\n")
        malformed = ev("(async()=>{const api='/api/juara/v1/vision/draft';const g=await fetch(api,{cache:'no-store'});const b=await g.json();const p=await fetch(api,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({draft:b.draft,expectedRevision:b.revision})});const g2=await fetch(api,{cache:'no-store'});const a=await g2.json();return {status:p.status,revision:a.revision}})()")
        after_rev = db_revision(cid)
        lines.append(f"MALFORMED_RAW={malformed} bad_rev={bad_rev} db_rev={after_rev}")
        assert malformed["status"] >= 400, malformed
        assert after_rev == str(bad_rev), (after_rev, bad_rev)
        lines.append(f"MALFORMED_FINANCE status={malformed['status']} revision_unchanged={after_rev}")

        other = other_club_id(cid)
        anon = next(l.split("=", 1)[1] for l in Path(".env.production.local").read_text().splitlines()
                    if l.startswith("NEXT_PUBLIC_SUPABASE_ANON_KEY="))
        cross = ev(f"""(async()=>{{const h={{'apikey':{json.dumps(anon)}}};const r=await fetch('http://127.0.0.1:3104/rest/v1/juara_clubs?id=eq.{other}&select=id',{{headers:h,cache:'no-store'}});const b=await r.text();const p=await fetch('http://127.0.0.1:3104/rest/v1/juara_clubs?id=eq.{other}',{{method:'PATCH',headers:{{...h,'Content-Type':'application/json'}},body:JSON.stringify({{name:'HACK'}})}});return {{read:r.status,readBody:b,write:p.status}}}})()""")
        assert cross["read"] == 200 and cross["readBody"].strip() == "[]", cross
        assert cross["write"] in (401, 403), cross
        lines.append(f"CROSS_TENANT read={cross['read']} rows=0 write={cross['write']}")
        lines.append("ASSERTIONS_PASS")
        rc = 0
    except Exception as e:
        import traceback
        lines.append(f"ASSERT_FAIL {type(e).__name__}: {e}")
        lines.append(traceback.format_exc().splitlines()[-2])
        lines.append("DIAGNOSIS see app/proxy/PostgREST logs; timeout treated as failure, not evidence")
        rc = 1
    LOG.write_text("\n".join(lines) + "\n")
    print("\n".join(lines))
    return rc


if __name__ == "__main__":
    sys.exit(main())
