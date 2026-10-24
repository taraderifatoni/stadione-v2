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
    # 12 feed posts/week. Existing CMS rows are never rewritten or removed.
    # Keep a 1–2 post/day ceiling; breaking-news additions remain editorially justified.
    0: [
        ("mon-am", "08:00", "30 Detik Paham Laga", "Satu momen pertandingan dan dampaknya bagi suporter", "Sepak Bola Eropa", "Reaction / explainer", "REEL"),
        ("mon-pm", "20:00", "Satu Keputusan, Efek Besar", "Keputusan pemain/pelatih yang mengubah cerita laga, dengan bukti", "Sepak Bola Indonesia", "Analisis ringan", "REEL"),
    ],
    1: [
        ("mid-am", "08:00", "Cerita dari Tribun", "Suara suporter atau komunitas dengan izin dan konteks yang jelas", "Komunitas", "UGC / kolaborasi", "REEL"),
    ],
    2: [
        ("mid-am", "08:00", "Laga dalam 3 Data", "Tiga statistik yang menjelaskan laga atau performa, bukan angka lepas", "Sepak Bola Eropa", "Data / utility", "CAROUSEL"),
        ("mid-pm", "20:00", "Satu Momen, Satu Cerita", "Kabar sepak bola Indonesia dijelaskan melalui konteks dan dampaknya", "Sepak Bola Indonesia", "News explainer", "REEL"),
    ],
    3: [
        ("mid-am", "08:00", "Lapangan Kita", "Cerita sepak bola lokal/akar rumput dengan verifikasi lokasi, tanggal, dan izin", "Tarkam & Komunitas", "Komunitas / UGC", "REEL"),
    ],
    4: [
        ("fri-am", "08:00", "Panduan Pekan Ini", "Jadwal, pemain, atau angka kunci yang berguna untuk diikuti", "Sepak Bola Indonesia", "Utility / data", "CAROUSEL"),
        ("fri-pm", "20:00", "Apa yang Dipertaruhkan?", "Preview laga berdasarkan jadwal terverifikasi dan satu pertanyaan utama", "Sepak Bola Indonesia", "Preview", "REEL"),
    ],
    5: [
        ("match-am", "08:00", "Reaksi Pagi Suporter", "Satu momen hasil semalam, lalu alasan momen itu penting", "Sepak Bola Eropa", "Reaction", "REEL"),
        ("match-pm", "20:00", "Tribun Pilih Siapa?", "Kolaborasi/polling spesifik yang memancing pilihan beralasan", "Komunitas", "Interaksi / kolaborasi", "REEL"),
    ],
    6: [
        ("match-am", "08:00", "Pemain yang Perlu Diikuti", "Kontribusi nyata pemain Indonesia atau pemain kunci pada laga hari itu", "Sepak Bola Indonesia", "Player story", "REEL"),
        ("match-pm", "20:00", "Setelah Peluit", "Reaksi pascalaga dengan fakta terkonfirmasi dan konteks singkat", "Sepak Bola Indonesia", "Post-match reaction", "REEL"),
    ],
}

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
