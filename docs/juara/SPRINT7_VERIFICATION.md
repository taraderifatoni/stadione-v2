# Verifikasi Sprint 7 + Produksi — 23 November 2026

Pelaksana: PM Stadione (native, sesuai keputusan model worker opsi C).
Mandat Owner: "lanjut saja semua, kerjakan berurutan, pilihkan yang terbaik".
Rencana: `docs/superpowers/plans/2026-11-23-juara-sprint7-production.md`.

## Bukti per langkah

| Langkah | Perintah / metode | Hasil |
|---|---|---|
| Baseline test | `node --test tests/juara/*.test.ts` | 39 test, 39 PASS, 0 fail (exit 0) |
| Build | `npm run build` | `✓ Compiled successfully in 19.2s`, exit 0 |
| Migrasi M-00…M-07 | `docker cp` + `psql -v ON_ERROR_STOP=1` | 8 file OK, tabel `juara_*` = 8 BASE TABLE + 1 VIEW, RLS aktif 8/8, policy 8/8 |
| Migrasi M-08 | `docker cp` + `psql` (retry setelah SSH pulih) | OK, `juara_bootstrap_club` ada |
| Grant service_role | query `information_schema.role_table_grants` | 0 grant pada objek `juara_*` |
| Kunci enkripsi | `openssl rand -base64 32` → env produksi + lokal | `KEYRING_VALID=true`, `ENCRYPTION_ROUNDTRIP=true`; file `.env*` ter-ignore git |
| Push | `git push origin main` | `72d4598..e5e03d8 main -> main` |
| Deploy VPS | `git merge --no-ff origin/main` + `npm run build` + `systemctl restart` | HEAD `825d8db`, build exit 0, service `active` |
| HTTP juara | `curl -I https://juara.stadione.pro/juara` | `307 → /juara/login` (auth guard aktif) |
| HTTP login | `curl https://juara.stadione.pro/juara/login` | 200 |
| HTTP B2C | `curl https://stadione.pro` | 200 |
| Commit lokal | `git log -1` | `e5e03d8 feat(juara): sprint 7 - apply-ready migrations, real playbook save, keyring` |

## Perubahan kode Sprint 7

- `src/lib/juara/keyring.ts` — loader `JUARA_ENCRYPTION_KEYS` / `JUARA_ACTIVE_KEY_ID` (nama sesuai ARCH §6.3).
- `src/lib/juara/playbook-save.ts` — `buildPlaybookInsertRow()` dengan AAD terikat `clubId|table|column|rowId|keyId`.
- `src/app/api/juara/v1/playbooks/route.ts` — stub diubah jadi insert nyata memakai JWT user; 401 tanpa sesi, 403 tanpa klub, 503 tanpa kunci, 201 sukses.
- 9 test baru (keyring 5, playbook-save 4) → total 39.

## Yang belum selesai (blokir teknis, bukan keputusan)

1. **UAT RLS runtime penuh** — script `juara-uat.sh` sudah disiapkan untuk membuat user
   `juara-uat@stadione.pro`, bootstrap klub "UAT Test Club", lalu membuktikan
   `anon` = 0 baris dan `authenticated` = baris milik klubnya. Eksekusi tertahan
   karena koneksi SSH ke `31.97.49.146` berulang kali timeout/terputus setelah
   deploy (TCP port 22 sempat terbuka, handshake tidak stabil). Tidak ada klaim
   "terverifikasi" untuk item ini sampai script benar-benar jalan.
2. **SSO** — butuh client ID/secret dari penyedia identitas.
3. **Pen-test live** — butuh vendor/anggaran.
4. **Kredensial notifikasi** (WAHA/HMAC/Resend/OneSignal produksi) — butuh nilai dari Owner.
5. **Data klub riil UAT** — dilarang mengarang; menunggu data anonim dari Owner.

## Catatan integritas

- Tidak ada nilai kunci enkripsi yang dicetak, disimpan di repo, atau masuk log.
- Tidak ada `DROP`/`TRUNCATE`/`DELETE` pada objek apa pun; semua migrasi aditif.
- Branch produksi VPS memiliki 2 commit lokal (`ea5b162`, `96e78e6`) yang
  dipertahankan lewat `git merge --no-ff`, bukan ditimpa.
- Lint repo lama (367 isu pre-existing di file B2C) tidak disentuh.
