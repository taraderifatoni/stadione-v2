"""Regression for midnight seeding and preserving archived/published plan identities."""
import importlib.util
from datetime import datetime, timezone

spec = importlib.util.spec_from_file_location("calendar", "scripts/cms-seed-editorial-plan.py")
calendar = importlib.util.module_from_spec(spec)
spec.loader.exec_module(calendar)
rows = calendar.plan(datetime(2026, 10, 6, 17, 5, tzinfo=timezone.utc))
assert len(rows) == 24
assert [r["editorial_meta"]["plan_key"] for r in rows[:3]] == [
    "2026-10-07:mid-am", "2026-10-07:mid-noon", "2026-10-07:mid-pm"]
assert rows[0]["scheduled_at"] == "2026-10-07T01:00:00Z"
assert rows[-1]["editorial_meta"]["slot_date"] == "2026-10-14"
assert len({r["editorial_meta"]["plan_key"] for r in rows}) == 24
calls = []
existing = [{"editorial_meta": rows[0]["editorial_meta"]},
            {"editorial_meta": rows[1]["editorial_meta"]}]
def fake_api(method, path, body=None, prefer=None):
    if method == "GET": return existing
    calls.append((path, body))
    return body if path == "stadione_content_items" else None
calendar.api = fake_api
calendar.datetime = type("Clock", (datetime,), {"now": staticmethod(lambda zone: datetime(2026, 10, 7, 0, 5, tzinfo=calendar.WIB))})
calendar.main()
created = calls[0][1]
assert len(created) == 22
assert all(r["editorial_meta"]["plan_key"] not in {"2026-10-07:mid-am", "2026-10-07:mid-noon"} for r in created)
print("PASS: today + seven days, WIB boundary, stable identities, existing items preserved")
