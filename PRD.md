# Stadione V2 — Product Requirement Document

## 1. Visi & Lingkup

Stadione V2 adalah platform multi-tenant **multi-cabang olahraga** untuk operasional venue olahraga Indonesia. V2 mencakup 4 domain:

| # | Domain | Model Bisnis | Cabang Olahraga | Subdomain |
|---|--------|-------------|-----------------|-----------|
| 1 | Booking Lapangan | Sewa per jam | Futsal, Basket, Badminton, Tenis, Voli, Pingpong, Squash, Pickleball | `stadione.pro` |
| 2 | Fitness & Studio | Membership + check-in | Gym, Yoga, Pilates, Boxing, MMA, CrossFit, Renang, Panjat Tebing, Dance, Spinning, Aerobics | `stadione.pro` |
| 3 | Akademi + Raport | Training + penilaian | Sepakbola, Basket, Tenis, Renang, Beladiri, Panjat Tebing | `stadione.pro` |
| 4 | POS / Kasir | Transaksi di tempat + shift | Walk-in booking, check-in, multi-payment | `pos.stadione.pro` |
| 5 | Platform Dashboard | Governance | Platform fee, diskon, venue & user management | `admin.stadione.pro` |

### Prinsip Multi-Cabang

1. **Satu venue bisa menjalankan banyak cabang olahraga sekaligus.** Contoh: Sport Center X punya lapangan futsal (booking), gym (membership), kolam renang (membership), dan akademi sepakbola.
2. **Satu venue bisa spesialis 1 cabang saja.** Contoh: Yoga Studio hanya yoga (membership).
3. **Modul sama, terminologi menyesuaikan.** Modul membership untuk gym, yoga, dan renang itu identik — yang berbeda hanya tampilan (ikon, nama, foto).
4. **Tidak ada batasan kombinasi.** Venue bebas memilih cabang olahraga mana yang diaktifkan.

**Yang TIDAK masuk V2:** tournament, community hub, gamification, ads engine, newsroom, coaching marketplace, sponsorship, QR check-in, official/match center, DOKU escrow, withdrawal.

---

## 2. Arsitektur Multi-Tenant

### 2.1 Subdomain Architecture

```
stadione.pro        → Halaman publik + user (landing, venue discovery, booking, membership, akademi)
admin.stadione.pro  → Dashboard platform + workspace admin
pos.stadione.pro    → POS / kasir (check-in, walk-in booking, payment, shift)
```

| Subdomain | Pengguna | Perangkat Target |
|-----------|---------|-----------------|
| `stadione.pro` | User umum, member, parent | Mobile-first |
| `admin.stadione.pro` | Platform admin, venue owner, manager, coach | Desktop + tablet |
| `pos.stadione.pro` | Staff, cashier | Mobile + tablet |

### 2.2 URL & Slug Strategy

```
# Public
stadione.pro/                                    → Landing page
stadione.pro/venue/sport-center-jakarta          → Halaman publik venue
stadione.pro/venue/sport-center-jakarta/booking  → Booking venue
stadione.pro/venue/sport-center-jakarta/fitness  → Membership venue
stadione.pro/venue/sport-center-jakarta/academy  → Akademi venue

# Admin
admin.stadione.pro/                              → Platform dashboard
admin.stadione.pro/venues                        → Kelola semua venue
admin.stadione.pro/users                         → Kelola user
admin.stadione.pro/fees                          → Platform fee
admin.stadione.pro/discounts                     → Diskon platform
admin.stadione.pro/settings                      → Pengaturan platform
admin.stadione.pro/w/sport-center-jakarta        → Workspace venue tertentu
admin.stadione.pro/w/sport-center-jakarta/booking
admin.stadione.pro/w/sport-center-jakarta/members
admin.stadione.pro/w/sport-center-jakarta/academy

# POS
pos.stadione.pro/                                → Pilih venue (jika multi-staff)
pos.stadione.pro/sport-center-jakarta            → POS venue tertentu
pos.stadione.pro/sport-center-jakarta/shift      → Buka/tutup shift
```

**Aturan slug venue:**
- `nama-venue-kota` — lowercase, strip whitespace, ganti spasi dengan `-`
- Contoh: `Iron Gym Jakarta` → `iron-gym-jakarta`
- Unik di seluruh platform
- Tidak bisa diubah setelah dibuat
- Prefix `w/` untuk workspace admin, tanpa prefix untuk halaman publik

### 2.1 Model

Satu platform, banyak venue dengan kepribadian berbeda:

```
Venue A (futsal) → Booking saja
Venue B (gym center) → Booking + Membership
Venue C (akademi bola) → Booking + Akademi
Venue D (sport center lengkap) → Booking + Membership + Akademi
```

### 2.2 Konsep "Workspace"

Setiap venue punya **workspace** sendiri. User yang login bisa punya akses ke beberapa workspace dengan peran berbeda:

- User A → Venue X (Owner), Venue Y (Staff)
- User B → Venue X (Member), Venue C (Coach)

Akses workspace ditentukan oleh role assignment per venue, bukan role global.

### 2.3 Domain Isolation

- Satu venue bisa mengaktifkan 1, 2, atau 3 domain
- Domain yang tidak aktif: halaman tidak muncul, tabel tidak di-query
- Konfigurasi per domain disimpan di tingkat venue

### 2.4 Arsitektur Navigasi — Mobile-First

Platform dirancang **mobile-first**. UI desktop menyesuaikan dari tampilan mobile.

#### Top Bar (persisten di semua halaman)
```
┌─────────────────────────────────┐
│ [hamburger]  Stadione   [avatar]│
│              Venue Name         │
└─────────────────────────────────┘
```
- Kiri: Hamburger menu → drawer yang berisi: venue switcher, semua menu, logout
- Tengah: Nama venue yang sedang aktif
- Kanan: Avatar user, klik → profil + pengaturan akun

#### Bottom Navbar (halaman publik + member)
```
┌──────────┬──────────┬──────────┬──────────┬──────────┐
│  Beranda │  Booking │  Fitness │  Akademi │  Profil  │
└──────────┴──────────┴──────────┴──────────┴──────────┘
```
- 5 tab tetap untuk navigasi utama user biasa
- Tab yang tidak relevan (misal venue tidak punya akademi) → disembunyikan
- Active state: ikon filled + warna brand

#### Admin/Workspace — Top Bar + Side Drawer
```
┌─────────────────────────────────┐
│ [≡]  Dashboard Venue X   [⚙️]   │
└─────────────────────────────────┘

  ┌────────────────────┐
  │ Venue X             │
  │ ├ Dashboard         │
  │ ├ Booking           │
  │ ├ Members           │
  │ ├ Akademi           │
  │ ├ Staff             │
  │ ├ Laporan           │
  │ └ Pengaturan        │
  │                     │
  │ [Switch Venue]      │
  │ [Keluar]            │
  └────────────────────┘
```
- Hamburger membuka drawer dari kiri
- Di dalam drawer: semua menu workspace + venue switcher di bawah
- Desktop: drawer menjadi sidebar persistent, bottom nav tidak ada

#### Responsive Breakpoints
- **Mobile:** < 768px → top bar + bottom nav / drawer
- **Desktop:** ≥ 768px → top bar + sidebar persistent + bottom nav hilang
- Semua halaman di-design untuk 375px dulu, baru scaling ke atas

---

## 3. Domain 1 — Booking Lapangan Olahraga

### 3.1 Entitas Inti

| Entitas | Deskripsi |
|---------|-----------|
| **Venue** | Tempat olahraga (punya nama, alamat, foto, jam operasional) |
| **Court** | Lapangan/kamar di dalam venue (nama, tipe: futsal/basket/badminton/gym room) |
| **Pricing Rule** | Aturan harga per court: harga dasar per jam, harga peak/off-peak, harga weekend, harga member vs non-member |
| **Booking** | Reservasi oleh user untuk 1 court, rentang jam tertentu, dengan harga final |
| **Recurring Booking** | Template booking berulang (setiap Senin 08:00-10:00, dst) |
| **Waitlist** | Antrian jika slot penuh, otomatis assign jika ada cancel |
| **Split Court** | 1 lapangan fisik bisa dipecah jadi 2 slot paralel (contoh: 1 lapangan basket → 2 half-court) |

### 3.2 Pricing Rule — Rule Engine

Harga final dihitung berdasarkan prioritas:

```
1. Cek apakah ada promo aktif untuk court+jam ini
2. Cek user role (member vs non-member → diskon member)
3. Cek paket jam yang dimiliki (beli 10 jam dapat diskon X)
4. Terapkan pricing rule berdasarkan tipe jam (peak/off-peak/weekend)
5. Fallback ke harga dasar court
```

### 3.3 Booking Flow

```
Pilih Venue → Pilih Court → Pilih Tanggal → Pilih Slot Jam
→ Sistem hitung harga final → User review → DOKU payment → Konfirmasi
```

**State Booking:**
```
PENDING → PAID → CONFIRMED → ONGOING → COMPLETED
                   ↘ CANCELLED (refund rules apply)
```

### 3.4 Recurring Booking

- User pilih court + hari + jam + frekuensi (mingguan / 2 minggu sekali)
- Sistem generate booking instances untuk N minggu ke depan
- Bisa cancel satu instance tanpa batalkan seluruh rangkaian
- Payment: bisa bayar per instance atau bayar di muka N instance

### 3.5 Split Court

- Venue owner atur: lapangan X bisa di-split jadi 2 slot
- Kapasitas masing-masing slot ditentukan (misal half-court max 8 orang)
- Booking dibuat per slot
- Kalau ada yang booking slot A, slot B tetap tersedia
- Kalau ada yang mau booking full court, kedua slot harus kosong

### 3.6 Waitlist

- Slot penuh → user bisa join waitlist
- Ada cancel → sistem otomatis notifikasi user pertama di waitlist
- User punya waktu terbatas (misal 30 menit) untuk claim sebelum dilempar ke user berikutnya
- Satu user bisa waitlist maksimal 3 slot bersamaan

### 3.7 Tournament Slot (Mini)

- Venue owner bisa menandai slot tertentu sebagai "tournament slot"
- Tournament slot = booking durasi panjang, multi-court
- Pricing khusus (paket tournament)
- Tidak termasuk dalam waitlist umum

---

## 4. Domain 2 — Fitness & Studio (Membership)

### 4.0 Cabang Olahraga yang Didukung

Semua cabang di bawah ini menggunakan **modul yang sama**:

| Cabang | Contoh Venue | Terminologi Khusus |
|--------|-------------|-------------------|
| Gym / Fitness | Iron Gym, Celebrity Fitness | Alat, area cardio, PT |
| Yoga | Yoga Barn, Radiantly Alive | Mat, studio, breathwork |
| Pilates | Pilates Studio | Reformer, mat pilates |
| Boxing / Muay Thai / MMA | Siam Gym, Boxing Camp | Ring, sparring, heavy bag |
| CrossFit / HIIT | CrossFit Box | WOD, rig, barbell |
| Kolam Renang | Swimming Club | Lintasan, kedalaman, suhu |
| Panjat Tebing / Bouldering | Climbing Gym | Wall grade, auto-belay |
| Dance Studio | Dance Lab | Lantai kayu, cermin |
| Spinning / Cycling | Cycle Studio | Sepeda statis, RPM |
| Aerobics / Zumba | Group Fitness | Studio luas, speaker |

### 4.1 Entitas Inti

| Entitas | Deskripsi |
|---------|-----------|
| **Membership Plan** | Paket keanggotaan — tier (Bronze/Silver/Gold/Platinum) + harga + benefit |
| **Member** | User yang terdaftar di membership plan venue tertentu |
| **Visit Package** | Paket kunjungan (beli 10x, 20x, 50x), bukan langganan bulanan |
| **Check-in** | Record kunjungan member ke venue |
| **Reward Points** | Poin yang didapat member dari aktivitas dan bisa ditukar |

### 4.2 Model Hybrid

Venue bisa mengkonfigurasi:

```
Membership Tier (bulanan/tahunan):
- Bronze  : Rp 150rb/bulan → akses gym, 1 kelas gratis/minggu
- Silver  : Rp 300rb/bulan → akses gym, unlimited kelas, 10% diskon booking
- Gold    : Rp 500rb/bulan → semua di atas + 1 guest pass/bulan + 20% diskon booking
- Platinum: Rp 800rb/bulan → semua di atas + priority booking + gratis 1 treatment

Visit Package (non-recurring):
- Paket 10x  : Rp 500rb (berlaku 3 bulan)
- Paket 20x  : Rp 900rb (berlaku 6 bulan)
- Paket 50x  : Rp 2jt (berlaku 12 bulan)
```

### 4.3 Membership Lifecycle

```
User pilih plan → DOKU payment → Aktif
→ Perpanjang otomatis/bayar manual tiap periode
→ Bisa upgrade/downgrade (selisih harga dihitung)
→ Freeze membership (maksimal 2 bulan) → biaya admin
→ Cancel membership (tidak ada refund untuk sisa periode)
```

### 4.4 Check-in Flow

```
Member datang → Staff buka halaman check-in → Cari member (nama/ID)
→ Sistem validasi:
   - Membership masih aktif?
   - Visit package masih ada sisa?
   - Tidak sedang di-freeze?
→ Check-in tersimpan → Saldo visit package berkurang 1
```

### 4.5 Reward Points — Sederhana

- Tiap check-in → +10 poin
- Tiap booking lapangan (member) → +X poin (X = jumlah jam)
- Poin bisa ditukar: diskon booking, upgrade tier gratis 1 bulan, merchandise
- **Tidak ada leaderboard, badge, atau gamification kompleks**

### 4.6 Integrasi Booking

- Member dapat diskon booking sesuai tier
- Visit package tidak bisa dipakai untuk booking lapangan (domain terpisah)
- Di halaman booking, sistem otomatis deteksi: user ini member venue ini → tampilkan harga member

---

## 5. Domain 3 — Akademi + Raport

### 5.0 Cabang Olahraga yang Didukung

Semua cabang di bawah ini menggunakan **modul yang sama**:

| Cabang | Terminologi Khusus |
|--------|-------------------|
| Sepakbola | U-10, U-14, U-17, formasi, posisi |
| Basket | U-12, U-15, U-18, shooting, dribble |
| Tenis | Junior, Elite, teknik forehand/backhand |
| Renang | Gaya bebas, dada, kupu-kupu, punggung |
| Beladiri (Karate, Taekwondo, Judo) | Sabuk, poomsae, kumite |
| Panjat Tebing | Boulder grade, lead climbing |

### 5.1 Entitas Inti

| Entitas | Deskripsi |
|---------|-----------|
| **Academy** | Akademi olahraga milik venue (nama, cabang olahraga, kategori umur, program) |
| **Sport Type** | Cabang olahraga akademi (sepakbola, basket, tenis, renang, beladiri, panjat tebing) |
| **Program** | Kurikulum/latihan (U-10, U-14, U-17, private coaching, holiday camp) |
| **Session** | Sesi latihan konkret (program + coach + tanggal + jam + lapangan) |
| **Coach** | Pelatih akademi, punya spesialisasi |
| **Student** | Murid terdaftar, terhubung dengan 1 parent account |
| **Enrollment** | Murid mendaftar di program tertentu |
| **Attendance** | Presensi per session (hadir/izin/sakit/alpha) |
| **Report Card** | Penilaian periodik per murid |
| **Report Template** | Template penilaian yang bisa dikustom per program/usianya |

### 5.2 Penilaian — Report Card

#### 5.2.1 Template Penilaian (Dikonfigurasi oleh Academy)

Setiap academy bisa membuat template penilaian sendiri. Contoh:

```
KATEGORI: Teknik Dasar                    (bobot 30%)
- Dribbling           [1] [2] [3] [4] [5]
- Passing             [1] [2] [3] [4] [5]
- Shooting            [1] [2] [3] [4] [5]
- First Touch         [1] [2] [3] [4] [5]

KATEGORI: Fisik                          (bobot 25%)
- Kecepatan           [1] [2] [3] [4] [5]
- Daya Tahan          [1] [2] [3] [4] [5]
- Kekuatan            [1] [2] [3] [4] [5]

KATEGORI: Taktik & Game Intelligence      (bobot 20%)
- Posisi              [1] [2] [3] [4] [5]
- Pengambilan Keputusan [1] [2] [3] [4] [5]
- Kerjasama Tim       [1] [2] [3] [4] [5]

KATEGORI: Mental & Attitude               (bobot 25%)
- Disiplin            [1] [2] [3] [4] [5]
- Semangat            [1] [2] [3] [4] [5]
- Kepemimpinan        [1] [2] [3] [4] [5]
```

#### 5.2.2 Alur Penilaian

```
1. Academy admin buat template — tentukan kategori + item + bobot
2. Template di-assign ke program/usianya
3. Setiap periode (bulanan/triwulan/semester), coach buka halaman raport
4. Coach centang rating setiap item untuk setiap murid
5. Coach bisa tambah catatan kualitatif per item
6. Sistem hitung nilai per kategori + total
7. Generate PDF raport → kirim ke parent
```

#### 5.2.3 Histori & Tren

```
Raport Januari : 3.2
Raport Februari: 3.5
Raport Maret   : 3.8

Grafik radar:
        Teknik
          /\
         /  \
  Fisik /    \ Taktik
       /      \
      /________\
       Mental

Tren meningkat per kategori.
```

### 5.3 Parent Portal (Many-to-Many)

- 1 parent bisa punya banyak anak
- 1 anak bisa dihubungkan ke 2 parent (ayah & ibu) — tabel junction `student_parents`
- Parent bisa lihat jadwal latihan semua anaknya
- Parent bisa lihat presensi semua anaknya
- Parent bisa lihat semua raport anaknya
- Parent bisa lihat histori pembayaran akademi per anak
- Parent bisa chat/message coach (opsional V2, bisa ditunda)

### 5.4 Pembayaran Akademi

- Enrollment fee per program (payment via DOKU)
- Opsi cicilan (dikonfigurasi oleh academy)
- Status: `UNPAID → PAID → ACTIVE → GRADUATED / DROPPED`
- Payment reminder otomatis jika jatuh tempo

---

## 6. Domain 4 — POS / Kasir

### 6.0 Overview

POS adalah antarmuka kasir untuk transaksi di tempat — **bukan** untuk user umum, hanya staff venue. POS berjalan di subdomain `pos.stadione.pro`, dioptimalkan untuk mobile dan tablet.

### 6.1 Entitas Inti

| Entitas | Deskripsi |
|---------|-----------|
| **Shift** | Sesi kerja staff (buka/tutup, catat kas awal, kas akhir, selisih) |
| **Walk-in Booking** | Booking yang dibuat oleh staff untuk pelanggan yang datang langsung |
| **Payment** | Transaksi pembayaran: cash, QRIS, transfer, debit card, split payment |
| **Invoice** | Struk/invoice dengan format `INV-YYYYMM-NNN`, printable |
| **Refund** | Pengembalian dana dengan approval chain |

### 6.2 Shift Management

```
1. Staff buka shift → input kas awal
2. Sepanjang shift: catat semua transaksi (booking, membership, dll)
3. Staff tutup shift → sistem hitung:
   - Total transaksi
   - Kas akhir = kas awal + cash masuk - cash keluar
   - Selisih (jika ada)
4. Shift tersimpan → siap audit
```

- 1 staff hanya bisa punya 1 shift aktif dalam 1 waktu
- Shift wajib ditutup sebelum staff logout
- Shift yang tidak ditutup dalam 24 jam → auto-close oleh sistem + flag

### 6.3 Payment Methods

| Metode | Deskripsi |
|--------|-----------|
| Cash / Tunai | Pembayaran langsung, hitung kembalian |
| QRIS | Scan QR atau tampilkan QR |
| Transfer Bank | Manual confirmation oleh staff |
| Debit / Kredit | Card terminal integration (opsional) |
| Split Payment | Kombinasi 2+ metode (misal: cash 50rb + QRIS 50rb) |

### 6.4 Walk-in Booking Flow

```
Customer datang → Staff buka halaman POS → Pilih court → Pilih jam
→ Sistem hitung harga (sama seperti online booking)
→ Staff pilih metode pembayaran → Konfirmasi → Cetak struk (opsional)
→ Booking terkonfirmasi
```

**Perbedaan dengan online booking:**
- Tidak ada user account wajib. Bisa booking sebagai "walk-in guest".
- Pembayaran lebih fleksibel (cash, QRIS)
- Staff yang mengoperasikan sepenuhnya

### 6.5 Invoice / Struk

- Format: `INV-20260801-001`
- Bisa dicetak thermal / standard printer
- Tampilan sederhana: nama venue, tanggal, item booking, harga, pajak (jika ada), total, metode bayar
- Bisa dikirim via WhatsApp (opsional)

### 6.6 Refund

```
Staff request refund → Pilih booking → Pilih alasan → Ajukan
→ Notifikasi ke manager/owner
→ Manager approve → Uang dikembalikan → Booking status = REFUNDED
→ Manager reject → Booking tetap CONFIRMED + catatan
```

- Refund tidak bisa dilakukan oleh staff sendiri (kecuali owner)
- Refund hanya bisa untuk booking yang belum lewat / baru selesai (maks 24 jam)
- Ada audit trail setiap refund

### 6.7 POS POS Schema

```sql
shifts
  id uuid PK
  venue_id uuid FK → venues
  staff_id uuid FK → auth.users
  status text -- open, closed, auto_closed
  opening_balance numeric DEFAULT 0
  closing_balance numeric null
  total_cash_in numeric DEFAULT 0
  total_cash_out numeric DEFAULT 0
  discrepancy numeric null -- selisih
  opened_at timestamptz
  closed_at timestamptz
  notes text
  created_at timestamptz

pos_transactions
  id uuid PK
  shift_id uuid FK → shifts
  booking_id uuid FK → bookings null -- null kalau bukan booking (misal membership)
  reference_type text -- booking, membership, visit_package, merchandise
  reference_id uuid
  amount numeric
  payment_method text -- cash, qris, transfer, debit, split
  payment_details jsonb -- {"cash":50000,"qris":50000} untuk split payment
  status text -- completed, refunded
  created_at timestamptz

invoices
  id uuid PK
  venue_id uuid FK → venues
  pos_transaction_id uuid FK → pos_transactions
  invoice_number text UNIQUE -- INV-20260801-001
  total_amount numeric
  printed_at timestamptz null
  created_at timestamptz

refunds
  id uuid PK
  pos_transaction_id uuid FK → pos_transactions
  requested_by uuid FK → auth.users
  approved_by uuid FK → auth.users null
  reason text
  amount numeric
  status text -- pending, approved, rejected
  requested_at timestamptz
  resolved_at timestamptz
  created_at timestamptz
```

---

## 7. Shared Services

### 7.1 Auth & Role

#### 6.1.1 Model Sederhana

**Global role (di level user):**
| Role | Deskripsi |
|------|-----------|
| `platform_admin` | Admin platform — akses dashboard platform, tidak terikat venue |
| `user` | Semua pengguna terdaftar |

**Venue-level role (per workspace):**
| Role | Deskripsi |
|------|-----------|
| `owner` | Pemilik venue — akses penuh ke semua domain venue |
| `manager` | Pengelola venue — akses penuh kecuali billing/finance sensitif |
| `staff` | Karyawan venue — akses terbatas (check-in, lihat booking, input presensi) |
| `coach` | Pelatih akademi — akses ke domain akademi saja (isi raport, lihat murid) |
| `member` | Member gym — akses ke halaman membership + diskon booking |
| `customer` | Default — user biasa yang booking lapangan tanpa membership |

#### 6.1.2 Aturan Akses (Middleware Next.js)

```
/middleware.ts:
- /platform/* → cek role == platform_admin
- /workspace/:venueSlug/* → cek user punya role di venue ini
- /workspace/:venueSlug/admin/* → cek role >= manager
- /workspace/:venueSlug/academy/* → cek role == coach | owner | manager
- /workspace/:venueSlug/membership/* → cek role == member | owner | manager | staff
```

**Tidak ada recursive CTE, tidak ada permission matrix, tidak ada hierarchical role.**

### 7.2 Payment — DOKU Integration

#### 6.2.1 Titik Integrasi

| Konteks | Trigger |
|---------|---------|
| Booking lapangan | User checkout booking |
| Membership — tier bulanan | User pilih plan |
| Membership — visit package | User beli paket kunjungan |
| Akademi — enrollment fee | User daftar program |

#### 6.2.2 Flow Payment

```
Frontend → POST /api/payment/create → backend generate DOKU payload
→ User di-redirect ke halaman DOKU → User bayar
→ DOKU callback ke /api/payment/callback → backend verifikasi
→ Update status booking/membership/enrollment → kirim notifikasi
```

#### 6.2.3 Rekonsiliasi

- Simpan semua payload callback DOKU mentah (raw JSON)
- Cron job harian: cocokkan record internal dengan DOKU settlement report
- Flag mismatch dan kirim alert ke admin

### 7.3 Notifikasi

#### 7.3.1 Pelajaran dari V1

| Masalah V1 | Solusi V2 |
|---|---|
| `notifications` user tidak pernah dibuat | Tabel `notifications` dibuat di Fase 0 |
| Push notification (OneSignal) tidak diintegrasi | OneSignal setup di Fase 0 |
| Automated reminder cuma `console.log` | Supabase `pg_cron` untuk scheduled job |
| WhatsApp cuma share link browser | Tidak pakai WhatsApp — fokus in-app + push + email |
| `admin_notifications` hard-coded partnership | Tabel `notifications` generik untuk semua event |
| Tidak ada cron job | `pg_cron` extension + Vercel Cron |
| Tidak ada notification center UI | Komponen `NotificationCenter` di top bar |

#### 7.3.2 Arsitektur

```
EVENT SOURCE               DISPATCHER              CHANNEL              USER
─────────────              ──────────              ───────              ────
DB Trigger ───┐
API Route  ───┤──→ Notification Service ──→ In-App (notifications table)
Cron Job   ───┤                              Push  (OneSignal)
Edge Func  ───┘                              Email (Resend)
```

#### 7.3.3 Channel & Provider

| Channel | Provider | Use Case |
|---------|---------|---------|
| In-app | Supabase Realtime + `notifications` table | Semua notifikasi — realtime, persisten, ada history |
| Push | **OneSignal** (PWA web push) | Booking confirmed, waitlist, raport published, payment due |
| Email | **Resend** (transactional) | Membership expired, payment receipt, raport published, staff invite |

**Yang TIDAK dipakai:** WhatsApp API. Terlalu mahal dan tidak esensial untuk MVP. Email + push + in-app cukup.

#### 7.3.4 Notification Service (Single Abstraction)

Semua fitur memanggil satu service yang sama:

```typescript
// lib/notification/notify.ts

async function sendNotification(params: {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  link?: string;
  channels?: ('in_app' | 'push' | 'email')[]; // default: all
  data?: Record<string, any>;
}): Promise<void>
```

Service ini yang menentukan channel mana yang aktif berdasarkan:
1. Requested channels (parameter)
2. User preferences (user muted channel ini?)
3. Provider availability (OneSignal configured? Resend configured?)

#### 7.3.5 Tabel `notifications` (versi final)

```sql
notifications
  id uuid PK DEFAULT gen_random_uuid()
  user_id uuid FK → auth.users NOT NULL
  type text NOT NULL
  /*
  booking.confirmed, booking.reminder, booking.cancelled
  waitlist.available, waitlist.expired
  membership.activated, membership.expired, membership.renewed
  membership.frozen, membership.upgraded, membership.downgraded
  visit_package.low, visit_package.empty
  checkin.success
  enrollment.confirmed, enrollment.payment_due
  raport.published, raport.coach_signed, raport.director_signed
  session.changed, attendance.recorded, student.absent
  payment.success, payment.failed, payment.receipt
  shift.opened, shift.closed_with_discrepancy, shift.auto_closed
  refund.requested, refund.approved, refund.rejected
  walkin_booking.success
  venue.onboarding_review, venue.approved, venue.rejected
  platform.discount_new, platform.fee_changed
  user.suspended
  venue.churn_warning
  staff.invite, staff.invite_accepted, staff.role_changed, staff.removed
  promo.available
  */
  title text NOT NULL
  body text NOT NULL
  link text -- deep link ke halaman terkait
  channels_used text[] -- ['in_app', 'push', 'email']
  metadata jsonb DEFAULT '{}' -- data tambahan spesifik per tipe
  is_read boolean DEFAULT false
  read_at timestamptz
  created_at timestamptz DEFAULT now()
)

-- Index untuk query cepat
CREATE INDEX idx_notifications_user_unread ON notifications(user_id, created_at DESC) WHERE is_read = false;
CREATE INDEX idx_notifications_user_type ON notifications(user_id, type);
```

#### 7.3.6 Notification Center UI

Komponen `NotificationCenter` di top bar semua halaman:

```
┌─────────────────────────────┐
│ 🔔 (3)              [Avatar]│   ← Bell icon + badge counter (unread count)
└─────────────────────────────┘

Klik bell → dropdown:
┌────────────────────────────────────────┐
│ Notifikasi                     [✓ semua]│
│────────────────────────────────────────│
│ 🔵 Booking dikonfirmasi         1m ago │
│    Lapangan A, 15:00-16:00            │
│────────────────────────────────────────│
│    Raport Januariditerbitkan   2h ago │
│    Akademi U-14 - Ahmad               │
│────────────────────────────────────────│
│    Membership akan expired     1d ago │
│    Gold - 3 hari lagi                 │
└────────────────────────────────────────┘
```

- **Realtime:** Subscribe Supabase Realtime channel `notifications:user_id=eq.xxx`
- **Badge:** `COUNT(*) WHERE is_read = false`
- **Mark read:** Klik item → `UPDATE is_read = true` + navigate ke link
- **Mark all read:** Tombol "✓ semua" di header dropdown
- **Tampilkan 20 terbaru**, scroll untuk load lebih

#### 7.3.7 User Notification Preferences

```sql
user_notification_preferences
  user_id uuid FK → auth.users PRIMARY KEY
  booking_confirmed_push boolean DEFAULT true
  booking_reminder_push boolean DEFAULT true
  membership_expired_email boolean DEFAULT true
  raport_published_push boolean DEFAULT true
  raport_published_email boolean DEFAULT true
  payment_push boolean DEFAULT true
  payment_email boolean DEFAULT true
  promo_push boolean DEFAULT false
  -- in-app selalu ON, tidak bisa dimatikan
```

User bisa mengatur via halaman Settings → Notifikasi.

#### 7.3.8 Cron & Scheduled Jobs

| Job | Frekuensi | Mekanisme | Action |
|-----|----------|----------|--------|
| Booking reminder (H-1) | Setiap jam | `pg_cron` | Cek booking besok → kirim push |
| Membership expiry (H-7, H-3, H-1) | Setiap hari 08:00 | `pg_cron` | Cek membership mau expired → push + email |
| Visit package low (sisa 2) | Setiap jam | `pg_cron` | Cek sisa visit → push |
| Waitlist slot available | Real-time | DB trigger | Ada cancel → notifikasi user pertama waitlist |
| Payment due reminder | Setiap hari 08:00 | `pg_cron` | Cek enrollment/payment due → push + email |
| Raport published | Real-time | API call | Coach publish → notifikasi parent |
| Staff invite | Real-time | API call | Owner invite → email ke staff |

**Setup `pg_cron`:**
```sql
-- Jadwalkan membership expiry reminder setiap hari jam 8 pagi
SELECT cron.schedule(
  'membership-expiry-reminder',
  '0 8 * * *',
  $$SELECT check_membership_expiry_and_notify()$$
);

-- Jadwalkan booking reminder setiap jam
SELECT cron.schedule(
  'booking-reminder',
  '0 * * * *',
  $$SELECT check_upcoming_bookings_and_notify()$$
);
```

#### 7.3.9 Notifikasi Matrix (Lengkap)

##### Booking
| Trigger | In-App | Push | Email | Mekanisme |
|---------|--------|------|-------|-----------|
| Booking confirmed | ✓ | ✓ | ✗ | Real-time (DB trigger) |
| Booking reminder (H-1) | ✓ | ✓ | ✗ | Scheduled (pg_cron tiap jam) |
| Booking cancelled | ✓ | ✗ | ✗ | Real-time (DB trigger) |
| Waitlist slot available | ✓ | ✓ | ✗ | Real-time (DB trigger — ada cancel) |
| Waitlist expired | ✓ | ✗ | ✗ | Scheduled (pg_cron tiap jam) |
| Recurring booking created | ✓ | ✗ | ✗ | Real-time |
| Recurring instance cancelled | ✓ | ✗ | ✗ | Real-time |

##### Fitness & Studio (Membership)
| Trigger | In-App | Push | Email | Mekanisme |
|---------|--------|------|-------|-----------|
| Membership aktif (setelah bayar) | ✓ | ✓ | ✗ | Real-time |
| Membership expired (H-7, H-3, H-1) | ✓ | ✓ | ✓ | Scheduled (pg_cron tiap hari 08:00) |
| Membership diperpanjang | ✓ | ✓ | ✗ | Real-time |
| Membership di-freeze | ✓ | ✓ | ✗ | Real-time |
| Membership di-upgrade/downgrade | ✓ | ✗ | ✗ | Real-time |
| Visit package hampir habis (sisa 2) | ✓ | ✓ | ✗ | Scheduled (pg_cron tiap jam) |
| Visit package habis | ✓ | ✓ | ✗ | Real-time |
| Check-in berhasil | ✓ | ✗ | ✗ | Real-time (hanya muncul di POS view) |

##### Akademi + Raport
| Trigger | In-App | Push | Email | Mekanisme |
|---------|--------|------|-------|-----------|
| Enrollment confirmed (setelah bayar) | ✓ | ✓ | ✗ | Real-time |
| Enrollment payment due | ✓ | ✓ | ✓ | Scheduled (pg_cron tiap hari 08:00) |
| Raport published (ke parent) | ✓ | ✓ | ✓ | Real-time (coach publish) |
| Raport signed by coach | ✓ | ✗ | ✗ | Real-time (notifikasi ke director) |
| Raport signed by director | ✓ | ✗ | ✗ | Real-time (notifikasi ke coach: selesai) |
| Jadwal sesi berubah | ✓ | ✓ | ✗ | Real-time |
| Presensi recorded | ✓ | ✗ | ✗ | Real-time (notifikasi ke parent) |
| Student absent without notice | ✓ | ✓ | ✗ | Scheduled (pg_cron setelah sesi selesai) |

##### POS / Kasir
| Trigger | In-App | Push | Email | Mekanisme |
|---------|--------|------|-------|-----------|
| Shift dibuka (notifikasi ke manager) | ✓ | ✗ | ✗ | Real-time |
| Shift ditutup + ada selisih | ✓ | ✓ | ✗ | Real-time (flag ke owner/manager) |
| Shift auto-close (24 jam) | ✓ | ✓ | ✓ | Scheduled (pg_cron) + alert |
| Refund requested | ✓ | ✓ | ✗ | Real-time (notifikasi ke manager/owner) |
| Refund approved/rejected | ✓ | ✗ | ✗ | Real-time |
| Walk-in booking sukses | ✓ | ✗ | ✗ | Real-time |

##### Platform Dashboard
| Trigger | In-App | Push | Email | Mekanisme |
|---------|--------|------|-------|-----------|
| Venue onboarding butuh review | ✓ | ✓ | ✗ | Real-time (notifikasi ke platform_admin) |
| Venue disetujui/ditolak | ✓ | ✗ | ✓ | Real-time (notifikasi ke venue owner) |
| Diskon platform baru | ✓ | ✓ | ✗ | Real-time (notifikasi ke semua venue owner) |
| Fee platform berubah | ✓ | ✗ | ✓ | Real-time |
| User disuspend | ✓ | ✗ | ✓ | Real-time |
| Venue churn detected (30 hari inactive) | ✓ | ✓ | ✗ | Scheduled (pg_cron mingguan) |

##### Staff & Admin
| Trigger | In-App | Push | Email | Mekanisme |
|---------|--------|------|-------|-----------|
| Staff invite dikirim | ✗ | ✗ | ✓ | Real-time (Resend email invite) |
| Staff invite diterima | ✓ | ✗ | ✗ | Real-time (notifikasi ke owner) |
| Role staff diubah | ✓ | ✗ | ✗ | Real-time |
| Staff dihapus dari venue | ✓ | ✗ | ✗ | Real-time |

##### Pembayaran (Semua Domain)
| Trigger | In-App | Push | Email | Mekanisme |
|---------|--------|------|-------|-----------|
| Payment success | ✓ | ✓ | ✓ | Real-time (DOKU callback) |
| Payment failed | ✓ | ✗ | ✗ | Real-time (DOKU callback) |
| Payment receipt | ✓ | ✗ | ✓ | Real-time (struk ke email) |

### 7.4 Kalender

- FullCalendar (React wrapper) untuk semua domain
- Kalender booking venue (tampilan slot yang sudah terisi)
- Kalender akademi (jadwal sesi latihan)
- View toggle: per court, per venue, per program

### 7.5 PWA — Progressive Web App

- Target: installable di homescreen Android/iOS, bukan native app
- **Offline support** untuk fitur kritis:
  - Check-in membership (sync saat online kembali)
  - Presensi akademi (sync saat online kembali)
  - Lihat jadwal booking (cached)
- **Service worker:** cache halaman publik venue untuk load cepat
- **Push notification:** via browser push API (OneSignal)
- **Install prompt:** muncul setelah user beberapa kali akses
- **Background sync:** antrian check-in/presensi offline → sync otomatis ketika koneksi pulih

### 7.6 Staff Invite via Email

```
Owner input email → POST /api/staff/invite
→ Backend cek: apakah email sudah terdaftar?
  → Belum: buat user record + kirim invitation email dengan magic link
  → Sudah: kirim email berisi link untuk accept role
→ Staff klik link → login/register → confirm role assignment
→ venue_roles terisi: user_id, venue_id, role = staff
→ Staff bisa akses workspace venue
```

---

## 8. Database Schema

### 8.1 Schema: `booking`

```sql
venues
  id uuid PK
  name text
  slug text UNIQUE
  address text
  city text
  latitude numeric
  longitude numeric
  phone text
  photos jsonb -- array of URLs
  operating_hours jsonb -- {"mon":{"open":"08:00","close":"22:00"}, ...}
  active_domains jsonb -- ["booking","membership","academy"]
  created_at timestamptz
  updated_at timestamptz

courts
  id uuid PK
  venue_id uuid FK → venues
  name text
  court_type text -- futsal, basketball, badminton, gym_room, etc
  is_splittable boolean DEFAULT false
  split_count int DEFAULT 1 -- jumlah sub-slot kalau splittable
  is_active boolean DEFAULT true
  created_at timestamptz

court_slots
  id uuid PK
  court_id uuid FK → courts
  split_index int DEFAULT 0 -- 0 = full court, 1,2 = split
  created_at timestamptz

pricing_rules
  id uuid PK
  court_id uuid FK → courts
  name text -- "Weekday Peak", "Weekend", "Member Discount"
  day_type text -- weekday, weekend, holiday
  time_start time -- null means all day
  time_end time
  base_price numeric -- per jam
  member_discount_pct numeric(5,2) DEFAULT 0
  is_active boolean DEFAULT true
  priority int DEFAULT 0 -- higher = applied first
  created_at timestamptz

promos
  id uuid PK
  venue_id uuid FK → venues
  code text UNIQUE
  discount_type text -- percentage, fixed
  discount_value numeric
  min_booking_hours int DEFAULT 0
  valid_from timestamptz
  valid_until timestamptz
  max_usage int DEFAULT null
  current_usage int DEFAULT 0
  is_active boolean DEFAULT true

bookings
  id uuid PK
  venue_id uuid FK → venues
  court_slot_id uuid FK → court_slots
  user_id uuid FK → auth.users
  booking_date date
  start_time time
  end_time time
  total_hours numeric(3,1)
  base_price numeric
  discount_amount numeric DEFAULT 0
  promo_id uuid FK → promos null
  final_price numeric
  status text -- pending, paid, confirmed, ongoing, completed, cancelled
  is_recurring_parent boolean DEFAULT false
  recurring_group_id uuid null -- group recurring bookings
  created_at timestamptz
  updated_at timestamptz

waitlist
  id uuid PK
  court_slot_id uuid FK → court_slots
  user_id uuid FK → auth.users
  booking_date date
  start_time time
  end_time time
  status text -- waiting, offered, claimed, expired, cancelled
  offered_at timestamptz
  expires_at timestamptz
  created_at timestamptz

recurring_templates
  id uuid PK
  user_id uuid FK → auth.users
  court_slot_id uuid FK → court_slots
  day_of_week int -- 0=Sunday, 1=Monday, etc
  start_time time
  end_time time
  frequency text -- weekly, biweekly
  max_occurrences int
  end_date date null
  is_active boolean DEFAULT true
  created_at timestamptz
```

### 8.2 Schema: `membership`

```sql
membership_plans
  id uuid PK
  venue_id uuid FK → venues
  name text -- "Bronze", "Silver", "Gold", "Platinum"
  tier_level int -- 1,2,3,4
  price numeric -- per bulan
  billing_cycle text -- monthly, quarterly, yearly
  benefits jsonb -- {"booking_discount_pct":10, "free_classes":1, ...}
  is_active boolean DEFAULT true
  created_at timestamptz

visit_packages
  id uuid PK
  venue_id uuid FK → venues
  name text -- "Paket 10x", "Paket 20x"
  visit_count int
  price numeric
  validity_days int -- masa berlaku dalam hari
  is_active boolean DEFAULT true
  created_at timestamptz

members
  id uuid PK
  user_id uuid FK → auth.users
  venue_id uuid FK → venues
  plan_id uuid FK → membership_plans
  status text -- active, frozen, cancelled, expired
  start_date date
  end_date date
  frozen_until date null
  freeze_count int DEFAULT 0
  auto_renew boolean DEFAULT true
  created_at timestamptz
  updated_at timestamptz

member_visit_packages
  id uuid PK
  member_id uuid FK → members
  package_id uuid FK → visit_packages
  remaining_visits int
  purchased_at timestamptz
  expires_at timestamptz

check_ins
  id uuid PK
  member_id uuid FK → members
  venue_id uuid FK → venues
  check_in_type text -- membership, visit_package
  member_visit_package_id uuid FK → member_visit_packages null
  checked_in_at timestamptz

reward_points
  id uuid PK
  member_id uuid FK → members
  points int -- bisa positif (earn) atau negatif (redeem)
  source text -- check_in, booking, manual, redeem
  description text
  created_at timestamptz
```

### 8.3 Schema: `academy`

```sql
academies
  id uuid PK
  venue_id uuid FK → venues
  name text
  sport_type text -- football, basketball, tennis, swimming, martial_arts, climbing
  description text
  age_groups text[] -- ["U-10", "U-14", "U-17"]
  created_at timestamptz

coaches
  id uuid PK
  user_id uuid FK → auth.users
  venue_id uuid FK → venues
  academy_id uuid FK → academies
  name text
  specialization text[] -- ["Teknik", "Fisik", "Kiper"]
  license_info text
  is_active boolean DEFAULT true
  created_at timestamptz

programs
  id uuid PK
  academy_id uuid FK → academies
  name text -- "U-10 Development", "Elite U-17"
  age_group text
  description text
  price numeric
  billing_cycle text -- monthly, quarterly, semester
  installment_available boolean DEFAULT false
  max_students int DEFAULT 20
  is_active boolean DEFAULT true
  created_at timestamptz

sessions
  id uuid PK
  program_id uuid FK → programs
  coach_id uuid FK → coaches
  court_slot_id uuid FK → court_slots
  session_date date
  start_time time
  end_time time
  topic text -- "Latihan Passing", "Small Sided Game"
  status text -- scheduled, ongoing, completed, cancelled
  created_at timestamptz

students
  id uuid PK
  user_id uuid FK → auth.users -- anak (kalau punya akun sendiri) atau null
  academy_id uuid FK → academies
  name text
  birth_date date
  age_group text
  joined_date date
  status text -- active, inactive, graduated
  created_at timestamptz

enrollments
  id uuid PK
  student_id uuid FK → students
  program_id uuid FK → programs
  status text -- unpaid, paid, active, completed, dropped
  start_date date
  end_date date
  payment_status text -- unpaid, partial, paid
  created_at timestamptz

attendances
  id uuid PK
  session_id uuid FK → sessions
  student_id uuid FK → students
  status text -- present, absent, sick, permitted
  note text
  recorded_by uuid FK → auth.users -- coach/staff yang input
  created_at timestamptz

report_templates
  id uuid PK
  academy_id uuid FK → academies
  name text -- "Template U-10", "Template Senior"
  age_group text
  categories jsonb
  /*
  [
    {
      "name": "Teknik Dasar",
      "weight": 30,
      "items": [
        {"name": "Dribbling", "max_score": 5},
        {"name": "Passing", "max_score": 5}
      ]
    },
    ...
  ]
  */
  created_at timestamptz

report_cards
  id uuid PK
  student_id uuid FK → students
  template_id uuid FK → report_templates
  program_id uuid FK → programs
  period text -- "Januari 2026", "Semester 1 2026"
  scores jsonb
  /*
  [
    {
      "category": "Teknik Dasar",
      "items": [
        {"name": "Dribbling", "score": 4, "note": "Sudah bagus, perlu variasi"},
        {"name": "Passing", "score": 3, "note": "Akurasi perlu ditingkatkan"}
      ],
      "category_score": 3.5
    },
    ...
  ]
  */
  total_score numeric(3,1)
  coach_notes text -- catatan keseluruhan
  coach_id uuid FK → auth.users
  status text -- draft, coach_signed, published
  coach_signature_image text null -- base64 signature
  signed_by_coach_at timestamptz null
  director_signature_image text null -- base64 signature
  signed_by_director_id uuid FK → auth.users null
  signed_by_director_at timestamptz null
  published_at timestamptz
  created_at timestamptz
  updated_at timestamptz
```

### 8.4 Schema: `shared`

```sql
venue_roles
  id uuid PK
  user_id uuid FK → auth.users
  venue_id uuid FK → venues
  role text -- owner, manager, staff, coach, member, customer
  created_at timestamptz
  UNIQUE (user_id, venue_id)

staff_invites
  id uuid PK
  venue_id uuid FK → venues
  email text
  role text -- staff, manager, coach
  invited_by uuid FK → auth.users
  token text UNIQUE -- unique invite token
  status text -- pending, accepted, expired
  expires_at timestamptz
  accepted_at timestamptz
  created_at timestamptz

student_parents
  student_id uuid FK → students
  parent_user_id uuid FK → auth.users
  relationship text -- ayah, ibu, wali
  is_primary boolean DEFAULT false
  PRIMARY KEY (student_id, parent_user_id)

payment_records
  id uuid PK
  user_id uuid FK → auth.users
  venue_id uuid FK → venues
  reference_type text -- booking, membership, visit_package, enrollment
  reference_id uuid
  amount numeric
  platform_fee numeric DEFAULT 0
  doku_invoice_id text
  doku_callback_raw jsonb -- raw JSON dari DOKU
  status text -- pending, paid, failed, refunded
  paid_at timestamptz
  created_at timestamptz

notifications
  id uuid PK
  user_id uuid FK → auth.users
  type text -- booking_confirmed, membership_expired, raport_published, etc
  title text
  body text
  link text -- deep link ke halaman terkait
  is_read boolean DEFAULT false
  created_at timestamptz
```

---

## 9. Technical Decisions

### 8.1 Next.js App Router Structure

```
src/
├── app/
│   ├── layout.tsx                 # Root layout (providers)
│   ├── page.tsx                   # Landing / venue discovery
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   ├── register/page.tsx
│   │   └── layout.tsx             # Auth layout (no sidebar)
│   ├── (platform)/                # Route group for platform admin
│   │   ├── layout.tsx             # Platform layout
│   │   ├── dashboard/page.tsx     # Platform overview + analytics
│   │   ├── venues/page.tsx        # Venue management
│   │   ├── users/page.tsx         # User management
│   │   ├── fees/page.tsx          # Platform fee config
│   │   ├── discounts/page.tsx     # Platform discount management
│   │   └── settings/page.tsx      # Platform settings (DOKU, email, T&C)
│   ├── (workspace)/               # Route group for workspace context
│   │   ├── [venueSlug]/
│   │   │   ├── layout.tsx         # Workspace layout (venue context provider)
│   │   │   ├── page.tsx           # Workspace dashboard
│   │   │   ├── bookings/...
│   │   │   ├── membership/...
│   │   │   ├── academy/...
│   │   │   ├── staff/...
│   │   │   └── settings/...
│   └── api/
│       ├── payment/
│       │   ├── create/route.ts    # DOKU payment creation
│       │   └── callback/route.ts  # DOKU webhook
│       ├── staff/
│       │   └── invite/route.ts    # Staff invite endpoint
│       └── ...
├── components/
│   ├── ui/                        # shadcn/ui components
│   ├── booking/
│   ├── membership/
│   ├── academy/
│   └── shared/
├── lib/
│   ├── supabase/
│   │   ├── client.ts              # Browser client
│   │   ├── server.ts              # Server client (cookies)
│   │   └── admin.ts               # Service role client
│   ├── doku/
│   │   ├── client.ts              # DOKU API wrapper
│   │   └── signature.ts           # DOKU signature verification
│   ├── notification/
│   │   ├── notify.ts              # Notification service (single dispatcher)
│   │   ├── channels/
│   │   │   ├── in_app.ts          # Supabase Realtime + DB insert
│   │   │   ├── push.ts            # OneSignal web push
│   │   │   └── email.ts           # Resend transactional email
│   │   └── preferences.ts         # User notification preferences
│   ├── auth.ts                    # Auth helpers
│   └── utils.ts
├── hooks/                         # Custom hooks
├── components/
│   ├── ui/                        # shadcn/ui components
│   ├── notification/
│   │   └── NotificationCenter.tsx # Bell icon + dropdown + badge + Realtime
│   ├── booking/
│   ├── membership/
│   ├── academy/
│   └── shared/
├── types/                         # TypeScript types
└── middleware.ts                  # Next.js middleware
```

### 8.2 Key Libraries

| Library | Purpose |
|---------|---------|
| `next` 14 | Framework |
| `@supabase/ssr` | Supabase SSR helpers |
| `@supabase/supabase-js` | Supabase client + Realtime |
| `shadcn/ui` + `tailwind` | UI components |
| `react-hook-form` + `zod` | Form handling + validation |
| `@tanstack/react-query` | Server state management |
| `@fullcalendar/react` | Calendar views |
| `jspdf` + `jspdf-autotable` | PDF generation (raport) |
| `date-fns` | Date utilities |
| `lucide-react` | Icons |
| `onesignal` (npm: `@onesignal/onesignal`) | Web push notifications (PWA) |
| `resend` (npm: `resend`) | Transactional email |
| `pg_cron` (Supabase extension) | Scheduled database jobs |

### 8.3 Yang Sengaja Tidak Dipakai

| Item | Alasan |
|------|--------|
| Redux / Zustand | React Query + URL state sudah cukup |
| NextAuth / Clerk | Supabase Auth langsung |
| tRPC | Overkill untuk scope ini; API Routes cukup |
| Drizzle / Prisma | Supabase JS client langsung; gak worth migration cost |
| Docker | Vercel deploy langsung; gak perlu container orchestration |

---

---

## 10. Prinsip Anti-Regresi

Dokumen ini hidup. Setiap kali ada godaan menambah fitur baru:

1. **Tanya:** Apakah ini bagian dari Booking, Membership, atau Akademi?
2. **Kalau tidak:** Masukkan ke backlog V3, jangan sentuh sebelum 3 domain ini production-solid.
3. **Kalau iya:** Tanya lagi — apakah ini benar-benar dibutuhkan untuk launch, atau bisa nanti?
4. **PRD ini diamendemen,** bukan diabaikan.

---

## 11. Keputusan Final

| # | Pertanyaan | Keputusan |
|---|-----------|-----------|
| 1 | Multi-venue management | **Switch.** 1 akun bisa akses banyak venue, pilih via venue switcher di sidebar. Tidak perlu login ulang. |
| 2 | Staff invite | **Email.** Owner/manager input email → sistem kirim invitation link → staff klik link → otomatis registered + assigned role. |
| 3 | Member discount | **Configurable.** Setiap venue bisa mengatur: diskon per tier, maksimal diskon per bulan, minimal booking, pengecualian hari. Semua lewat halaman Settings. |
| 4 | Raport signing | **Ya — tanda tangan digital.** Coach dan Academy Director (atau Owner) menandatangani raport sebelum publish. Simpan sebagai signature image + timestamp. |
| 5 | Parent account | **Many-to-many.** 1 parent bisa punya banyak anak. 1 anak bisa dihubungkan ke 2 parent (ayah & ibu). |
| 6 | Bahasa | **Full Bahasa Indonesia.** Semua UI, error message, notifikasi, dan raport dalam Bahasa Indonesia. |
| 7 | Mobile app | **PWA.** Tidak perlu native app. PWA dengan offline support untuk check-in dan presensi. |
| 8 | Data retention | **Lihat Section 13 — Data Retention Policy** |

---

## 12. Platform Dashboard

Selain 3 domain per venue, Stadione V2 memiliki **dashboard platform** untuk mengelola aspek bisnis global.

### 12.1 Akses

Hanya role `platform_admin` yang bisa mengakses dashboard platform. Role ini diberikan manual oleh super admin (melewati UI Super Admin). Dashboard platform terpisah dari workspace venue — tidak terikat venue manapun.

### 12.2 Fitur

#### 12.2.1 Platform Fee

- **Komisi per transaksi:** Platform mengambil X% dari setiap booking yang sukses (konfigurasi per venue atau global)
- **Override per venue:** Venue A bisa dikenakan fee 5%, Venue B 3% (negosiasi khusus)
- **Tier fee:** Berdasarkan volume transaksi bulanan (semakin tinggi volume → fee semakin rendah)
- **Riwayat fee:** Laporan fee yang tertagih per periode, per venue

#### 12.2.2 Diskon Platform

- **Diskon global:** Platform bisa membuat promo yang berlaku untuk semua venue (misal: Harbolnas, ulang tahun platform)
- **Subsidi silang:** Platform bisa mensubsidi sebagian biaya booking (misal: diskon 20% untuk user baru, 10% ditanggung platform, 10% ditanggung venue)
- **Batas per user:** Maksimal klaim diskon platform per user per bulan
- **Reporting:** Laporan penggunaan diskon — berapa yang ditanggung platform vs venue

#### 12.2.3 Venue Management

- **Onboarding venue:** Timeline verifikasi venue baru (dokumen, approval, aktivasi)
- **Status venue:** Active, suspended, inactive
- **Kategori venue:** Futsal, basket, badminton, gym, sepakbola, mixed
- **Pencarian & filter venue**

#### 12.2.4 User & Role Management

- **List semua user** dengan filter per role, per venue, status
- **Assign/revoke role** (termasuk platform_admin, moderator)
- **Suspend user** secara platform-wide atau per venue
- **Activity log user** (login history, transaksi besar, flag aktivitas mencurigakan)

#### 12.2.5 Laporan & Analytics

- **Ringkasan platform:** Total venue, total user, total transaksi bulan ini
- **Revenue platform:** Fee yang terkumpul, tren per bulan
- **Top venue:** Berdasarkan booking, revenue, rating
- **Churn detection:** Venue yang 30 hari tanpa aktivitas booking
- **Export CSV** untuk semua laporan

#### 12.2.6 Pengaturan Platform

- **DOKU configuration:** API key, merchant ID, environment (sandbox/production)
- **Email template:** Template notifikasi global (bisa dioverride per venue)
- **Terms & conditions:** Dokumen kebijakan platform
- **Announcement banner:** Pesan yang muncul di semua halaman publik (maintenance, promo)

### 12.3 Schema Tambahan

```sql
platform_fee_config
  id uuid PK
  venue_id uuid FK → venues null -- null = default global
  fee_pct numeric(5,2) -- misal 5.00 = 5%
  min_fee_amount numeric DEFAULT 0 -- fee minimal per transaksi
  max_fee_amount numeric DEFAULT null -- fee maksimal per transaksi
  is_active boolean DEFAULT true
  created_at timestamptz

platform_discounts
  id uuid PK
  name text -- "Promo Harbolnas 2026"
  code text UNIQUE
  discount_type text -- percentage, fixed
  discount_value numeric
  platform_share_pct numeric(5,2) -- berapa persen ditanggung platform (sisanya venue)
  min_booking_amount numeric DEFAULT 0
  max_discount_amount numeric DEFAULT null
  max_usage_per_user int DEFAULT 1
  max_total_usage int DEFAULT null
  current_usage int DEFAULT 0
  valid_from timestamptz
  valid_until timestamptz
  applicable_venues uuid[] null -- null = semua venue
  is_active boolean DEFAULT true
  created_at timestamptz

platform_announcements
  id uuid PK
  title text
  body text
  type text -- info, warning, maintenance, promo
  is_dismissible boolean DEFAULT true
  valid_from timestamptz
  valid_until timestamptz
  is_active boolean DEFAULT true
  created_at timestamptz

venue_onboarding
  id uuid PK
  venue_id uuid FK → venues
  owner_user_id uuid FK → auth.users
  status text -- pending_docs, under_review, approved, rejected, active
  documents jsonb -- {"ktp":"url", "npwp":"url", "nib":"url", ...}
  reviewer_id uuid FK → auth.users null
  review_notes text
  submitted_at timestamptz
  reviewed_at timestamptz
  created_at timestamptz
```

---

## 13. Data Retention Policy

### 13.1 Rekomendasi

| Data | Retensi Aktif | Retensi Arsip | Keterangan |
|------|--------------|--------------|------------|
| Booking | 2 tahun | 5 tahun (cold storage) | Untuk keperluan audit dan sengketa. Setelah 2 tahun, data dipindahkan ke tabel arsip (bukan dihapus). Cold storage tidak bisa diakses dari dashboard biasa. |
| Payment records | 5 tahun | 10 tahun | Kewajiban pajak. Tidak boleh dihapus. Bukti transaksi untuk laporan keuangan venue. |
| Membership | Aktif + 1 tahun setelah expired | 3 tahun | Untuk analisis retensi member. Setelah 1 tahun expired, data dianonimkan. |
| Check-in records | 1 tahun | 3 tahun | Data operasional. Tidak perlu disimpan lama. |
| Raport & student records | Aktif + 3 tahun | 10 tahun | Nilai historis untuk perkembangan murid. Arsip berguna untuk rekomendasi dan portofolio. |
| Attendance | 1 tahun | 3 tahun | Sejalan dengan raport. Setelah raport arsip, presensi bisa dihapus. |
| Notifications | 90 hari | - | Notifikasi dibaca → hapus setelah 90 hari. Notifikasi tidak dibaca → tetap ada. |
| User account | Selama aktif + 1 tahun | 5 tahun setelah delete | User bisa request hapus akun. Data transaksi tetap disimpan (anonim) untuk kewajiban hukum. |

### 13.2 Mekanisme

- **Soft delete dulu**, jangan hard delete langsung
- **Cron job bulanan** untuk memindahkan data ke tabel arsip sesuai retensi
- **User request data:** User bisa request export semua data pribadi (GDPR-style)
- **Venue tutup:** Data booking/membership tetap disimpan sesuai retensi. Venue ditandai `inactive`. Tidak bisa booking baru tapi data historis tetap bisa diakses oleh owner.

---

## 14. Update Skema — Parent & Raport

### 14.1 Parent Many-to-Many

Tabel `student_parents` (sudah ada di schema 7.4) menggantikan `parent_user_id` di tabel `students`. 1 parent bisa punya banyak anak, 1 anak bisa punya 2 parent.

### 14.2 Digital Signature pada Raport

Kolom signature sudah ada di definisi `report_cards` (section 7.3).

**Alur signing:**
1. Coach isi raport → status `draft`
2. Coach tanda tangan di halaman raport (gambar di canvas / upload signature image) → status `coach_signed`
3. Academy Director/Owner review + tanda tangan → status `published`
4. Raport tampil dengan kedua tanda tangan + tanggal di PDF
5. Raport tidak bisa diedit setelah `published` (kecuali oleh platform admin dengan audit trail)

### 14.3 Staff Invite Flow

Sudah di-cover di section 6.6 dan tabel `staff_invites` di schema 7.4.

---

## 15. Development Phases — Revisi

### Fase 0 — Foundation (2-3 minggu)
- [ ] Setup Next.js project + Tailwind + shadcn/ui
- [ ] Setup Supabase project (baru)
- [ ] Setup DOKU sandbox integration
- [ ] Setup OneSignal account + web push config
- [ ] Setup Resend account + email templates
- [ ] Setup Supabase pg_cron extension
- [ ] Auth: login, register, password reset (Bahasa Indonesia)
- [ ] Subdomain routing (stadione.pro / admin.stadione.pro / pos.stadione.pro)
- [ ] Venue creation + slug generation + venue switcher
- [ ] Role assignment (platform_admin, owner, manager, staff, coach, member)
- [ ] Staff invite via email (Resend)
- [ ] Middleware route guard (per subdomain + per role)
- [ ] Top bar + bottom navbar + NotificationCenter component
- [ ] Tabel `notifications` + Realtime subscription
- [ ] Notification service (`lib/notification/notify.ts`)

### Fase 1 — Booking MVP (3-4 minggu)
- [ ] Court CRUD + sport type selection
- [ ] Pricing rules (peak/off-peak/weekend/member)
- [ ] Booking flow (pilih court → tanggal → jam → bayar → konfirmasi)
- [ ] DOKU payment integration
- [ ] Kalender booking (FullCalendar)
- [ ] Booking management (lihat, cancel, history)

### Fase 2 — Booking Lanjutan (2-3 minggu)
- [ ] Recurring booking
- [ ] Split court
- [ ] Waitlist
- [ ] Tournament slot (mini)
- [ ] Promo codes

### Fase 3 — Platform Dashboard (2-3 minggu)
- [ ] Platform fee configuration
- [ ] Platform discount management
- [ ] Venue onboarding & management
- [ ] User & role management (list, suspend, assign)
- [ ] Analytics & reporting (revenue, top venues, churn)
- [ ] Pengaturan platform (DOKU config, email, T&C, announcements)

### Fase 4 — POS / Kasir (3-4 minggu)
- [ ] Shift management (buka/tutup shift)
- [ ] Walk-in booking (guest checkout)
- [ ] Multi-payment (cash, QRIS, transfer, debit, split)
- [ ] Invoice generation (thermal + standard)
- [ ] Refund dengan approval chain
- [ ] POS dashboard (ringkasan transaksi hari ini)
- [ ] Optimasi mobile/tablet untuk penggunaan di tempat

### Fase 5 — Fitness & Studio Membership (3-4 minggu)
- [ ] Membership plan CRUD per cabang olahraga
- [ ] Visit package CRUD
- [ ] Member enrollment + DOKU payment (+ platform fee deduction)
- [ ] Check-in system (PWA offline-capable)
- [ ] Membership lifecycle (upgrade, downgrade, freeze, cancel)
- [ ] Reward points sederhana
- [ ] Member discount settings (configurable per venue)
- [ ] Integrasi diskon booking untuk member

### Fase 6 — Akademi (4-5 minggu)
- [ ] Academy + program CRUD per cabang olahraga
- [ ] Coach management
- [ ] Student enrollment + DOKU payment
- [ ] Parent many-to-many (1 parent → N anak, 1 anak → N parent)
- [ ] Session scheduling + kalender
- [ ] Attendance tracking (PWA offline-capable)
- [ ] Report template builder
- [ ] Report card input (coach)
- [ ] Digital signing (coach + director)
- [ ] PDF generation + tampilkan signature
- [ ] Parent portal (lihat jadwal + presensi + raport + pembayaran)

### Fase 7 — Polish & PWA (2-3 minggu)
- [ ] Notifikasi integration ke semua domain (booking, membership, akademi, POS)
- [ ] User notification preferences page
- [ ] SEO untuk halaman publik venue
- [ ] Onboarding flow untuk venue baru
- [ ] PWA: service worker, offline caching, install prompt
- [ ] Mobile responsive final pass
- [ ] Error handling + loading states
- [ ] Data retention cron job

**Total estimasi: 21-27 minggu (5-7 bulan) untuk 1-2 developer.**

---

*PRD v2.2 — 30 Juli 2026*
*Status: Final — 4 domain, multi-sport, multi-subdomain, mobile-first*
