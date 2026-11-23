# Bukti Runtime RLS JUARA — 23 November 2026

Metode: anon key publik dari bundle klien Next.js `juara.stadione.pro`
(`NEXT_PUBLIC_SUPABASE_ANON_KEY` memang publik). UAT authenticated dijalankan
lewat SSH VPS dengan admin API/service key hanya di server (nilai tidak dicetak).

Supabase produksi: `https://api.stadione.pro`.

## A. Isolasi anon — TERVERIFIKASI

```bash
curl -H "apikey: $ANON" -H "Authorization: Bearer $ANON" \
  'https://api.stadione.pro/rest/v1/juara_playbooks?select=id&limit=5'
# HTTP 200, body []
```

- `HTTP 200`, body `[]` → tabel ada, 0 baris terlihat oleh `anon`.

```bash
curl -X POST ... /rest/v1/juara_playbooks -d '{...}'
# HTTP 401, {"code":"42501","message":"new row violates row-level security policy for table \"juara_playbooks\""}
```

- Tulisan anon ditolak RLS `WITH CHECK`.

## B. Authenticated UAT — TERVERIFIKASI (23.11.2026, setelah SSH pulih)

Lingkungan: VPS `31.97.49.146`, SSH `root@31.97.49.146` pulih (`SSH_OK`). Dua user
UAT dibuat via admin API, email dikonfirmasi, password diset sementara (tidak
dicatat). Setiap user memanggil `juara_bootstrap_club()` → mendapat `club_id`
berbeda (RLS helper `auth.uid()` bekerja).

| # | Pemeriksaan | Hasil | Bukti |
|---|---|---:|---|
| B1 | User A (member Club A) insert `juara_playbooks` milik Club A | **PASS** | `HTTP 201`, row dikembalikan |
| B2 | User B (member Club B) `select` semua playbooks | **PASS** | `HTTP 200`, body `[]` |
| B3 | User B filter row milik Club A (`id=eq.<row_a>`) | **PASS** | `HTTP 200`, body `[]` |
| B4 | User B mencoba insert ke Club A | **PASS (ditolak)** | `HTTP 403`, `42501 row violates row-level security policy` |
| B5 | `juara_bootstrap_club()` dipanggil user authenticated | **PASS** | `HTTP 200`, UUID klub dikembalikan (A dan B) |

## C. Kebersihan data UAT

Semua artefak UAT dihapus setelah bukti terkumpul (transaksi SQL tunggal,
`ON_ERROR_STOP=1`): 1 row `juara_playbooks`, 2 row `juara_club_members`, 2 row
`juara_clubs`, 2 user `auth.users`. File sementara di VPS (`/tmp/juara-uat*`,
token/password) dan di lokal (`/tmp/opencode/juara-*`) dihapus. Tidak ada nilai
kunci/secret yang dicetak.

## Kesimpulan

- Isolasi `anon`: **TERVERIFIKASI**.
- Isolasi `authenticated` antar-klub + bootstrap RPC: **TERVERIFIKASI**.
- Produksi **belum** "fully verified" untuk semua aspek (SSO, pen-test, notifikasi,
  data klub riil masih tertunda), tetapi **UAT RLS runtime** yang diminta CTO
  sudah selesai dan dibuktikan.
