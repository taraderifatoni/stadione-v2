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

### 2026-10-04 — Publish trending Feed and Reels test

- Purpose: Prove the full SerpAPI-to-editorial-to-Instagram workflow with one Feed and one Reels post.
- Changes: Selected a Google News trend from the official Kementerian Pemuda dan Olahraga source, created original Stadione artwork and motion, uploaded both assets to the protected CMS bucket, and published them through the durable Instagram worker.
- Affected components: Stadione CMS content records, Supabase Storage, Instagram publisher, and the `stadione.id` Instagram account.
- Deployment: No application release change; production remained on release `764a35c`.
- Verification: Feed media ID `17946297900070610` published as IMAGE/FEED at `https://www.instagram.com/p/DeE_hcfIyyx/`. Reels media ID `17996940846033736` published as VIDEO/REELS at `https://www.instagram.com/reel/DeE_iKrAFBn/`. Both CMS items and publish attempts are `PUBLISHED` with no error.
- Rollback: Archive or remove the two Instagram posts manually if editorial withdrawal is required; retain the CMS audit records.
- Remaining work: Complete Pinterest OAuth activation and reference search validation.


### 2026-10-04 — Automated SerpAPI editorial trend synchronization

- Purpose: Make sports discovery refresh automatically for the feed and Reels editorial workflow.
- Changes: Added a worker-authenticated internal trend-sync endpoint, a credential-safe runner, and a daily 06:15 WIB systemd timer. The sync caches Google Trends, Google News, and TikTok video references while recording monthly SerpAPI usage.
- Affected components: Internal CMS API, SerpAPI cache, usage ledger, and systemd trend-sync timer.
- Deployment: Release `764a35c` built successfully, deployed through TD Connector, and activated in production. `stadione-trend-sync.timer` is enabled for 06:15 WIB daily.
- Verification: The production worker completed successfully and cached 12 Google Trends items, 15 Google News items, and 10 TikTok video items. The usage ledger recorded 3 requests; configured status is true.
- Rollback: Disable the trend-sync timer and redeploy release `1829df5`.
- Remaining work: Complete Pinterest OAuth activation and validate visual-reference searches.


### 2026-10-04 — Connect sportsmarktz SerpAPI and repair TikTok discovery

- Purpose: Connect the requested SerpAPI account and make all editorial discovery sources operational.
- Changes: Configured the protected production key for `sportsmarktz.com`; corrected Bing Videos parsing from `videos_results` to `video_results`; removed unsupported `mkt=id-ID`; scoped video discovery to TikTok; and added a first-run fetch when no weekly cache exists.
- Affected components: Protected Stadione environment and `src/lib/cms/serpapi.ts`.
- Deployment: Pending build and production rollout of this commit.
- Verification: Account verified as `sportsmarktz.com` with 250 monthly searches and zero prior usage. Google Trends returned 29 items, Google News returned 100 items, and the corrected Bing Videos query returned 30 TikTok items.
- Rollback: Restore the environment backup created before key installation and redeploy the preceding release.
- Remaining work: Validate the CMS trend-pool synchronization after deployment and continue Pinterest OAuth activation.


### 2026-10-04 — SerpAPI account verification

- Purpose: Verify the available VPS SerpAPI credential before connecting it to Stadione.
- Changes: Temporarily tested the existing protected HaloBugar credential, then restored the Stadione environment backup after the account did not match the requested owner. No credential value was logged or committed.
- Affected components: Protected production environment only; no application source or database schema changed.
- Deployment: Stadione was restarted after the test and after rollback.
- Verification: SerpAPI identified the credential as `taradfworkspace.com`, Free Plan, usage 250/250, with zero searches left. It is not the requested `sportsmarktz.com` account. Stadione production was restored with no SerpAPI key; service is active and the public site returns HTTP 200.
- Rollback: Completed by restoring the timestamped environment backup created before the test.
- Remaining work: Install an active key belonging to `sportsmarktz.com`, then test Google Trends, Google News, and Bing video/TikTok discovery.


### 2026-10-04 — GitHub push and SerpAPI production readiness

- Purpose: Complete the pending source push and verify whether the production editorial radar can retrieve SerpAPI data.
- Changes:
  - Pushed `feat/stadione-editorial-scheduler` to `taraderifatoni/stadione-v2` through the VPS SSH identity after collaborator access was granted.
  - Inspected the production SerpAPI configuration and usage tables without exposing credentials.
- Affected components: GitHub feature branch, Stadione production environment, `stadione_api_usage`, and `stadione_trend_snapshots`.
- Deployment: No runtime code changed in this verification entry; production remains on release `bd4f4a2`.
- Verification:
  - GitHub remote branch resolved to commit `bd4f4a2ca7cf271a3fe192daeae0b46e60162d55`.
  - `SERPAPI_API_KEY` is missing from `/opt/stadione/.env.production`.
  - SerpAPI usage contains zero requests and the trend snapshot cache is empty.
  - The source integration is present but cannot call SerpAPI until the production key is configured.
- Rollback: Documentation-only record; revert this commit if the record must be removed.
- Remaining work:
  - Add `SERPAPI_API_KEY` to the protected production environment, restart `stadione.service`, and run one CMS trend-pool sync to verify Google Trends and Google News responses.
  - Do not place the key in Git, Plan Master, or chat.

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
  - The production symlink points to `/opt/stadione-releases/bd4f4a2`.
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
  - Editors must complete and approve each draft; the system intentionally does not invent facts or auto-publish unreviewed material.
