# Assessment fitur platform non-JUARA — 24 November 2026

Assessment read-only source, route, schema dan rencana pada workspace saat ini. Tidak
menjalankan transaksi pembayaran, memodifikasi produksi atau mengasumsikan keberadaan
route = production accepted. CTO_HANDOFF sudah ACKNOWLEDGED.

## Interpretasi status

**Development (D)** = implementasi terlihat tetapi bukti QA/release per fitur belum
tersedia dalam sumber yang diperiksa. Ini status verifikasi assessment, bukan klaim
fitur tersebut belum berjalan live. **Testing (T)** hanya jika ada artefak test/UAT
spesifik; **Production (P)** perlu SHA deployment + smoke/monitoring per fitur;
**Backlog (B)** = kebutuhan roadmap yang implementasi lengkapnya belum ditemukan.
IMPLEMENTATION_PLAN.md menandai deliverable fase0–7 [x], tetapi rincian masih [ ]
dan beberapa gap kode nyata. Jadi checkbox itu tidak boleh dipromosikan menjadi P.
Production verification untuk non-JUARA adalah **UNKNOWN/PERLU REKONSILIASI PM**.
Daftar ini mencakup fitur logis, bukan setiap komponen tampilan sebagai fitur.

## Inventory domain dan dependensi

| ID | Domain/fitur dan subfitur | Status verifikasi | Source utama | Dependensi/keterangan |
|---|---|---|---|---|
| ID01 | Identitas: register, login/logout, email verification/callback, password reset, session | D | src/app/(auth)/*; src/app/auth/callback; src/app/api/auth/session; src/lib/auth.ts | Supabase Auth; semua domain |
| ID02 | Profil: akun, kontak, privacy, preferences | D | src/app/profile/account; profile/privacy; (public)/profile | ID01 |
| ID03 | Peran: global admin, venue owner/manager/staff, venue switch | D | src/lib/auth.ts; src/app/admin/layout.tsx; src/middleware.ts; venue_roles | ID01, VE01; middleware melewatkan /api |
| ID04 | Staff invite, invite-info, accept, role management | D | src/app/api/staff/*; admin/w/[slug]/staff; (public)/invite | ID01, ID03, email, VE01 |
| VE01 | Venue katalog/detail, slug, alamat, foto, olahraga dan domain layanan | D | src/lib/venue.ts; (public)/venues; (public)/venue/[venueSlug]; admin/venues | ID03, venues |
| VE02 | Pencarian venue/lokasi dan home discovery | D | src/app/search; (public)/page.tsx; (public)/booking | VE01; beberapa search input perlu verifikasi wiring |
| VE03 | Onboarding venue, approval/rejection dan verifikasi dokumen | D/B | src/lib/platform.ts getOnboardingQueue/approve/reject; venue_onboarding; IMPLEMENTATION_PLAN§7.4 | ID01/03; flow wizard lengkap belum ditemukan |
| VE04 | Workspace dashboard, venue settings, staff dan modul per venue | D | src/app/admin/w/[slug]/* | VE01, ID03; shared context |
| BK01 | Court CRUD, aktivasi, cabang olahraga | D | src/lib/booking/court.ts; admin/w/[slug]/bookings | VE01 |
| BK02 | Slot/calendar, ketersediaan, pilih court/tanggal/jam | D | src/lib/booking/booking.ts; (public)/booking; venue/[venueSlug]/booking | BK01, bookings/court_slots |
| BK03 | Pricing weekday/weekend/holiday, timeband, priority, member discount | D | src/lib/booking/pricing.ts | BK01, MB01; holiday enum ada tetapi resolver tidak mengembalikan holiday |
| BK04 | Booking checkout, harga breakdown, konfirmasi dan riwayat | D | src/lib/booking/booking.ts; (public)/my-bookings; profile/bookings | BK02/03, PY01, ID01 |
| BK05 | Pembatalan booking dan refund eligibility | D | cancelBooking; my-bookings; PY03 | BK04, PY03, notifikasi/waitlist |
| BK06 | Recurring weekly/biweekly, template dan cancel group | D | src/lib/booking/recurring.ts | BK02/03/04; partial failure/transaction debt |
| BK07 | Split court/full-vs-half mutual exclusion | D/B | court_slots; courts.is_splittable; IMPLEMENTATION_PLAN§2.2 | BK01/02; end-to-end concurrency belum dibuktikan |
| BK08 | Waitlist join/position/leave, auto offer/expiry/claim | D/B | src/lib/booking/waitlist.ts; advanced migration; plan§2.3 | BK02/05, notifications/cron; auto processing tidak ada pada helper |
| BK09 | Tournament multi-court, longer duration, special price | D/B | bookings schema; plan§2.4 | BK01/02/03; standalone workflow belum ditemukan |
| BK10 | Promo code validity, usage limit/min hours, percentage/fixed discount | D | src/lib/booking/promo.ts; public booking | BK03; platform discount policy |
| PY01 | DOKU checkout/payment URL, payment record | D | src/app/api/payment/create; src/lib/doku/client.ts; DokuPaymentModal | BK04/MB02/AC03; critical debt P0-P2 below |
| PY02 | Webhook/status reconciliation, booking confirmation, receipt notification | D | src/app/api/payment/callback | PY01, POS03, notifications; critical correlation/auth debt |
| PY03 | Refund approval/request, direct bank/non-direct link, accounting status | D | src/app/api/payment/refund; src/lib/doku/refund.ts; src/lib/pos.ts | PY01/02, POS03; provider failure semantics debt |
| PY04 | Settlement estimate/status, fee split, financial records | D | src/lib/doku/refund.ts; payment_records; platform_fee_config | PY01/02, OP03; settlement labels need audit |
| PS01 | POS login/venue selection and operator permissions | D | src/app/pos/page.tsx; pos/[slug] | ID01/03, VE01 |
| PS02 | Open/close shift, opening cash, closing cash, discrepancy | D | src/lib/pos.ts; pos/[slug]/shift | PS01, PS03 |
| PS03 | Walk-in booking/product sale, cash/QRIS/transfer/debit/DOKU/split payment | D | src/app/pos/page.tsx; pos/[slug]/walkin | BK04, PY01/02, PS02 |
| PS04 | Invoice/receipt creation, numbering, print/share | D | src/lib/pos.ts createInvoice; daily_counters migration; POS page | PS03; numbering consistency review |
| PS05 | Check-in lookup and membership/visit redemption | D | pos/[slug]/checkin; src/lib/membership.ts | MB02/03/04; offline queue |
| MB01 | Membership plan CRUD/tier/billing cycles/benefits | D | src/lib/membership.ts; admin/w/[slug]/members | VE01, ID03 |
| MB02 | Membership enrollment, payment, active/frozen/cancelled/expired lifecycle | D | src/lib/membership.ts; fitness/plans; venue/[slug]/fitness | MB01, PY01, cron; payment-to-activation needs runtime proof |
| MB03 | Visit package create/purchase/balance/expiry | D | visit_packages/member_visit_packages; membership.ts | PY01, MB04 |
| MB04 | Check-in/history, visit decrement and offline check-in | D | membership.checkIn; api/offline/checkin; pos checkin | MB02/03, ID03; non-atomic write debt |
| MB05 | Rewards ledger/balance, earn/redeem policy | D/B | membership.earnPoints/getRewardBalance; reward_points; plan§5.6 | MB04, PY01; redemption completeness unverified |
| MB06 | Member benefits into booking discount | D | booking/pricing.calculatePrice; plan§5.7 | MB01/02, BK03 |
| AC01 | Academy create, coaches, sports, program CRUD/capacity | D | src/lib/academy.ts; admin/w/[slug]/academy | VE01, ID03 |
| AC02 | Session schedule, coach assignment, conflict detection | D/B | sessions; academy.getSessions; plan§6.2 | AC01, BK02; conflict UI/runtime not evidenced |
| AC03 | Student enrollment, parent/student many-to-many, fees | D | academy.enrollStudent; (public)/academy; venue academy | AC01, PY01, ID01; multi-insert atomicity debt |
| AC04 | Attendance record/upsert, parent visibility, offline attendance | D/B | academy.recordAttendance; attendances; offline.ts | AC02/03; offline attendance dropped by queue implementation |
| AC05 | Report templates/categories/items/weights, report scores/calculation | D/B | report_templates/report_cards; academy.saveReportCard; academy/report | AC01/03; full builder/weight QA not evidenced |
| AC06 | Coach/director signature, publish/lock/audit report | D | academy.signReportCard; SignatureCanvas; academy/report | AC05, ID03; transition/immutability enforcement needs audit |
| AC07 | Report PDF/export, parent child roster/schedule/report/payment access | D/B | academy/report; profile/children; academy.getParentStudents; plan§6.9-10 | AC03/04/06, PY01; full parent journey QA absent |
| OP01 | Platform admin dashboard/KPI/venues/users/global operations | D | admin/dashboard, users, venues; api/admin/dashboard; platform.ts | ID03, VE01, all domain metrics |
| OP02 | Workspace reports/revenue/booking/member/student analytics | D | admin/reports; admin/w/[slug]/reports | BK04, PY02, MB02, AC03; definitions/reconciliation ownership needed |
| OP03 | Platform fee config/global-vs-venue, discount share, announcements | D | admin/fees,discounts,settings,platform; api/admin/*; platform.ts | PY01/04, BK10, notifications |
| NT01 | In-app notification center/history/read state/realtime | D | NotificationCenter; notifications routes; lib/notification/channels/in_app | ID01; domain event producers |
| NT02 | Email delivery via Resend, web push via OneSignal | D | lib/notification/channels/{email,push}; notify.ts | credentials, DNS, worker/provider delivery |
| NT03 | Notification preferences/channel routing, event triggers | D | profile/notifications; notification/preferences,triggers | ID01; booking/membership/academy/POS owners produce events |
| NT04 | Booking reminder, membership expiry, waitlist expiry, retention cron | D/B | api/cron/*; supabase/migrations/20260730000009_cron_jobs.sql; plan§7.8 | timezones, scheduling, domain tables; runtime schedule evidence absent |
| EX01 | PWA install, manifest/icons, service worker/offline fallback | D | public/{manifest.json,sw.js}; PwaInstallPrompt | shared shell/cache/auth policy |
| EX02 | Offline queue/retry/sync booking/attendance/checkin | D/B | src/lib/offline.ts; api/offline/checkin | MB04, AC04, BK04; current handler only checkin |
| EX03 | Responsive shell/nav, error boundary/loading/accessibility | D | components/shared/*; components/ui/* | all teams; common standards, per-feature acceptance |
| EX04 | SEO metadata/sitemap/robots/structured data | B/D | IMPLEMENTATION_PLAN§7.3; route metadata | VE01/public discovery; sitemap/robots files not found |
| EX05 | Venue onboarding wizard5steps/doc upload/first invite | B/D | IMPLEMENTATION_PLAN§7.4; onboarding schema/helpers | VE01/03, ID04; complete wizard not found |

D/B berarti bagian dasar implementasi D, subfitur lanjutan B/verification gap. Master
inventory sebaiknya memecah baris ini saat PM menyerahkan bukti status per subfitur.
Tidak ada baris diberi P hanya karena kode atau checkbox exist.

## Dependensi yang menentukan batas tim

- Venue identity + Auth/RBAC merupakan prerequisite semua fitur; API/backend
  permission menjadi tanggung jawab feature owner, bukan diserahkan ke UI guards.
- Booking → Pricing/Promo + Membership entitlement → Payment → Booking confirmed
  → Notification → POS/check-in/report. Kontrak status/event harus disepakati.
- POS → Shift + Booking + Payment/refund; shared payment state machine satu owner.
- Academy → Venue/Auth → Enrollment/parent relationship → Payment → Session/
  Attendance → Assessment/signature/publish → Parent notification/report.
- Notifications, PWA, security, infrastructure mendukung semua tim; **feature owner
  tetap accountable** untuk trigger/UX/error outcomes dan incident domainnya.
- JUARA Academy integration menyentuh students/report/parent permissions; domain
  Academy harus menjadi owner data sumber, JUARA consumer melalui kontrak/read model.

## Temuan technical debt dan risiko konkret (static review, bukan exploit live)

| Prioritas assessment | Temuan terverifikasi source | Dampak dan pemilik yang disarankan |
|---|---|---|
| P0 | payment/callback mengimpor validateDokuNotification tetapi tidak memanggilnya; memakai admin client | Signature verification perlu diperiksa segera oleh Payments owner+Security |
| P0 | callback satu invoice melakukan SELECT semua pending pos_transactions DOKU lalu update semuanya tanpa correlation invoice | Risiko transaksi lain dianggap completed/failed; Payments/POS boundary |
| P0 | payment/create dan refund tidak memanggil getUser/requireRole; middleware mengecualikan /api | Server capability/tenant checks belum terlihat; Payments owner; cek deployment exposure read-only |
| P1 | payment/create menerima amount request dan insert payment_records status paid saat baru membuat URL | Harga authoritative dan state machine salah; Payments + Booking contract |
| P1 | refund catch provider error tetapi tetap status refunded, refund approved dan booking cancelled | False financial completion; perlu requested/processing/failed/reconciled states |
| P1 | offline/checkin admin insert tanpa auth/idempotency/checked error, selalu success | Akses/duplicate/lost sync; Membership owner |
| P1 | offline.processOfflineQueue hanya mengeksekusi checkin; attendance/booking ikut processed++; tidak cek res.ok | Data offline bisa hilang walau belum disimpan; domain consumers+platform |
| P1 | membership.checkIn insert dan decrement package terpisah; enrollStudent tiga insert terpisah; recurring loop mengabaikan failed inserts dan return error:null | Partial writes/oversell/inconsistent capacity; respective feature owners |
| P2 | pricing.getDayType tidak menghasilkan holiday; missing rule ->0 | Harga nol/salah pada gap config; Booking owner |
| P2 | signReportCard men-set published_at juga saat coach_signed, role string dari caller; audit DB workflow lock belum dilakukan | Workflow publication/approval perlu negative tests; Academy owner |
| P2 | settlementStatus memberi settled saat tanggal <= hari ini tanpa settlement provider evidence | Estimasi bukan rekonsiliasi; Payments owner |
| P2 | waitlist helper hanya CRUD, auto-process/expiry tidak terbukti lengkap; plan mengklaim done | Feature completeness traceability; Booking owner |
| P2 | tests yang ditemukan berfokus JUARA; tidak ditemukan suite non-JUARA dalam tests/ | Coverage journey/payment/tenant gap; per-team QA, shared automation enabling |
| P2 | README masih boilerplate; PRD_V2.md yang dirujuk plan tidak ditemukan; checkbox plan kontradiktif | Product status tidak reliable; PM+feature owners rekonsiliasi |

Temuan P0 perlu triage prioritas segera dengan read-only production SHA/config review.
Jangan melakukan payment/refund exploit atau transaksi riil untuk membuktikannya.
Assessment tidak mengubah app dan tidak menyatakan insiden produksi telah terjadi.

## Input yang PM perlu lengkapi

Per feature ID: release SHA/environment, active usage, last successful journey,
open incidents, backlog ticket, named human/agent owner, dependencies/API owner,
on-call coverage, tests/monitoring, monthly support load. Pisahkan production
version dari candidate version. Fitur yang beroperasi live tetap harus diberi
risk flag walau belum memenuhi quality gate; jangan menyembunyikannya sebagai backlog.
