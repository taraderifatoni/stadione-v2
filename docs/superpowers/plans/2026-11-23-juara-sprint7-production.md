# JUARA Sprint 7 + Produksi Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Mengaktifkan JUARA di produksi: migrasi `juara_*` ter-apply, kunci enkripsi terpasang, kode terbaru ter-deploy, RLS + enkripsi + auth terbukti berjalan, dan keputusan tertunda (R7/R8, termin sponsor, model worker) diputuskan.

**Architecture:** Migrasi aditif (8 tabel, 8 policy, 1 helper `SECURITY DEFINER` + `SET search_path`) di-apply berurutan lewat jalur kredensial yang tersedia (Management API bila token valid; jika tidak, `psql`/pooler dengan kredensial DB). Kunci AES-256-GCM 32 byte di-generate di mesin, disimpan hanya di `.env.production` VPS dan `.env.local` lokal, tidak pernah dicetak. Deploy memakai alur yang sudah terbukti: push ke `origin/main` → fetch/merge di `/opt/stadione` → `npm run build` → restart `stadione.service` → verifikasi HTTP.

**Tech Stack:** PostgreSQL 15 (Supabase), Next.js 16.2.12 App Router, Supabase SSR, Node 24.16.0, Traefik, systemd.

**Spec:** `docs/juara/ARCHITECTURE.md`, `docs/juara/SECURITY_QA_PLAN.md`, `docs/juara/DECISIONS.md` (D1–D5), `docs/juara/PM_RULINGS.md` (R1–R17).

## Global Constraints

- Satu repo, satu Supabase project (`bkjsqfcjylgmxlauatwt`), satu `auth.users`. Dilarang project/DB/tenant/schema baru.
- Semua objek baru ber-prefix `juara_` di `schema public`. Dilarang menyentuh tabel B2C.
- Migrasi hanya aditif: tidak ada `DROP`, `TRUNCATE`, `DELETE`, atau `ALTER` pada objek non-`juara_`.
- `club_id` hanya dari `auth.uid()` ∩ `juara_club_members` ∩ JWT claim; GUC `app.current_club_id` dilarang (R11).
- Kunci enkripsi tidak boleh masuk git, log, transkrip, atau output perintah. Panjang 32 byte, base64.
- Setiap langkah produksi harus punya perintah verifikasi dan bukti yang bisa dibaca ulang.
- Rollback tersedia: `/opt/stadione-releases/807f6ff`; migrasi aditif tidak butuh rollback destruktif.

## Review Focus

- `anon` key tidak boleh bisa membaca satu baris `juara_*` pun (RLS bocor = insiden).
- Service role harus tetap bisa menulis (kalau RLS memblokir semuanya, aplikasi mati).
- Migrasi dijalankan dua kali (idempoten atau gagal bersih) — jangan sampai setengah ter-apply tanpa catatan.
- Deploy tidak boleh menjatuhkan `stadione.pro` (B2C) — cek HTTP B2C setelah restart.
- Kunci enkripsi yang hilang = data vault tidak bisa dibuka; kunci harus tersimpan sebelum data pertama ditulis.

---

### Task 1: Preflight produksi

**Files:**
- Read: `database/juara/migrations/*.sql`, `.env.local`, `/opt/stadione/.env.production`

**Interfaces:**
- Produces: keputusan jalur apply migrasi (Management API vs psql/pooler), daftar env key yang wajib ditambah di VPS.

- [ ] **Step 1:** `git status --short` kosong dan `git log -1 --oneline` dicatat.
- [ ] **Step 2:** Audit destruktif: `grep -nEi '\b(drop|truncate|delete from)\b' database/juara/migrations/*.sql` → hanya komentar.
- [ ] **Step 3:** Uji kredensial DB (Management API token, `psql`, pooler). Catat jalur yang berhasil.
- [ ] **Step 4:** `node --test tests/juara/*.test.ts` → 32/32 PASS sebagai baseline.

### Task 2: Apply migrasi M-00 … M-06

**Files:**
- Read: `database/juara/migrations/20261123000{0..6}_*.sql`
- Create: `docs/juara/MIGRATION_APPLIED.md`

**Interfaces:**
- Produces: 8 tabel `juara_*`, 8 policy RLS, fungsi `juara_current_club_id()`, ENUM `juara_*` aktif di project.

- [ ] **Step 1:** Jalankan tiap file berurutan; hentikan pada error pertama.
- [ ] **Step 2:** Verifikasi: `SELECT count(*) FROM information_schema.tables WHERE table_name LIKE 'juara_%'` → 8.
- [ ] **Step 3:** Verifikasi RLS: `SELECT relname, relrowsecurity FROM pg_class WHERE relname LIKE 'juara_%'` → semua `true`.
- [ ] **Step 4:** Verifikasi policy per tabel: 8 policy total, semuanya memakai `juara_current_club_id()`.
- [ ] **Step 5:** Catat hasil + timestamp di `docs/juara/MIGRATION_APPLIED.md`; commit.

### Task 2A: Hardening lanjutan + penyimpanan Playbook nyata

**Files:**
- Create: `database/juara/migrations/20261123000007_juara_hardening_view.sql`, `database/juara/migrations/20261123000008_juara_bootstrap_club.sql`, `src/lib/juara/keyring.ts`, `src/lib/juara/playbook-save.ts`
- Modify: `src/app/api/juara/v1/playbooks/route.ts`
- Test: `tests/juara/keyring.test.ts`, `tests/juara/playbook-save.test.ts`

**Interfaces:**
- Produces: `juara_bootstrap_club(TEXT, juara_league_tier) -> UUID`, `getActiveKey()`, `buildPlaybookInsertRow(input, clubId, rowId, keyring)`; save route menulis ke `juara_playbooks` memakai JWT user (bukan service_role).

- [ ] **Step 1:** Apply M-07 (cabut grant view dari service_role/anon) dan M-08 (helper bootstrap club berbasis `auth.uid()`).
- [ ] **Step 2:** Implement `keyring.ts` + test; `playbook-save.ts` + test (AAD terikat rowId & clubId).
- [ ] **Step 3:** Ganti stub route dengan insert memakai `createClient()` dari `@/lib/supabase/server`; 401 tanpa sesi, 403 tanpa klub, 503 tanpa kunci, 201 saat berhasil.
- [ ] **Step 4:** Test 39/39 PASS dan `npm run build` exit 0; commit.

### Task 3: Kunci enkripsi AES-256-GCM

**Files:**
- Modify: `/opt/stadione/.env.production` (VPS), `.env.local` (lokal)
- Create: `docs/juara/ENCRYPTION_KEY_RUNBOOK.md`

**Interfaces:**
- Consumes: `src/lib/juara/keyring.ts` — membaca `JUARA_ENCRYPTION_KEYS` (JSON map `key_id -> base64 32 byte`) dan `JUARA_ACTIVE_KEY_ID` sesuai ARCHITECTURE §6.3.
- Produces: keyring `{"v1":"<base64 32 byte>"}` + `JUARA_ACTIVE_KEY_ID=v1`, prosedur rotasi tertulis.

- [ ] **Step 1:** Generate kunci dengan `openssl rand -base64 32`, tulis langsung ke env sebagai `JUARA_ENCRYPTION_KEYS={"v1":"..."}` tanpa mencetak nilai kunci.
- [ ] **Step 2:** Verifikasi round-trip enkripsi/dekripsi memakai kunci tersebut (test lokal, output boolean saja).
- [ ] **Step 3:** Tulis runbook rotasi (v1 → v2: tulis ganda, baca dua versi, re-enkripsi, pensiun v1).
- [ ] **Step 4:** Pastikan `.env*` di `.gitignore`; `git check-ignore -v .env.local` → matched.

### Task 4: Deploy kode terbaru

**Files:**
- Modify (VPS): `/opt/stadione` (git working tree), `/opt/stadione-current` (symlink)

**Interfaces:**
- Produces: `juara.stadione.pro` menyajikan commit terbaru; `stadione.pro` tetap 200.

- [ ] **Step 1:** `git push origin main`.
- [ ] **Step 2:** Di VPS: `git fetch && git merge --ff-only origin/main`.
- [ ] **Step 3:** `npm run build` → exit 0.
- [ ] **Step 4:** `systemctl restart stadione.service`; `systemctl is-active` → `active`.
- [ ] **Step 5:** Verifikasi: `curl -s -o /dev/null -w "%{http_code}" https://juara.stadione.pro/juara` → 200; `https://stadione.pro` → 200/301.

### Task 5: Verifikasi RLS + API runtime

**Files:**
- Create: `docs/juara/RLS_RUNTIME_EVIDENCE.md`

**Interfaces:**
- Consumes: `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`.

- [ ] **Step 1:** REST sebagai `anon`: `GET /rest/v1/juara_playbooks?select=id` → `[]` (0 baris), bukan error.
- [ ] **Step 2:** REST sebagai `service_role`: `GET /rest/v1/juara_playbooks?select=id` → `[]` tanpa error (tabel ada, kosong).
- [ ] **Step 3:** `POST /api/juara/v1/playbooks` tanpa sesi → 401/403 (bukan 500).
- [ ] **Step 4:** `POST /api/juara/v1/playbooks/generate` tanpa sesi → tetap 200 (formula murni) atau 401 sesuai kontrak; catat yang sebenarnya.
- [ ] **Step 5:** Catat bukti + commit.

### Task 6: Keputusan tertunda (R7/R8, termin sponsor, model worker)

**Files:**
- Modify: `docs/juara/PM_RULINGS.md`, `docs/juara/TEAM.md`

**Interfaces:**
- Produces: R18–R20 tertulis dengan angka/parameter pasti; keputusan model worker final.

- [ ] **Step 1:** Tetapkan R18 (R7 = angka biaya operasional tahunan yang dipakai wizard), R19 (R8 = jadwal termin sponsor: 50/30/20 pada bulan 1/7/10), R20 (model worker = native).
- [ ] **Step 2:** Tulis di `PM_RULINGS.md` dengan alasan satu baris tiap butir.
- [ ] **Step 3:** Perbarui `TEAM.md`: worker tidak dipakai sampai ada model berbayar; PM native.
- [ ] **Step 4:** Commit.

### Task 7: Verifikasi Sprint 7 + laporan

**Files:**
- Create: `docs/juara/SPRINT7_VERIFICATION.md`
- Modify: `docs/PM_LOG.md`, `docs/CTO_HANDOFF.md` (status)

- [ ] **Step 1:** Semua test + build + lint juara: catat exit code.
- [ ] **Step 2:** Tulis verifikasi dengan bukti per perintah.
- [ ] **Step 3:** Update PM_LOG (status, bukti, dampak).
- [ ] **Step 4:** Commit dan kirim laporan ke CTO via `opencode run --session ses_dff75dd2effeCFUgcR7oA66Mu8`.

## Yang Tidak Bisa Diselesaikan Tanpa Input Eksternal

- SSO (butuh client ID/secret IdP).
- Pen-test live (butuh vendor/anggaran).
- Kredensial notifikasi (WAHA/HMAC/Resend/OneSignal produksi).
- Data klub riil UAT (butuh data dari Owner — dilarang mengarang).
