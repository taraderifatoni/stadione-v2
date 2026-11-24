# Bukti Perbaikan Audit P1 — 24 November 2026

Sumber: `docs/juara/OWNER_REP_P1_AUDIT.md` (CHANGES REQUIRED).
Commit perbaikan: `d1e9efb`. **Status: siap untuk review; belum deployed; P1 belum accepted.**

| # | Temuan audit | Perbaikan | Bukti | Status |
|---|---|---|---|---|
| 1 | Policy `juara_clubs`/`juara_playbooks` dll masih `FOR ALL`, bypass capability via PostgREST | M-14 mengubah policy 7 tabel jadi `FOR SELECT`; tulis hanya RPC `juara_insert_playbook`, `juara_set_vision_draft`, `juara_set_member_role` dengan pengecekan peran | Policy live sebelum fix diverifikasi: 7 tabel `ALL`, membership `SELECT`. File M-14 disiapkan. | **IMPLEMENTED, belum di-apply produksi** — menunggu review visual/deploy |
| 2 | SD bisa GET draft utuh termasuk `guardrails.equity`; regex top-level tidak cukup | `draftForRole()` allowlist eksplisit + `mergeRestrictedDraft()` mempertahankan equity lama untuk peran non-owner | `tests/juara/draft-dto.test.ts` 4 test; route draft memakai allowlist dan merge | TESTED |
| 3 | Invite stub mengembalikan `200 {ok:true}` | Route mengembalikan `501 {ok:false, code:NOT_IMPLEMENTED}` | Kode route; SEC-02 tetap RENCANA | IMPLEMENTED |
| 4 | MIME PDF `application/pdf.ts` | Header `application/pdf` | Sumber route; smoke header menyusul setelah deploy | IMPLEMENTED, smoke pending |
| 5 | Rollback M-12 membuka policy rentan | Komentar rollback M-12 dihapus; M-14 menyatakan rollback aplikasi, policy tidak dilemahkan | File migrasi M-12/M-14, ledger | IMPLEMENTED |
| 6 | Gate/status ledger menyesatkan | Browser regression dicatat setelah deploy; D3 ditandai parsial; `SECURITY_GATE_UAT.md` direkonsiliasi | `PM_EXECUTION_STATUS.md`, `SECURITY_GATE_UAT.md`, `P1_DEPLOY_VERIFICATION.md` | IMPLEMENTED |

## Verifikasi lokal

- `node --test tests/juara/*.test.ts` → **61 pass / 0 fail**.
- `npm run build` exit 0; ESLint sumber juara exit 0.
- Tidak ada perubahan UI visual pada slice ini (backend/security); paket screenshot diambil
  dari build produksi berjalan `6425ae5` sesuai standar bukti visual.

## Yang belum

- M-14 belum di-apply; uji negatif PostgREST/RPC untuk 7 tabel menyusul setelah deploy.
- Visual review oleh Owner Representative belum selesai; status **VISUAL REVIEW PENDING**.
- Deploy dan post-smoke belum dilakukan untuk commit `d1e9efb`.
