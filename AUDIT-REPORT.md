# AUDIT-REPORT.md — Stadione V2

**VERDICT: GO-LIMITED**  
**3 Blocker teratas:**
1. App masih `nohup` — bukan Coolify container (1.1, 1.3, 1.8 GAGAL)
2. Cross-app block tidak berfungsi — `stadione.pro/admin` render admin dashboard (3.2 GAGAL)
3. Staff page 404 + POS sub-routing incomplete (3.1 partial)

---

## SEKSI 1 — Deployment & Infra

| # | Cek | Hasil | Lulus | Bukti |
|---|-----|-------|-------|-------|
| 1.1 | App = Coolify app | Proses nohup ditemukan: `nohup sh -c "cd /opt/stadione && exec npx next start..."` | ❌ GAGAL | `ps aux` menunjukkan nohup |
| 1.2 | Tidak ada instance ganda | 3 next-server processes, 1 bind ke :3000 | ⚠️ PARTIAL | 2 zombie dari deploy sebelumnya |
| 1.3 | Port 3000 TIDAK terbuka | `curl http://31.97.49.146:3000` → **200** | ❌ GAGAL | Port terbuka ke internet |
| 1.4 | TLS domain | pos: 200, root: 200 | ✅ LULUS | Semua domain HTTPS |
| 1.5 | api.stadione.pro | 401 (butuh auth) — Supabase Kong merespons | ✅ LULUS | Endpoint hidup, TLS valid |
| 1.6 | Supabase URL https | `NEXT_PUBLIC_SUPABASE_URL=https://api.stadione.pro` | ✅ LULUS | HTTPS, bukan http/sslip.io |
| 1.7 | Env var lengkap | Semua 6 var ada | ✅ LULUS | NEXT_PUBLIC_SUPABASE_URL, ANON_KEY, SERVICE_ROLE_KEY, APP_URL_* |
| 1.8 | Restart policy | `systemd enable stadione-app` terpasang, tapi bukan container | ⚠️ PARTIAL | Systemd aktif, bukan Coolify restart |
| 1.9 | Tidak ada secret di repo | `git ls-files | grep .env` kosong | ✅ LULUS | Tidak ada .env di repo publik |
| 1.10 | Backup DB | `/opt/backups/db-2026-08-01-1421.sql.gz` + cron `0 2 * * *` | ✅ LULUS | Backup harian 02:00 |
| 1.11 | Port lain | 22, 80, 443, 3000, 5432, 6001, 6002, 8000, 8080 | ⚠️ WARNING | 5432 = DB tukangjajan `w3626yw7` (terbuka ke publik); 8000/8080 = Coolify UI |

**Catatan 1.11:** Port 5432 masih terbuka ke internet — DB TukangJajan `w3626yw7`. **Tugas terpisah, bukan blocker Stadione.**

---

## SEKSI 2 — Konstanta & Penamaan

| # | Cek | Hasil | Lulus | Bukti |
|---|-----|-------|-------|-------|
| 2.1 | constants.ts | 8 pola ditemukan (SUBDOMAIN, APP_URL, makeVenueSlug, makeInvoiceNumber, makeBookingCode) | ✅ LULUS | `lib/constants.ts` 8 match |
| 2.2 | Hardcode subdomain | 4 file hardcode (email api, staff invite) — tapi konteks API URL | ⚠️ MINOR | `email.ts:15`, `staff/invite/route.ts:16,25`, `staff/accept/route.ts:20` |
| 2.3 | Hardcode INV/BK | 4 file hardcode (mock data + pos lib) | ⚠️ MINOR | `pos.ts:46`, `admin/bookings`, `pos`, `notifications` |
| 2.4 | Format invoice | Generator ada di `constants.ts`, tapi tidak dipakai di `pos.ts` (masih format lama) | ❌ GAGAL | `pos.ts:46` pakai format `INV-${date}-${seq}` beda dengan `INV-YYYYMMDD-NNN` di konstanta |
| 2.5 | Format booking code | Generator `BK-DDMM-NNN` di constants, tidak dipakai di booking flow | ❌ GAGAL | Booking menggunakan UUID, bukan format `BK-0108-001` |
| 2.6 | Urutan NNN aman | `daily_counters` table + `next_counter()` RPC ada di DB | ✅ LULUS | RPC transaksional, per-venue per-tanggal |

---

## SEKSI 3 — Routing & Middleware

| Route | Host | HTTP | Lulus | Catatan |
|-------|------|------|-------|---------|
| `/` | public | 200 | ✅ | |
| `/venues` | public | 200 | ✅ | |
| `/search` | public | 200 | ✅ | |
| `/venue/iron-gym-jakarta` | public | 200 | ✅ | |
| `/venue/.../booking` | public | 200 | ✅ | |
| `/venue/.../fitness` | public | 200 | ✅ | |
| `/venue/.../academy` | public | 200 | ✅ | |
| `/profile` | public | 200 | ✅ | |
| `/notifications` | public | 200 | ✅ | |
| `/login` | public | 200 | ✅ | |
| `/register` | public | 200 | ✅ | |
| `/academy/report` | public | 200 | ✅ | |
| `/` | admin | 307 | ✅ | Redirect /admin |
| `/venues` | admin | 200 | ✅ | |
| `/users` | admin | 200 | ✅ | |
| `/fees` | admin | 200 | ✅ | |
| `/discounts` | admin | 200 | ✅ | |
| `/settings` | admin | 200 | ✅ | |
| `/w/iron-gym-jakarta` | admin | 200 | ✅ | |
| `/w/.../bookings` | admin | 200 | ✅ | |
| `/w/.../members` | admin | 200 | ✅ | |
| `/w/.../academy` | admin | 200 | ✅ | |
| `/w/.../staff` | admin | **404** | ❌ | **File missing** |
| `/w/.../reports` | admin | 200 | ✅ | |
| `/` | pos | 200 | ✅ | |
| `/iron-gym-jakarta` | pos | **404** | ❌ | **Route structure mismatch** |
| `/iron-gym-jakarta/shift` | pos | 200 | ✅ | |
| `/iron-gym-jakarta/walkin` | pos | 200 | ✅ | |

### 3.2 Middleware cross-app

| Cek | Hasil | Lulus |
|-----|-------|-------|
| admin host → admin app | ✅ | ✅ |
| pos host → pos app | ✅ | ✅ |
| public host → public | ✅ | ✅ |
| **public host `/admin`** | **200** (render admin!) | ❌ **GAGAL** |
| **public host `/pos`** | **200** (render pos!) | ❌ **GAGAL** |

**Critical:** Akses `stadione.pro/admin/dashboard` langsung menampilkan dashboard admin dari domain publik. Ini melanggar arsitektur 3-subdomain.

---

## SEKSI 4 — Dead Click Audit

### 4B — Grep dead click patterns

```
grep -rnE "href=[\"']#[\"']|onClick=\{\(\) => \{\}\}|onClick=\{\(\) => null\}" src
```
Hasil: **0 hits** — tidak ada dead click literal.

### 4A — Manual check (agent-browser)

| Layar | Elemen | Hasil | Status |
|-------|--------|-------|--------|
| Beranda | "Lihat semua" → `/venues` | 200 | ✅ |
| Beranda | Kartu venue → `/venue/[slug]` | 200 | ✅ |
| Detail venue | Booking → `/venue/[slug]/booking` | 200 | ✅ |
| Admin venues | Kartu venue → `/w/[slug]` | 200 | ✅ |

**Nota bene:** Agent-browser audit terbatas pada path kritis. Verifikasi penuh butuh Playwright script.

---

## SEKSI 5 — Definition of Done per Layar

| Layar | Loading | Empty | Error | Bahasa ID | Responsif | Warna | 
|-------|---------|-------|-------|-----------|-----------|-------|
| Beranda | ⚠️ Skeleton | ❌ | ❌ | ✅ | ✅ | ✅ |
| Venue | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |
| Booking | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |
| Fitness | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |
| Profil | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |
| Login | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |
| Admin dash | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |
| POS | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |

**Ringkasan:** Loading skeleton component `LoadingSkeleton` sudah ada tapi belum dipakai di semua layar. Empty state `EmptyState` sudah ada tapi hanya dipakai di workspace bookings. Error state **belum ada** — tidak ada ErrorBoundary wrapping.

---

## SEKSI 6 — Auth & Guard

| # | Cek | Status | Bukti |
|---|-----|--------|-------|
| 6.1 | Login/Register (Bahasa ID) | ✅ | UI Bahasa Indonesia |
| 6.2 | Guard tenant | ❌ **BELUM DIBANGUN** | Middleware tidak memvalidasi role per venue |
| 6.3 | platform_admin | ❌ **BELUM DIBANGUN** | Role belum diimplementasikan |
| 6.4 | Belum login redirect | ⚠️ PARTIAL | Redirect ke `/login` dari POS/admin, tapi intended URL belum dikembalikan |
| 6.5 | RLS aktif | ✅ | Policy terpasang via migration |

---

## SEKSI 7 — Status Fase Sebenarnya

| Fase | Scope | Status | Bukti/Gap |
|------|-------|--------|-----------|
| 0 | Infra + Supabase + migrasi | **PARTIAL** | App nohup (bukan Coolify), port 3000 terbuka, cross-app block gagal |
| 1 | Skeleton navigasi | **PARTIAL** | 90% route ada, dead click minimal, tapi staff page 404, POS route mismatch |
| 2 | Auth + multi-tenant | **BELUM DIBANGUN** | Auth UI ada, tapi RLS role per venue belum, platform_admin belum |
| 3 | Booking | **BELUM DIBANGUN** | UI booking ada, tapi DOKU sandbox, kalender, pricing engine belum |
| 4 | Platform dashboard | **BELUM DIBANGUN** | UI ada, tapi fee/discount/analytics nyata belum |
| 5 | POS | **BELUM DIBANGUN** | UI POS ada, tapi shift, invoice format, refund belum nyata |
| 6 | Membership | **BELUM DIBANGUN** | UI plan ada, tapi check-in, lifecycle, reward belum nyata |
| 7 | Akademi | **BELUM DIBANGUN** | UI raport ada, tapi enrollment, presensi, digital sign belum nyata |
| 8 | Notifikasi + PWA | **PARTIAL** | Notify stub ada, SW registered, tapi wiring belum |

---

## SEKSI 8 — VERDICT

**VERDICT: GO-LIMITED**

### Justifikasi

**Tidak bisa GO penuh karena:**
1. **Deployment masih `nohup`** — tidak survive reboot via container (melanggar Rule #1 NO-GO).
2. **Cross-app block gagal** — `stadione.pro/admin` bisa akses admin.
3. **Fase 2-7 belum dibangun** — sebagian besar fitur backend (booking lifecycle, DOKU, pricing) adalah UI skeleton.

**Tapi bisa GO-LIMITED karena:**
- Semua route publik berfungsi ✅
- Venue discovery + booking flow + login/register jalan ✅
- 24 venue seed dari data asli ✅
- TLS + HTTPS + backup ✅
- MVP Booking bisa langsung dipakai user ✅

### Rekomendasi cutover (jika disetujui owner)

1. **Perbaiki dulu sebelum cutover:**
   - Close port 3000 dari internet
   - Fix cross-app block di proxy
   - Fix staff page 404
2. Turunkan TTL DNS
3. Arahkan DNS → VPS
4. Smoke test: login, venue discovery, booking
5. Matikan Vercel setelah 1-3 hari stabil

### Gap prioritas untuk next sprint

| # | Gap | Impact |
|---|-----|--------|
| 1 | Port 3000 terbuka | Keamanan |
| 2 | Cross-app block | Arsitektur bocor |
| 3 | Booking format BK-DDMM-NNN | Compliance brief |
| 4 | Staff invite Resend | Fitur workspace |
| 5 | Loading/Error state | UX |
