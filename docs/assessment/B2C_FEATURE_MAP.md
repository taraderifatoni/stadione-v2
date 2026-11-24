# B2C Feature Map — Stadione (read-only assessment, 24 November 2026)

Assessment ini hanya membaca repo, git log, dan dokumentasi lokal. Tidak ada deploy,
push, migrasi, tulisan DB, pembacaan kredensial, perubahan model, atau perubahan kode
produksi. Satu-satunya file yang ditulis adalah dokumen ini.

## 0. Metode, disiplin status, dan batas bukti

- Urutan kerja: `graphify query "B2C admin POS academy fitness payments features"`
  dijalankan lebih dulu (228 node, start: `AdminAcademy()`, `payments/page.tsx`,
  `PosPage()`, `FitnessPage()`, `academy.ts`, `admin.ts`, `stadione-mockup.jsx`),
  baru dilanjutkan dengan `glob`/`grep`/`read` pada baris yang sudah terlokalisasi,
  `git log --oneline -20`, dan `git status --short`.
- `docs/CTO_HANDOFF.md` sudah berstatus **ACKNOWLEDGED** saat dibaca; tidak diubah.
- Status dipisah keras, tidak boleh digabung:
  - **IMPLEMENTED** = kode/source ada di tree saat ini.
  - **TESTED** = hanya jika ada bukti test/UAT spesifik fitur. `tests/` berisi
    **hanya** `tests/juara/*.test.ts`; tidak ditemukan suite otomatis B2C.
  - **DEPLOYED** = hanya bukti platform-level (service/symlink/HTTP 200), **bukan**
    bukti SHA per fitur.
  - **ACCEPTED** = tidak ada bukti untuk B2C. `docs/VISUAL_ACCEPTANCE_STANDARD.md`
    mewajibkan screenshot viewport + metadata + inspeksi visual reviewer; manifest
    screenshot yang ada (`docs/juara/screenshots/**`) adalah untuk JUARA, bukan B2C.
- `AUDIT-REPORT.md` (2 Agu 2026, verdict GO-LIMITED) adalah baseline historis.
  Beberapa temuannya sudah teratasi di kode saat ini (lihat §11), sehingga jangan
  dipakai sebagai status terkini. Sebaliknya, checkbox `[x]` di
  `IMPLEMENTATION_PLAN.md` / `REMAINING_WORK.md` juga tidak boleh dipromosikan
  menjadi DEPLOYED/ACCEPTED.
- Owner saat ini: tidak ada penugasan named-DRI B2C di dokumen. Pemilik produk
  adalah **Owner (user)**; eskalasi teknis tercatat ke **CTO TDCorp**
  (`docs/CTO_HANDOFF.md`). Penulis commit B2C terakhir adalah **`bigblaz`**
  (2026-08-01…08-04); commit November 2026 oleh `taraderifatoni` seluruhnya
  bertema JUARA. Semua kolom "Proposed pod" di bawah adalah **usulan struktur**,
  bukan reassignment, dan tidak mengubah siapa pemilik hari ini.

## 1. Ringkasan matriks

| ID | Feature area | IMPLEMENTED | TESTED | DEPLOYED | ACCEPTED | Proposed pod (usulan) |
|---|---|---|---|---|---|---|
| B1 | Identitas, auth, peran & staff invite | Ya | Tidak ada suite B2C | Platform-level ⚠️ | Tidak ada bukti | Identity & Access |
| B2 | Discovery venue, pencarian & katalog | Ya | Historical smoke saja | Platform-level ⚠️ | Tidak ada bukti | Venue & Discovery |
| B3 | Booking, pricing, promo, recurring, waitlist | Ya (parsial lanjutan) | Tidak ada suite B2C | Platform-level ⚠️ | Tidak ada bukti | Booking & Pricing |
| B4 | Fitness & membership | Ya (parsial Payment-state) | Tidak ada suite B2C | Platform-level ⚠️ | Tidak ada bukti | Membership & Fitness |
| B5 | Akademi & raport | Parsial (raport UI mock) | Tidak ada suite B2C | Platform-level ⚠️ | Tidak ada bukti | Academy & Raport |
| B6 | POS / kasir | Ya (`/pos` utama; sub-route stub) | Tidak ada suite B2C | Platform-level ⚠️ | Tidak ada bukti | POS Operations |
| B7 | Payments / DOKU & settlement | Ya | Tidak ada suite B2C | Platform-level ⚠️ | Tidak ada bukti | Payments & Settlement (authoritative) |
| B8 | Admin platform & workspace | Ya | Tidak ada suite B2C | Platform-level ⚠️ | Tidak ada bukti | Platform Admin & Analytics |
| B9 | Notifikasi, trigger & cron | Ya (delivery belum dibuktikan) | Tidak ada suite B2C | Platform-level ⚠️ | Tidak ada bukti | Notifications & Engagement |
| B10 | PWA, offline & shared shell | Ya (offline parsial) | Tidak ada suite B2C | Platform-level ⚠️ | Tidak ada bukti | Shared Experience / Platform |
| B11 | JUARA (batas cakupan, bukan B2C) | Ya + kandidat baru | 74 test (JUARA) | Baseline + kandidat ⚠️ | Hanya staging slice | Pod JUARA terpisah |
| B12 | Mockup & artifact perencanaan | Design artifact | N/A | N/A (bukan kode) | N/A | Product/Doc steward |

⚠️ **DEPLOYED platform-level** artinya: ada bukti `stadione.service active`, symlink
`/opt/stadione-current`, dan `https://stadione.pro` → 200 pada 23–24 Nov 2026, tetapi
tidak ada pemetaan SHA produksi per fitur B2C. Lihat §11.

---

## 2. B1 — Identitas, autentikasi, peran & staff invite

- **Feature name / scope:** Login, register, forgot-password, auth callback, session,
  logout, role venue (`owner/manager/staff/coach/member`), staff invite→accept,
  redirect lintas subdomain, auth guard Juara.
- **Main source paths:** `src/app/(auth)/{login,register,forgot-password}/page.tsx`,
  `src/app/auth/callback/page.tsx`, `src/app/api/auth/session/route.ts`,
  `src/app/api/staff/{invite,invite-info,accept}/route.ts`,
  `src/app/(public)/invite/page.tsx`, `src/lib/auth.ts`, `src/hooks/useAuth.ts`,
  `src/lib/supabase/{client,server,admin}.ts`, `src/middleware.ts`.
- **Dependencies:** Supabase Auth (`auth.users`), tabel `venue_roles`, `staff_invites`;
  cookie `sb-*`; Resend untuk email undangan; semua domain lain bergantung pada ini.
- **Status — implemented:** Ya. `middleware.ts:32-54` kini memblokir `/admin` & `/pos`
  dari host publik dan melakukan rewrite subdomain (perbaikan atas temuan lama).
- **Status — tested:** Tidak ada test otomatis B2C. Bukti historis: `AUDIT-REPORT.md`
  §3–§6 (Agustus) berisi smoke manual, sudah usang untuk kondisi saat ini.
- **Status — deployed:** Platform-level ⚠️, tidak ada bukti SHA per fitur.
- **Status — accepted:** Tidak ada bukti penerimaan B2C.
- **Supporting evidence:** commit `2a35778` (rebuild awal), `a7f86be`/`20f1032`
  (guard & platform_admin), `96f7fdb` (invite UI), `ef21495` (auth lintas subdomain),
  `112cc70` (fix invite accept), `0f0cd9f` (logout); `src/middleware.ts:1-61`;
  `docs/CTO_HANDOFF.md` (akses anon/auth terverifikasi untuk tabel `juara_*`, bukan izin
  umum B2C).
- **Current owner:** Owner (produk); implementasi terakhir `bigblaz`; pengawasan CTO
  TDCorp. Tidak ada DRI B2C yang ditunjuk secara eksplisit.
- **Proposed owner (usulan):** Identity & Access pod (DRI) + Security/Release reviewer;
  pod ini memegang kontrak RBAC/RLS, bukan mengambil alih UX fitur lain.
- **Debt / risks:** Middleware melewati `/api` (`SKIP` di `middleware.ts:4`), jadi
  otorisasi server-side tidak ada pada route payment/admin; beberapa policy RLS
  permisif (`USING (true)`), perlu audit tenant; email invite masih hardcode subdomain
  (temuan `AUDIT-REPORT.md` §2.2); klaim "platform_admin belum ada" di audit lama
  sudah tidak sesuai kode → perlu rekonsiliasi, bukan dijadikan status baru.

## 3. B2 — Discovery venue, pencarian & katalog

- **Feature name / scope:** Landing, daftar venue, detail venue, pencarian,
  selector venue di booking/fitness, halaman venue per slug, onboarding/approval venue.
- **Main source paths:** `src/app/(public)/page.tsx`, `(public)/venues/page.tsx`,
  `(public)/search/page.tsx`, `src/app/search/page.tsx`,
  `src/app/(public)/venue/[venueSlug]/{layout,page,booking,fitness,academy}/page.tsx`,
  `src/lib/venue.ts`, `src/app/admin/venues/page.tsx`, `src/lib/platform.ts:79-94`.
- **Dependencies:** `venues`, `venue_onboarding`, `courts`, `pricing_rules`,
  Supabase client; `NEXT_PUBLIC_APP_URL_*` dari `src/lib/constants.ts`.
- **Status — implemented:** Ya untuk katalog/detail; onboarding wizard 5-langkah
  belum ditemukan (helper approve/reject saja).
- **Status — tested:** Hanya smoke HTTP historis (`AUDIT-REPORT.md` §3: `/`,
  `/venues`, `/search`, detail venue → 200). Tidak ada regression test terkini.
- **Status — deployed:** Platform-level ⚠️.
- **Status — accepted:** Tidak ada bukti; tidak ada screenshot visual B2C sesuai
  `docs/VISUAL_ACCEPTANCE_STANDARD.md`.
- **Supporting evidence:** commit `f7b2a78` (venue discovery + real data), `318bb3a`
  (workspace + slug), `71b3bf4` (SEO/venue detail), `56c1fd4` (dynamic admin pages),
  `0eb19b6` (seed membership/academy); `supabase/migrations/20260730000010_seed_venues.sql`;
  `database/seed-venues.sql`.
- **Current owner:** Owner; implementasi `bigblaz`; tidak ada DRI B2C eksplisit.
- **Proposed owner (usulan):** Venue & Discovery pod; berbagi kontrak `venue_id`/slug
  dengan Booking, Membership, Academy, POS.
- **Debt / risks:** `approveOnboarding()` di `src/lib/platform.ts:85-89` meng-update
  `venues` memakai `id` onboarding, bukan `venue_id` — dugaan bug, perlu koreksi; `REMAINING_WORK.md`
  masih meminta venue dummy padahal migration seed sudah ada (dokumen usang);
  generator kode booking di `constants.ts` tidak dipakai alur booking (§4).

## 4. B3 — Booking, pricing, promo, recurring & waitlist

- **Feature name / scope:** Pilih venue→court→slot, harga weekday/weekend, durasi,
  promo, konfirmasi + DOKU, riwayat, pembatalan; recurring & waitlist sebagai
  subfitur lanjutan; tournament masih backlog.
- **Main source paths:** `src/app/(public)/booking/page.tsx`,
  `(public)/venue/[venueSlug]/booking/page.tsx`, `(public)/my-bookings/page.tsx`,
  `src/app/profile/bookings/page.tsx`, `src/lib/booking/{booking,court,pricing,promo,recurring,waitlist}.ts`,
  `supabase/migrations/20260730000002_booking.sql`, `...0003_booking_advanced.sql`.
- **Dependencies:** `courts`, `court_slots`, `bookings`, `pricing_rules`, `promos`,
  `recurring_templates`, `waitlist`, `daily_counters` + RPC `next_counter()`;
  Supabase Auth; `/api/payment/create`; notifikasi booking.
- **Status — implemented:** Ya untuk inti. Parsial: holiday tidak pernah dihasilkan,
  auto-offer waitlist, transaksi recurring, price fallback 0.
- **Status — tested:** Tidak ada test otomatis B2C. Bukti historis hanya route smoke.
- **Status — deployed:** Platform-level ⚠️.
- **Status — accepted:** Tidak ada bukti.
- **Supporting evidence:** commit `2a35778`, `ece7b93`, `f7b2a78`, `71b3bf4`,
  `56c1fd4`, `3399ee0` (trigger notifikasi), `a5c6da7` (RLS);
  `src/app/(public)/booking/page.tsx:77-131` (slot→booking→DOKU);
  `src/lib/booking/pricing.ts:47-95`; `AUDIT-REPORT.md` §7 (status lama "belum
  dibangun", sudah tidak sesuai source).
- **Current owner:** Owner; `bigblaz`; tidak ada DRI B2C eksplisit.
- **Proposed owner (usulan):** Booking & Pricing pod; kontrak status `bookings.status`
  dan price breakdown harus disepakati dengan Payments dan POS.
- **Debt / risks:** `getDayType()` hanya weekday/weekend (`pricing.ts:47-51`),
  rule tidak ada → harga 0 (`pricing.ts:79-80`); cek slot dibaca lalu insert
  (`booking/page.tsx:82-115`) → race/double booking; `validatePromo` tidak menaikkan
  `current_usage` (`promo.ts:17-43`); `createRecurringBooking` loop insert tanpa
  rollback dan tetap `error:null` (`recurring.ts:53-76`); waitlist hanya CRUD, tanpa
  auto-claim/expiry; kode `BK-DDMM-NNN` dibuat untuk pesan UI tetapi tidak tersimpan
  di `bookings` (`booking/page.tsx:108-115`).

## 5. B4 — Fitness & membership

- **Feature name / scope:** Paket membership & visit package, pendaftaran anggota,
  status aktif/frozen/cancelled, check-in + riwayat, poin reward, expiry cron.
- **Main source paths:** `src/app/(public)/fitness/page.tsx`,
  `(public)/fitness/plans/page.tsx`, `(public)/venue/[venueSlug]/fitness/page.tsx`,
  `src/lib/membership.ts`, `src/app/admin/members/page.tsx`,
  `src/app/admin/w/[slug]/members/page.tsx`,
  `src/app/api/cron/membership-expiry/route.ts`, `src/app/api/offline/checkin/route.ts`.
- **Dependencies:** `membership_plans`, `visit_packages`, `members`,
  `member_visit_packages`, `check_ins`, `reward_points`, RPC `decrement_visit_package`;
  `/api/payment/create`; notifikasi; pg_cron.
- **Status — implemented:** Ya untuk CRUD dasar; parsial untuk payment→activation
  dan atomicity.
- **Status — tested:** Tidak ada test otomatis B2C; tidak ada bukti journey
  daftar→bayar→aktif→check-in.
- **Status — deployed:** Platform-level ⚠️.
- **Status — accepted:** Tidak ada bukti.
- **Supporting evidence:** commit `8dd99db` (B1 membership CRUD + registration/portal),
  `0eb19b6` (seed), `56c1fd4` (fitness plans DB), `ec1589d` (reward UI),
  `a5c6da7` (RLS members INSERT); `src/lib/membership.ts:1-89`;
  `src/app/(public)/fitness/page.tsx:42-113`; `REMAINING_WORK.md` Fase 9 (masih
  mencantumkan wiring notifikasi sebagai todo → usang/perlu verifikasi).
- **Current owner:** Owner; `bigblaz`; tidak ada DRI B2C eksplisit.
- **Proposed owner (usulan):** Membership & Fitness pod; konsumen kontrak Payments
  dan status `bookings`/`members`.
- **Debt / risks:** `registerMembership()` insert `members` dengan `status:"active"`
  sebelum pembayaran DOKU sukses (`fitness/page.tsx:64-83`); `buyPackage()` sama
  sekali tidak memanggil payment (`fitness/page.tsx:88-113`); `checkIn()` insert +
  `decrement_visit_package` terpisah (`membership.ts:57-65`) → oversell pada
  konkurensi; cron memanggil `sendNotification` tanpa `await`
  (`api/cron/membership-expiry/route.ts:16`); reward earning rule tidak terpasang
  di UI (`earnPoints` tidak dipanggil); endpoint offline check-in tidak terautentikasi
  (§10).

## 6. B5 — Akademi & raport

- **Feature name / scope:** Akademi/coach/program, sesi, student + parent relation,
  enrollment, absensi, template & raport, tanda tangan coach/director, publish.
- **Main source paths:** `src/app/(public)/academy/page.tsx`,
  `(public)/academy/report/page.tsx`, `(public)/venue/[venueSlug]/academy/page.tsx`,
  `src/app/admin/academy/page.tsx`, `src/app/admin/w/[slug]/academy/page.tsx`,
  `src/lib/academy.ts`, `src/components/academy/SignatureCanvas.tsx`,
  `src/app/profile/children/page.tsx`,
  `supabase/migrations/20260730000007_academy.sql`.
- **Dependencies:** `academies`, `coaches`, `programs`, `sessions`, `students`,
  `student_parents`, `enrollments`, `attendances`, `report_templates`, `report_cards`;
  notifikasi raport; JUARA Academy bridge (konsumen, design-only).
- **Status — implemented:** Parsial. CRUD library lengkap, tetapi raport publik
  masih memakai nilai acak dan fungsi tanda tangan/report card tidak terpasang di UI.
- **Status — tested:** Tidak ada test otomatis B2C; tidak ada bukti raport published
  atau alur wali melihat raport.
- **Status — deployed:** Platform-level ⚠️.
- **Status — accepted:** Tidak ada bukti.
- **Supporting evidence:** commit `45488cd` (C1/C2 Academy + enrollment), `c30f4c2`
  (notifikasi enrollment), `a5c6da7` (RLS students), `56c1fd4` (report DB),
  `0eb19b6` (seed); `src/lib/academy.ts:1-87`;
  `src/app/(public)/academy/report/page.tsx:45-51` (skor `Math.random()`);
  `docs/juara/ACADEMY_INTEGRATION_SPEC.md` (integrasi JUARA bersifat desain).
- **Current owner:** Owner; `bigblaz`; tidak ada DRI B2C eksplisit.
- **Proposed owner (usulan):** Academy & Raport pod sebagai **source of truth** B2C;
  JUARA/Talent Pathway pod menjadi konsumen melalui kontrak read-model (lihat
  `docs/assessment/JUARA_TEAM_FINDINGS.md`, J31).
- **Debt / risks:** `enrollStudent()` di halaman publik
  (`(public)/academy/page.tsx:37`) mengisi `program_id` pada `students`, padahal skema
  (`...0007_academy.sql:72-82`) tidak memiliki kolom itu → pendaftaran publik
  berisiko gagal; `lib/academy.ts:28-39` melakukan tiga insert terpisah tanpa
  transaksi; `signReportCard` men-set `published_at` juga saat `coach_signed` dan
  menerima `role` dari caller (`academy.ts:69-80`); raport UI mensimulasikan nilai
  dengan `Math.random()`; `getReportCards`, `signReportCard`, `recordAttendance`,
  `getParentStudents`, dan `SignatureCanvas` tidak memiliki pemanggil di halaman
  saat ini; tidak ada generasi PDF raport di tree saat ini (jsPDF hanya dipakai
  `lib/juara/pdf.ts`).

## 7. B6 — POS / kasir

- **Feature name / scope:** Login kasir, pilih venue, buka/tutup shift, booking slot,
  walk-in, cash/QRIS/transfer/debit/DOKU/split, member check-in, invoice cetak,
  shift report, void/refund.
- **Main source paths:** `src/app/pos/page.tsx` (779 baris, aplikasi utama),
  `src/app/pos/[slug]/{shift,walkin,checkin}/page.tsx` (**redirect stub ke `/pos`**),
  `src/lib/pos.ts`, `src/app/api/payment/{create,refund}/route.ts`,
  `src/app/api/offline/checkin/route.ts`.
- **Dependencies:** `shifts`, `pos_transactions`, `invoices`, `refunds`, `bookings`,
  `courts`, `court_slots`, `pricing_rules`, `members`, `check_ins`; `/api/payment/*`;
  `venue_roles`; invoice number helper & `daily_counters`.
- **Status — implemented:** Ya di `/pos`. Sub-route `/pos/[slug]/*` bukan fitur
  tersendiri, hanya `router.replace("/pos")`.
- **Status — tested:** Tidak ada test otomatis B2C; tidak ada bukti visual/acceptance.
- **Status — deployed:** Platform-level ⚠️ (`AUDIT-REPORT.md` §3 mencatat host pos
  200 pada Agustus; status SHA saat ini tidak dipetakan).
- **Status — accepted:** Tidak ada bukti.
- **Supporting evidence:** commit `db89fa7`, `2c52e50`, `67fac62`, `9e81142`,
  `b2ff8af`, `ee7fcaa`, `c2ad01c`, `597669c`, `5827542`;
  `src/app/pos/page.tsx:39-123` (metode & split), `:194-245` (shift),
  `:268-368` (booking/walk-in), `:370-389` (check-in), `:616-678` (report),
  `:687-776` (refund & invoice); `src/lib/pos.ts:1-93`.
- **Current owner:** Owner; `bigblaz`; tidak ada DRI B2C eksplisit.
- **Proposed owner (usulan):** POS Operations pod; menggunakan kontrak Payment &
  Settlement untuk DOKU/refund, bukan mengimplementasikan logika provider sendiri.
- **Debt / risks:** Nomor invoice di UI dibuat dengan `Math.random()`
  (`pos/page.tsx:315-321`, `:359-363`) padahal ada `createInvoice()`/`next_counter()`;
  `walkinPay()` tidak pernah mengisi `dokuUrl` (`pos/page.tsx:338-346`) sehingga opsi
  DOKU walk-in tidak menghasilkan link; QRIS/transfer hanya menyimpan
  `manual_verified:false` tanpa UI persetujuan; split transaksi diinsert per baris
  tanpa atomicity (`:256-266`); perhitungan selisih shift duplikat di UI dan
  `lib/pos.ts:19-31`; refund lokal tetap sukses walau DOKU gagal (§7); tidak ada
  role-check server-side untuk kasir; tidak ada evidence visual untuk layout POS.

## 8. B7 — Payments / DOKU & settlement

- **Feature name / scope:** Buat payment link DOKU, webhook status, konfirmasi
  booking, refund direct/non-direct, estimasi settlement, settlement tracking.
- **Main source paths:** `src/lib/doku/client.ts`, `src/lib/doku/refund.ts`,
  `src/app/api/payment/create/route.ts`, `src/app/api/payment/callback/route.ts`,
  `src/app/api/payment/refund/route.ts`, `src/components/payment/DokuPaymentModal.tsx`
  (komponen ada tetapi tidak dipakai halaman saat ini), `src/lib/pos.ts:42-54`.
- **Dependencies:** DOKU Checkout/Status/Refund API (`DOKU_CLIENT_ID`,
  `DOKU_SECRET_KEY` — tidak dibaca dalam assessment ini); Supabase **admin client**;
  `payment_records`, `bookings`, `pos_transactions`, `refunds`, `notifications`;
  HMAC SHA-256 + Request-Id idempotency.
- **Status — implemented:** Ya, dengan masalah kebenaran status yang tercantum di bawah.
- **Status — tested:** Tidak ada test otomatis B2C. Riwayat commit hanya mencatat
  perbaikan format signature/build, bukan test embedding/webhook.
- **Status — deployed:** Platform-level ⚠️.
- **Status — accepted:** Tidak ada bukti.
- **Supporting evidence:** commit `a7c4c58`, `4e64bcb`, `a1be343`, `5bdfec0`,
  `5827542`, `3b4f98e`, `e12f60b`, `0f0cd9f`, `7389ddb` (API key dikeluarkan dari
  client); `src/app/api/payment/callback/route.ts:3,5-93`;
  `src/app/api/payment/create/route.ts:5-44`; `src/app/api/payment/refund/route.ts:5-94`;
  `docs/assessment/PLATFORM_FEATURE_FINDINGS.md` (temuan P0/P1 sejalan).
- **Current owner:** Owner; `bigblaz`; tidak ada DRI B2C eksplisit.
- **Proposed owner (usulan):** Payments & Settlement pod sebagai **pemilik
  authoritative state machine** (`payment_records`, invoice correlation, status
  `paid/pending/failed/refunded/settled`) yang dipakai Booking, Membership, POS,
  Academy. Ini bukan perpindahan owner hari ini.
- **Debt / risks (prioritas tertinggi dalam inventory ini):**
  - P0 — `validateDokuNotification` diimpor (`callback/route.ts:3`) tetapi **tidak
    dipanggil**; webhook menerima payload apa pun dari admin client tanpa verifikasi
    signature. Jangan dieksploitasi; cukup ditandai untuk triage read-only.
  - P0 — route `/api/payment/*` tidak memanggil `getUser()`/`requireRole()`;
    `middleware.ts:4` melewati `/api`.
  - P0 — `callback/route.ts:62-79` mengambil **semua** `pos_transactions` DOKU
    pending lalu mengubah semuanya tanpa korelasi invoice; risiko transaksi lain
    ikut completed/failed.
  - P1 — `create/route.ts:34-38` langsung menulis `payment_records.status = "paid"`
    saat URL dibuat, sebelum webhook; harga juga dipercaya dari request body.
  - P1 — `refund/route.ts:33,44` merekonstruksi invoice sebagai
    `INV-${transactionId.slice(0,8)}`, berbeda dengan format di `create/route.ts:22`
    (`INV-${refId.slice(0,8)}-${base36}`) → refund provider berisiko gagal.
  - P1 — kegagalan DOKU ditelan (`refund/route.ts:52-55`) lalu transaksi tetap
    ditandai `refunded`, booking `cancelled`, refund `approved`.
  - P2 — `checkDokuStatus()` tidak dipanggil dari route/job mana pun; tidak ada
    rekonsiliasi aktif. `estimateSettlementDate`/`settlementStatus`
    (`refund.ts:127-161`) adalah estimasi lokal, bukan bukti settlement provider.

## 9. B8 — Admin platform & workspace

- **Feature name / scope:** Dashboard platform, kelola venue/user, fee & diskon,
  pengumuman, onboarding approval, settings, laporan; workspace per venue
  (bookings, members, academy, staff, reports, settings).
- **Main source paths:** `src/app/admin/{page,dashboard,venues,users,fees,discounts,settings,reports,platform,staff,bookings,members,academy}/page.tsx`,
  `src/app/admin/w/[slug]/*`, `src/app/api/admin/{dashboard,fees,discounts,announcements,check-role}/route.ts`,
  `src/lib/platform.ts`, `src/lib/supabase/admin.ts`.
- **Dependencies:** service-role key (hanya server), `venues`, `venue_roles`,
  `platform_fee_config`, `platform_discounts`, `platform_announcements`,
  `venue_onboarding`, `bookings`, `members`, `students`, `auth.admin.listUsers`.
- **Status — implemented:** Ya, dua dashboard yang tumpang tindih
  (`admin/dashboard` via `/api/admin/dashboard`, `admin/platform` via query client).
- **Status — tested:** Tidak ada test otomatis B2C.
- **Status — deployed:** Platform-level ⚠️ (`AUDIT-REPORT.md` §3 mencatat route
  admin 200; perbaikan guard ada di commit `3d27a75`).
- **Status — accepted:** Tidak ada bukti.
- **Supporting evidence:** commit `ffd5f97`, `3d69ba6`, `c2d8068`, `71b3bf4`,
  `56c1fd4`, `ec1589d`, `7389ddb`, `3d27a75`; `src/lib/platform.ts:1-94`;
  `src/app/admin/dashboard/page.tsx:13-27`; `src/app/admin/platform/page.tsx:17-29`.
- **Current owner:** Owner; `bigblaz`; tidak ada DRI B2C eksplisit.
- **Proposed owner (usulan):** Platform Admin & Analytics pod; metrik pendapatan
  harus mengonsumsi state Payments yang sudah rekonsiliasi, bukan menghitung ulang
  dari `bookings.final_price`.
- **Debt / risks:** definisi revenue berbeda antar dashboard (`platform.ts:12-13`
  pakai `platform_fee` atau fallback 5%; `admin/platform` menjumlahkan
  `bookings.final_price` tanpa filter status); `approveOnboarding` menus `venues.id`
  dengan onboarding id (`platform.ts:85-89`); API admin memakai admin client tanpa
  capability check yang terlihat; `AUDIT-REPORT.md` §5 mencatat loading/empty/error
  state belum merata (perlu diverifikasi ulang, jangan dianggap masih benar).

## 10. B9 — Notifikasi, trigger & cron

- **Feature name / scope:** Notification center, preferensi kanal, trigger event
  (booking, membership, enrollment, raport, shift, refund), email/push, reminder
  booking & expiry.
- **Main source paths:** `src/lib/notification/{notify,preferences,triggers}.ts`,
  `src/lib/notification/channels/{in_app,email,push}.ts`,
  `src/components/notification/NotificationCenter.tsx`,
  `src/app/(public)/notifications/page.tsx`, `src/app/profile/notifications/page.tsx`,
  `src/app/api/cron/{booking-reminder,membership-expiry}/route.ts`,
  `supabase/migrations/20260730000009_cron_jobs.sql`.
- **Dependencies:** `notifications`, `user_notification_preferences`; Resend &
  OneSignal (env); Supabase; producer dari semua feature pod.
- **Status — implemented:** Ya untuk in-app + wiring trigger; pengiriman email/push
  belum ada bukti runtime.
- **Status — tested:** Tidak ada test otomatis B2C atau bukti pengiriman.
- **Status — deployed:** Platform-level ⚠️.
- **Status — accepted:** Tidak ada bukti.
- **Supporting evidence:** commit `3399ee0` (H2–H5 trigger), `0eb19b6` (duplicate
  notif fix), `f048e31`, `112cc70`; `src/lib/notification/triggers.ts:1-93`;
  `REMAINING_WORK.md` Fase 9 (env Resend/OneSignal & wiring masih tertulis sebagai
  todo → status dokumen usang, perlu verifikasi).
- **Current owner:** Owner; `bigblaz`; tidak ada DRI B2C eksplisit.
- **Proposed owner (usulan):** Notifications & Engagement pod sebagai shared
  service; feature pod tetap bertanggung jawab atas trigger dan UX notifikasinya.
- **Debt / risks:** tidak ada bukti kredensial/pen-test pengiriman; cron memanggil
  `sendNotification` tanpa await; jadwal pg_cron tidak terverifikasi runtime;
  `notifyRaportPublished` memiliki `link:"/parent"` yang tidak cocok dengan route
  saat ini (`profile/children`); tidak ada outbox/retry/idempotensi pengiriman.

## 11. B10 — PWA, offline & shared shell

- **Feature name / scope:** Manifest & ikon, service worker, install prompt, antrian
  offline, background sync check-in, navigasi & komponen UI bersama, error boundary.
- **Main source paths:** `public/{manifest.json,sw.js,icon-192.png,icon-512.png}`,
  `src/components/pwa/PwaInstallPrompt.tsx`, `src/lib/offline.ts`,
  `src/app/api/offline/checkin/route.ts`, `src/components/shared/*`,
  `src/components/ui/*`, `src/app/globals.css`, `src/lib/design.ts`.
- **Dependencies:** service worker & localStorage browser; Supabase; semua halaman.
- **Status — implemented:** Ya untuk shell/PWA; offline hanya untuk `checkin`.
- **Status — tested:** Tidak ada test otomatis B2C; tidak ada audit aksibilitas.
- **Status — deployed:** Platform-level ⚠️ (aset statis ada di tree; bukti runtime
  service worker tidak spesifik per fitur).
- **Status — accepted:** Tidak ada bukti visual B2C sesuai standar.
- **Supporting evidence:** commit `f048e31` (SW registration, BottomNav filter),
  `3399ee0` (ErrorBoundary), `112cc70`; `src/lib/offline.ts:1-67`;
  `docs/VISUAL_ACCEPTANCE_STANDARD.md` (gate yang belum terpenuhi untuk B2C).
- **Current owner:** Owner; `bigblaz`; tidak ada DRI B2C eksplisit.
- **Proposed owner (usulan):** Shared Experience / Platform pod (design system,
  PWA, offline, aksibilitas, standar visual) sebagai enabler, bukan pemilik journey
  tiap domain.
- **Debt / risks:** `OfflineAction.type` mendeklarasikan `attendance`/`booking`,
  tetapi `processOfflineQueue()` hanya menangani `checkin` dan tetap
  `processed++` untuk tipe lain, serta tidak mengecek `res.ok` (`offline.ts:43-65`)
  → data bisa hilang; `/api/offline/checkin` memakai admin client tanpa autentikasi,
  tanpa idempotensi, dan selalu mengembalikan success (`route.ts:4-15`);
  `AUDIT-REPORT.md` §5 (empty/error state) perlu diverifikasi ulang.

## 12. B11 — Batas cakupan JUARA (dicatat agar tidak tertukar dengan B2C)

- **Feature name / scope:** `src/app/juara/**`, `src/app/api/juara/v1/**`,
  `src/lib/juara/**`, `tests/juara/**`, `docs/juara/**` — B2B executive suite,
  bukan fitur B2C, tetapi satu repo/DB/Supabase Auth dengan B2C.
- **Status — implemented/tested/deployed/accepted:** Kandidat terbaru: 74 test
  lolos; **ACCEPTED hanya untuk bukti fungsional staging slice draft/CAS/
  reconciliation** pada `063c1c8` (`docs/juara/OWNER_REP_FINAL_RELEASE_EVIDENCE_AUDIT.md`).
  Bukan acceptance produksi, bukan P1/D3 penuh, bukan acceptance B2C.
- **Supporting evidence:** `docs/PM_LOG.md` (Sprint 0–11, deploy 23 Nov),
  `docs/juara/PM_EXECUTION_STATUS.md`, `docs/juara/P1_DEPLOY_VERIFICATION.md`,
  `docs/assessment/JUARA_TEAM_FINDINGS.md`.
- **Current owner:** Owner → CTO TDCorp → PM (`ses_dfd621110ffeVnw419vDE4qR43`);
  enam worker divisi (`docs/juara/TEAM.md`) masih ada tetapi seluruhnya kena kuota
  free (23–24 Nov), sehingga implementasi lanjutan dijalankan native oleh PM.
- **Proposed owner (usulan):** Pod JUARA terpisah sesuai
  `docs/assessment/JUARA_TEAM_FINDINGS.md`; jangan menggabungkan DRI B2C dan JUARA.
- **Debt / risks:** berbagi `auth.users` dan database produksi
  (`docs/juara/DECISIONS.md` D4); migrasi M-14/M-16 masih perlu rekonsiliasi
  produksi; Academy bridge JUARA bersifat design-only; jangan membaca status
  "LIVE/accepted" JUARA sebagai bukti penerimaan B2C.

## 13. B12 — Mockup & artifact perencanaan (desain, bukan produksi)

- **Feature name / scope:** `stadione-mockup.jsx` (24 layar: public, admin, POS),
  `PRD.md`, `IMPLEMENTATION_PLAN.md`, `REMAINING_WORK.md`, `AUDIT-REPORT.md`,
  `docs/VISUAL_ACCEPTANCE_STANDARD.md`, `docs/juara/design/**`.
- **Status — implemented/tested/deployed/accepted:** **Design artifact saja.**
  `stadione-mockup.jsx` bukan source yang di-build (tidak ada di `src/`, berekstensi
  `.jsx` dengan state murni UI); file `stadione-mockup.jsx:Zone.Identifier` menandakan
  artifact hasil unduhan Windows. Tidak masuk status tested/deployed/accepted.
- **Supporting evidence:** `stadione-mockup.jsx:1-30` (definisi 24 screen),
  `:126-1000+` (komponen screen Public/Admin/POS); commit `2a35778`;
  `AUDIT-REPORT.md` (2 Agu), `REMAINING_WORK.md` (Fase 8–12).
- **Current owner:** Owner/dokumen produk; bukan owner kode produksi.
- **Proposed owner (usulan):** Product/Document steward + design reviewer; mockup
  dipakai sebagai referensi visual bersama `docs/VISUAL_ACCEPTANCE_STANDARD.md`.
- **Debt / risks:** dokumen saling bertentangan (audit lama GO-LIMITED vs kode yang
  sudah lebih jauh; checklist "Fase 0–7 Done" vs gap nyata; `README.md` masih
  boilerplate; `PRD_V2.md` yang dirujuk plan tidak ada); fidelitas mockup terhadap
  layar aktif belum diperiksa; tidak ada manifest screenshot B2C untuk visual gate.

---

## 14. Deployment & acceptance evidence (ringkasan lintas fitur)

- **Local git:** HEAD `063c1c8` (`docs(juara): final release evidence and app rollback
  rehearsal`, 24 Nov 2026, `taraderifatoni`). `git status --short`: perubahan/untracked
  terutama dokumentasi Juara (`AGENTS.md`, `docs/juara/**`, `scripts/juara/**`,
  `scripts/owner-rep/**`, `.owner-rep-runtime/`, `docs/VISUAL_ACCEPTANCE_STANDARD.md`);
  **tidak ada modifikasi source B2C** di working tree. Commit B2C terakhir:
  `5827542` / `0f0cd9f` (3–4 Agu 2026, `bigblaz`).
- **Bukti deploy platform (dokumen, bukan SSH):** `docs/PM_LOG.md:401-432` —
  23 Nov 2026: VPS `/opt/stadione`, merge `96e78e6`, `npm run build` exit 0, symlink
  `/opt/stadione-current`, `systemctl restart stadione.service` → active, port 3011,
  Traefik `stadione.yml`, `https://stadione.pro` tetap 200.
  `docs/juara/P1_DEPLOY_VERIFICATION.md` — 24 Nov: VPS `6425ae5`,
  `stadione.service active`, `GET https://stadione.pro` → 200 ("B2C aman").
  `docs/juara/PM_EXECUTION_STATUS.md` baseline menyebut VPS `019ebcd`.
- **Kesimpulan disiplin:** Angka SHA di atas tidak konsisten satu sama lain dan tidak
  dipetakan ke fitur B2C. Maka status DEPLOYED untuk B1–B10 hanya dapat dinyatakan
  **platform-level ⚠️**, bukan "fitur X terverifikasi di produksi pada SHA Y".
  Perlu rekonsiliasi PM: SHA produksi aktual, tanggal build, dan journey smoke per
  fitur. Assessment ini tidak melakukan SSH/curl produksi.
- **ACCEPTED B2C:** tidak ada. Gate `docs/VISUAL_ACCEPTANCE_STANDARD.md` belum
  terpenuhi untuk layar B2C (tidak ada manifest screenshot + inspeksi reviewer B2C).
- **Temuan lama yang sudah berubah di source (hindari status usang):**
  cross-app block kini ada di `src/middleware.ts:36-44`; halaman
  `src/app/admin/staff/page.tsx` sudah ada; `/pos/[slug]/*` kini redirect stub
  (bukan 404); crew RLS dan notifikasi sudah banyak disentuh commit Agustus.
  Ini tidak otomatis berarti terverifikasi di produksi.

## 15. Usulan feature-pod structure (proposal saja, tanpa reassignment)

| Pod (usulan) | Feature IDs | Alasan batas | Ketergantungan |
|---|---|---|---|
| Identity & Access | B1 | Auth/RBAC/RLS adalah fondasi semua domain | Owner, CTO handoff |
| Venue & Discovery | B2 | `venue_id`/slug dipakai semua modul | Identity |
| Booking & Pricing | B3 | state booking & harga | Venue, Payments, Membership |
| Membership & Fitness | B4 | entitlement member | Venue, Payments, Booking |
| Academy & Raport | B5 | source of truth akademi B2C | Venue, Identity, Payments; JUARA konsumen |
| POS Operations | B6 | shift & transaksi kasir | Booking, Membership, Payments |
| Payments & Settlement | B7 | **pemilik state machine pembayaran**, bukan sekadar integration | Semua domain transaksional |
| Platform Admin & Analytics | B8 | governance & metrik | Payments (data authoritative) |
| Notifications & Engagement | B9 | shared service, trigger tetap milik feature pod | Semua domain |
| Shared Experience / Platform | B10 | design system, PWA, offline, aksibilitas | Semua UI |
| Security / Release reviewer | lintas | audit independen & visual gate | Tidak boleh menjadi queue QA tunggal |
| JUARA pods | B11 | produk B2B terpisah | `docs/assessment/JUARA_TEAM_FINDINGS.md` |

Catatan tata kelola usulan: satu DRI per pod, satu worktree/branch per slice, migrasi
dan file high-contention (`src/lib/doku/*`, `src/app/api/payment/*`, `payment_records`,
`pos_transactions`, `bookings.status`, `src/lib/supabase/*`) dikoordinasikan terpusat;
maksimal 2 slice implementasi + 1 reviewer sampai kapasitas agen/provider/kuota
diukur (enam worker JUARA saat ini sedang kena kuota — lihat `docs/juara/TEAM.md`).

## 16. Information gap yang harus dilengkapi PM (tidak bisa direka)

1. SHA produksi aktual + tanggal build untuk tiap fitur B2C, dan apakah source
   B2C Agustus itu benar-benar yang berjalan di `/opt/stadione-current`.
2. Test/UAT B2C terbaru (journey booking→DOKU→confirm, membership→bayar→check-in,
   akademi enrollment→raport→wali, POS shift→refund) beserta screenshot viewport
   sesuai `docs/VISUAL_ACCEPTANCE_STANDARD.md`.
3. Named human/agent owner per fitur + on-call/insiden/status backlog; dokumen saat
   ini hanya memberi Owner, CTO, PM JUARA, dan author git `bigblaz`.
4. Status runtime penyedia pembayaran/notifikasi (DOKU webhook & settlement,
   Resend/OneSignal), RLS/tenant audit, dan apakah temuan P0 di §8 sudah ditriage.
5. Rekonsiliasi dokumentasi usang: `AUDIT-REPORT.md`, `REMAINING_WORK.md`,
   `IMPLEMENTATION_PLAN.md`, `README.md`, dan `PRD_V2.md` yang tidak ditemukan.

Assessment ini berhenti di inventarisasi dan rekomendasi struktur. Tidak ada
perubahan owner, deploy, push, DB, kredensial, atau kode produksi yang dilakukan.
