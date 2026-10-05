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
- Verification:***REDACTED***@ibachdim; tidak menggunakan video generatif AI.
- Materi disunting menjadi format Stadione dengan judul, skor 2–2 setelah 120 menit, hasil adu penalti 4–2, serta zona teks aman.
- Fakta pertandingan dan pencetak gol diverifikasi terhadap laporan resmi FIFA.
- Sumber video dan sumber fakta dicatat di caption serta metadata CMS.
- Publikasi memakai event key idempoten `fifa-asean-cup-2026-final-indonesia-thailand-reel-2026-10-05` untuk mencegah Reels duplikat.

### 2026-10-05 — Paket artikel untuk konten Reels

- Aturan produksi diperbarui: hero artikel selalu berupa foto bersih tanpa judul atau overlay teks agar halaman tidak terlalu ramai.
- Untuk konten video/Reels, hero artikel diambil dari frame wajah atau scene video yang paling representatif.
- Artikel pasangan Reels Irfan Bachdim diterbitkan dengan frame video bersih sebagai cover dan Reels Instagram Stadione ditanam di tengah artikel.
- Renderer News sekarang mendukung tag aman `<instagram-reel url="...">` yang menghasilkan player Instagram dengan thumbnail, playback, dan tautan langsung.
- Tujuan embed adalah mengalirkan pembaca website ke pemutaran Reels asli sehingga view dan interaksi Instagram dapat bertambah.
- Artikel: `/news/irfan-bachdim-reaksi-indonesia-juara-fifa-asean-cup-2026`.
