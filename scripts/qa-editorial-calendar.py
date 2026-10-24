"""Regression for the 12-slot weekly matrix, WIB boundaries, and safe seeding."""
import importlib.util
from datetime import datetime, timezone

spec = importlib.util.spec_from_file_location("calendar", "scripts/cms-seed-editorial-plan.py")
calendar = importlib.util.module_from_spec(spec)
spec.loader.exec_module(calendar)

# The seeder covers today plus seven days: 12 weekly slots plus one or two
# slots from the overlapping weekday at the end of the rolling window.
rows = calendar.plan(datetime(2026, 10, 26, 0, 0, tzinfo=timezone.utc))
assert len(rows) == 14
assert [r["editorial_meta"]["plan_key"] for r in rows[:2]] == [
    "2026-10-26:mon-am", "2026-10-26:mon-pm"]
assert rows[0]["scheduled_at"] == "2026-10-26T01:00:00Z"
assert len({r["editorial_meta"]["plan_key"] for r in rows}) == len(rows)

weekly = calendar.plan(datetime(2026, 10, 26, 0, 0, tzinfo=timezone.utc))[:12]
assert len(weekly) == 12
assert sum(r["format"] == "REEL" for r in weekly) == 10
assert sum(r["format"] == "CAROUSEL" for r in weekly) == 2
assert sum("kolaborasi" in r["editorial_meta"]["angle"].lower() or "ugc" in r["editorial_meta"]["angle"].lower() for r in weekly) >= 2

calls = []
main_rows = calendar.plan(datetime(2026, 10, 7, 0, 5, tzinfo=calendar.WIB))
existing = [{"editorial_meta": main_rows[0]["editorial_meta"]},
            {"editorial_meta": main_rows[1]["editorial_meta"]}]
def fake_api(method, path, body=None, prefer=None):
    if method == "GET": return existing
    calls.append((path, body))
    return body if path == "stadione_content_items" else None
calendar.api = fake_api
calendar.datetime = type("Clock", (datetime,), {"now": staticmethod(lambda zone: datetime(2026, 10, 7, 0, 5, tzinfo=calendar.WIB))})
calendar.main()
created = calls[0][1]
assert len(created) == len(main_rows) - 2
assert all(r["editorial_meta"]["plan_key"] not in {main_rows[0]["editorial_meta"]["plan_key"], main_rows[1]["editorial_meta"]["plan_key"]} for r in created)
print("PASS: 12 weekly slots, format mix, WIB boundaries, stable identities, existing items preserved")
