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
  - Active on the Stadione VPS through TD Connector.
  - `stadione-editorial-plan.timer` enabled with a daily 00:05 Asia/Jakarta schedule and persistent catch-up.
  - `stadione-cms-publish.timer` remains enabled and checks approved schedules every minute.
- Verification:
  - First run created 21 draft slots covering 2026-10-05 through 2026-10-11.
  - Each day contains slots from 08:00 through 20:00 WIB.
  - Second run created zero rows, confirming duplicate prevention.
  - Database contains 21 `DRAFT` plan items and two previously published Instagram test items.
  - Both editorial-plan service runs exited successfully.
- Rollback: Commit `8641c4e` is the implementation baseline. Revert the follow-up workflow commit to remove documentation-only rules; disable `stadione-editorial-plan.timer` and redeploy the previous release to remove the scheduler.
- Remaining work:
  - Push the feature branch to the verified GitHub remote after explicit remote authorization.
  - Editors must complete and approve each draft; the system intentionally does not invent facts or auto-publish unreviewed material.
