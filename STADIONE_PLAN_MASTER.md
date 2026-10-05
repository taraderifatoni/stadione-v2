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

### 2026-10-05 — Viral candidate queue production deployment

- Purpose: Record production activation of the owner-first candidate approval flow.
- Changes: Pushed commit `ce0fdb755b5144c89addbd32a6deb094ecf3f676`, created an integrity-checked database backup, applied the additive decision-ledger migration, built and activated immutable release `ce0fdb7`.
- Affected components: CMS approval radar, admin API, production database, and active Stadione release.
- Deployment: Active on release `ce0fdb7`; rollback release is `d461e99`.
- Verification: Migration table exists; production build passed; app and timer are active; local/public endpoints return HTTP 200 and admin returns expected HTTP 307 authentication redirect.
- Rollback: Repoint `/opt/stadione-current` to `/opt/stadione-releases/d461e99` and restart `stadione.service`.
- Remaining work: Owner decisions must be submitted from the authenticated CMS. No candidate was approved during deployment.



### 2026-10-05 — Viral candidate approval queue

- Purpose: Change the operating flow so Stadione presents source links first; production begins only after the owner approves Feed, Reels, both, or rejects the candidate.
- Changes:
  - Replaced the immediate “Buat paket konten” action with four explicit decisions: Approve Feed, Approve Reels, Approve Keduanya, and Reject.
  - Candidate cards now show a source link, a transparent potential score (high/medium/check), its reason, and a reminder that final preview approval remains mandatory.
  - Added an immutable decision ledger containing the candidate snapshot, decision, actor, source URL, and decision time.
  - Approval creates only the selected formats and records first-stage approval separately from the final content approval. Rejection creates no content.
- Affected components: CMS approval radar, admin CMS API, `stadione_trend_decisions`, and editorial activity logs.
- Deployment: Pending commit, database backup/migration, and immutable release deployment.
- Verification: Engine QA, TypeScript, targeted lint (zero errors), and production build passed.
- Rollback: Redeploy release `d461e99`; the additive decision table may remain unused.
- Remaining work: Verify the live decision endpoint using an authenticated owner session; no candidate has been approved automatically.



### 2026-10-05 — Multi-clip Reels production deployment

- Purpose: Record live rollout of the corrected real-video Reels pipeline.
- Changes: Pushed commit `d461e99fcc9c07d73431af81fb972be261ddb30f`, built immutable release `d461e99` directly in its release directory, activated it, and restarted Stadione.
- Affected components: `/opt/stadione-releases/d461e99`, `/opt/stadione-current`, Stadione app, CMS, content-engine timer, and video discovery display.
- Deployment: Active on `d461e99`; no database migration was required.
- Verification: Release build and TypeScript passed; local/public endpoints return HTTP 200; admin CMS returns expected HTTP 307 authentication redirect; app and engine timer are active; worker completed successfully and retained idempotent skip behavior. No post was auto-published.
- Rollback: Repoint `/opt/stadione-current` to `/opt/stadione-releases/b21a456` and restart `stadione.service`.
- Remaining work: A real editorial Reel still requires editor-selected clips with accessible media URLs, transcripts, timestamp ranges, and documented reuse rights. Discovery URLs alone remain review-only.



### 2026-10-05 — Real-source multi-clip Reels engine

- Purpose: Correct the Reels interpretation: Stadione repackages verified sports news using real clips from news portals, YouTube, TikTok, X, Instagram, or official sources; it does not generate AI footage.
- Changes:
  - Upgraded the source packet to version 3 with multiple `video_sources`, platform/page/media URLs, creator, transcript, credit, rights class/evidence/scope, and audio-rights metadata.
  - Each Reel scene now references a source ID plus source start/end timestamps and verified claim IDs.
  - Replaced the single-video renderer with an FFmpeg montage pipeline that downloads real media, cuts source ranges, reframes to 1080x1920, adds a persistent hook, changing scene captions, per-clip credits, concatenates clips, and normalizes audio.
  - Render metadata records source count, source platforms, timing, credits, and `ai_footage: false`.
  - Expanded the weekly single-query video discovery pool from TikTok-only to portal-adjacent YouTube, TikTok, X, and Instagram results while preserving SerpAPI cache and request-budget controls.
  - CMS guidance now documents the multi-source packet and explicitly states that AI footage is not used.
- Affected components: `engine.ts`, `engine-media.ts`, `content-engine.ts`, SerpAPI video parsing/query, CMS editor guidance, and engine QA.
- Deployment: Pending commit and immutable TD Connector deployment.
- Verification:
  - QA rendered a real synthetic moving-video montage from two declared sources/platforms with three independently timestamped clips, changing captions, visible source credits, normalized audio, 1080x1920 output, and no AI footage.
  - Source/rights/transcript/timestamp/claim gates, Feed carousel render, approval invalidation, TypeScript, targeted lint (zero errors), and Next.js production build passed.
- Rollback: Redeploy release `b21a456`.
- Remaining work: Production video results provide discovery/page URLs and remain `EDITORIAL_REVIEW`. An editor must supply an accessible media URL plus permission/license evidence before a real Reel can render or publish. Platform page availability alone is not permission.



### 2026-10-05 — Sports newsroom engine V2 production verification

- Purpose: Record the committed deployment and live verification required by the Stadione workflow.
- Changes: Pushed commit `b21a45630650e26826c0b97c4eb6a3e04da06641`; backed up the Stadione database; applied the additive engine migration; deployed immutable release `b21a456`; enabled the content-engine timer; and rebuilt inside the release directory to remove a workspace-specific Sharp external-module reference found by the first runtime probe.
- Affected components: Production database, `/opt/stadione-releases/b21a456`, `/opt/stadione-current`, `stadione.service`, and `stadione-content-engine.timer`.
- Deployment: Active on release `b21a456`. Timer research/recovery runs precede the existing 08:00/13:00/20:00 WIB editorial slots.
- Verification:
  - Backup `/opt/backups/db-2026-10-05-0101.sql.gz` is non-empty and passed gzip integrity testing.
  - Migration created `stadione_engine_runs` and `claim_stadione_engine_run`.
  - Worker completed successfully and returned review-only results.
  - One Feed slot and one Reel slot were evaluated and correctly BLOCKED because no current candidate matched their matrix pillars; no media was invented and nothing was published.
  - Repeating the same Feed run returned `input_already_processed_or_locked`, confirming idempotency.
  - Local and public home pages return HTTP 200; the admin CMS returns the expected HTTP 307 authentication redirect; app and timer are active.
- Rollback: Repoint `/opt/stadione-current` to `/opt/stadione-releases/764a35c`, restart `stadione.service`, and disable `stadione-content-engine.timer`.
- Remaining work: Editors can add a verified source packet and documented media rights in CMS, then generate and approve a real preview. Current cached news did not satisfy the selected matrix pillars, so the honest outcome is BLOCKED rather than a fabricated Feed or Reel.

### 2026-10-05 — Sports newsroom engine V2 (HaloBugar workflow adaptation)

- Purpose: Replace direct trend-to-post generation with a source-led sports newsroom workflow modeled on HaloBugar's latest gated engine while retaining Stadione's theme, schedule, SerpAPI budget controls, and mandatory editor approval.
- Changes:
  - Added durable engine runs, checkpoints, idempotent slot locks, bounded retry/recovery, and a source packet with claim ledger, freshness, event-status, independent-source, primary-source, 5W1H, narrative, and media-rights gates.
  - Added a Stadione sports voice contract, 5–10 slide 1080x1350 carousel rendering with measured text fit and bounded repair, and 1080x1920 Reel rendering that requires real source video, transcript, cleared audio/media rights, timed scenes, and normalized audio.
  - Added authenticated admin and internal generation routes, source-packet editing, explicit preview generation, editor approval tied to a content/render digest, and automatic approval invalidation after edits.
  - Reused the existing SerpAPI cache and atomic monthly budget; the engine does not make additional SerpAPI requests. Pinterest remains a visual benchmark only, not a factual or rights source.
  - Added the 07:00/12:00/19:00 WIB research worker timer ahead of the existing 08:00/13:00/20:00 WIB editorial slots. Generated items remain review-only and cannot publish until all gates and editor approval pass.
- Affected components: CMS admin workspace and API, Instagram publisher gate, content engine and media renderer, Supabase migration `20261005000014_stadione_engine_v2.sql`, content-engine systemd units, QA script, Sharp dependency.
- Deployment: Pending commit, database backup/migration, immutable release deployment, timer activation, and live verification through TD Connector.
- Verification:
  - Engine QA passed 13 areas: independent sources, claim evidence, freshness, future/final state, unsupported numbers, media rights, Reel source-video gate, approval and render digest invalidation, five-slide measured render, bounded overflow repair, real FFmpeg 1080x1920 video with audio, and timeline bounds.
  - `npx tsc --noEmit` passed.
  - Next.js 16.2.12 production build passed with all new CMS routes.
  - Repository-wide lint remains blocked by 271 pre-existing errors outside this change; targeted engine lint has no errors after the QA-script exemption, with only existing CMS `img` optimization warnings.
- Rollback: Before deployment, return to release `764a35c`. After deployment, repoint `/opt/stadione-current` to release `764a35c`, restart `stadione.service`, and disable `stadione-content-engine.timer`; the additive engine tables may remain unused.
- Remaining work: Apply and verify the migration, deploy the committed release, activate the worker, generate one honest Feed and Reel preview from cached trends, and keep previews BLOCKED when source evidence or documented media rights are incomplete. This vertical slice uses editor-controlled source-led narrative inputs; it does not claim autonomous AI copy-desk parity with HaloBugar.


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
