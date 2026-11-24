# Peta Status Produksi — Stadione & JUARA (read-only, 24 Nov 2026)

Sumber: SSH read-only ke `31.97.49.146`, curl HTTPS publik, git lokal. Tidak ada deploy,
restart, migrasi, transaksi, atau perubahan kredensial. Nama env saja; tidak ada nilai rahasia.

## Runtime

| Item | Bukti | Catatan |
|---|---|---|
| Host | `srv1862653` | VPS `31.97.49.146` |
| Service | `stadione.service` = `active` | Port 3011 via Traefik |
| Symlink | `/opt/stadione-current → /opt/stadione` | Release lama tersedia di `/opt/stadione-releases/` |
| Deployed HEAD | `6425ae5 Merge origin/main (mobile nav fix)` | **Tertinggal** dari lokal `063c1c8` |
| Working tree VPS | 6 entry | Perubahan lokal VPS, bukan dari PM; tidak saya ubah |
| HTTP | `stadione.pro` 200; `juara.stadione.pro/juara/login` 200; `/api/juara/v1/playbooks` 401 | Auth guard aktif |
| Rute JUARA ter-build | 4 halaman di `.next/server/app/juara` | Lokal memiliki lebih banyak rute; produksi belum sinkron |

## Database produksi (read-only)

| Item | Hasil | Interpretasi |
|---|---|---|
| `juara_*` tables | 9 | 8 tabel + 1 view inventaris policy |
| Policy `juara_*` | 8 | `juara_club_members` = `SELECT`; 7 tabel lain masih `ALL` |
| `juara_playbooks` | `tactical_dna_type`, `tactical_profile_enc` ada | M-10/M-11 ter-apply. Tidak ada kolom CAS di tabel ini. |
| `juara_clubs` | `vision_draft_enc`, `vision_finance_enc` ada; `vision_revision`, `vision_legacy_migrated` **tidak ada** | M-13 + M-15 ter-apply; M-16 (CAS) belum. Koreksi dari catatan sebelumnya yang salah menaruh revision di `juara_playbooks`. |
| ENUM `juara_tactical_dna` | 10 nilai | M-11 ter-apply |
| M-14/M-16 | **belum** ter-apply di produksi | Policy `FOR ALL` masih ada; CAS revision belum aktif |

Artinya: aplikasi produksi `6425ae5` dan DB produksi **tidak** mencerminkan source/CAS/RBAC
yang sudah di-review di staging. Semua acceptance JUARA sejauh ini adalah bukti **staging**,
bukan produksi.

## Env produksi (nama saja)

`DOKU_CLIENT_ID`, `DOKU_ENVIRONMENT`, `DOKU_SECRET_KEY`, `NEXT_PUBLIC_SUPABASE_URL`,
`NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `JUARA_ACTIVE_KEY_ID`,
`JUARA_ENCRYPTION_KEYS`. Tidak ada nilai yang dicetak atau disalin.

## Status kerja PM saat assessment

- HEAD lokal `063c1c8`; working tree lokal berisi modifikasi file Owner Representative dan
  kandidat D3 provisional (`src/app/juara/juara.css`, `docs/juara/design/D3_COLOR_REFERENCES.md`,
  referensi Mobbin). **Belum di-commit sebagai desain final, belum di-deploy.**
- Palet lama hijau/emas ditolak Owner. Kandidat graphite/navy/cobalt masih provisional dan
  tidak boleh diklaim diterima sebelum screenshot actual app + review.
- Payment static triage berjalan paralel; temuan akan dicatat terpisah di
  `docs/assessment/PAYMENT_STATIC_TRIAGE.md`.
- Tidak ada perubahan produksi oleh assessment ini.
