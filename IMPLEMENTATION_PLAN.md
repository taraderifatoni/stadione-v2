# Stadione V2 — Rencana Pengerjaan Detail

> Referensi: `PRD_V2.md` — baca PRD dulu sebelum eksekusi.

---

## Fase 0 — Foundation (Minggu 1-3)

**Tujuan:** Project ready, auth jalan, 3 subdomain routing aktif, user bisa login & switch venue, notifikasi siap pakai.

### 0.1 Project Init
- [ ] `npx create-next-app@latest stadione-v2 --typescript --tailwind --app`
- [ ] `npx shadcn-ui@latest init`
- [ ] Setup folder structure sesuai PRD section 9.1
- [ ] Setup ESLint + Prettier
- [ ] Setup `tsconfig.json` path aliases (`@/components`, `@/lib`, `@/hooks`, `@/types`)
- [ ] Install dependencies: `@supabase/supabase-js`, `@supabase/ssr`, `@tanstack/react-query`, `react-hook-form`, `zod`, `date-fns`, `lucide-react`, `resend`, `onesignal`

### 0.2 Supabase Setup
- [ ] Buat project Supabase baru (production + staging)
- [ ] Setup environment variables:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `NEXT_PUBLIC_SITE_URL`
- [ ] Buat `lib/supabase/client.ts` — browser client
- [ ] Buat `lib/supabase/server.ts` — server client (cookies)
- [ ] Buat `lib/supabase/admin.ts` — service role client
- [ ] Jalankan SQL: `database/00-schema.sql` — tabel `venues`, `venue_roles`, `staff_invites`, `notifications`, `user_notification_preferences`

### 0.3 OneSignal + Resend Setup
- [ ] Buat akun OneSignal + setup web push config
- [ ] Tambahkan env: `NEXT_PUBLIC_ONESIGNAL_APP_ID`, `ONESIGNAL_API_KEY`
- [ ] Buat `lib/notification/channels/push.ts`
- [ ] Buat akun Resend + verifikasi domain `stadione.pro`
- [ ] Tambahkan env: `RESEND_API_KEY`
- [ ] Buat `lib/notification/channels/email.ts`
- [ ] Buat email template dasar: `templates/email/basic.tsx` (React Email)

### 0.4 Notification Service
- [ ] Buat `types/notification.ts` — `NotificationType` enum, `Notification` interface
- [ ] Buat `lib/notification/notify.ts` — single dispatcher function
- [ ] Buat `lib/notification/channels/in_app.ts` — Supabase insert + Realtime
- [ ] Buat `lib/notification/preferences.ts` — read/write user preferences
- [ ] Tes end-to-end: panggil `notify()` → muncul di tabel `notifications` → Realtime muncul di UI

### 0.5 Auth
- [ ] Setup Supabase Auth (email/password)
- [ ] Buat `app/(auth)/login/page.tsx` — login form (react-hook-form + zod)
- [ ] Buat `app/(auth)/register/page.tsx` — register form
- [ ] Buat `app/(auth)/forgot-password/page.tsx` — forgot password
- [ ] Buat `app/(auth)/layout.tsx` — auth layout (tanpa top bar / bottom nav)
- [ ] Buat `lib/auth.ts` — `getCurrentUser()`, `getUserRole()`, `getUserVenues()`
- [ ] Buat `hooks/useAuth.ts` — React hook untuk auth state
- [ ] Tes: register → verifikasi email → login → session persist

### 0.6 Middleware + Subdomain Routing
- [ ] Buat `middleware.ts` — route guard berdasarkan subdomain + role
  ```
  stadione.pro/*        → public, no guard kecuali halaman tertentu
  admin.stadione.pro/*  → cek role platform_admin
  pos.stadione.pro/*    → cek role staff/manager/owner
  ```
- [ ] Setup Vercel domain: 3 subdomain pointing ke project yang sama
- [ ] Tes: akses `admin.stadione.pro` sebagai user biasa → redirect ke login
- [ ] Tes: akses `pos.stadione.pro` sebagai platform_admin → bisa

### 0.7 Venue + Slug
- [ ] Buat `lib/venue.ts` — `createVenue()`, `generateSlug()`, `getVenueBySlug()`
- [ ] Buat `app/(workspace)/[venueSlug]/layout.tsx` — venue context provider
- [ ] Buat `components/shared/VenueSwitcher.tsx` — dropdown pilih venue di top bar
- [ ] Buat halaman create venue (admin.stadione.pro/venues/new)
- [ ] Tes: buat venue "Iron Gym Jakarta" → slug `iron-gym-jakarta`

### 0.8 Role Assignment
- [ ] Buat `lib/role.ts` — `assignRole()`, `revokeRole()`, `getUserRolesForVenue()`
- [ ] Buat halaman staff management di workspace admin
- [ ] Buat `app/api/staff/invite/route.ts` — POST endpoint kirim email invite (Resend)
- [ ] Buat `app/api/staff/accept/route.ts` — GET endpoint terima invite (token)
- [ ] Tes: owner invite email → staff klik → role terisi

### 0.9 Top Bar + Bottom Navbar
- [ ] Buat `components/shared/TopBar.tsx`
  ```
  [hamburger] [Venue Name] [🔔 NotificationCenter] [👤 Avatar]
  ```
- [ ] Buat `components/notification/NotificationCenter.tsx` — bell + dropdown + badge + Realtime
- [ ] Buat `components/shared/BottomNav.tsx`
  ```
  [Beranda] [Booking] [Fitness] [Akademi] [Profil]
  ```
- [ ] Buat `components/shared/SideDrawer.tsx` — hamburger menu (mobile)
- [ ] Buat `components/shared/Sidebar.tsx` — sidebar persistent (desktop)
- [ ] Buat `app/(public)/layout.tsx` — TopBar + BottomNav
- [ ] Buat `app/(platform)/layout.tsx` — TopBar + Sidebar
- [ ] Buat `app/(workspace)/[venueSlug]/layout.tsx` — TopBar + Sidebar + venue context
- [ ] Buat `app/pos/layout.tsx` — POS layout (mobile-optimized)
- [ ] Tes: semua breakpoint responsive

### Deliverable Fase 0
- [x] Project berjalan di `localhost:3000`
- [x] User bisa register, login, logout
- [x] 3 subdomain berfungsi dengan route guard
- [x] Venue bisa dibuat dengan slug unik
- [x] Staff bisa di-invite via email
- [x] NotificationCenter muncul di top bar dengan badge realtime
- [x] `notify()` function berfungsi — in-app + push + email
- [x] Top bar + bottom nav + sidebar responsif

---

## Fase 1 — Booking MVP (Minggu 4-7)

**Tujuan:** User bisa booking lapangan, bayar via DOKU, lihat kalender.

### 1.1 Database
- [ ] Jalankan `database/01-booking.sql` — tabel `courts`, `court_slots`, `pricing_rules`, `promos`, `bookings`

### 1.2 Court Management (Workspace Admin)
- [ ] Buat `lib/booking/court.ts` — CRUD court
- [ ] Buat `app/(workspace)/[venueSlug]/booking/courts/page.tsx` — list court
- [ ] Buat `app/(workspace)/[venueSlug]/booking/courts/new/page.tsx` — form tambah court
- [ ] Buat `app/(workspace)/[venueSlug]/booking/courts/[courtId]/page.tsx` — edit court
- [ ] Court form: nama, sport_type (dropdown 8 cabang), is_splittable, split_count
- [ ] Tes: CRUD court berfungsi

### 1.3 Pricing Rules (Workspace Admin)
- [ ] Buat `lib/booking/pricing.ts` — CRUD pricing rules + calculate price
- [ ] Buat `components/booking/PricingRuleForm.tsx`
- [ ] Integrasi ke halaman edit court → tab "Harga"
- [ ] Pricing rule fields: day_type (weekday/weekend/holiday), time_start, time_end, base_price, member_discount_pct, priority
- [ ] Logic: `calculatePrice(courtId, date, startTime, endTime, userId)` → return breakdown
- [ ] Tes: weekday 08:00 = Rp 80rb, weekend 08:00 = Rp 100rb, member = diskon 10%

### 1.4 Kalender Booking
- [ ] Install `@fullcalendar/react`, `@fullcalendar/timegrid`, `@fullcalendar/interaction`
- [ ] Buat `components/booking/BookingCalendar.tsx`
- [ ] Buat `hooks/useBookingCalendar.ts` — fetch bookings, available slots
- [ ] Kalender view: timeGridWeek, timeGridDay
- [ ] Slot hijau = tersedia, slot merah = terisi
- [ ] Klik slot tersedia → buka booking modal
- [ ] Tes: kalender menampilkan booking yang sudah ada, slot kosong bisa diklik

### 1.5 Booking Flow (Public)
- [ ] Buat `app/(public)/venue/[venueSlug]/booking/page.tsx` — halaman booking venue
- [ ] Buat `components/booking/CourtSelector.tsx` — pilih court
- [ ] Buat `components/booking/DatePicker.tsx` — pilih tanggal
- [ ] Buat `components/booking/TimeSlotPicker.tsx` — pilih jam
- [ ] Buat `components/booking/BookingSummary.tsx` — review + harga breakdown + promo code
- [ ] Buat `lib/booking/booking.ts` — `createBooking()`, `getUserBookings()`, `cancelBooking()`
- [ ] Flow: pilih court → pilih tanggal → pilih slot jam → review harga → bayar → konfirmasi
- [ ] Tes: booking flow end-to-end

### 1.6 DOKU Payment Integration
- [ ] Buat `lib/doku/client.ts` — DOKU API wrapper
- [ ] Buat `lib/doku/signature.ts` — signature verification
- [ ] Buat `app/api/payment/create/route.ts` — generate DOKU payment URL
- [ ] Buat `app/api/payment/callback/route.ts` — DOKU webhook handler
- [ ] Buat `components/payment/DokuPaymentModal.tsx` — redirect ke DOKU
- [ ] Buat `components/payment/PaymentStatus.tsx` — tampilkan status pembayaran (pending/success/failed)
- [ ] Flow: checkout → POST /api/payment/create → redirect DOKU → bayar → callback → update booking status
- [ ] Tes: booking dengan DOKU sandbox — semua state transisi benar

### 1.7 Booking Management (User)
- [ ] Buat `app/(public)/my-bookings/page.tsx` — daftar booking user
- [ ] Buat `components/booking/BookingCard.tsx` — card per booking (status, court, jam, harga)
- [ ] Buat `components/booking/CancelBookingModal.tsx` — cancel booking + konfirmasi
- [ ] Buat `lib/booking/booking.ts` — `getUserBookings()`, `cancelBooking()`, `getBookingDetail()`
- [ ] Tes: user lihat history, cancel booking yang belum lewat

### 1.8 Notifikasi Booking
- [ ] Booking confirmed → `notify({ type: 'booking.confirmed', ... })`
- [ ] Booking reminder (H-1) → `pg_cron` job
- [ ] Booking cancelled → `notify({ type: 'booking.cancelled', ... })`
- [ ] Tes: semua trigger mengirim notifikasi ke channel yang benar

### Deliverable Fase 1
- [x] Venue owner bisa tambah court + atur harga
- [x] User bisa browse kalender venue publik
- [x] User bisa booking + bayar via DOKU
- [x] Booking muncul di kalender dan history user
- [x] Notifikasi booking confirmed + reminder berfungsi

---

## Fase 2 — Booking Lanjutan (Minggu 8-10)

**Tujuan:** Recurring booking, split court, waitlist, tournament slot, promo codes.

### 2.1 Recurring Booking
- [ ] Buat `lib/booking/recurring.ts` — `createRecurringBooking()`, `cancelRecurringInstance()`
- [ ] Buat `components/booking/RecurringBookingForm.tsx` — pilih frekuensi + durasi
- [ ] Tambah opsi "Booking Berulang" di checkout flow
- [ ] Sistem generate N booking instances berdasarkan template
- [ ] Database: tabel `recurring_templates`
- [ ] Tes: booking setiap Senin 08:00-10:00 untuk 4 minggu → 4 booking muncul

### 2.2 Split Court
- [ ] Buat `lib/booking/split.ts` — `getSplitSlots()`, `bookSplitSlot()`
- [ ] Tampilkan split slots di kalender sebagai sub-kolom
- [ ] Validasi: full court booking → semua split slot harus kosong
- [ ] Tes: lapangan basket split 2 → 2 user booking half-court bersamaan

### 2.3 Waitlist
- [ ] Buat `lib/booking/waitlist.ts` — `joinWaitlist()`, `processWaitlist()`
- [ ] Buat `components/booking/WaitlistButton.tsx` — tombol "Gabung Antrian"
- [ ] Buat `components/booking/WaitlistModal.tsx` — klaim slot yang tersedia
- [ ] Buat DB trigger: booking cancelled → notifikasi waitlist pertama
- [ ] Buat `pg_cron` job: waitlist offer expired setelah 30 menit → offer ke user berikutnya
- [ ] Database: tabel `waitlist`
- [ ] Tes: booking penuh → join waitlist → ada cancel → user pertama dapat notifikasi → klaim dalam 30 menit

### 2.4 Tournament Slot
- [ ] Tambah field `is_tournament_slot` di tabel `bookings`
- [ ] Buat form booking tournament: durasi panjang, multi-court
- [ ] Pricing khusus untuk tournament slot
- [ ] Tournament slot tidak masuk waitlist
- [ ] Tes: venue tandai slot tournament → booking 4 jam, 2 court

### 2.5 Promo Codes
- [ ] Buat `lib/booking/promo.ts` — `validatePromo()`, `applyPromo()`
- [ ] Buat `components/booking/PromoInput.tsx` — input kode promo di checkout
- [ ] Validasi: masa berlaku, max usage, min booking hours
- [ ] Promo platform vs promo venue (dari platform dashboard)
- [ ] Database: tabel `promos`
- [ ] Tes: input kode promo valid → harga diskon, kode expired → error

### Deliverable Fase 2
- [x] User bisa booking berulang mingguan
- [x] Split court berfungsi (2 half-court paralel)
- [x] Waitlist otomatis menawarkan slot yang cancel
- [x] Tournament slot bisa dibuat dengan pricing khusus
- [x] Promo codes berfungsi dengan validasi lengkap

---

## Fase 3 — Platform Dashboard (Minggu 11-13)

**Tujuan:** Platform admin bisa kelola fee, diskon, venue onboarding, user, analytics.

### 3.1 Database
- [ ] Jalankan `database/03-platform.sql` — tabel `platform_fee_config`, `platform_discounts`, `platform_announcements`, `venue_onboarding`

### 3.2 Platform Fee
- [ ] Buat `lib/platform/fee.ts` — CRUD fee config
- [ ] Buat `app/(platform)/fees/page.tsx` — list & edit fee configs
- [ ] Buat `components/platform/FeeForm.tsx` — form fee per venue / global
- [ ] Integrasi fee ke payment flow: setiap transaksi → potong fee → catat di `payment_records.platform_fee`
- [ ] Tes: booking Rp 100rb, fee 5% → platform dapat Rp 5rb, venue dapat Rp 95rb

### 3.3 Platform Discount
- [ ] Buat `lib/platform/discount.ts` — CRUD diskon platform
- [ ] Buat `app/(platform)/discounts/page.tsx` — list & buat diskon
- [ ] Buat `components/platform/DiscountForm.tsx` — tentukan share platform vs venue
- [ ] Integrasi ke booking flow: cek diskon platform + diskon venue
- [ ] Tes: diskon 20% (10% platform, 10% venue) → laporan benar

### 3.4 Venue Management
- [ ] Buat `app/(platform)/venues/page.tsx` — list semua venue + filter + search
- [ ] Buat `app/(platform)/venues/[venueId]/page.tsx` — detail venue
- [ ] Buat `components/platform/VenueStatusBadge.tsx` — active/suspended/inactive
- [ ] Buat `app/(platform)/venues/onboarding/page.tsx` — antrian verifikasi
- [ ] Buat `components/platform/OnboardingReview.tsx` — review dokumen + approve/reject
- [ ] Tes: venue baru daftar → masuk antrian → admin review dokumen → approve → venue active

### 3.5 User Management
- [ ] Buat `app/(platform)/users/page.tsx` — list user + search + filter role
- [ ] Buat `app/(platform)/users/[userId]/page.tsx` — detail user + semua role di semua venue
- [ ] Buat `components/platform/UserRoleManager.tsx` — assign/revoke role
- [ ] Buat `components/platform/SuspendUserModal.tsx` — suspend user
- [ ] Tes: cari user → lihat semua venue + role → suspend → user tidak bisa login

### 3.6 Analytics
- [ ] Buat `lib/platform/analytics.ts` — query agregat
- [ ] Buat `app/(platform)/analytics/page.tsx` — dashboard platform
- [ ] Buat `components/platform/AnalyticsCards.tsx` — total venue, user, transaksi bulan ini
- [ ] Buat `components/platform/RevenueChart.tsx` — chart fee terkumpul per bulan (Recharts)
- [ ] Buat `components/platform/TopVenues.tsx` — top 10 venue by booking/revenue
- [ ] Buat `components/platform/ChurnDetection.tsx` — venue 30 hari tanpa aktivitas
- [ ] Export CSV untuk semua laporan
- [ ] Tes: semua angka akurat, chart responsif

### 3.7 Platform Settings
- [ ] Buat `app/(platform)/settings/page.tsx`
- [ ] DOKU configuration form (api_key, merchant_id, environment)
- [ ] Email template editor (Resend templates)
- [ ] Terms & conditions editor (markdown)
- [ ] Buat `components/platform/AnnouncementManager.tsx` — CRUD announcement banner
- [ ] Announcement muncul di semua halaman publik
- [ ] Tes: ganti DOKU config → payment tetap jalan, announcement muncul

### Deliverable Fase 3
- [x] Platform fee otomatis terpotong dari setiap transaksi
- [x] Platform admin bisa buat diskon global
- [x] Venue onboarding flow: daftar → review → approve → aktif
- [x] User management: list, search, filter, assign role, suspend
- [x] Analytics dashboard dengan chart + export CSV
- [x] Pengaturan platform lengkap

---

## Fase 4 — POS / Kasir (Minggu 14-17)

**Tujuan:** Staff venue bisa buka shift, proses walk-in booking, multi-payment, cetak invoice.

### 4.1 Database
- [ ] Jalankan `database/04-pos.sql` — tabel `shifts`, `pos_transactions`, `invoices`, `refunds`

### 4.2 Shift Management
- [ ] Buat `lib/pos/shift.ts` — `openShift()`, `closeShift()`, `getActiveShift()`
- [ ] Buat `app/pos/[venueSlug]/page.tsx` — POS dashboard (pilih venue jika multi-staff)
- [ ] Buat `components/pos/ShiftPanel.tsx` — panel buka/tutup shift
- [ ] Buka shift: input kas awal → shift aktif
- [ ] Tutup shift: kalkulasi otomatis (total transaksi, kas akhir, selisih)
- [ ] Auto-close: shift > 24 jam → sistem tutup + flag + notifikasi
- [ ] 1 staff hanya 1 shift aktif
- [ ] Tes: buka shift → 3 transaksi → tutup shift → selisih = 0 → sukses

### 4.3 Walk-in Booking
- [ ] Buat `components/pos/WalkInBooking.tsx` — form booking oleh staff
- [ ] Buat `components/pos/CourtQuickSelect.tsx` — pilih court cepat
- [ ] Buat `components/pos/GuestCheckout.tsx` — checkout tanpa user account
- [ ] Flow: pilih court → pilih jam → pilih payment method → konfirmasi → cetak struk
- [ ] Staff bisa booking sebagai "walk-in guest" atau cari user terdaftar
- [ ] Harga tetap dihitung dari pricing rules
- [ ] Tes: booking walk-in → muncul di kalender → user bisa lihat

### 4.4 Multi-Payment
- [ ] Buat `components/pos/PaymentMethodSelector.tsx` — pilih metode
- [ ] Buat `components/pos/CashPayment.tsx` — input nominal, hitung kembalian
- [ ] Buat `components/pos/QrisPayment.tsx` — tampilkan QR / scan QR
- [ ] Buat `components/pos/SplitPayment.tsx` — kombinasi 2+ metode
- [ ] Validasi: total split payment = total tagihan
- [ ] Tes: booking Rp 150rb, split: cash 50rb + QRIS 100rb → sukses

### 4.5 Invoice / Struk
- [ ] Buat `lib/pos/invoice.ts` — `generateInvoiceNumber()`, `createInvoice()`
- [ ] Buat `components/pos/InvoicePreview.tsx` — preview struk sebelum cetak
- [ ] Buat `components/pos/InvoicePrint.tsx` — format thermal + standard
- [ ] Format invoice: `INV-YYYYMMDD-NNN`
- [ ] Cetak otomatis setelah transaksi sukses (opsional)
- [ ] Struk berisi: venue, tanggal, item, harga, pajak, total, metode bayar
- [ ] Tes: transaksi → invoice number ter generate → cetak → nomor unik

### 4.6 Refund
- [ ] Buat `lib/pos/refund.ts` — `requestRefund()`, `approveRefund()`, `rejectRefund()`
- [ ] Buat `components/pos/RefundRequestModal.tsx` — staff ajukan refund
- [ ] Buat `components/pos/RefundApprovalModal.tsx` — manager approve/reject
- [ ] Validasi: refund hanya untuk booking yang belum lewat / max 24 jam setelah selesai
- [ ] Audit trail: setiap refund tercatat siapa yang minta, siapa yang approve, alasan
- [ ] Tes: staff ajukan refund → notifikasi ke manager → manager approve → booking status REFUNDED

### 4.7 POS Optimasi Mobile
- [ ] Semua halaman POS didesain untuk mobile + tablet
- [ ] Tombol besar, mudah ditekan (target 48x48px minimum)
- [ ] Keyboard numerik custom untuk input cash
- [ ] Loading state minimal (transaksi harus cepat)
- [ ] Tes: POS dibuka di tablet 10" dan HP 6"

### 4.8 Notifikasi POS
- [ ] Shift dibuka → `notify({ type: 'shift.opened', ... })` ke manager
- [ ] Shift ditutup dengan selisih → `notify({ type: 'shift.closed_with_discrepancy', ... })`
- [ ] Shift auto-close → `notify({ type: 'shift.auto_closed', ... })` + email
- [ ] Refund requested → `notify({ type: 'refund.requested', ... })`
- [ ] Refund resolved → `notify({ type: 'refund.approved', ... })`

### Deliverable Fase 4
- [x] Staff bisa buka/tutup shift dengan kalkulasi otomatis
- [x] Walk-in booking berfungsi + terintegrasi kalender
- [x] Multi-payment: cash, QRIS, transfer, split
- [x] Invoice ter generate + cetak
- [x] Refund dengan approval chain
- [x] POS optimal di mobile + tablet

---

## Fase 5 — Fitness & Studio Membership (Minggu 18-21)

**Tujuan:** Venue bisa buat membership plan + visit package, user bisa daftar member, check-in, dapat diskon booking.

### 5.1 Database
- [ ] Jalankan `database/05-membership.sql` — tabel `membership_plans`, `visit_packages`, `members`, `member_visit_packages`, `check_ins`, `reward_points`

### 5.2 Membership Plan Management (Workspace)
- [ ] Buat `lib/membership/plan.ts` — CRUD plan + visit package
- [ ] Buat `app/(workspace)/[venueSlug]/membership/plans/page.tsx` — list plan
- [ ] Buat `components/membership/PlanForm.tsx` — form plan (tier, harga, benefit, billing cycle)
- [ ] Buat `components/membership/VisitPackageForm.tsx` — form paket kunjungan
- [ ] Support semua cabang olahraga Fitness & Studio
- [ ] Tes: buat plan Gold gym → muncul di halaman membership venue

### 5.3 Member Enrollment (Public)
- [ ] Buat `app/(public)/venue/[venueSlug]/fitness/page.tsx` — halaman membership venue
- [ ] Buat `components/membership/PlanCard.tsx` — card per tier (harga, benefit, CTA)
- [ ] Buat `components/membership/VisitPackageCard.tsx` — card paket kunjungan
- [ ] Buat `components/membership/EnrollmentFlow.tsx` — pilih plan → checkout → DOKU → aktif
- [ ] Buat `lib/membership/member.ts` — `enrollMember()`, `renewMembership()`
- [ ] Tes: user pilih Silver plan → bayar DOKU → membership aktif → muncul di profil

### 5.4 Membership Lifecycle
- [ ] Buat `lib/membership/lifecycle.ts` — `upgradeMembership()`, `downgradeMembership()`, `freezeMembership()`, `cancelMembership()`
- [ ] Upgrade/downgrade: hitung selisih harga
- [ ] Freeze: maksimal 2 bulan, biaya admin
- [ ] Cancel: tidak ada refund sisa periode
- [ ] Auto-renew: opsi perpanjang otomatis (toggle di settings)
- [ ] Buat `components/membership/MembershipStatus.tsx` — tampilkan status + tombol aksi
- [ ] `pg_cron` job: membership expired → status expired + notifikasi
- [ ] Tes: upgrade Silver → Gold, selisih dihitung, membership Gold aktif

### 5.5 Check-in System
- [ ] Buat `lib/membership/checkin.ts` — `checkIn()`, `getCheckInHistory()`
- [ ] Buat `components/membership/CheckInPanel.tsx` — panel check-in (staff view)
- [ ] Buat `components/membership/MemberSearch.tsx` — cari member by nama/ID/email
- [ ] Validasi saat check-in: membership aktif? visit package masih sisa? tidak frozen?
- [ ] Visit package: check-in → saldo berkurang 1
- [ ] Check-in history per member
- [ ] Offline support: simpan check-in di localStorage → sync saat online
- [ ] Tes: staff cari member → check-in → saldo visit package berkurang → muncul di history

### 5.6 Reward Points
- [ ] Buat `lib/membership/reward.ts` — `earnPoints()`, `redeemPoints()`
- [ ] Rules: check-in = +10 pts, booking = +X pts per jam
- [ ] Redeem: diskon booking, upgrade tier sebulan, merchandise
- [ ] Buat `components/membership/RewardBalance.tsx` — tampilkan saldo poin
- [ ] Buat `components/membership/RedeemModal.tsx` — pilih hadiah → tukar
- [ ] **Tidak ada leaderboard atau gamification**
- [ ] Tes: 5x check-in → 50 poin → redeem diskon booking 10% → poin berkurang

### 5.7 Member Discount Integration
- [ ] Integrasi diskon member ke booking flow
- [ ] Di halaman booking, cek: user ini member venue ini? tier apa?
- [ ] Tampilkan harga member vs harga normal
- [ ] Diskon dihitung per pricing rules (`member_discount_pct`)
- [ ] Buat setting: maksimal diskon per bulan, minimal booking, pengecualian hari
- [ ] Buat `components/membership/MemberDiscountSettings.tsx`
- [ ] Tes: member Gold booking → otomatis dapat diskon 20% → batas diskon bulanan diterapkan

### 5.8 Notifikasi Membership
- [ ] Membership aktif → `notify({ type: 'membership.activated', ... })`
- [ ] Expired H-7,3,1 → `pg_cron` + `notify({ type: 'membership.expired', ... })`
- [ ] Visit package low (sisa 2) → `pg_cron` + `notify({ type: 'visit_package.low', ... })`
- [ ] Check-in sukses → in-app only (di POS view)
- [ ] Semua ngikut preferences user

### Deliverable Fase 5
- [x] Venue punya membership plan + visit package
- [x] User bisa enroll membership via DOKU
- [x] Upgrade/downgrade/freeze/cancel berfungsi
- [x] Check-in sistem dengan validasi + offline support
- [x] Reward points sederhana (earn + redeem)
- [x] Diskon member otomatis di booking flow
- [x] Semua lifecycle event ada notifikasinya

---

## Fase 6 — Akademi + Raport (Minggu 22-26)

**Tujuan:** Academy bisa kelola program, murid, coach, presensi, raport dengan digital signing.

### 6.1 Database
- [ ] Jalankan `database/06-academy.sql` — tabel `academies`, `coaches`, `programs`, `sessions`, `students`, `student_parents`, `enrollments`, `attendances`, `report_templates`, `report_cards`

### 6.2 Academy Setup (Workspace)
- [ ] Buat `lib/academy/academy.ts` — CRUD academy + coach + program
- [ ] Buat `app/(workspace)/[venueSlug]/academy/setup/page.tsx` — wizard setup akademi
- [ ] Buat `components/academy/AcademyForm.tsx` — nama, sport_type, age_groups
- [ ] Buat `components/academy/CoachForm.tsx` — tambah coach (nama, spesialisasi, lisensi)
- [ ] Buat `components/academy/ProgramForm.tsx` — tambah program (nama, umur, harga, capacity)
- [ ] Support: sepakbola, basket, tenis, renang, beladiri, panjat tebing
- [ ] Tes: setup akademi basket U-12, 2 coach, 1 program → siap

### 6.3 Session Scheduling
- [ ] Buat `lib/academy/session.ts` — CRUD session
- [ ] Buat `components/academy/SessionCalendar.tsx` — FullCalendar view sesi
- [ ] Buat `components/academy/SessionForm.tsx` — jadwal sesi (program, coach, court, jam)
- [ ] Konflik deteksi: coach tidak bisa di 2 sesi bersamaan
- [ ] Konflik deteksi: court tidak bisa dipakai bersamaan dengan booking
- [ ] Tes: jadwal sesi U-12 Senin 15:00 → coach tidak bisa di sesi lain jam sama

### 6.4 Student Enrollment (Public + Parent)
- [ ] Buat `app/(public)/venue/[venueSlug]/academy/page.tsx` — halaman akademi venue
- [ ] Buat `components/academy/ProgramCard.tsx` — card program (nama, umur, harga, sisa slot)
- [ ] Buat `lib/academy/enrollment.ts` — `enrollStudent()`, `getEnrollments()`
- [ ] Buat `components/academy/EnrollmentForm.tsx` — form daftar (nama anak, umur, parent)
- [ ] Buat `components/academy/ParentLink.tsx` — hubungkan parent account ke student
- [ ] Many-to-many: 1 parent → N anak, 1 anak → N parent (ayah & ibu)
- [ ] Payment: enrollment fee via DOKU
- [ ] Status: UNPAID → PAID → ACTIVE → GRADUATED/DROPPED
- [ ] Tes: parent daftarkan 2 anak ke akademi basket → bayar → aktif

### 6.5 Attendance Tracking
- [ ] Buat `lib/academy/attendance.ts` — `recordAttendance()`, `getSessionAttendance()`, `getStudentAttendance()`
- [ ] Buat `components/academy/AttendanceSheet.tsx` — grid nama murid + status (hadir/izin/sakit/alpha)
- [ ] Buat `components/academy/AttendanceQuickAction.tsx` — bulk action (semua hadir)
- [ ] Offline support: simpan presensi di localStorage → sync saat online
- [ ] Tes: coach buka sesi → centang 15 murid hadir, 2 izin → tersimpan → parent bisa lihat

### 6.6 Report Template Builder
- [ ] Buat `lib/academy/report-template.ts` — CRUD template
- [ ] Buat `components/academy/TemplateBuilder.tsx` — drag-drop kategori + item
- [ ] Buat `components/academy/CategoryEditor.tsx` — nama kategori, bobot (%), items
- [ ] Buat `components/academy/ItemEditor.tsx` — nama item, max_score
- [ ] Validasi: total bobot semua kategori = 100%
- [ ] Template disimpan sebagai JSON di `report_templates.categories`
- [ ] Template bisa di-assign ke program/usianya
- [ ] Tes: buat template "U-12 Basketball" → 4 kategori → total bobot 100% → simpan

### 6.7 Report Card Input (Coach)
- [ ] Buat `lib/academy/report-card.ts` — `createReportCard()`, `updateScores()`, `publishReportCard()`
- [ ] Buat `components/academy/ReportCardInput.tsx` — grid penilaian
- [ ] Buat `components/academy/ScoreSlider.tsx` — slider 1-5 per item + notes
- [ ] Buat `components/academy/StudentSelector.tsx` — pilih murid dari program
- [ ] Coach buka halaman raport → pilih template → pilih murid → input nilai → simpan draft
- [ ] Sistem hitung: skor per kategori (rata-rata item × bobot) → total score
- [ ] Tes: coach input raport 20 murid → semua tersimpan draft → total score akurat

### 6.8 Digital Signing
- [ ] Buat `components/academy/SignatureCanvas.tsx` — canvas untuk tanda tangan
- [ ] Simpan signature sebagai base64 PNG
- [ ] Buat `components/academy/SigningFlow.tsx` — alur penandatanganan
- [ ] Coach sign → status `coach_signed` → notifikasi ke director
- [ ] Director/Owner review → sign → status `published` → notifikasi ke parent
- [ ] Raport terkunci setelah `published` (tidak bisa diedit tanpa audit trail)
- [ ] Tes: coach sign → director sign → raport published → coba edit → ditolak

### 6.9 PDF Generation
- [ ] Buat `lib/academy/pdf.ts` — generate raport PDF
- [ ] Buat `components/academy/RaportPDF.tsx` — layout raport (jsPDF)
- [ ] Isi: logo venue, judul, nama murid, periode, tabel kategori + skor, signature coach + director, catatan
- [ ] Download PDF / kirim via email
- [ ] Tes: generate PDF → tampilan rapi → signature muncul → download

### 6.10 Parent Portal
- [ ] Buat `app/(public)/parent/dashboard/page.tsx` — parent dashboard
- [ ] Buat `components/academy/ParentStudentList.tsx` — list semua anak
- [ ] Buat `components/academy/ParentSchedule.tsx` — jadwal latihan semua anak
- [ ] Buat `components/academy/ParentAttendance.tsx` — presensi per anak
- [ ] Buat `components/academy/ParentRaportList.tsx` — list raport per anak
- [ ] Buat `components/academy/ParentPaymentHistory.tsx` — histori pembayaran
- [ ] Tes: parent login → lihat 2 anak → lihat jadwal + presensi + raport → download raport

### 6.11 Notifikasi Akademi
- [ ] Enrollment confirmed → `notify({ type: 'enrollment.confirmed', ... })`
- [ ] Payment due → `pg_cron` + `notify({ type: 'enrollment.payment_due', ... })`
- [ ] Raport published → `notify({ type: 'raport.published', ... })` ke parent
- [ ] Raport coach signed → `notify({ type: 'raport.coach_signed', ... })` ke director
- [ ] Raport director signed → `notify({ type: 'raport.director_signed', ... })` ke coach
- [ ] Jadwal sesi berubah → `notify({ type: 'session.changed', ... })`
- [ ] Presensi recorded → `notify({ type: 'attendance.recorded', ... })` ke parent
- [ ] Student absent without notice → `pg_cron` + `notify({ type: 'student.absent', ... })`

### Deliverable Fase 6
- [x] Academy + coach + program setup untuk 6 cabang olahraga
- [x] Student enrollment via DOKU + parent many-to-many
- [x] Session scheduling dengan deteksi konflik
- [x] Attendance tracking offline-capable
- [x] Report template builder (drag-drop kategori + item)
- [x] Report card input + perhitungan otomatis
- [x] Digital signing (coach + director)
- [x] PDF generation dengan signature
- [x] Parent portal lengkap

---

## Fase 7 — Polish & PWA (Minggu 27-29)

**Tujuan:** Semua fitur lengkap, production-ready, PWA installable, notifikasi terintegrasi penuh.

### 7.1 Notifikasi Integration
- [ ] Audit semua trigger: pastikan setiap event di matrix 7.3.9 memanggil `notify()`
- [ ] Buat `app/(public)/notifications/page.tsx` — halaman semua notifikasi (infinite scroll)
- [ ] Buat `components/notification/NotificationPreferences.tsx` — halaman settings notifikasi
- [ ] Tes end-to-end: setiap event → muncul di NotificationCenter → badge update realtime

### 7.2 PWA Setup
- [ ] Install `next-pwa`
- [ ] Buat `manifest.json` — nama, ikon, theme color, display: standalone
- [ ] Buat service worker — cache halaman publik + offline fallback
- [ ] Buat `components/pwa/InstallPrompt.tsx` — popup "Install Aplikasi"
- [ ] OneSignal web push integration dengan service worker
- [ ] Tes: buka di HP → "Install Aplikasi" → icon di homescreen → buka → offline → tetap bisa lihat jadwal

### 7.3 SEO
- [ ] Buat `generateMetadata()` untuk setiap halaman publik venue
- [ ] Buat `sitemap.ts` — generate sitemap semua venue + halaman statis
- [ ] Buat `robots.ts`
- [ ] Meta tags: title, description, og:image (foto venue)
- [ ] Structured data: SportsActivityLocation schema per venue
- [ ] Tes: Google Search Console → halaman venue terindeks

### 7.4 Onboarding Flow
- [ ] Buat `components/onboarding/VenueOnboardingWizard.tsx` — step-by-step setup venue
- [ ] Step 1: Info dasar (nama, alamat, slug, foto)
- [ ] Step 2: Pilih domain (booking, fitness, akademi) + cabang olahraga
- [ ] Step 3: Upload dokumen verifikasi (KTP, NPWP, NIB)
- [ ] Step 4: Invite staff pertama
- [ ] Step 5: Done → redirect ke workspace dashboard
- [ ] Tes: user baru → wizard → 5 step → venue siap

### 7.5 Mobile Responsive Final Pass
- [ ] Tes semua halaman di 375px, 414px, 768px, 1024px, 1440px
- [ ] Perbaiki overflow horizontal
- [ ] Perbaiki touch target (minimum 44x44px)
- [ ] Perbaiki font size readability di mobile
- [ ] Perbaiki table/grid scroll horizontal di mobile
- [ ] Tes: tidak ada horizontal scroll, semua tombol mudah ditekan

### 7.6 Error Handling
- [ ] Buat `components/shared/ErrorBoundary.tsx` — catch React errors
- [ ] Buat `components/shared/ErrorPage.tsx` — 404, 500, 403 pages
- [ ] Tambahkan error handling di semua API routes
- [ ] Tambahkan toast notification untuk error (shadcn sonner)
- [ ] Tambahkan Supabase error handling (network error, auth error, RLS error)
- [ ] Tes: matikan internet → UI tampilkan pesan ramah, tidak crash

### 7.7 Loading States
- [ ] Buat `components/shared/Skeleton.tsx` — skeleton loader untuk card, table, form
- [ ] Tambahkan loading.tsx di setiap route group
- [ ] Tambahkan React.Suspense boundary
- [ ] Optimistic updates untuk aksi cepat (React Query mutation)
- [ ] Tes: buka halaman dengan koneksi lambat → skeleton muncul → konten muncul

### 7.8 Data Retention Cron
- [ ] Buat `pg_cron` jobs:
  - `retention-bookings` — pindahkan booking > 2 tahun ke `bookings_archive`
  - `retention-checkins` — hapus check-in > 1 tahun
  - `retention-notifications` — hapus notifikasi dibaca > 90 hari
  - `retention-anonymize` — anonimkan membership expired > 1 tahun
- [ ] Tes: data retention job berjalan → data dipindahkan, tidak dihapus permanen

### 7.9 Final QA
- [ ] Test semua flow end-to-end:
  - [ ] User register → booking → bayar → konfirmasi → reminder
  - [ ] User daftar membership → bayar → check-in → redeem reward
  - [ ] Parent daftarkan anak → coach input raport → sign → publish → parent lihat
  - [ ] Staff buka shift → walk-in booking → multi-payment → cetak invoice → tutup shift
  - [ ] Platform admin set fee → venue onboarding → approve → lihat analytics
- [ ] Test semua role permission
- [ ] Test semua subdomain routing
- [ ] Test DOKU sandbox → production switch
- [ ] Test PWA install + offline + push notification
- [ ] Test di iOS Safari + Android Chrome

### Deliverable Fase 7
- [x] Semua notifikasi terintegrasi + preferences page
- [x] PWA installable + offline support + push notification
- [x] SEO optimal untuk halaman venue publik
- [x] Onboarding wizard untuk venue baru
- [x] Mobile responsive 100%
- [x] Error + loading state di semua halaman
- [x] Data retention cron berjalan
- [x] QA end-to-end all green

---

## Total Estimasi

| Fase | Nama | Minggu |
|------|------|--------|
| 0 | Foundation | 1-3 |
| 1 | Booking MVP | 4-7 |
| 2 | Booking Lanjutan | 8-10 |
| 3 | Platform Dashboard | 11-13 |
| 4 | POS / Kasir | 14-17 |
| 5 | Fitness & Studio | 18-21 |
| 6 | Akademi + Raport | 22-26 |
| 7 | Polish & PWA | 27-29 |

**Total: 29 minggu (7-8 bulan) untuk 1-2 developer.**

---

## Catatan Eksekusi

1. **Setiap fase selesai = harus bisa didemo.** Jangan tanggung.
2. **Database migration pakai file SQL** di folder `database/`, dijalankan manual atau via Supabase Migration.
3. **Environment variables** terdokumentasi di `.env.example`.
4. **TDD opsional**, tapi minimal happy-path test di akhir setiap fase.
5. **Branch strategy:** `main` → production, `staging` → testing, `feat/fase-X` → development.
6. **PRD adalah sumber kebenaran.** Jika ada keraguan, kembali ke PRD.

---

*Implementation Plan v1.0 — 30 Juli 2026*
