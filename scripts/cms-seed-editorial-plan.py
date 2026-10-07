#!/usr/bin/env python3
"""Maintain today's slots and the next seven days without replacing existing items."""
from __future__ import annotations

import json
import os
import sys
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, time, timedelta, timezone
from zoneinfo import ZoneInfo

WIB = ZoneInfo("Asia/Jakarta")
HORIZON_DAYS = 7

SLOTS = {
    0: [
        ("mon-am", "08:00", "Highlight / meme Eropa", "Rekap hasil semalam atau reaction atas hasil yang sudah terkonfirmasi", "Sepak Bola Eropa", "Recap / reaction", "CAROUSEL"),
        ("mon-noon", "13:00", "Non-bola pride", "Apresiasi prestasi atlet Indonesia atau momen akhir pekan yang terkonfirmasi", "Olahraga Indonesia", "Apresiasi", "CAROUSEL"),
        ("mon-pm", "20:00", "Tarkam of the week", "Momen komunitas pilihan dengan izin tertulis dan konteks lokasi/tanggal", "Tarkam & Komunitas", "UGC / momen", "REEL"),
    ],
    1: [
        ("mid-am", "08:00", "Update / nostalgia", "Hasil kompetisi jika ada; jika tidak, momen bersejarah yang dapat diverifikasi", "Sepak Bola Eropa", "Update / nostalgia", "REEL"),
        ("mid-noon", "13:00", "Sepak bola lokal", "Liga Indonesia, rumor dengan label jelas, atau bedah taktik berbasis data", "Sepak Bola Indonesia", "Update / analisis", "CAROUSEL"),
        ("mid-pm", "20:00", "Hot news / quotes", "Isu aktual atau kutipan langsung; verifikasi sumber primer dan konteks", "Sepak Bola Indonesia", "Kutipan / update", "REEL"),
    ],
    2: [],
    3: [],
    4: [
        ("fri-am", "08:00", "Preview non-bola", "Preview agenda F1, MotoGP, atau BWF; hasil hanya setelah sesi berlangsung", "Olahraga Indonesia", "Preview", "CAROUSEL"),
        ("fri-noon", "13:00", "Trivia / interaksi", "Polling big match atau tebak pemain dengan jawaban dan sumber internal", "Komunitas", "Interaksi", "CAROUSEL"),
        ("fri-pm", "20:00", "Kick-off / preview lokal", "Starting XI resmi atau preview laga sesuai jadwal aktual", "Sepak Bola Indonesia", "Preview / matchday", "REEL"),
    ],
    5: [
        ("match-am", "08:00", "Morning reaction", "Reaction hasil semalam, momen krusial, atau kontroversi dengan sumber terverifikasi", "Sepak Bola Eropa", "Reaction", "REEL"),
        ("match-noon", "13:00", "Tarkam / kearifan lokal", "UGC sepak bola komunitas; hanya tayang setelah izin, kredit, dan moderasi lolos", "Tarkam & Komunitas", "UGC", "REEL"),
        ("match-pm", "20:00", "Watchalong / live momen", "Live momen hanya dengan sumber real-time/editor; snapshot tren bukan feed live", "Sepak Bola Indonesia", "Live / reaction", "REEL"),
    ],
    6: [],
}
SLOTS[2] = SLOTS[1]
SLOTS[3] = SLOTS[1]
SLOTS[6] = SLOTS[5]

def api(method: str, path: str, body=None, prefer: str | None = None):
    base = os.environ["NEXT_PUBLIC_SUPABASE_URL"].rstrip("/")
    key = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
    payload = None if body is None else json.dumps(body, ensure_ascii=False).encode()
    headers = {"apikey": key, "Authorization": f"Bearer {key}", "Content-Type": "application/json"}
    if prefer:
        headers["Prefer"] = prefer
    request = urllib.request.Request(base + "/rest/v1/" + path, data=payload, headers=headers, method=method)
    try:
        with urllib.request.urlopen(request, timeout=30) as response:
            raw = response.read()
            return json.loads(raw) if raw else None
    except urllib.error.HTTPError as error:
        detail = error.read().decode("utf-8", "replace")
        raise RuntimeError(f"Supabase {method} {path} failed ({error.code}): {detail[:500]}") from error

def plan(now_wib: datetime):
    rows = []
    first_day = now_wib.astimezone(WIB).date()
    for offset in range(HORIZON_DAYS + 1):
        day = first_day + timedelta(days=offset)
        for slot_key, clock, label, theme, pillar, angle, content_format in SLOTS[day.weekday()]:
            hour, minute = map(int, clock.split(":"))
            scheduled_wib = datetime.combine(day, time(hour, minute), WIB)
            plan_key = f"{day.isoformat()}:{slot_key}"
            rows.append({
                "kind": "SOCIAL",
                "format": content_format,
                "title": f"{label} — {day.strftime('%d/%m/%Y')}",
                "caption": None,
                "hashtags": ["Stadione", "OlahragaIndonesia"],
                "platforms": ["INSTAGRAM"],
                "category": pillar,
                "status": "DRAFT",
                "assets": [],
                "editorial_meta": {
                    "origin": "WEEKLY_MATRIX_AUTO",
                    "standard": "STADIONE_SPORTS_DESK_V1",
                    "plan_key": plan_key,
                    "slot_date": day.isoformat(),
                    "slot_key": slot_key,
                    "slot_time_wib": clock,
                    "label": label,
                    "theme": theme,
                    "pillar": pillar,
                    "angle": angle,
                    "fact_check_status": "UNVERIFIED",
                    "rights_status": "PENDING",
                    "review_required": True,
                },
                "scheduled_at": scheduled_wib.astimezone(timezone.utc).isoformat().replace("+00:00", "Z"),
            })
    return rows

def main():
    now_wib = datetime.now(WIB)
    desired = plan(now_wib)
    existing_rows = api("GET", "stadione_content_items?select=editorial_meta&limit=1000") or []
    existing = {
        str(row.get("editorial_meta", {}).get("plan_key"))
        for row in existing_rows
        if isinstance(row.get("editorial_meta"), dict) and row["editorial_meta"].get("plan_key")
    }
    missing = [row for row in desired if row["editorial_meta"]["plan_key"] not in existing]
    if "--dry-run" in sys.argv:
        print(json.dumps({"checked_at_wib": now_wib.isoformat(), "desired": len(desired), "missing": len(missing)}, ensure_ascii=False))
        return
    created = []
    if missing:
        created = api("POST", "stadione_content_items", missing, "return=representation") or []
    api("POST", "stadione_editorial_runs", [{
        "run_date": now_wib.date().isoformat(),
        "status": "COMPLETED",
        "pool": {
            "origin": "WEEKLY_MATRIX_AUTO",
            "horizon_days": HORIZON_DAYS,
            "includes_today": True,
            "desired_slots": len(desired),
            "created_slots": len(created),
            "existing_slots": len(desired) - len(missing),
            "review_required": True,
        },
        "completed_at": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
    }], "return=minimal")
    print(json.dumps({"checked_at_wib": now_wib.isoformat(), "desired": len(desired), "created": len(created)}, ensure_ascii=False))

if __name__ == "__main__":
    main()
