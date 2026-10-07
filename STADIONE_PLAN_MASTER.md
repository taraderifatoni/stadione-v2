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

### 2026-10-06 — Public News pages

- Purpose: Make published CMS articles visible on the public Stadione website.
- Changes: Added `/news` listing, `/news/[slug]` article detail, a latest-news section on the homepage, and News links in bottom navigation and the side drawer.
- Data rules: Public pages read only `ARTICLE` rows with `PUBLISHED` status and a non-null slug. Article HTML is converted into safe text blocks instead of being injected into the page.
- Verification: Type checking and the production build passed. `/news`, the published final article, and the homepage news block return HTTP 200 and render the CMS title.
- Deployment: Release `/opt/stadione-releases/669ab00` deployed through TD Connector; `stadione.service` is active on the new release.
- Rollback: Repoint the production symlink to the preceding release and restart `stadione.service`.

### 2026-10-05 — Indonesia–Thailand final editorial override

- Purpose: Temporarily override the normal plan around the Indonesia vs Thailand final without changing the long-term weekly matrix.
- Schedule (Asia/Jakarta): From 23:00 on 5 October 2026, check hourly for up to four runs and publish the verified final result only after an official result is available; remain silent and avoid duplicates otherwise. On 6 October, run a flexible 08:00 Man of the Match feature, then resume normal editorial posts at approximately 13:00 and 19:00.
- Content rules: Use SerpAPI plus a primary/official source, verify final score and match events, and use the approved modern-newspaper carousel format: authentic-player cover, article-depth pages, short source label, pixel-safe wrapping, page counter only, no `EDISI DIGITAL`, and no promotional footer.
- Connectivity check: Instagram `@stadione.id` and the cached trend pool were read successfully before the four cloud automations were created.
- Deployment: Four enabled one-time/limited cloud automations; no application release required.
- Remaining work: Observe outcomes after each run, prevent duplicates, and let the standard editorial plan continue after the 19:00 slot on 6 October 2026.

### 2026-10-05 — Newspaper chrome simplification

- Purpose: Remove unnecessary interface-like labels from the newspaper artwork and leave more visual breathing room for the article itself.
- Changes: Removed `EDISI DIGITAL`, the footer rule, `BACA UTUH • SIMPAN • BAGIKAN`, and `STADIONE.PRO` from every carousel page. The upper-right label now contains only the page counter (for example `1/7`), and the body-safe area extends farther downward without adding a footer.
- Affected components: Newspaper carousel renderer and padel owner-preview assets.
- Deployment: Commit `6021e44` was pushed and activated as immutable release `/opt/stadione-releases/6021e44` through TD Connector. All seven assets in draft `be98acb9-2f33-4d43-9fba-674116b4cdbf` were regenerated/cleaned in place and the draft remains unpublished.
- Verification: TypeScript and targeted lint passed with zero errors; the production build compiled successfully and generated all 50 pages. Draft verification confirms seven cleaned assets with page counters only and no edition/footer copy. The public site returns HTTP 200, the admin route returns its expected HTTP 307 login redirect, and both the application service and editorial-plan timer are active.
- Rollback: Redeploy release `83b3a74`.
- Remaining work: Owner review is required before publication.

### 2026-10-05 — Pixel-safe newspaper wrapping and photo cover correction

- Purpose: Correct the missing photographic cover and prevent newspaper headlines/body copy from clipping at the right edge.
- Changes: Newspaper text now uses Sharp/Pango pixel measurement rather than character-count estimates, constrains every headline and paragraph to a 940 px safe column, wraps overflow downward automatically, and reduces font size only within defined readability limits. The padel cover is rebuilt from the authentic athletes with an AI-assisted newspaper collage background while typography remains deterministic and code-rendered.
- Affected components: Shared text measurement, newspaper carousel renderer, padel owner-preview assets, and render audit.
- Deployment: Commit `83b3a74` was pushed and activated as immutable release `/opt/stadione-releases/83b3a74` through TD Connector. Draft `be98acb9-2f33-4d43-9fba-674116b4cdbf` was regenerated in place with one AI-assisted authentic-athlete photo cover and six pixel-wrapped newspaper article pages; it remains `DRAFT` with no Meta publish request.
- Verification: TypeScript and targeted lint passed with zero errors; the production build compiled successfully and generated all 50 pages. All seven regenerated assets are public 1080×1350 JPEGs. Headline and body rendering is constrained to a 940 px safe width and the CMS lightbox can inspect each page. The public site returns HTTP 200, the admin route returns its expected HTTP 307 login redirect, and both the application service and editorial-plan timer are active.
- Rollback: Redeploy release `2347889`.
- Remaining work: Owner review is required before any Meta publication.

### 2026-10-05 — Newspaper article carousel implementation

- Purpose: Execute the approved direction by converting website-style articles into text-only, nostalgic newspaper carousels.
- Changes: Replaced the photo/poster carousel renderer with off-white newsprint pages, modern black typography, compact masthead/source/section hierarchy, thin editorial rules, restrained Stadione red accents, and automatic one/two-column article flow. The default editorial package now produces seven article sections instead of five short poster cards. Render audit records headline/body line counts and column count.
- Affected components: Editorial package generator, carousel JPEG renderer, source label, pagination limits, and render audit.
- Deployment: Commit `2347889` was pushed and activated as immutable release `/opt/stadione-releases/2347889` through TD Connector. Newspaper padel preview `be98acb9-2f33-4d43-9fba-674116b4cdbf` was created with seven JPEG pages and remains `DRAFT` without a Meta publish attempt.
- Verification: TypeScript and targeted lint passed with zero errors; the production build compiled successfully and generated all 50 pages. The seven-page draft stores complete article copy and URL-backed 4:5 assets. The public site returns HTTP 200, the admin route returns its expected HTTP 307 login redirect, and both the application service and editorial-plan timer are active.
- Rollback: Redeploy release `cd1e96a`.
- Remaining work: Review the first padel newspaper preview with the owner before publication; no automatic Meta publish is authorized for that draft.

### 2026-10-05 — Newspaper carousel design direction

- Purpose: Turn full website articles into nostalgic newspaper-style Instagram carousels instead of short poster headlines.
- Approved direction: Use an off-white newsprint tone, black/charcoal ink, modern highly readable typography, thin editorial rules, compact section labels, and restrained Stadione red accents. Slides are text-led pages without illustrations, icons, charts, or decorative sports graphics. Article depth must be preserved across as many slides as needed (normally 6–10): cover/lede, chronology, context, analysis, notable quote or evidence, implications, and closing discussion.
- Cover rule: The cover may use an authentic photograph only when the selected format calls for it; otherwise it remains text-led. Its vertical stack must flow naturally and compactly—masthead, edition/date, source label, section kicker, headline, dek, and optional credit—with normal line spacing and no large artificial gaps like the current padel cover. Attribution is shortened to `SUMBER: KEMENPORA`, `SUMBER: BBC NEWS`, `SUMBER: KOMPAS.COM`, or equivalent; author names and long URLs stay out of the artwork.
- Body-page rule: Layout full article paragraphs as readable newspaper columns or editorial blocks, with clear subheads and pull quotes. Text must never be fake filler, truncated into poster copy, or shrunk below a comfortable mobile reading size. Red is reserved for emphasis, source labels, rules, or selected words—not large decorative fields.
- Affected components: Future editorial package structure, article-to-carousel pagination, cover renderer, text-page renderer, source-label normalization, preview, and approval workflow.
- Deployment: Plan only; no renderer or draft changes in this entry.
- Verification: Owner supplied the visual reference and explicitly approved the newspaper/article direction, compact spacing, text-only body pages, and short source labels.
- Rollback: Not applicable; this entry records the design plan before implementation.
- Remaining work: Implement automatic article pagination and typography measurement, render a new padel preview from the full article, and obtain owner approval before publication.

### 2026-10-05 — Carousel zoom lightbox

- Purpose: Let editors read and inspect carousel artwork at a useful size before approval or publication.
- Changes: Every carousel preview slide with an image is now clickable. It opens a full-screen lightbox with a contained large preview, slide number, close button, outside-click and Escape-key dismissal, plus an `Open original size` link for pixel-level inspection.
- Affected components: CMS carousel slide preview and editorial review workflow.
- Deployment: Commit `cd1e96a` was pushed and activated as immutable release `/opt/stadione-releases/cd1e96a` through TD Connector.
- Verification: TypeScript and targeted lint passed with zero errors (five existing `<img>` warnings); the production build compiled successfully and generated all 50 pages. The public site returns HTTP 200, the admin route returns its expected HTTP 307 login redirect, and both the application service and editorial-plan timer are active.
- Rollback: Redeploy release `c0b5703`.
- Remaining work: Consider previous/next keyboard navigation if editors frequently review carousels longer than five slides.

### 2026-10-05 — Rendered carousel preview fix

- Purpose: Make generated carousel JPEGs visible inside the CMS editor instead of showing blank structural cards.
- Changes: The slide preview now reads rendered assets from `asset.url`, retains `asset.image_url` for unrendered source-photo structures, displays completed JPEGs without duplicate text overlays, and uses the correct 4:5 Instagram aspect ratio. The padel preview assets were also repaired to retain their headline/body metadata.
- Affected components: CMS carousel preview and draft `ee2813e7-545c-4d5d-b897-024469b4caa8`.
- Deployment: Commit `c0b5703` was pushed and activated as immutable release `/opt/stadione-releases/c0b5703` through TD Connector.
- Verification: TypeScript and targeted lint passed with zero errors (four existing `<img>` warnings); the production build compiled successfully and generated all 50 pages. Draft verification confirmed five URL-backed assets with complete headline/body metadata. The public site returns HTTP 200, the admin route returns its expected HTTP 307 login redirect, and both the application service and editorial-plan timer are active.
- Rollback: Redeploy release `ab96f85`.
- Remaining work: Refresh the open editor after deployment to reload the repaired asset payload.

### 2026-10-05 — Padel carousel owner preview

- Purpose: Let the owner review the new photojournalistic carousel format before any Instagram publication request.
- Changes: Created draft carousel `ee2813e7-545c-4d5d-b897-024469b4caa8` about Fadona Kusumawati/Fitriani Sabatini's Asian Games 2026 padel silver medal. Slide 1 uses the authentic official-event photograph with Stadione grading and editorial overlays; slides 2–5 are full-text cards. The paired caption and five JPEG assets are stored in CMS.
- Publication state: `DRAFT`; no Meta container or publish request was created. Owner approval is explicitly required before publishing this preview.
- Remaining work: Collect owner feedback, revise if requested, and only publish after explicit approval.

### 2026-10-05 — Photojournalistic carousel renderer

- Purpose: Match the approved sports-editorial benchmark: authentic photography edited into a branded cover, followed by strong full-text storytelling cards.
- Changes: Replaced the repeated-photo renderer with an attention-cropped, graded, full-bleed cover using the authentic source image, dark editorial gradient, gold/burgundy accents, and bottom-weighted headline. Subsequent slides render as textured full-text cards with larger typography, distinct hierarchy, and no repeated photograph. Render audit now records each slide's `photo` or `full_text` layout and whether an authentic photo was used.
- Affected components: Carousel media renderer, engine slide model, generated JPEG assets, and render audit metadata.
- Deployment: Commit `ab96f85` was pushed and activated as immutable release `/opt/stadione-releases/ab96f85` through TD Connector.
- Verification: TypeScript and targeted lint passed with zero errors; the production build compiled successfully and generated all 50 pages. The public site returns HTTP 200, the admin route returns its expected HTTP 307 login redirect, and both the application service and editorial-plan timer are active.
- Rollback: Redeploy release `b3efa20`.
- Remaining work: Extend the packet schema with multiple cleared photographs before enabling photo/text alternation beyond the single authentic cover image.

### 2026-10-05 — Authentic-photo carousel rhythm

- Purpose: Replace repetitive photo backgrounds and synthetic athlete likenesses with a stronger sports-editorial image/text rhythm.
- Changes: Carousel drafts now mark odd-numbered slides as photo-led and even-numbered slides as full-text. When only one authentic source photo exists, it is used on the cover only and every following slide is full-text; when multiple authentic photos exist, they alternate across odd slides. Athlete faces must come from authentic supplied/source assets and remain subject to the existing rights gate. The CMS preview now visibly distinguishes photo-led and full-text slides.
- Affected components: Editorial candidate model, trend-to-carousel mapping, carousel metadata, and CMS slide preview.
- Deployment: Commit `b3efa20` was pushed and activated as immutable release `/opt/stadione-releases/b3efa20` through TD Connector.
- Verification: TypeScript and targeted lint passed with zero errors (three existing `<img>` warnings); the production build compiled successfully and generated all 50 pages. The public site returns HTTP 200, the admin route returns its expected HTTP 307 login redirect, and both the application service and editorial-plan timer are active.
- Rollback: Redeploy release `4e98183`.
- Remaining work: Add multiple licensed photos to a candidate to exercise the alternating-photo path; a single portal thumbnail intentionally produces a cover-photo/text-only carousel.

### 2026-10-05 — Live five-slide carousel test

- Purpose: Validate the complete article-to-carousel workflow against the connected Instagram account.
- Changes: Created an editable website article and a five-slide original Stadione graphic carousel about Fadona Kusumawati/Fitriani Sabatini's Asian Games 2026 padel silver medal. Facts were checked against an official government release retained in private editorial metadata; no portal brand appears in the public caption. The graphics are original Stadione assets, avoiding reuse of the portal photograph.
- Publication: Instagram content `e0a769c2-22ec-4971-9770-d163f43fa43a` was published successfully as Meta media `18129762628793196` at `https://www.instagram.com/p/DeGwUNcAc-3/`. Its paired website article remains an editable draft (`50ba0447-7a45-4219-8550-19928df27434`).
- Verification: Meta returned `PUBLISHED`; the CMS record contains five public assets and the publish-attempt ledger records the final media ID.
- Remaining work: Review and publish the paired website article when the public article renderer is enabled.

### 2026-10-05 — Article and five-slide carousel drafts

- Purpose: Turn an approved viral candidate into a useful website article and Instagram carousel instead of a one-slide newsroom brief.
- Changes: The former Feed action now creates an editable article plus a five-slide carousel (cover, summary, context, what to watch, and discussion). Public copy does not expose aggregator or portal brand names and does not claim first-hand reporting; source URL, source name, snapshot, fact-check state, and image-rights state remain in private editorial metadata. Research and primary evidence may still be cited explicitly when an editor adds them.
- Affected components: Editorial package generator, viral-candidate modal copy, article draft, carousel draft, and internal provenance workflow.
- Deployment: Commit `4e98183` was pushed and activated as immutable release `/opt/stadione-releases/4e98183` through TD Connector.
- Verification: TypeScript and targeted lint passed with zero errors (three existing `<img>` warnings); the production build compiled successfully and generated all 50 pages. The public site returns HTTP 200, the admin route returns its expected HTTP 307 login redirect, and both the application service and editorial-plan timer are active.
- Rollback: Redeploy release `373ceb5`.
- Remaining work: Editors must verify facts and clear image rights before publication; the generator deliberately does not invent missing facts.

### 2026-10-05 — Bulk content actions and simplified editor

- Purpose: Reduce editor clutter, support safe bulk cleanup, and make suggested carousel drafts visually useful immediately.
- Changes: Added row selection, select-all, bulk archive, and permanent delete for non-scheduled/non-published content. Consolidated editor commands into one `Aksi` dropdown containing save, review, schedule/publish, archive, and delete. Suggested carousel drafts now attach the candidate portal thumbnail to their slide previews with source attribution and `PENDING` rights; publication remains blocked until rights are explicitly cleared.
- Affected components: CMS pipeline/editor UI, CMS content API, trend-to-carousel draft creation, and activity workflow.
- Deployment: Commit `373ceb5` was pushed and activated as immutable release `/opt/stadione-releases/373ceb5` through TD Connector.
- Verification: TypeScript and targeted lint passed with zero errors (three existing `<img>` warnings); the production build compiled successfully and generated all 50 pages. The protected delete endpoint returns the expected HTTP 401 without a session, the public site returns HTTP 200, the admin route returns its expected HTTP 307 login redirect, the app service is active, and `stadione-editorial-plan.timer` remains enabled with its next run scheduled.
- Rollback: Redeploy release `263cbdb`.
- Remaining work: Existing drafts keep their current assets; newly created suggested carousels receive portal thumbnails automatically when SerpAPI provides one.

### 2026-10-05 — Five-slot visual reference library

- Purpose: Provide a Pinterest-independent place for the owner to supply multiple design references according to editorial use.
- Changes: Replaced the Pinterest-only moodboard input with a monthly library capped at five references. Each reference has a purpose (match result, meme, news cover, statistics, or Reels) and accepts either any HTTPS link or a JPEG/PNG/WebP upload up to 10 MB. Uploaded files are removed from storage when their reference is deleted. References remain inspiration only and do not count as publication-rights evidence.
- Affected components: CMS reference UI/API, `stadione_visual_references`, and `stadione-cms` storage.
- Deployment: Commit `263cbdb` was pushed and activated as immutable release `/opt/stadione-releases/263cbdb` through TD Connector. Database backup `/opt/backups/db-2026-10-05-0219.sql.gz` was created before applying `database/10-visual-reference-library.sql`.
- Verification: TypeScript and targeted lint passed with zero errors (three pre-existing `<img>` warnings); the production build compiled and generated all 50 pages. The three new database columns are present, the protected references endpoint returns the expected HTTP 401 without a session, the public site returns HTTP 200, the admin route returns its expected HTTP 307 login redirect, and the app plus editorial timers are active.
- Rollback: Redeploy release `59b0a91`; the additive database columns may remain unused.
- Remaining work: Populate the five reference roles with the owner's preferred examples.

### 2026-10-05 — Manual viral suggestions alongside autopost

- Purpose: Keep the automated editorial pipeline while allowing the owner to select occasional viral stories and publish them manually.
- Changes: Renamed the old approval radar as a manual viral-suggestion workflow. Selecting Feed, Reels, or both now creates explicit `DRAFT` items marked `TREND_MANUAL` and `manual_publish`; these drafts are excluded from the plan-key autopost worker and remain editable/publishable from the CMS. The supplied Pinterest token was tested against the official v5 account endpoint but was not stored because Pinterest returned HTTP 401 authentication failure.
- Affected components: CMS viral-suggestion UI, trend-to-draft admin API, editorial activity log, and protected Pinterest configuration decision.
- Deployment: Commit `59b0a91` was pushed and activated as immutable release `/opt/stadione-releases/59b0a91` through TD Connector. The first restart briefly returned HTTP 502 because the build command had run in the working checkout rather than the new release directory; the same production build was rerun in the correct immutable release and service health was restored.
- Verification: TypeScript passed and targeted lint completed with zero errors (three pre-existing `<img>` warnings). The production build, including all 50 generated pages, passed with the protected VPS environment. `stadione.service` is active, the public site returns HTTP 200, and the admin CMS returns its expected HTTP 307 authentication redirect.
- Rollback: Redeploy release `65b8c9c`.
- Remaining work: Generate a new Pinterest token after the Pinterest application has active API access, then verify `/v5/user_account` before storing it in the protected server environment.

### 2026-10-05 — Quality-gated editorial autopilot

- Purpose: Remove manual candidate and preview approval so the editorial matrix runs automatically.
- Changes:
  - Automatic trend sync now persists the complete cached pool for the content engine.
  - Packages that pass every source, claim, freshness, media-rights, render, and format gate receive `AUTO_EDITORIAL` approval and are scheduled two minutes later for the existing publisher.
  - The worker no longer reports manual review as required.
  - Published or scheduled items no longer show the preview-engine action seen on the old published Reel.
- Affected components: Internal trend sync, content engine, generation worker response, CMS editor state, scheduler, and Instagram publisher.
- Deployment: Commit `65b8c9c` was pushed and activated as immutable release `/opt/stadione-releases/65b8c9c` through TD Connector. `stadione.service`, `stadione-content-engine.timer`, and `stadione-trend-sync.timer` are active.
- Verification: QA, TypeScript, targeted lint (zero errors), and production build passed. The live trend-sync rerun completed successfully at 09:00 WIB and persisted a cached pool containing 12 Google Trends items, 15 Google News items, and 10 Bing video references; SerpAPI usage was 5/100. The public site returned HTTP 200 and the admin CMS returned the expected HTTP 307 authentication redirect. The first deployment-time sync attempt briefly hit connection refused while the app was restarting; the post-start rerun succeeded without source or database errors.
- Rollback: Redeploy release `ce0fdb7`.
- Remaining work: Autopilot still blocks content when factual corroboration, accessible source footage, transcript, or documented reuse rights are missing. No OpenAI API key is configured, so the system does not invent source packets to force publication. The already-processed current slot was not republished; the next eligible editorial slot will be handled automatically.

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


### 2026-10-05 — Final FIFA ASEAN Cup: Indonesia vs Thailand

- Override breaking-news dijalankan setelah hasil akhir terkonfirmasi oleh SerpAPI, FIFA, dan AFC.
- Fakta publikasi: 2–2 setelah 120 menit; Indonesia menang adu penalti 4–2. Gol: Dean James 84', Iklas Sanron 87', Peeradol Chamrasamee 111', dan Elkan Baggott 116'.
- Paket terdiri dari artikel CMS utuh dan carousel Instagram tujuh halaman bergaya koran modern.
- Cover memakai foto pertandingan autentik dengan olah latar editorial berbantuan AI; identitas pemain dipertahankan.
- Carousel tidak memakai label `EDISI DIGITAL` maupun footer promosi. Semua teks memakai safe wrapping dan sumber singkat hanya pada cover.
- Event key idempoten: `fifa-asean-cup-2026-final-indonesia-thailand-2026-10-05` untuk mencegah duplikasi artikel maupun posting sosial.

### 2026-10-05 — Reels Timnas: Garuda Juara Asia Tenggara

- Reels vertikal 9:16 berdurasi 44 detik dibuat dari video autentik unggahan @ibachdim; tidak menggunakan video generatif AI.
- Materi disunting menjadi format Stadione dengan judul, skor 2–2 setelah 120 menit, hasil adu penalti 4–2, serta zona teks aman.
- Fakta pertandingan dan pencetak gol diverifikasi terhadap laporan resmi FIFA.
- Sumber video dan sumber fakta dicatat di caption serta metadata CMS.
- Publikasi memakai event key idempoten `fifa-asean-cup-2026-final-indonesia-thailand-reel-2026-10-05` untuk mencegah Reels duplikat.

### 2026-10-05 — Paket artikel untuk konten Reels

- Hero artikel memakai foto bersih tanpa overlay teks. Untuk Reels, hero diambil dari frame wajah atau scene paling representatif.
- Artikel pasangan Reels Irfan Bachdim diterbitkan dengan frame video bersih dan player Instagram di tengah artikel.
- Renderer News mendukung tag aman `<instagram-reel url="...">` agar thumbnail, playback, dan tautan Reels asli tampil di artikel.
- Tujuan embed adalah mengalirkan pembaca website ke pemutaran Reels asli dan menambah peluang view Instagram.

### 2026-10-06 — Man of the Match final Indonesia vs Thailand

- SerpAPI, laporan FIFA, ANTARA, dan Kompas digunakan untuk verifikasi pascalaga. Tidak ditemukan posting Man of the Match duplikat.
- Elkan Baggott dipilih karena mencetak gol penyama pada menit ke-116 dan berhasil sebagai eksekutor ketiga Indonesia dalam adu penalti.
- Artikel CMS dan carousel enam halaman bergaya koran modern diterbitkan; cover memakai foto asli, sumber singkat, safe wrapping, tanpa EDISI DIGITAL dan footer promosi.
- Instagram: https://www.instagram.com/p/DeJIq6FIHd7/
- Artikel: /news/elkan-baggott-man-of-the-match-final-indonesia-thailand-2026

### 2026-10-06 — Artikel pasangan dan sinkronisasi jadwal

- Artikel pasangan dibuat untuk posting Padel Fadona/Fitriani dan Indonesia 5 Emas; masing-masing sosial ditautkan lewat parent_id.
- Hero kedua artikel memakai foto bersih tanpa teks. Waktu publikasi artikel lama disamakan dengan waktu posting sosial terkait.
- Penjadwalan sosial berikutnya otomatis menyamakan status dan waktu artikel pasangan; artikel menjadi publik setelah publikasi Instagram berhasil.
- Artikel Padel: /news/perak-padel-fadona-fitriani-asian-games-2026
- Artikel lima emas: /news/indonesia-lima-emas-asian-games-2026

### 2026-10-06 — Hapus dan arsip tersinkron Meta

- Tombol konten Instagram yang sudah terbit berubah menjadi Hapus Meta + CMS. Sistem menghapus di Meta lebih dulu dan hanya menghapus data CMS setelah Meta berhasil.
- Konten CMS dipertahankan jika Meta mengembalikan kegagalan, sehingga tidak terjadi status sukses palsu atau kehilangan catatan.
- Instagram Graph API tidak menyediakan operasi arsip untuk media terbit. Karena itu, aksi arsip CMS pada media Instagram terbit ditolak dengan petunjuk untuk mengarsipkan lewat aplikasi Instagram atau menggunakan Hapus Meta + CMS.

### 2026-10-06 — Audit konsistensi dan produksi slot siang normal

- Ketentuan pemilik: permintaan ad hoc adalah additional post; tidak mengubah plan_key, waktu, atau konten slot rutin. Paket ini adalah slot normal `2026-10-06:mid-noon`, bukan tambahan.
- Audit: CMS fallback masih menampilkan scaffold burgundy dari editorial.ts; draf Prabowo belum merupakan artikel terverifikasi. Carousel Elkan dibuat lewat skrip terpisah dengan teks ringkas, bukan artikel utuh. Standar yang tidak sama antarrute adalah penyebab ketidak-konsistenan.
- Audit otomasi: timer aktif bukan bukti produksi berhasil. Slot rutin 6 Oktober tidak tersedia; slot masa depan tetap dipertahankan. Research otomatis masih mengembalikan UNCONFIRMED dan publisher legacy yang tidak bertanda V2 melewati gate engine. Belum mengklaim perbaikan seluruh pipeline.
- Produksi siang: SerpAPI google_news memilih laporan aktual ILeague tentang lima laga Persija dan fokus kebugaran Shin Tae-yong. Jadwal, hasil awal musim, dan pernyataan pemulihan dicocokkan dengan Tangsel Pos; ini pratinjau, bukan hasil laga Oktober. Tidak memakai viral-score buatan.
- Dua sumber dicatat apa adanya: operator liga primer dan media sekunder untuk corroboration; bukan dua laporan primer independen. Metadata foto menyatakan pemakaian editorial dan sumber, bukan lisensi pembelian yang tidak dimiliki.
- Shared engine-media.ts sekarang memakai foto asli pada cover, paper-tone cream, modern font, sumber singkat hanya cover, tanpa EDISI DIGITAL/footer promosi. Margin 72 px dan kotak teks diukur; ukuran body minimal 32 px. Overflow menghentikan render, bukan memotong teks.
- Gate carousel menerima body artikel hingga 1200 karakter per bagian (Reels tetap 360); batas baca ditentukan render pixel. Skrip run-noon-persija.cjs menghasilkan artikel dan lima JPEG dari body identik, memeriksa duplikat CMS + Instagram, memakai claim ledger V2/digest/approval, dan menyerahkan publikasi ke publisher CMS berlease. Tidak memanggil media_publish sendiri.
- Verifikasi pra-deploy: qa-engine.cjs lulus (termasuk foto cover, source hanya cover, teks artikel >360 karakter, overflow fail-closed, montage regresi); tsc --noEmit dan git diff --check lulus. Kelima halaman Persija diperiksa visual, 344 kata, font body 36 px, safe-wrap semuanya lulus.
- Komponen: src/lib/cms/engine.ts, engine-media.ts, scripts/qa-engine.cjs, run-noon-persija.cjs, stadione_content_items/stadione-cms storage. Deploy aplikasi direncanakan via TD setelah commit; bukti live/publication ditambahkan setelah sukses.
- Rollback kode: ab9ff6f; jangan menjalankan ulang media_publish untuk rollback konten yang sudah terbit. Identitas event/plan harus tetap disimpan untuk dedupe.
- Remaining: satukan fallback preview dan semua jalur legacy/manual, lengkapi writer fakta otomatis dan pagination artikel, pertahankan waktu slot di auto_schedule, tambahkan pengujian kualitas editorial end-to-end, dan pulihkan autentikasi git push. Belum mengubah posting lama atau slot masa depan.

### 2026-10-06 — Gate versi JSONB sebelum publikasi siang

- Live preparation masih DRAFT; belum ada permintaan Meta terkirim. Gate mendeteksi packet/approval digest berubah akibat pengurutan ulang kunci objek oleh PostgreSQL JSONB.
- packetDigest/contentDigest memakai canonical sorted-object JSON dengan urutan array tetap. Uji regresi memastikan key reorder tidak mengubah digest, sedangkan perubahan nilai tetap membatalkannya.
- Paket noon hanya dihitung ulang approval-nya jika digest canonical sumber tersimpan identik dengan packet yang telah diperiksa visual. Tidak menonaktifkan gate atau melewati approval.
- Affected: engine.ts, qa-engine.cjs, run-noon-persija.cjs. Menunggu commit/build/deploy berikutnya sebelum menjadwalkan. Rollback rilis sebelumnya ab9ff6f; rilis 7499437 belum menerbitkan konten.

### 2026-10-06 — Bukti live slot siang Persija

- Deploy aplikasi commit 6fd1998 ke /opt/stadione-releases/6fd1998 melalui TD; stadione-current menunjuk rilis tersebut, stadione.service aktif. Build Next, TypeScript, dan QA engine lulus. Rilis sebelumnya 7499437 tersedia, rollback sebelum rangkaian perubahan ab9ff6f.
- Publikasi CMS normal slot siang berhasil pukul 13:52 WIB: social 32ce976a-6040-41af-be88-a7bf3c884235, article ed866a29-33f9-4a05-8e8e-4a4d686f62f7, keduanya PUBLISHED pada 2026-10-06T06:52:38.775Z tanpa publish_error.
- Instagram Graph mengonfirmasi CAROUSEL_ALBUM dengan lima IMAGE children, media_id 17952401802083527: https://www.instagram.com/p/DeJLw1boJIO/. Publish attempt PUBLISHED, error_message null. Tidak menjalankan media_publish langsung atau mengirim ulang.
- Artikel publik HTTP 200, judul/body tampil dan hero clean tanpa overlay: https://stadione.pro/news/persija-jadwal-padat-oktober-2026-kebugaran. Artikel dan sosial memiliki timestamp yang sama.
- 21 slot rutin masa depan tidak diubah; tidak ada paket V2 lain yang memiliki approval untuk dimigrasikan. Request tambahan tetap terpisah dari slot normal.
- Push origin HEAD telah dicoba: gagal karena autentikasi HTTPS GitHub di VPS tidak tersedia (terminal prompts disabled). Commit berada di repo VPS, deploy berhasil, tetapi belum tersalin ke GitHub. Jangan menyatakan push berhasil.
- Audit pipeline lengkap masih merupakan pekerjaan lanjutan sebagaimana daftar remaining di atas; keberhasilan satu slot ini bukan bukti semua produksi otomatis sudah beres.

### 2026-10-06 — Push GitHub berhasil lewat SSH dan diagnosis cover

- GitHub role taracorp memiliki push, tetapi token aplikasi HTTPS/CLI/connector menolak write dengan 403 Resource not accessible by integration. Tidak memperluas scope aplikasi dan tidak menyalin token/key ke chat atau Git.
- SSH yang telah dikonfigurasi di VPS mengautentikasi sebagai taracorp. Fast-forward push ke taraderifatoni/stadione-v2 branch feat/stadione-editorial-scheduler berhasil dari 285ab44 ke 0a6cee3d543ad92ad97831de67c0d7735c26b917; ls-remote mengonfirmasi SHA identik. Semua commit asli, aset, dan riwayat rollback ikut terkirim, bukan snapshot ulang atau force push.
- Config repositori: remote.origin.pushurl memakai git@github.com:taraderifatoni/stadione-v2.git; fetch URL HTTPS tetap dipertahankan. Jalur SSH menggunakan key/known_hosts yang sudah tersedia, tanpa membuat credential baru. Rollback konfigurasi: git config --unset remote.origin.pushurl.
- Cover Persija tidak sesuai cover yang pemilik approve: renderer 7499437 memakai foto rectangle 936x586 di atas kertas cream, bukan foto atlet autentik yang menyatu dengan kolase/tekstur koran dan aksen merah editorial. Ini kesalahan implementasi desain, bukan akibat kompresi Instagram.
- Standar cover yang harus dipertahankan: wajah dan subjek asli; olah background editorial/collage sesuai acuan cover padel/Timnas; judul compact dengan wrapping; sumber singkat; tanpa EDISI DIGITAL/footer. Paper-tone text-only berlaku untuk halaman artikel setelah cover, bukan alasan mengganti cover menjadi foto kotak biasa.
- Scope turn ini: push dan diagnosis. Belum mengubah renderer, aset CMS, jadwal rutin, atau menghapus/menerbitkan ulang posting Persija. Koreksi desain dan tindakan pada posting live menunggu arahan pemilik.
- Deployment aplikasi tetap 6fd1998, tidak ada build/restart karena perubahan ini hanya konfigurasi Git dan dokumentasi. Verifikasi berikutnya membandingkan HEAD lokal dan remote setelah commit entry ini.

### 2026-10-06 — Preview koreksi cover Persija, belum dipublikasikan

- Pemilik menyetujui pembuatan ulang cover sebagai preview saja. Tidak mengganti carousel yang sudah tayang, tidak menerbitkan ulang, dan tidak mengubah slot rutin atau konten CMS.
- Foto atlet autentik dari ILeague menjadi referensi gambar; background diolah dengan AI menjadi kolase stadion, sobekan koran, charcoal dan merah Stadione. Acuan gaya: assets/editorial/indonesia-thailand-final-cover.jpg. Ini bukan klaim bahwa setiap piksel wajah/jersey tetap identik atau bahwa lisensi foto telah diperoleh.
- Aset hasil: assets/editorial/previews/persija-cover-preview-20261006.png (1122x1402, PNG; SHA256 8ad16753781f9c2782b4602015990ef7dc1de2f17f257717aa763fd84036b0d0). Resep dan sumber dicatat di assets/editorial/previews/persija-cover-preview-20261006.md.
- Pemeriksaan visual: subjek menyatu dengan background, bukan foto rectangle di atas cream; judul compact dan terbungkus, sumber singkat ILEAGUE.ID, tanpa EDISI DIGITAL, footer promosi, atau teks terpotong. Preview sudah ditampilkan kepada pemilik; persetujuan desain akhir belum diberikan.
- Ini adalah aset preview, bukan perbaikan shared renderer atau bukti konsistensi seluruh pipeline. Production tetap 6fd1998. Rollback aset/dokumentasi ke fffb2bd; jangan menghapus atau menerbitkan ulang konten live untuk rollback preview.
- Commit aset, resep, dan catatan ini ke branch feat/stadione-editorial-scheduler, lalu push melalui SSH VPS yang sudah terverifikasi; cocokkan HEAD dengan remote. Tidak memerlukan deploy/restart aplikasi.

### 2026-10-06 — Kunci gaya carousel dan revisi Persija yang diminta pemilik

- Pemilik mengotorisasi publikasi ulang Persija memakai cover preview 8ad1675 dan meminta gaya dikunci di engine. Ini additional design revision, bukan pengganti plan_key normal atau artikel website baru. Posting live sebelumnya dipertahankan sebagai riwayat; Instagram tidak dapat mengganti gambar carousel yang sudah terbit.
- Kontrak tunggal STADIONE_NEWSPAPER_COLLAGE_V1 di carousel-style.ts: cover lengkap memakai foto atlet sebagai acuan dan background kolase koran/charcoal/merah; artikel sesudahnya cream, modern sans, teks-only dengan margin 72px dan body minimal 32px; sumber singkat hanya cover, tanpa EDISI DIGITAL/footer promosi. Brief tersimpan bersama metadata engine.
- Cover terikat melalui checksum, foto sumber, headline, dek, sumber dan catatan review. Renderer hanya mengekspor artwork yang sudah disiapkan menjadi JPEG 1080x1350, tidak membuat ulang cover/foto kotak. Input salah rasio atau checksum ditolak. Setiap halaman menyimpan checksum gambar dan digest naskah.
- Publisher CMS memeriksa kontrak untuk semua carousel, termasuk jalur manual/scheduler/legacy, lalu mengunduh dan memeriksa checksum serta dimensi sebelum membuat kontainer Meta. Label standar legacy tidak lagi melewati pemeriksaan gaya. Scaffold naskah generik juga ditolak. Tidak mengubah kode/jadwal Reels.
- CMS tidak lagi mensimulasikan preview burgundy dari scaffold/raw photo. Jika belum ada render, kartu menyatakan Belum dirender; zoom tetap membuka hasil JPEG yang sebenarnya.
- scripts/republish-persija-style.cjs memakai ID revisi stabil dan publisher CMS berlease, tidak memanggil media_publish langsung. Revisi memakai parent artikel yang sama, approval dari permintaan pemilik, snapshot slot rutin sebelum/sesudah, dan verifikasi akun/5 children. Draf revisi tidak dijadwalkan otomatis sebelum pemeriksaan hasil.
- Affected: carousel-style.ts, engine.ts, engine-media.ts, content-engine.ts, publish-instagram.ts, content-workspace.tsx, qa-engine.cjs, cms-load.cjs, run-noon-persija.cjs, republish-persija-style.cjs, resep preview, metadata/aset revisi CMS. Tidak mengubah konfigurasi timer, tanggal atau plan_key slot rutin.
- QA awal lokal lulus: fakta/digest, cover-source/text binding, larangan fallback/legacy, checksum cover/aset, rasio, full-article safe-wrap, dan regresi montage Reels; tsc --noEmit serta git diff --check lulus. Build dan bukti live ditambahkan setelah commit/deploy TD. Rollback kode ke 1418937 (rilis aplikasi sebelumnya 6fd1998), bukan menjalankan ulang publikasi.
- Batas operasional: engine membutuhkan artwork cover editorial yang telah disiapkan workflow gambar, bukan menebak kolase dari foto mentah. VPS tidak memiliki provider gambar AI terkonfigurasi; tidak mengklaim generator AI otomatis server sudah tersedia. Paket tanpa artwork tetap membutuhkan produksi cover dan akan ditolak sebelum publikasi. Ini memastikan desain tidak diam-diam turun ke template lama; pekerjaan writer/research otomatis dari audit sebelumnya tetap belum diselesaikan.
- Bukti pra-deploy VPS: seluruh checksum source identik dengan workspace; 20 kategori QA lulus, tsc --noEmit, git diff --check, dan production build Next 16.2.12 lulus. Tidak ada SOCIAL berstatus SCHEDULED sebelum perubahan dan 21 draf slot rutin tetap tersedia. Deploy/publikasi menunggu commit rangkaian ini; bukti hasil ditambahkan sesudah sukses.

### 2026-10-06 — Bukti deploy pengunci gaya dan publikasi ulang Persija

- Kode/kontrak committed dan pushed melalui SSH: f11dd3e2753824bfc323ebcf3374b70d5407755c, remote branch feat/stadione-editorial-scheduler mengonfirmasi SHA identik sebelum deploy. Release /opt/stadione-releases/f11dd3e dibuat dari git archive dan build yang lulus; stadione-current menunjuk rilis tersebut dan stadione.service aktif. Hanya service aplikasi direstart; timer tidak diubah. /news dan artikel Persija publik HTTP 200.
- Persija revised social 0c4cedd3-0ea4-487a-a6f2-04bfa79d3fea berhasil terbit 6 Oktober pukul 16:39:59 WIB (2026-10-06T09:39:59.066Z), media_id 17989612254099591: https://www.instagram.com/p/DeJe4e5IJi3/. Meta mengonfirmasi akun stadione.id, CAROUSEL_ALBUM dan 5 IMAGE children. Item serta publish attempt PUBLISHED, publish_error/error_message null.
- Cover input SHA256 8ad16753781f9c2782b4602015990ef7dc1de2f17f257717aa763fd84036b0d0 persis PNG preview yang disetujui. JPEG hasil ekspor SHA256 315e472e38cfcb8242b0523772024a57fbe44b0f2e441ca1cb7bc75616815cfa, 1080x1350. Tidak menggambar ulang atau menimpa tulisan cover. Semua aset di storage diverifikasi checksum/dimensi sebelum dan sesudah terbit.
- Halaman 2–5 memiliki naskah DAN byte gambar identik dengan empat halaman artikel sebelumnya. Body 36px, headline 60px, margin 72px; audit area aman lulus. Cover berubah, isi utuh dipertahankan tanpa template burgundy, EDISI DIGITAL atau footer promosi.
- Revisi memakai parent artikel ed866a29-33f9-4a05-8e8e-4a4d686f62f7 yang sama, additional_post=true, plan_key additional:persija-approved-newspaper-collage-20261006-v1. Snapshot semua slot rutin sebelum/sesudah identik. Tidak membuat artikel duplikat, mengubah jadwal rutin, atau memutasi posting asli 17952401802083527. Posting lama masih tayang; tidak ada penghapusan/arsip Meta yang diminta/dilakukan dalam rangkaian ini.
- Uji idempotensi live: menjalankan prepare kembali menghasilkan skipped dengan ID revisi yang sama; menjalankan publisher kembali menghasilkan PUBLISHED/mediaId identik, tanpa mengirim permintaan publish baru. Artifact operasional audit/snapshot ada di .tools/persija-approved-newspaper-collage-20261006-v1 (tidak dikomit, tanpa kredensial).
- Bukti ini ditambahkan dalam follow-up commit dokumentasi dan dipush; aplikasi tetap f11dd3e, tidak perlu redeploy untuk catatan hasil. Rollback aplikasi ke 6fd1998 melalui symlink/restart tidak akan menghapus konten Instagram; jangan menjalankan ulang publisher sebagai rollback. Pengunci gaya sudah aktif; produksi artwork AI otomatis di VPS dan kelengkapan writer/research tetap sebagaimana batas operasional di atas.

### 2026-10-06 — Produksi slot normal malam Persib/Menalo

- Permintaan pemilik menjalankan slot sore/malam normal, bukan additional post. Ditargetkan plan_key 2026-10-06:mid-pm pukul 20:00 WIB; pilar Sepak Bola Indonesia, kutipan/update. Periksa riwayat CMS/Instagram sebelum menyiapkan paket agar tidak mengulang Timnas, padel, atau Persija.
- SerpAPI google_news melalui reservasi/cache service digunakan untuk tiga query: sepak bola Indonesia when:1d (didominasi final Timnas yang sudah terbit), Liga Indonesia Persib Persebaya -Thailand -Persija when:1d (terlalu sempit), lalu Persib when:1d (100 kandidat, ditemukan laporan Menalo). Tidak menggunakan/mengarang skor viral atau volume pencarian. Metadata hasil discovery yang dipilih dicatat dalam paket.
- Dipilih pernyataan kesiapan Luka Menalo menjelang Persib-Port FC. Primer laman klub persib.co.id/article-details/menalo-nyatakan-kesiapan-hadapi-port-fc; sekunder banten.antaranews.com/berita/392129/luka-menalo-siap-berkontribusi-saat-persib-bandung-hadapi-port-fc. ANTARA mengatribusi laporan kepada laman klub; ini bukan dua wawancara primer independen. Jadwal 8 Oktober, Thailand, kesiapan, rekaman lawan, respek dan target tiga poin dicocokkan. PREVIEW, tanpa hasil/skor/formasi atau lineup yang belum ada; analisis ditandai Analisis Stadione.
- Format carousel dipilih dari materi kutipan/penjelasan yang terverifikasi; matrix preference REEL dicatat, selected_format CAROUSEL dengan alasan. Tidak membuat footage AI atau video palsu. Cover memakai foto latihan resmi klub dan acuan gaya yang telah disetujui, body halaman cream modern sans. SUMBER: PERSIB.CO.ID hanya cover, tanpa EDISI DIGITAL/footer promosi. Foto hero artikel tetap bersih tanpa overlay.
- Aset: assets/editorial/evening-20261006/persib-menalo-cover.png (1122x1402, SHA256 cf8f42245b0e98fb11798c5a144c5e76f11b92c885ae0957afb88caa25174d23), persib-menalo-source.jpg (SHA256 13f9a0b9f0705f0b835f4193cb8ac0c84fe7495e837706d32f7ce2b5c4845f5a), README.md; driver scripts/run-evening-persib.cjs. Sumber foto dan Fernando disimpan pada provenance, tidak mengklaim izin/lisensi pembelian.
- Driver menggunakan shared auditPacket/renderCarousel/verifyCarouselAssets/publisher CMS. ID social/article stabil dari plan_key; history Instagram/CMS dicek dua kali, visual QA/digest wajib sebelum prepare, approval sesuai instruksi auto pemilik. Artikel dibuat dari body slides yang sama dan dijadwalkan pada waktu feed; publisher berlease mempertahankan proteksi request tidak pasti.
- Scope hanya paket slot malam ini; tidak mengubah renderer yang dikunci, timer, slot lain atau konten terbit. Artifact audit/runtime di .tools/evening-persib-20261006 tanpa credential tidak dikomit. Commit/push resep, aset dan Plan Master sebelum schedule/publish; verifikasi visual/hasil live dicatat setelah selesai. Rollback source ke 5be0c16; jangan rollback konten terbit dengan mengirim publish ulang.
- QA sebelum publikasi: lima JPEG final di-version-kan dalam assets/editorial/evening-20261006/slides; hash render lokal/VPS identik. Review visual 19:43 WIB lulus, semua 1080x1350, body 36px/headline 60px, margin 72px; tidak ada clipping/overflow. Halaman isi cream, hanya sumber singkat pada cover, tanpa label edisi/footer. Digest paket 19c9f6e954a875f7a5ea504c76935953dc078a14f8a0d525d9d291a3c9da0991 mengikat attestation visual.
- Paket DRAFT dibuat setelah cek duplikat live kedua dan gate shared engine kosong: SOCIAL 0de44d3b-8312-465a-a6b2-231dc38da4bc, ARTICLE parent 2acee3c6-1481-4cec-aa51-a5a1e6f51b0c. Source asli/full text/audit operasional tetap runtime, bukan disalin ke Git. Jadwal diterapkan setelah commit/push, belum mengklaim terbit pada tahap ini.
- Commit produksi ddb5e15 berhasil dipush lewat SSH collaborator yang sudah ada, remote HEAD terverifikasi. Kedua item SCHEDULED 20:00 WIB; publisher timer aktif, source renderer/gate/publisher/route deploy identik dengan resep yang digunakan. Review template news menemukan excerpt akan berulang di body; pembuka kini hanya excerpt, body memuat empat bagian artikel utuh. Hanya body ARTICLE pasangan dirapikan sebelum tayang; aset/digest carousel dan jadwal tetap.

### 2026-10-06 — Bukti terbit slot malam Persib/Menalo

- Persib Datang dengan Rencana terbit pada 20:01:27 WIB, setelah mulai diproses pada slot normal 20:00. Instagram https://www.instagram.com/p/DeJ16t0oAcS/; media 18115823165000484. ARTICLE https://stadione.pro/news/persib-menalo-port-fc-shopee-cup-8-oktober-2026 tayang dengan published_at identik 2026-10-06T13:01:27.097+00:00. Plan_key 2026-10-06:mid-pm, additional_post=false. Bukti publik tanpa kredensial di assets/editorial/evening-20261006/published.json.
- Verifikasi Graph: username stadione.id, CAROUSEL_ALBUM, lima child IMAGE. Manifest style STADIONE_NEWSPAPER_COLLAGE_V1, checksum/dimensi lima aset publik lolos setelah terbit; snapshot seluruh slot normal lain sebelum/sesudah identik. Tidak membuat posting tambahan atau mengubah jadwal lain.
- Pemeriksaan duplikat ketiga pada 19:58:42 WIB memakai fungsi driver dan riwayat live kembali lulus. Publisher shared mula-mula 202 PROCESSING, lalu 200 PUBLISHED. Timer yang bertabrakan menerima 409 dari lease, tidak mengirim duplikat; siklus berikutnya kosong. Pemanggilan ulang driver setelah PUBLISHED menghasilkan skipped/media_id yang sama tanpa request Meta publish baru.
- Website HTTP 200, judul/four sections/foto hero bersih tampil. Pembuka muncul satu kali dalam elemen article; body empat bagian dengan delapan paragraf dari naskah carousel, ringkasan sebagai lead. Hasil pemeriksaan HTML dipisahkan dari meta description agar tidak salah menghitung intro. Commit perapian pembuka 2848651 dipush sebelum publikasi; catatan hasil ini dipush pada follow-up commit. Tidak perlu redeploy/restart aplikasi karena shared engine yang aktif sudah identik dan perubahan ini resep/aset/isi CMS.

### 2026-10-06 — Audit penulisan setelah koreksi pemilik

- Pemilik meminta analisis, memberikan dua contoh Goal serta screenshot halaman 2/5 dan 5/5 Menalo. Kedua artikel dibaca melalui web. Audit dicatat dalam STADIONE_WRITING_AUDIT.md, dengan pembeda berita langsung versus feature argumentatif, contoh kelemahan Menalo dan arah perbaikan naskah.
- Temuan: saya menulis SLIDES yang mengulang bahan pendek dan menambahkan label Analisis Stadione serta paragraf generik. Label bukan kewajiban engine. Audit sumber/render/style tidak menilai substansi tulisan; narrative_reviewed diisi produsen sendiri. Minimal lima bagian/aset juga memaksa pemanjangan ketika bahan tidak cukup. Tidak menganggap tanda baca sebagai bukti asal AI.
- Perubahan hanya laporan dan Plan Master. Tidak mengubah CMS/postingan, jadwal, renderer, aturan engine atau deployment. Implementasi writer/editor review, artikel dahulu lalu pagination, penambahan riset atau format lebih singkat merupakan pekerjaan berikutnya, belum diklaim selesai.
- Verifikasi dokumen terhadap dua screenshot, kode engine.ts/editorial.ts/driver, serta kedua teks pembanding. Commit/push dokumentasi melalui TD Connector; rollback dokumentasi ke d6c59ca. Tidak memerlukan restart/deploy aplikasi.

### 2026-10-06 — Implementasi article-first dan bacaan Goal harian

- Permintaan pemilik: baca Goal minimal sehari sekali dan perbaiki engine penulisan. Automation Baca Goal untuk Stadione dibuat aktif, mulai 7 Oktober sekitar 07:00 WIB (flexible, Asia/Jakarta), RRULE DAILY. Run harus membaca minimal satu URL baru secara utuh, mencatat pelajaran sendiri, validasi/commit/push jurnal dan Plan Master melalui TD, lalu menyamakan jurnal runtime. Tidak mengubah jadwal editorial atau posting terbit; notifikasi hanya saat gagal membaca/menyimpan. Dua contoh yang benar-benar dibaca hari ini menjadi entri awal.
- Standar naskah baru STADIONE_ARTICLE_FIRST_V1: src/lib/cms/news-writing.ts menyediakan artikel kanonis, audit label/scaffold/pengulangan, kutipan persis sumber, rujukan penalaran, review digest stabil JSONB, pagination lossless dan body HTML website. Packet carousel versi 3 kini wajib article versi 1. Boolean narrative_reviewed saja tidak cukup. Batas carousel berubah dari 5–10 ke 2–10; tidak menambah penutup/pengisi otomatis. Pango/font/margin dan cover kolase STADIONE_NEWSPAPER_COLLAGE_V1 dipertahankan.
- src/lib/cms/writing-references.ts membaca /opt/stadione-editorial/goal-readings.json saat preview/publikasi, tanpa rebuild untuk pembacaan baru. Brief operator memakai aturan dan pelajaran tiga referensi terbaru sesuai genre. Bacaan terakhir harus dalam 36 jam; benchmark ID/genre harus ada dalam jurnal. editorial/goal-readings.json dan STADIONE_WRITING_GUIDE.md menjadi catatan versi/pedoman. Tidak menyimpan ulang teks Goal atau mengklaim pelatihan ulang model.
- Shared engine.ts, engine-media.ts, publish-instagram.ts dan API CMS menerapkan gate artikel/pagination/referensi. Caption dari artikel, bukan gabungan claim ledger. Publikasi memeriksa parent ARTICLE mempunyai judul, excerpt, body dan digest artikel identik. generateEnginePreview membangun parent artikel dengan hero foto bersih, menjadwalkan pasangan bersama, mempertahankan planned_at slot dan menolak menimpa artikel historis. Artikel tayang setelah keberhasilan Instagram lewat worker yang sudah ada.
- Uji lokal: 17 kategori audit tulisan, 9 kategori integrasi pipeline mock (tanpa request Meta), 20 kategori QA engine/render/Reels, TypeScript dan diff check. Kasus gagal mencakup pola Menalo lama, judul tentang kutipan, label Analisis Stadione, paragraf/kalimat ulang, kutipan palsu, edit sesudah review, referensi hilang/kedaluwarsa, artikel pasangan/historis. Kasus lulus berita dua halaman tanpa pengisi, pagination tidak kehilangan kata, articleHtml, slot dan foto hero. npm run qa:writing menjadi perintah regresi baru.
- Pemeriksaan VPS sebelum rollout: tidak ada item SCHEDULED; snapshot disimpan runtime .tools/writing-rollout-scheduled-before.json. Tidak mengubah data CMS/Instagram/jadwal/timer atau secret. VPS tidak mempunyai konfigurasi provider LLM writer; naskah utuh tetap ditulis/direview oleh editor/agent produksi. Engine kini memeriksa dan memproses artikel itu, bukan mengklaim bisa menulis prosa mandiri hanya dari judul/boolean.
- Tahap ini siap commit/push dan build rilis; belum mengklaim deploy/live. Rollback aplikasi ke /opt/stadione-releases/f11dd3e, source ke 9ff008b; jurnal runtime dapat tetap tersedia. Bukti rilis/health/snapshot ditambahkan setelah deploy. Histori Plan Master/audit sebelumnya dipertahankan.
- Cover disiapkan setelah pagination dan wajib mencatat page_count yang sama; artwork tidak ditimpa angka baru. Reels dengan article wajib menyediakan media.article_image foto/frame sumber bersih, sehingga URL video tidak disalahgunakan sebagai hero artikel. QA tambahan menguji ketiadaan frame tersebut; tidak merender atau menerbitkan posting baru pada rollout ini.

### 2026-10-06 — Bukti deploy engine penulisan baru

- Implementasi fe1c93bf2de65e9cc2926da28a8af3cb11b69dc1 committed/pushed dan remote SHA dikonfirmasi sebelum deploy. Rilis immutable /opt/stadione-releases/fe1c93b kini aktif melalui stadione-current; stadione.service aktif. Source news-writing.ts/publish-instagram.ts rilis dan repository mempunyai checksum identik.
- Build awal Turbopack menolak symlink node_modules keluar root rilis; percobaan Webpack menemui import child_process pada modul notifikasi lama di client. Solusi final menyediakan dependency sebagai hardlink file/direktori di dalam rilis, lalu build Turbopack default di direktori rilis. Build exit 0; tidak mengubah modul notifikasi atau next.config untuk mengatasi build. Tidak ada npm install/credential baru. Dependency/source aktif sebelumnya tidak diedit; rilis lama f11dd3e tetap tersedia.
- Uji terbaru lulus di VPS sebelum commit: 17 kategori audit tulisan, 9 kategori integrasi pipeline tanpa Meta, 20 kategori QA render/video beserta pemeriksaan hero Reels, TypeScript dan diff check. Probe kode rilis aktif menolak packet Menalo historis tanpa article dan menolak tujuh masalah pada naskah lama meskipun review digest valid. Tidak melakukan request Meta publish untuk pengujian.
- Jurnal runtime /opt/stadione-editorial/goal-readings.json identik dengan editorial/goal-readings.json committed, SHA256 811552089faaeabd9c5c5f21b7ac56418ca9dac5268594b5c309d44895e86351. Brief NEWS membaca referensi Goal Piala Presiden dengan empat pelajaran. Probe override file sementara membuktikan perubahan jurnal terbaca pada pemanggilan berikutnya tanpa cache/restart; file sementara dibuang dan jurnal produksi tidak dimutasi.
- Verifikasi live pukul 21:44–21:45 WIB: local/public /news HTTP 200, artikel Persib existing HTTP 200, publisher internal HTTP 200/results kosong. Snapshot seluruh item SCHEDULED sebelum/sesudah identik (nol item pada saat rollout). Timer publisher/content-engine/editorial-plan/trend-sync/reminder tetap aktif dengan jadwal semula. Tidak memutasi artikel/posting historis atau menerbitkan konten duplikat.
- Automation pembacaan harian tetap aktif, RRULE DAILY sekitar 07:00 WIB, Asia/Jakarta, mulai 7 Oktober; pelajaran berikutnya masuk jurnal versi dan runtime setelah commit/push. Ini penjadwalan, belum mengklaim run pertama besok sudah terjadi. Source writer tetap agent/editor produksi, dengan audit deterministik dan digest; tidak mengklaim pemeriksaan otomatis memahami seluruh kualitas semantik atau bahwa model dilatih ulang.
- Catatan hasil ini dikomit/dipush pada follow-up dokumentasi. Rollback aplikasi: repoint stadione-current ke /opt/stadione-releases/f11dd3e dan restart stadione.service; data/jurnal tidak perlu dihapus. Tidak menjalankan publisher sebagai rollback.


### 2026-10-07 — Kelola posting tayang dan insight performa

- Permintaan pemilik: posting tayang dapat dihapus/diarsipkan dari CMS dan mendapat kolom performa serta detail insight. Tidak mengubah konten, artwork, artikel, slot rutin, atau otomasi penulisan.
- Akar masalah: PATCH menolak semua aksi jika attempt PUBLISHED; bulk selection mengecualikan PUBLISHED. Pengelolaan kini memakai jalur terpisah, lease database dan advisory lock yang sama dengan publisher. Attempt PUBLISHED merupakan riwayat, sedangkan PREPARING/PROCESSING/READY/PUBLISHING/UNCERTAIN atau lease aktif tetap dilindungi.
- Koreksi catatan 6 Oktober: dokumentasi Meta v25 terbaru sudah menyediakan DELETE IG_MEDIA_ID dengan Facebook Login dan izin instagram_basic + instagram_manage_contents. Izin ini sudah terkonfirmasi tersedia pada koneksi Stadione; kepemilikan media dicek sebelum DELETE. CMS baru menyembunyikan posting setelah respons sukses Meta. Riwayat item, plan_key, digest dan attempt disimpan sebagai tombstone agar tidak terbit ulang. Kegagalan Meta mempertahankan CMS; timeout/hasil tidak pasti tidak diulang otomatis. Bulk melaporkan sukses/gagal per konten, tidak mengaku sukses seluruh batch.
- Arsip: referensi IG Media tidak menyediakan operasi arsip. Menu menyediakan Arsip CMS saja, tautan dan panduan arsip di aplikasi Instagram, lalu konfirmasi pencatatan pengguna. Status laporan pengguna diberi scope INSTAGRAM_REPORTED dan instagram_verified=false; tidak diklaim sebagai hasil verifikasi API. Konfirmasi penghapusan manual juga terpisah dan berlabel tidak terverifikasi. Artikel pasangan dikelola terpisah; hapus sosial tidak otomatis menghapus artikel.
- Insight: endpoint admin-only GET/POST /api/admin/cms/insights; cache terpisah stadione_content_insights agar refresh tidak mengubah jadwal, naskah/digest/approval. Ambil views, reach, likes, comments, saved, shares, total_interactions dan waktu tonton Reels dari Meta. Refresh otomatis saat CMS dibuka, TTL 15 menit, maksimal 30 posting per refresh dengan tiga worker; tombol refresh detail mengambil ulang. Metrik tidak tersedia bernilai null, angka nol yang valid tetap nol. Jika refresh gagal, snapshot sukses terakhir disimpan dengan error dan tidak diberi penilaian seolah data baru.
- Kolom Performa Instagram dan detail modal menjelaskan angka, formula engagement (total interaksi / reach x 100), sumber organik/lifetime, waktu pembaruan, kendala dan pembanding. Label Bagus/Normal/Perlu ditingkatkan dihitung relatif terhadap median >=5 posting Stadione dengan format dan kelompok umur sama, umur >=24 jam serta reach >=100. Batas internal +/-20%, bukan standar industri atau penilaian dari Meta. Data belum lengkap/basi (<1 jam untuk penilaian), sampel kecil dan median engagement nol diberi Belum cukup data/Belum tersedia beserta alasan.
- Komponen: cms/meta.ts, content-management.ts, performance.ts, insights.ts, publish-instagram.ts; route CMS dan insights; content-workspace.tsx, insights-panel.tsx; migration 20261007000017_stadione_content_insights.sql; scripts/qa-cms-management.cjs, package.json qa:cms. Publisher menolak ARCHIVED/tombstone sebelum rekonsiliasi attempt lama; metadata pengelolaan dilindungi dari perubahan melalui payload editor.
- Verifikasi lokal: qa:cms lulus 18 kelompok (sinkron hapus, ownership, kegagalan/timeout, riwayat dedupe, arsip/restore, cache, missing-vs-zero, benchmark/umur/format, auth 401/403, larangan publikasi ulang). TypeScript dan diff check lulus. Lint nol error, empat warning img yang sudah ada. Live read-only Meta membuktikan akun stadione.id dan insight posting Persib terbaca; beberapa ID CMS lama sudah tidak dapat dibaca di Meta, sehingga tidak dihapus/dinyatakan sukses otomatis.
- Sumber resmi diperiksa langsung: https://developers.facebook.com/docs/instagram-platform/reference/instagram-media/ dan /insights/. Tidak menyalin token/debug payload ke Git. Belum menjalankan DELETE pada posting pengguna sebagai uji.
- Deploy: menunggu commit/push terverifikasi, uji migrasi dalam transaksi rollback, build dan aktivasi rilis via TD Connector; bukti live ditambahkan setelah selesai. Rollback aplikasi ke fe1c93b; fungsi claim publisher sebelumnya dicadangkan sebelum migrasi. Tabel insight baru dapat tetap disimpan saat rollback, tidak menghapus konten/riwayat.
- Tambahan verifikasi pra-commit: migrasi + assertion SQL dijalankan dalam satu transaksi lalu ROLLBACK di database VPS. Lulus grant/RLS, PUBLISHED tetap dapat dikelola, lease pengelolaan tunggal, publisher normal tetap dapat mengklaim, penolakan SCHEDULED/active publisher, serta larangan terbit ulang ARCHIVED/tombstone. Tidak ada fixture database yang disimpan.
- Playwright pada komponen CMS sebenarnya dengan API fixture terisolasi lulus tampilan insight/angka, aksi hapus/arsip enabled pada attempt PUBLISHED, aksi edit naskah tayang disembunyikan, konfirmasi arsip manual wajib dicentang, desktop/mobile tanpa overflow horizontal. Tidak ada permintaan API produksi atau penghapusan live. Screenshot diperiksa secara visual.

- Live tahap awal: commit 6670a5c750944e9bfdec0b1cf216614e0de01bfa dipush dan SHA remote sama sebelum deploy. Build production exit 0; release 6670a5c aktif, /news lokal/publik HTTP 200 dan endpoint insight tanpa sesi HTTP 401. Migrasi diterapkan transaksional via TD ke database Stadione, fungsi publisher sebelumnya dicadangkan di .tools/cms-management-rollout/publisher-claim-before.sql.
- Endpoint insight pada kode rilis diuji melalui trusted CLI adapter dengan actor platform_admin dari database (bukan bypass pada layanan web). POST refresh dan GET cache HTTP 200: 12 cache, 7 snapshot Meta sukses, 5 media tidak terbaca. Persib 1 tayangan/1 reach; Reels DeIYziKDF42 107 tayangan/87 reach/1 share, rata-rata 8181 ms dan total 777201 ms. Label 7 Belum cukup data dan 5 Belum tersedia sesuai data nyata. 39 baris CMS, seluruh metadata/status/jadwal identik sebelum/sesudah; SHA256 snapshot 1657335854054a4c0d7e2063286dba16bc013d0a644c69415f6140472a044908. Tidak ada DELETE Meta live.
- Pemeriksaan kasus tepi menambahkan perbaikan: lease tersisa milik attempt PUBLISHED tidak lagi menahan aksi pengelolaan; hanya lease aktif attempt yang belum selesai yang mengunci. Jika Meta sukses tetapi penulisan status CMS sebelumnya gagal, pengelolaan membaca ID media dari durable attempt PUBLISHED agar aksi hapus tidak hanya menghapus CMS dan meninggalkan posting Instagram. UI menganggap attempt PUBLISHED sebagai posting terbit. qa:cms kini 19 kelompok; assertion SQL ditambahkan sebagai scripts/qa-cms-management-db.sql dan lulus transaksi rollback, termasuk PUBLISHED dengan leased_until masih di masa depan.
- Perbaikan kasus tepi ini akan dikomit/push sebelum migrasi final dan rilis berikutnya; bukti aktivasi akhir menyusul. Pengujian UI sebelumnya tetap berlaku untuk struktur menu/detail; perubahan UI tambahan hanya deteksi attempt PUBLISHED yang status CMS-nya belum sinkron.


### 2026-10-07 — Verifikasi akhir kelola posting dan insight

- Commit perbaikan 116735ced5f4448e559fc9deba624e69701c1fcc berhasil dipush, ls-remote mengonfirmasi SHA identik sebelum migrasi/rilis akhir. Migrasi final diterapkan transaksional; claim pengelolaan mengabaikan lease tersisa attempt PUBLISHED. Assertion SQL pada fungsi yang telah terpasang lulus BEGIN/ROLLBACK; tidak ada fixture tersimpan.
- Build production final exit 0. Rilis immutable /opt/stadione-releases/116735c aktif melalui stadione-current; stadione.service aktif. /news lokal dan publik HTTP 200; endpoint insight publik tanpa sesi HTTP 401; chunk JavaScript CMS yang memuat kolom Performa Instagram dilayani HTTP 200.
- Trusted CLI adapter pada kode rilis: GET insights cache HTTP 200 (12 item), GET CMS HTTP 200 (39 item), koneksi Meta aktif. Pemeriksaan dilakukan di proses CLI terpisah dengan actor platform_admin dari database; autentikasi layanan web tidak diubah. qa:cms final lulus 19 kelompok; source content-management.ts, content-workspace.tsx dan publish-instagram.ts pada release identik dengan repository committed.
- Snapshot seluruh 39 baris konten/status/metadata/jadwal sebelum dan setelah seluruh deploy/refresh tetap identik, SHA256 1657335854054a4c0d7e2063286dba16bc013d0a644c69415f6140472a044908. Timer cms-publish, content-engine, editorial-plan, trend-sync dan reminder semuanya aktif; hanya layanan aplikasi direstart. Tidak menerbitkan, menghapus, mengarsipkan, atau memindahkan jadwal posting pengguna selama uji. DELETE live berikutnya hanya terjadi saat pengguna memilih konten dan mengonfirmasi aksi pada CMS; tidak mengklaim telah menghapus posting percobaan di Meta.
- Penggunaan: refresh admin.stadione.pro/admin/cms; pilih posting tayang lalu Aksi → Hapus Instagram + CMS, Arsip CMS saja, atau panduan/konfirmasi Arsip di Instagram. Pilihan massal menerima posting tayang. Klik kolom Performa Instagram untuk metrik, engagement, waktu tonton Reels, alasan label, pembanding dan refresh manual. Media tidak terbaca tetap ditandai dengan jelas; pencatatan penghapusan/arsip manual tidak dianggap verifikasi Meta.
- Batas platform: hapus menggunakan endpoint resmi Meta; arsip Instagram tetap dilakukan di aplikasi karena tidak ada operasi arsip di IG Media API. Insight belum memberi label bagus/buruk pada akun yang sampelnya belum memadai. Penilaian adalah aturan internal, bukan skor resmi Instagram. Artikel pasangan tidak dihapus oleh aksi hapus sosial.
- Catatan ini dikomit dan dipush sebagai dokumentasi follow-up; tidak perlu build ulang. Rollback rilis ke /opt/stadione-releases/6670a5c (tahap awal) atau fe1c93b (sebelum fitur) dengan symlink/restart; cache boleh dipertahankan. Bila fungsi publisher perlu dikembalikan, gunakan backup publisher-claim-before.sql; jangan menghapus tombstone/attempt atau menjalankan publisher sebagai prosedur rollback.


### 2026-10-07 — Bacaan Goal harian: laporan pertandingan sepak bola putri

- Referensi baru goal-20261007-barcelona-femenino-clasico-match-news (NEWS/laporan pertandingan), dibaca utuh melalui browsing pada 2026-10-07T00:40:12.000Z. URL: https://www.goal.com/id/daftar/barcelona-menggila-menang-7-0-atas-real-madrid-di-clasico-claudia-pina-tampil-memukau-empat-gol-dalam-satu-babak/blt5d9a5b29d627fc07. Teks utama yang tersedia dibaca dari lead, bagian kontribusi Claudia Pina, konteks Real Madrid hingga penutup klasemen; bukan hanya judul/snippet. Artikel tidak memiliki kutipan langsung; catatan tidak mengarang kutipan.
- Lima pelajaran dalam kata-kata sendiri dicatat pada editorial/goal-readings.json: hasil dan pembeda dalam lead, kontribusi pemain, perkembangan konteks, tidak memaksakan kutipan, serta penutup dengan konsekuensi konkret. Catatan juga menolak pujian absolut tanpa bukti. Ini acuan struktur penulisan, bukan verifikasi hasil pertandingan atau sumber fakta untuk posting baru.
- Seluruh dua entry sebelumnya dipertahankan tanpa perubahan timestamp. Variasi kali ini laporan pertandingan sepak bola putri setelah feature Gordon dan berita langsung Piala Presiden. Tidak menyimpan ulang teks artikel Goal.
- Komponen yang berubah hanya jurnal referensi dan Plan Master. Validasi schema wajib lulus sebelum commit; push memakai autentikasi SSH collaborator yang sudah tersedia, kemudian jurnal committed disalin persis ke /opt/stadione-editorial/goal-readings.json. Engine membacanya tanpa rebuild/restart. Bukti checksum runtime ditambahkan setelah sinkronisasi.
- Tidak mengubah jadwal editorial/otomasi, artikel atau posting terbit, renderer, credential maupun kode produksi. Rollback referensi/dokumentasi ke cde589e3e57edd4b5eb805d28fe576cc4a1b3b95 dan salin kembali jurnal commit tersebut bila diperlukan; tidak menjalankan publisher sebagai rollback.
- Bukti sinkronisasi bacaan 7 Oktober: commit fe1293ba5f840dd24117ed92ccd770e8630e6a94 berhasil dipush; ls-remote via remote SSH yang sama mengonfirmasi SHA identik. Jurnal committed, working tree, dan /opt/stadione-editorial/goal-readings.json identik (cmp lulus), SHA256 05b8014b2b250c8c16e9c3c7bf1916e621a15572e89f21e7777c7819d62e6280. Validator repository dan runtime lulus, masing-masing tiga entry, bacaan terbaru 2026-10-07T00:40:12.000Z.
- Probe writerBrief NEWS pada kode release aktif membaca goal-20261007-barcelona-femenino-clasico-match-news bersama referensi NEWS sebelumnya dari file runtime yang benar. Tidak melakukan restart/build maupun operasi CMS/Meta/jadwal. Bukti ini dikomit sebagai dokumentasi follow-up; jurnal tetap sama dan tidak memerlukan penyalinan ulang karena checksum tidak berubah. Tidak ada notifikasi rutin sesuai arahan pemilik.

### 2026-10-07 — Pemulihan editorial harian yang berhenti

- Keluhan pemilik: hari ini belum ada artikel/posting. Pemeriksaan TD pukul 14:59 WIB membuktikan nol slot CMS tanggal 7 Oktober, walau publisher tiap menit dan SerpAPI aktif. Seeder pukul 00:05 WIB membuat 21 slot mulai tanggal 8 karena first_day=besok. Semua run generate pagi/siang mengembalikan results kosong. Tugas agent editorial siang/malam tanggal 6 adalah VEVENT sekali jalan tanpa RRULE, telah disabled; hanya rutinitas bacaan Goal berulang. Timer VPS bukan writer LLM dan tidak menggantikan tugas produksi naskah/cover.
- scripts/cms-seed-editorial-plan.py kini mencakup hari ini + tujuh hari berikutnya (24 slot), mempertahankan semua plan_key existing termasuk PUBLISHED/ARCHIVED/tombstone. Jadwal matriks 08/13/20 WIB dan additional post tidak dipindahkan. qa-editorial-calendar.py memeriksa batas midnight UTC/WIB, horizon, unique identities dan tidak mengganti slot existing.
- deploy/stadione-editorial-plan.service akan memakai salinan script committed /opt/stadione-editorial/cms-seed-editorial-plan.py, agar perbaikan worker Python tidak memerlukan rebuild aplikasi. Kalender/timer lama tetap frekuensi semula. Deploy hanya setelah commit/push terverifikasi; rollback script/unit ke fb1ee30.
- editorial/production-automation.json mencatat instruksi produksi agent berulang, wake 07/12/19 WIB untuk mempersiapkan slot 08/13/20. Ia membaca jurnal Goal, memilih sumber SerpAPI sesuai pilar, menulis artikel utuh/review digest, menyiapkan AI cover berfoto autentik atau montage footage nyata, lalu shared engine/publisher. Gaya koran/renderer/gate tidak dilonggarkan. Kegagalan harus menyebut tahap; keberhasilan rutin diam. Automation id/status live akan dicatat setelah pemasangan.
- scripts/cms-produce-slot.cjs menjadi adapter preview lalu schedule untuk semua slot, memakai shared audit, reference freshness, renderer, generateEnginePreview dan paired ARTICLE. Preview tidak menjadwalkan/publish; operator wajib melihat semua JPEG. Schedule memeriksa hash input/byte preview, CAS item.updated_at, attempt/history/tombstone, event identity dan recent Meta captions akun stadione.id. Tidak memanggil media_publish langsung atau memakai driver lama yang masih berisi gaya naskah sebelumnya. Parent artikel/slot diproses oleh engine rilis yang sama.
- Pemulihan slot pagi/siang tanggal 7 akan memakai topik baru sesuai pilar; slot malam tetap 20 WIB. Sumber/bukti, hasil audit visual dan URL terbit dicatat setelah verifikasi live. Belum mengklaim publikasi selesai atau bahwa provider writer mandiri sudah dipasang di VPS.
- Adapter produksi memakai loader kode rilis aktif /opt/stadione-current, sehingga perubahan repository yang belum dideploy tidak diam-diam menjadi jalur publikasi. Push lokal HTTPS ditolak 403; bundle Git dipindahkan lewat TD dan dipush dengan autentikasi SSH VPS yang tersedia. Commit 2f640c394d6c76ff37f665914e53be05f5e87f9e terkonfirmasi pada branch remote sebelum pemasangan worker/automation.
- Automation produksi live berhasil dibuat enabled, exact schedule Asia/Jakarta, DTSTART 7 Oktober 19:00 WIB, RRULE DAILY BYHOUR 7/12/19 tanpa batas count. ID operasional 6ac5fe18aa6081919975505004e57a3d. Tugas sekali jalan historis siang/malam tetap disabled; bacaan Goal harian tidak diubah. Script calendar terpasang identik committed; start worker 15:08 WIB membuat hanya tiga slot hari ini, 21 slot existing tetap sama. Rilis aplikasi 116735c dan semua timer publikasi tetap berjalan.
- Cover generatif diperiksa dan direvisi sebelum preview: satu hasil awal rasio terlalu sempit ditolak, sumber typo dikoreksi, detail kecil jersey yang dibuat generator dihapus. Final rasio 1122x1402 berada dalam toleransi renderer 4:5. Export JPEG hanya konversi mekanis kualitas95 4:4:4, tidak mengubah desain/wrapping/identitas. Adapter menerima MIME PNG atau JPEG sesuai byte, mengikat SHA exact pada cover final.
- Pra-publikasi pemulihan: dua paket tanggal 7 Oktober memakai canonical article NEWS dan benchmark Goal laporan pertandingan terbaru; semua source/claim/reference audit lulus. Inggris–Ceko: hasil resmi England Football, ANTARA, Tirto dan statistik FA (3–0; gol Coufal 27, Kane40/57; 125 caps dan 111 starter). Borneo–Buriram: preview pukul19 WIB, sumber klub, penyelenggara AFF/ASEAN United dan detik; tidak mengarang hasil laga yang belum dimulai. SerpAPI search olahraga tanggal7 HTTP200 dicatat kuotanya; pool tren pagi juga sukses.
- Dua cover dari foto autentik memakai template kolase cream/charcoal/merah, caption/source tanpa footer/edisi. Preview engine pada rilis aktif menghasilkan masing-masing5 JPEG1080x1350; delapan halaman isi semuanya font36, safe_wrap=true, batas pixel terukur. Semua cover dan halaman isi diperiksa visual, termasuk dua halaman Inggris yang disunting untuk menambahkan data111starter/14pengganti dan menghapus kalimat pengisi. assets/editorial/recovery-20261007 menyimpan naskah asli Stadione, sumber URL/checksum, audit dan cover final; teks lengkap penerbit pihak ketiga disimpan hanya sebagai evidence runtime, bukan disalin ke Git.
- Slot pemulihan tetap plan_key 2026-10-07:mid-am dan :mid-noon, scheduled_at01:00Z/06:00Z. Pagi memilih carousel karena footage pertandingan yang dapat diproses tidak tersedia; bukan video AI. Belum memindahkan atau menerbitkan slot :mid-pm13:00Z. Bukti CMS/Meta/pasangan website ditambahkan setelah worker selesai; rollback konten bukan publish ulang otomatis atau menghapus media pengguna.
- Verifikasi akhir 15:34 WIB: kedua slot pemulihan PUBLISHED melalui publisher systemd/shared lease, bukan Meta manual. Inggris–Ceko terbit15:31:12 WIB (media18117962287748105, https://www.instagram.com/p/DeL713loPKi/), artikel https://stadione.pro/news/kane-samai-shilton-inggris-tundukkan-ceko-1765eef1 HTTP200. Borneo–Buriram terbit15:32:58 WIB (media18434039053198141, https://www.instagram.com/p/DeL76w-IKK-/), artikel https://stadione.pro/news/borneo-buka-shopee-cup-di-markas-juara-bertahan-b9949124 HTTP200. Kedua media owner ID akun Stadione benar, tipe CAROUSEL_ALBUM dengan lima IMAGE child; artikel memiliki digest/body identik, foto hero bersih dan published_at sama dengan pasangannya.
- Semua byte JPEG diverifikasi melalui verifyCarouselAssets; publication audit kosong. Memanggil kembali shared publisher mengembalikan mediaId lama tanpa publish baru, dan adapter schedule mengembalikan skipped/PUBLISHED untuk keduanya. Bukti tersimpan assets/editorial/recovery-20261007/published.json. Empat puluh item lain identik snapshot sebelum pemulihan; slot malam 80b9be65-650f-4a48-bf2d-2ceed7726a32 tetap DRAFT pada13:00Z/20 WIB, menunggu agent produksi wake19 WIB. Tidak mengklaim konten malam sudah diproduksi atau terbit.
- Commit persiapan konten44ce069fce347b31ea031977a8e3735fbed488c9 dipush dan remote SHA diverifikasi sebelum schedule. Perbaikan worker/adapter2f640c3,3d08804,b8a7144 telah committed/pushed. Seluruh timer publisher/content-engine/editorial-plan/trend-sync/reminder tetap aktif, aplikasi tetap rilis116735c; tidak rebuild/restart aplikasi. Runtime jurnal Goal tidak berubah. Catatan hasil ini dan manifest publikasi dikomit/push sebagai follow-up.
- Mekanisme harian sekarang mempunyai dua komponen nyata: agent Codex berulang menulis/review naskah dan membuat cover/footage, VPS renderer/publisher memeriksa serta menerbitkan pada slot. VPS belum mendapat provider LLM mandiri. Automation enabled merupakan bukti konfigurasi; run pertama produksi berulang berikutnya belum terjadi pada saat verifikasi ini. Kegagalan produksi berikutnya wajib dilaporkan, bukan disamarkan dengan status timer aktif.
