# Bukti Perbaikan Audit P1 v2 — 24 November 2026

Sumber: `docs/juara/OWNER_REP_P1_AUDIT.md` lanjutan. Status: **perbaikan siap untuk review;
belum deploy UI; P1 belum accepted.**

## Temuan → perbaikan → bukti

| # | Temuan | Perbaikan | Bukti |
|---|---|---|---|
| 1 | `mergeRestrictedDraft` mempertahankan `equity` incoming SD saat draft lama kosong | `equity` SELALU dibuang untuk non-owner, lalu dipasang hanya dari draft lama; mutation melewati allowlist | `tests/juara/draft-dto.test.ts`: "SD tidak menyisipkan equity saat draft lama kosong" |
| 2 | RPC draft bisa menimpa finance blob & HTTP DTO bisa dilewati | Pemisahan `vision_draft_enc` (non-sensitif) vs `vision_finance_enc` (privat); M-15 RPC mengabaikan finance blob dari OWNER/CEO selain itu; GET menggabungkan finance hanya untuk peran berhak | Staging: SD `juara_set_vision_draft(club, blob, finance)` → `finance_after_sd=NULL`; Finance Controller → ditolak; Owner → `finance_written=1` |
| 3 | `existingRow.error` diabaikan; concurrent save menimpa | Fail closed saat baca draft lama gagal; `expectedHash` + 409 `VERSION_CONFLICT`; UI menyimpan versi dari GET | Browser: stale hash menghasilkan "Draf berubah di sesi lain"; save normal → "Draf tersimpan"; reload → 10/45/45 |
| 4 | Screenshot produksi lama bukan bukti build perbaikan | Paket screenshot dari **build kandidat lokal** `http://127.0.0.1:3100` dengan env produksi & akun demo, state loading dan loaded terpisah | `docs/juara/screenshots/commit-fixes-v2/MANIFEST.md` |
| 5 | M-14 belum diuji runtime staging | Staging DB sementara `juara_staging_20261124`: 16 migrasi ter-apply, negative role/action/tenant dijalankan, DB dihapus setelah uji | Tabel hasil di bawah |
| 6 | MIME & invite | `application/pdf`, invite `501 NOT_IMPLEMENTED` | Kode; reviewer sudah menerima dari kode sebelumnya |

## Uji staging negatif (M-14 + M-15, akun sintetis)

| Kasus | Hasil |
|---|---|
| SD `UPDATE juara_club_members` → OWNER | ditolak (`permission denied`) |
| SD `UPDATE juara_clubs` nama | ditolak |
| SD `UPDATE juara_playbooks` status | ditolak |
| SD RPC `juara_set_member_role(self,'OWNER')` | ditolak: "Hanya Owner klub yang boleh mengubah role" |
| SD RPC `juara_set_vision_draft(..., finance)` | berhasil untuk draft, finance tetap `NULL` |
| Finance Controller RPC insert playbook / set draft | ditolak |
| Owner RPC insert playbook & finance write | berhasil |
| Akun klub lain membaca klub A | `0` baris |
| Policy final | semua `juara_*` = `SELECT` |

Migrasi staging dijalankan atomik per file dengan `ON_ERROR_STOP=1`; staging DB di-drop setelah uji.

## Verifikasi lokal

- `node --test tests/juara/*.test.ts` → **65 pass / 0 fail**.
- `npm run build` exit 0; ESLint sumber juara exit 0.
- M-15 ter-apply di produksi (kolom + fungsi, self-contained) agar build kandidat dapat diuji;
  **M-14 masih belum di-apply produksi**. Tidak ada deploy UI.

## Catatan transisi

- M-15 awalnya bergantung pada `juara_can_edit` dari M-14; karena M-14 sengaja belum
  di-apply produksi, fungsi M-15 dibuat self-contained dengan pemeriksaan role inline,
  lalu di-reapply. Staging diuji ulang setelah perubahan ini.
- Demo draft di-reset sekali saat diagnosa (data uji, bukan klub riil).
- Rollback tetap aplikasi-ke-commit-sebelumnya; policy tidak dilemahkan.
