# Stadione Plan Master

This document is the shared operational history for Stadione. Every code, configuration, database, editorial automation, and production change must update this file and have a corresponding Git commit.

## Change record template

### YYYY-MM-DD — Change title

- Purpose:
- Changes:
- Affected components:
- Deployment:
- Verification:
- Rollback:
- Remaining work:

## Change history

### 2026-10-04 — Rolling editorial plan and Instagram scheduler verification

- Purpose: Ensure the Stadione editorial plan creates a continuous seven-day review queue and that approved Instagram schedules can publish automatically.
- Changes:
  - Added `scripts/cms-seed-editorial-plan.py` to maintain a rolling seven-day calendar.
  - Added `deploy/stadione-editorial-plan.service` and `deploy/stadione-editorial-plan.timer`.
  - The plan creates three review-only slots per day at 08:00, 13:00, and 20:00 Asia/Jakarta.
  - Every generated item remains `DRAFT`; publication still requires source verification, fact verification, media-rights clearance, assets, caption, and editor scheduling.
  - Duplicate prevention uses a stable `editorial_meta.plan_key` per date and slot.
- Affected components: Stadione CMS content tables, systemd editorial-plan timer, existing Instagram publish worker.
- Deployment:
  - Release `a58aa3b` was built and deployed through TD Connector on 2026-10-04.
  - The production symlink points to `/opt/stadione-releases/a58aa3b`.
  - `stadione-editorial-plan.timer` is enabled with a daily 00:05 Asia/Jakarta schedule and persistent catch-up.
  - `stadione-cms-publish.timer` is enabled and checks approved schedules every minute.
- Verification:
  - Production build completed successfully after loading the production environment.
  - First plan run created 21 draft slots covering 2026-10-05 through 2026-10-11.
  - Each day contains slots from 08:00 through 20:00 WIB.
  - Second run created zero rows, confirming duplicate prevention.
  - Database contains 21 `DRAFT` plan items and two previously published Instagram test items.
  - `stadione.service`, `stadione-cms-publish.timer`, and `stadione-editorial-plan.timer` are active.
  - Local production endpoint and `https://stadione.pro/` return HTTP 200.
  - `https://admin.stadione.pro/admin/cms` returns HTTP 307 to the expected authentication flow.
- Rollback: Point `/opt/stadione-current` back to `/opt/stadione-releases/62918b8`, restart `stadione.service`, and disable `stadione-editorial-plan.timer` if the rolling calendar must be removed.
- Remaining work:
  - Push `feat/stadione-editorial-scheduler` after the GitHub connection for `taraderifatoni/stadione-v2` receives write permission. The current connector reports `push: false`, and the VPS HTTPS remote has no GitHub credentials.
  - Editors must complete and approve each draft; the system intentionally does not invent facts or auto-publish unreviewed material.
