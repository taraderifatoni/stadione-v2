# Bukti Slice Transactional Draft + Migration Reconciliation

Tanggal: 24 Nov 2026. Sumber: `docs/juara/OWNER_REP_FIXES_V2_AUDIT.md`.
Status: **siap untuk review; M-16 belum di-apply produksi; UI belum di-deploy.**

## Perubahan

- M-16: kolom `vision_revision` + `vision_legacy_migrated`; menghapus overload 2 dan 3 argumen;
  satu fungsi 4 argumen `(club, blob, finance_blob, expected_revision)`.
- Fungsi melakukan `UPDATE ... WHERE vision_revision = expected` dalam satu transaksi,
  mengembalikan revision baru; conflict → SQLSTATE `40001` / `REVISION_CONFLICT`.
- SD ditolak `LEGACY_NOT_MIGRATED` sampai Owner/CEO melakukan save pertama yang
  mem-backfill finance blob. Finance blob existing tidak pernah ditimpa SD.
- Route draft: `expectedRevision` wajib, tidak ada fallback raw `UPDATE`; 409 untuk
  conflict/legacy, 500 untuk RPC gagal lain. Wizard mengirim/menyimpan revision dari server.

## Rehearsal staging — urutan produksi aktual

Runner: `/tmp/opencode/staging-cas-test.sh` → di VPS `/tmp/staging-cas-test.sh`.
DB sementara `juara_cas_stage` di dalam container Postgres yang sama, **dihapus setelah uji**.

Urutan aplikasi migrasi: `M-00…M-13 → M-15 → M-14 → M-16` (mensimulasikan M-15 yang
terlanjur ada di produksi sebelum M-14).

| Pemeriksaan | Hasil |
|---|---|
| Overload sebelum M-16 | `juara_set_vision_draft(uuid,bytea)` **dan** `(uuid,bytea,bytea)` |
| Overload sesudah M-16 | hanya `(uuid,bytea,bytea,integer)` |
| SD save sebelum migrasi | `RC=1 LEGACY_NOT_MIGRATED` |
| Owner backfill pertama | `RC=0` → `revision=1`, `migrated=true`, `finance=bb` |
| SD save dengan finance blob `dd` | `RC=0` → `revision=2`, `finance=bb` (existing terjaga) |
| Finance Controller direct RPC | `RC=1 Tidak berhak menulis draft klub ini` |
| Cross-tenant read klub lain | `0` baris |
| CAS paralel, dua request `expectedRevision=2` | `RC=0/1` → satu sukses `revision=3`, satu `REVISION_CONFLICT`; final revision `3` |
| Policy akhir | semua `juara_*` = `SELECT` |

## Verifikasi lokal

- `node --test tests/juara/*.test.ts` → **65 pass / 0 fail**.
- `npm run build` exit 0; ESLint sumber juara exit 0.
- Tidak ada perubahan DB produksi untuk M-14/M-16. Audit compatibility M-15 produksi
  dilakukan read-only: kolom `vision_finance_enc` ada, fungsi 3 argumen ada; tidak ada rollback.

## Koreksi audit berikutnya (checkpoint saat ini)

-Bug finance: `planDraftWrite` sekarang memakai `existingFinance` sebagai authoritative;
  legacy `public.guardrails.equity` hanya dipakai bila finance blob absen. Route melewati
  `prepareDraftWriteFromEncrypted` (enkripsi/dekripsi nyata). Malformed finance → fail closed.
- Regression encrypted-blob: public equity=100 + finance=200 + Owner PUT tanpa equity →
  finance tetap 200; SD PUT equity=999 → tidak mengubah finance; backfill legacy-only → 100.
- M-16 sekarang `BEGIN; … COMMIT;`; injected `SELECT 1/0` sebelum COMMIT pada klon staging
  membuat exit 3 dan signature RPC tetap sama setelah rollback.
- Backend staging terisolasi: PostgREST port 3101 + proxy lokal 3102 + candidate Next 3100.
  HTTP Owner/SD: save/reload, allowlist SD, stale-write tidak mengubah data, cross-tenant
  GET `[]` / PATCH 403. Log sanitized: `docs/juara/rehearsal-logs/http-cas.log`.
- Runner persisten: `scripts/juara/cas_sql_staging.sh`, `scripts/juara/cas_assert.sh`,
  `scripts/juara/staging_http_rehearsal.sh`, `scripts/juara/local-supabase-proxy.js`.
- Paket visual build kandidat: `docs/juara/screenshots/http-cas-stage/` (Owner save sukses,
  reload, conflict attempt). Screenshot conflict UI tidak berhasil diambil; bukti conflict
  memakai HTTP stale-write + runner SQL paralel.

## Evidence closure (audit `OWNER_REP_FINANCE_HTTP_AUDIT`)

- Satu entry point persisten: `scripts/juara/evidence_closure_rehearsal.sh`. Role staging unik
  `pgrst_evclose`, PostgREST bind `127.0.0.1:3103`, target guard nama DB, cleanup trap; tidak
  mengubah role bersama `pgrst`. Log sanitized:
  `docs/juara/rehearsal-logs/evidence-closure-runner.log`.
- Cutover M-14 + M-16 digabung dalam **satu transaksi eksplisit** (M-16 tidak dibungkus
  `psql -1` agar tidak bentrok dengan `COMMIT` internal). Injected `SELECT 1/0` sebelum
  COMMIT pada klon staging → exit 3, kolom `vision_revision`/`vision_legacy_migrated` absen,
  overload M-15/M-14 tetap dua. Cutover nyata → dua kolom, satu RPC 4 argumen, policy `SELECT`.
- HTTP route staging: encrypted legacy public equity=100, finance absent → SD PUT ditolak
  409 `LEGACY_NOT_MIGRATED`; Owner PUT tanpa equity → 200 revision 1, equity 100; seed
  public100+finance200 → Owner PUT tanpa equity tetap equity 200.
- Konflik deterministik memakai `P0001` untuk `REVISION_CONFLICT` agar tidak menggantung:
  tab memegang revision R dengan input lokal 18/17, tab lain menyimpan lebih dulu, tab pertama
  menampilkan "Draf berubah di sesi lain" + aksi **Muat versi terbaru**. Input lokal tetap
  (bukti `Pemain bintang` 18/17), DB tidak tertimpa (revision naik, star dari pemenang).
  Screenshot: `docs/juara/screenshots/evidence-closure/` (conflict & recovery, 1440×900/390×844).
- HTTP paralel via PostgREST sempat timeout; SQL paralel tetap membuktikan 1 sukses/1 conflict.
  Ini dicatat, bukan diklaim sebagai HTTP 200/409 eksplisit.

## Koreksi audit `OWNER_REP_EVIDENCE_CLOSURE_AUDIT`

- Mobile 390 diperbaiki: layout wizard satu kolom, panel Catatan di bawah form, status
  recovery penuh lebar, tombol grid 2 kolom. Saya membuka `server-loaded-390x844.png`:
  tidak ada form 132px, alert/status terbaca, tombol Muat/Pulihkan terlihat.
- Recovery benar: `reloadLatestRevision` memuat `body.draft` dari server dan menyimpan
  salinan lokal; `chooseServerDraft` menampilkan server (star 25, scrMax 62),
  `Pulihkan edit lokal` mengembalikan star 17 secara eksplisit dengan peringatan
  menimpa server. Test dua field berbeda di `tests/juara/draft-recovery.test.ts`.
- Runner HTTP executable: `scripts/juara/http_assertions.py` menjalankan GET/PUT
  terautentikasi: legacy backfill 100, omitted-equity retained 200, parallel
  **200/409 VERSION_CONFLICT**, finance public100+finance200 retained 200,
  malformed finance status 400 + revision DB tidak berubah, cross-tenant GET 0/PATCH 401.
  Log: `docs/juara/rehearsal-logs/http-assertions.log`.
- Rollback runner sekarang mengukur baseline signature/grants/policies/data sebelum
  injected failure dan mengassert identik sesudah rollback; `CLEANUP_DONE` hanya
  dicetak bila drop DB dan role berhasil; `--keep` dicatat sebagai cleanup belum dijalankan.

## Validitas bukti akhir (audit `OWNER_REP_CLOSURE_FINAL_AUDIT`)

- Cross-tenant kini memakai **dua token authenticated** (Owner & SD). Kontrol positif klub sendiri
  `200 rows=1`, klub lain `200 rows=0`, PATCH klub lain `403` dan nama tidak berubah. Role SD
  diverifikasi `SPORTING_DIRECTOR`.
- Malformed finance: payload valid + revision disimpan **sebelum** korupsi `deadbeef`, lalu PUT
  payload valid tersebut menghasilkan route `500 Draf lama tidak dapat dibaca`, revision DB tetap.
- Legacy-only: seed public encrypted equity=100, finance NULL, migrated=false → SD `409
  LEGACY_NOT_MIGRATED`; Owner PUT **tanpa equity** → 200 equity 100; SD save → 200; Owner tetap 100.
- Concurrent: `200/409 VERSION_CONFLICT`, final revision `R+1`, winner star 31 tersimpan.
- Log memuat `candidate_sha` dan `ELAPSED`, bukan narasi. Entry point:
  `scripts/juara/final_evidence_entrypoint.sh` (guard local endpoint, staging clean, seeded fixture,
  assertions, cleanup). Batas isolasi dinyatakan: auth produksi, REST/DB staging.
- Rollback: fixture nonempty sebelum clone; snapshot deterministik md5 dari nama/league/ciphertext,
  policy lengkap `roles/cmd/qual/with_check`, dan grants tanpa `|| true`, identik setelah rollback.
- Compatible rollback build: `1a2655c`/candidate saat ini memakai RPC 4 argumen dan policy
  `SELECT-only`; build lama dengan raw UPDATE/RPC 2 argumen **tidak** dipakai sebagai rollback.
  Health/read/write application pasca-rollback diwakili HTTP assertions pada build kandidat
  terhadap schema M-16.

## Catatan

- Bukti visual tidak menggantikan rehearsal DB.
- Account/data uji sepenuhnya sintetis; tidak ada klub riil.
- Rollback tetap pada level aplikasi; policy keamanan tidak dilemahkan.
- M-14/M-16 masih belum di-apply produksi; UI belum di-deploy; P1 belum accepted.
