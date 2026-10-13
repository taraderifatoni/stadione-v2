# Stadione social mirroring

Instagram remains the primary publisher for CMS social content. After its durable attempt and CMS status reach PUBLISHED, the same systemd publisher copies the reviewed caption and rendered assets to each supported, connected destination. At this release the publishing adapters are Instagram and Facebook Page; YouTube has a discovery API key only, and Pinterest/TikTok/X/Threads have no publishing connection. Credentials stay server-side and are not requested through chat.

Facebook uses the existing verified Stadione Page token (META_ACCESS_TOKEN, or optional FACEBOOK_PAGE_ACCESS_TOKEN). The adapter checks the token's Page and can_post, stages photos as published=false, then creates one Page post with ordered attached_media. Reels use video_reels start, hosted upload and finish; publication is confirmed separately. Carousel artwork is a multi-photo Facebook post, not a link-card carousel. No content rewrite, AI video, altered schedule or extra Instagram post is involved.

database/11-social-mirrors.sql adds a settings record whose started_at is the activation cutoff. Existing published content before that timestamp is excluded. Re-running the migration does not reset the cutoff. It adds a durable per-content/platform ledger with a unique key, claim lease, payload digest and a pre-send compare-and-set against the content version and archive/tombstone/management state. A server-side due selector excludes terminal attempts so old successes cannot starve the queue. Automatic mirroring includes future normal and additional Instagram content; disabling settings stops new sends.

Non-idempotent send intent is persisted before contacting Meta. PUBLISHING and UNCERTAIN are never automatically resent. FINALIZING only reads status and can resume confirmation without resending. A definite rejected request becomes FAILED and can be queued again by a platform admin through the CMS panel. Retry clears unpublished staging media, never resets uncertain or published work. Facebook errors do not modify Instagram status or prevent the paired website article being published.

CMS displays account publishing capabilities, recent mirror states, errors and links. A connected account means credentials/Page checks succeeded; actual publication still needs a successful attempt and Meta verification. Unsupported/unconnected platforms are shown honestly. New adapters require their own official account authorization, formatting/asset checks and durable delivery state; a search API key alone is not an upload connection.

Deleting an eligible CMS social post removes a known Facebook mirror before attempting the existing Instagram removal. A failed Facebook removal preserves Instagram and CMS. Unknown DELETE results require reconciliation and are not repeated. The Facebook ledger retains DELETED history to prevent resurrection. CMS-only archiving continues to leave social posts live; no Facebook/Instagram archive API is invented. Management is blocked while a mirror's send/confirmation is active.

Verification:
- node scripts/qa-social-mirrors.cjs
- node scripts/qa-cms-management.cjs
- node scripts/qa-engine.cjs
- node scripts/qa-writing-pipeline.cjs
- node scripts/qa-production-preview.cjs
- Run scripts/qa-social-mirrors-db.sql with psql (BEGIN/ROLLBACK included).
- TypeScript, targeted lint and Next production build.
- Before activating, snapshot CMS/IG/Page posts and backup DB; apply committed migration and run the SQL QA transaction.
- Inspect the first future normal post on Instagram and Facebook, paired ARTICLE and per-platform attempt; replay must not create another post.

Rollback: disable stadione_social_mirror_settings.enabled for FACEBOOK, switch /opt/stadione-current to the previous immutable release and restart stadione.service. Preserve the mirror ledger and settings cutoff; do not drop evidence or re-send unknown work. Disable new sends before reconciling any in-flight work. Existing Instagram schedules, attempts and content are preserved.
