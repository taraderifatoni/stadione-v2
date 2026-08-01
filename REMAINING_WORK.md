# Stadione V2 — Sisa Pengerjaan

## Fase 8 — Fix Critical (1 minggu)

Yang bikin user gak bisa pakai:

- [ ] **Subdomain SSL** — `admin.stadione.pro` & `pos.stadione.pro` masih generating cert
- [ ] **Booking flow** — pastikan booking bisa dibuat oleh user yang login (cek full flow: login → venue → booking → DOKU)
- [ ] **Venue tidak ada** — buat 1 venue dummy via SQL biar ada yang bisa diakses: venue "Iron Gym Jakarta", 2 courts, pricing rules
- [ ] **Auth fix** — cek login/register di production, pastikan Supabase redirect URL sudah di-set ke `stadione.pro`
- [ ] **Test all 30 routes** — buka 1 per 1, pastikan gak ada error

## Fase 9 — Notification Integration (1 minggu)

- [ ] Set env vars: OneSignal `APP_ID`, Resend `API_KEY`
- [ ] Panggil `sendNotification()` dari semua trigger:
  - Booking confirmed
  - Membership expired (H-7,3,1)
  - Raport published → parent
  - Staff invite
- [ ] pg_cron jobs: booking reminder setiap jam, membership expiry setiap hari
- [ ] Notification preferences page (`/settings/notifications`)

## Fase 10 — Polish & UX (1-2 minggu)

- [ ] Loading skeleton (skeleton component di semua list)
- [ ] Error boundaries + toast
- [ ] Empty states (illustrasi + CTA saat list kosong)
- [ ] Mobile QA: tes di HP asli, perbaiki overflow/touch target
- [ ] Onboarding wizard: step-by-step setup venue baru
- [ ] SEO: metadata per halaman venue, sitemap.xml

## Fase 11 — PWA (1 minggu)

- [ ] `next-pwa` setup + service worker
- [ ] `manifest.json` — nama, ikon, theme color, standalone
- [ ] Offline caching untuk halaman publik
- [ ] Install prompt
- [ ] Background sync untuk check-in attendance

## Fase 12 — Raport Enhancement (1 minggu)

- [ ] Digital signature canvas (tanda tangan coach + director)
- [ ] jsPDF raport generation + download
- [ ] Report template builder UI (drag-drop kategori)
- [ ] Histori raport dengan grafik tren

---

## Ringkasan

| Fase | Nama | Estimasi |
|------|------|----------|
| 0-6 | Core domains | ✅ Done |
| 7 | Deploy + domain | ✅ Done |
| **8** | **Fix Critical** | **1 minggu** |
| **9** | **Notification Integration** | **1 minggu** |
| **10** | **Polish & UX** | **1-2 minggu** |
| **11** | **PWA** | **1 minggu** |
| **12** | **Raport Enhancement** | **1 minggu** |

**Total tersisa: 5-6 minggu.**
