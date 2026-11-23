# Runbook Kunci Enkripsi JUARA — 23 November 2026

## Variabel environment

Nama mengikuti `ARCHITECTURE.md` §6.3 (bukan nama lama di rencana Sprint 7):

```
JUARA_ENCRYPTION_KEYS={"v1":"<kunci base64 32 byte>"}
JUARA_ACTIVE_KEY_ID=v1
```

- Format `JUARA_ENCRYPTION_KEYS` adalah peta JSON `key_id -> kunci base64 32 byte`.
- Beberapa versi boleh hidup bersamaan untuk rotasi; hanya `JUARA_ACTIVE_KEY_ID` yang
  dipakai untuk enkripsi baru.
- Kunci dibuat dengan `openssl rand -base64 32`.
- Nilai kunci **dilarang** masuk git, log, transkrip, atau output perintah. File
  `.env.local` dan `.env.production` sudah di-`.gitignore`.

## Lokasi terpasang

| Lingkungan | File | Status |
|---|---|---|
| VPS produksi (`31.97.49.146`) | `/opt/stadione/.env.production` | Terpasang, mode `600` |
| Lokal (PM) | `/home/taradfs/stadione-v2/.env.local` | Terpasang, ter-ignore git |

Keduanya memakai kunci `v1` yang sama (disalin lewat kanal SSH terenkripsi, file
sementara dihapus setelahnya). Pemisahan kunci antara lokal dan produksi akan
membuat data vault tidak bisa dibaca lintas lingkungan.

## Verifikasi tanpa membocorkan kunci

```bash
node -e 'const fs=require("fs"); const s=fs.readFileSync(".env.local","utf8");
const j=JSON.parse(s.match(/^JUARA_ENCRYPTION_KEYS=(.*)$/m)[1]);
console.log(Buffer.from(j.v1,"base64").length===32)'
```

Output `true` = kunci 32 byte. Jangan pernah mencetak isi `j.v1`.

## Prosedur rotasi v1 → v2

1. Generate kunci baru: `openssl rand -base64 32`. Simpan sementara di file `600`.
2. Tambahkan ke peta: `JUARA_ENCRYPTION_KEYS={"v1":"...","v2":"<baru>"}`. Biarkan
   `JUARA_ACTIVE_KEY_ID=v1` dulu — aplikasi lama masih bisa membaca v1.
3. Deploy konfigurasi ke produksi, restart `stadione.service`, verifikasi aplikasi
   masih bisa membaca data lama.
4. Ubah `JUARA_ACTIVE_KEY_ID=v2`, deploy + restart. Tulisan baru memakai v2;
   pembacaan masih mendukung v1 dari peta.
5. Re-enkripsi seluruh kolom `*_enc` (8 kolom di `juara_playbooks` dan
   `juara_contracts_vault`) dari v1 ke v2 lewat job migrasi terkontrol, per klub.
   AAD harus tetap memakai `clubId|table|column|rowId|keyId`.
6. Setelah audit selesai, hapus `v1` dari peta dan deploy ulang.
7. Simpan bukti rotasi di `docs/juara/`; jangan simpan kunci lama di repo.

## Penting

- `decryptField` mengambil `keyId` dari blob (lihat `pack`/`unpack`), jadi kunci lama
  harus tetap ada di peta selama proses re-enkripsi.
- AAD mengikat ciphertext ke `clubId`, nama tabel, nama kolom, `rowId`, dan `keyId`.
  Memindahkan baris antar klub atau mengubah `rowId` akan membuat dekripsi gagal —
  ini disengaja (deteksi tamper).
