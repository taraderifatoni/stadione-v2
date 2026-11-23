# Bukti Runtime RLS JUARA — 23 November 2026

Metode: tanpa SSH, memakai **anon key publik** yang memang disertakan Next.js di
bundle klien `juara.stadione.pro` (dalam produksi, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
bersifat publik dan memang dikirim ke browser). Tidak ada kredensial privat yang
dicari, dicetak, atau dipakai.

Supabase produksi: `https://api.stadione.pro`.

## A. Isolasi anon — LULU (bukti runtime nyata)

Perintah (anon key disimpan di file sementara, tidak dicetak):

```bash
ANON=$(cat /tmp/opencode/juara-anon.txt)
curl -sS -i -H "apikey: $ANON" -H "Authorization: Bearer $ANON" \
  'https://api.stadione.pro/rest/v1/juara_playbooks?select=id&limit=5'
```

Hasil:
- `HTTP 200`, body `[]` → tabel ada dan dapat di-query, tetapi **0 baris** terlihat
  oleh `anon`. RLS bekerja.
- Tidak ada error `PGRST205` (tabel tidak ada) maupun `42501` (ditolak) — ini
  membuktikan tabel `juara_playbooks` benar-benar aktif di PostgREST produksi.

## B. Anon mencoba menulis — DITOLAK (bukti runtime nyata)

```bash
curl -sS -X POST -H "apikey: $ANON" -H "Authorization: Bearer $ANON" \
  -H 'Content-Type: application/json' -H 'Prefer: return=minimal' \
  'https://api.stadione.pro/rest/v1/juara_playbooks' \
  -d '{"club_id":"00000000-0000-0000-0000-000000000000","horizon_years":1,
       "target_sporting_outcome":"CHAMPION","tactical_dna_type":"BALANCED_HYBRID"}'
```

Hasil:
- `HTTP 401`
- Body: `{"code":"42501","message":"new row violates row-level security policy for table \"juara_playbooks\""}`

Ini bukti bahwa `WITH CHECK` policy menolak tulisan tanpa `auth.uid()` yang
terhubung ke klub.

## C. Jalur authenticated — BELUM TERBUKTI

Upaya yang sudah dicoba dan gagal jujur:

1. `POST /auth/v1/signup` untuk `juara-uat@stadione.pro` → `HTTP 200`, user dibuat
   (id `7767122e-d23c-4135-9737-e2168692a882`), tetapi **email belum terverifikasi**.
2. `POST /auth/v1/token?grant_type=password` → `400 email_not_confirmed`.
3. `POST /auth/v1/token?grant_type=anonymous` → `400 unsupported_grant_type`
   (anonymous sign-in tidak diaktifkan di instance ini).
4. Admin API `/auth/v1/admin/users` membutuhkan `service_role` key yang hanya ada
   di VPS; SSH ke `31.97.49.146` masih `banner timeout`.

Karena itu **belum ada bukti runtime** bahwa:
- `authenticated` dengan membership bisa menginsert baris ke klubnya;
- user dari klub lain tidak bisa membaca baris klub tersebut;
- `juara_bootstrap_club()` bisa dipanggil via RPC oleh user yang sah.

Script `juara-uat.sh` di VPS sudah disiapkan untuk tiga pemeriksaan itu dan
**tinggal dieksekusi begitu SSH/admin key tersedia**.

## Kesimpulan terbatas

- Isolasi `anon` (baca 0 baris, tulis ditolak RLS): **TERVERIFIKASI**.
- Isolasi antar-klub `authenticated`: **BELUM TERVERIFIKASI** — jangan diklaim selesai.
- Migrasi/administrasi database sudah tercatat di `MIGRATION_APPLIED.md`.

## Kebersihan

File sementara berisi kata sandi/token UAT (`/tmp/opencode/juara-uat-pw`,
`/tmp/opencode/juara-uat-token.json`, `/tmp/opencode/juara-signup.json`) dihapus
setelah verifikasi. Anon key adalah nilai publik dan tidak disimpan di repo.
