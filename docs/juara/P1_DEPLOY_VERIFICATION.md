# Verifikasi Deploy P1 — 24 November 2026

Konteks: mandat eksekusi Owner Representative. Status: **IMPLEMENTED → TESTED → DEPLOYED**;
**ACCEPTED masih menunggu Owner Representative/Owner**.

## Deploy

- Commit PM `8c6a1c0` (security + shell + draft), `291e506` (mobile nav fix).
- VPS merge `85ec9218`, lalu `6425ae5` setelah perbaikan mobile; build exit 0;
  `stadione.service active`.
- Rollback siap: `git reset --hard 019ebcd && npm run build && systemctl restart stadione.service`
  di `/opt/stadione`. Tidak dieksekusi.

## Gate keamanan (runtime produksi)

| Endpoint tanpa sesi | Hasil |
|---|---|
| `GET /api/juara/v1/playbooks` | 401 `UNAUTHENTICATED` |
| `GET /api/juara/v1/vision/draft` | 401 `UNAUTHENTICATED` |
| `POST /api/juara/v1/playbooks/generate` | 401 `UNAUTHENTICATED` |
| `POST /api/juara/v1/members/invite` | 401 `UNAUTHENTICATED` |
| `GET https://stadione.pro` | 200 (B2C aman) |

M-12/M-13 ter-apply. UAT anti eskalasi ada di `SECURITY_GATE_UAT.md`.

## Browser regression (agent-browser v0.33.1, path absolut nvm)

- Login demo → `/juara`, judul "Selamat datang, Klub Demo JUARA".
- Screenshot 4 viewport: `docs/juara/screenshots/p1-1440x900.png`, `p1-1024x768.png`,
  `p1-768x1024.png`, `p1-390x844.png`. File diverifikasi berukuran sesuai viewport.
- Mobile 390×844: sidebar berubah jadi bottom navigation, tidak ada overflow horizontal,
  header/context tab/KPI terbaca.
- Journey langkah 4: input bintang diubah 25 → 15 (total 90%), tombol Lanjut menampilkan
  **"Total masih 90%. Sisa 10% belum dialokasikan."**; status live **"Total 90% — kurang 10%."**
- Tombol "Isi sisa ke produk akademi" → total 100% → Lanjut berhasil.
- "Simpan draf" → `Draf tersimpan`; reload halaman → `Draf dimuat`; nilai terbaca
  kembali 15 / 45 / 40 (bukan nilai default 25 / 45 / 30).

## Test lokal

- `node --test tests/juara/*.test.ts` → **57 pass / 0 fail**.
- `npm run build` exit 0; ESLint sumber juara exit 0 (1 warning lama di `crypto.test.ts`).

## Yang belum

- Accepted oleh Owner Representative/Owner.
- D3 lanjutan: inspector 360–440 px dalam canvas, action bar 52 px saat skenario diedit,
  dan 9 rute penuh masih sesuai backlog plan, tidak diklaim selesai.
- SEC-02 invite nyata masih RENCANA; gate izinnya sudah aktif.
