# JUARA.STADIONE.PRO Sprint 2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bangun fondasi keamanan dan auth Slice 2: enkripsi AES-256-GCM di aplikasi, helper Supabase Auth untuk juara, migrasi file RENCANA, dan PDF exporter dengan watermark dinamis.

**Architecture:** Modul murni (crypto, rbac, validation) dipakai oleh API route dan UI. Migrasi SQL ditulis sebagai file RENCANA di `database/juara/migrations/` — **tidak** di-apply. Auth memakai Supabase Auth existing dengan tabel `juara_club_members`. Enkripsi memakai Node `crypto` (AES-256-GCM, 12-byte IV, 16-byte tag, AAD). PDF memakai jsPDF + autotable yang sudah terpasang.

**Tech Stack:** Next.js 16.2.12 App Router, React 19, Supabase SSR, Zod 4, Node 24 `node:test` + `node:crypto`, jsPDF 4.2 + jspdf-autotable 5.0.

**Spec:** `docs/superpowers/specs/2026-11-22-juara-stadione-pro-design.md` §7 (K2/K3/K4), `docs/juara/ARCHITECTURE.md`, `docs/juara/RULEBOOK.md`, `docs/juara/PM_RULINGS.md` R1–R17, `docs/juara/FINANCE_SPEC.md` §8, `docs/juara/DECISIONS.md` D1–D5.

## Global Constraints

- Satu repo, satu Supabase project/database, satu `auth.users`; tabel `juara_*` di `schema public`. Dilarang project/DB/tenant/schema baru.
- `club_id` dari `auth.uid()` ∩ `juara_club_members` ∩ JWT claim; GUC `app.current_club_id` dilarang (R11).
- Gaji/signing fee/buy-out/nilai sponsor → AES-256-GCM di aplikasi → `BYTEA`; kunci 32 byte di environment; tidak dicetak ke log (D2).
- Migrasi SQL hanya RENCANA — tidak di-apply tanpa izin Owner.
- Dilarang: deploy, DNS, SSL, push, restart container, kredensial, data klub riil, perubahan kode produksi di luar izin Owner.
- Sebelum mengubah kode, baca panduan Next.js versi ini di `node_modules/next/dist/docs/`.

## Review Focus

- Kunci AES-256-GCM kurang dari 32 byte → harus ditolak sejak awal (Task 1).
- AAD yang salah saat dekripsi → harus gagal dengan error, bukan mengembalikan plaintext (Task 1).
- Route handler menerima payload tanpa auth session → harus 401 (Task 2).
- PDF watermark harus dinamis per halaman (nama, peran, WIB), bukan statis (Task 5).
- Migrasi file tidak boleh di-apply oleh worker; verifikasi struktur saja (Task 3, 4).

---

### Task 1: AES-256-GCM encryption module (TDD)

**Files:**
- Create: `src/lib/juara/crypto.ts`
- Test: `tests/juara/crypto.test.ts`

**Interfaces:**
- Produces:
  - `encrypt(plaintext: string, key: Buffer, keyId: string, aad?: Buffer): EncryptedBlob`
  - `decrypt(blob: EncryptedBlob, key: Buffer, aad?: Buffer): string`
  - `pack(blob: EncryptedBlob): Buffer`
  - `unpack(buf: Buffer): EncryptedBlob`
  - `type EncryptedBlob = { version: number; keyId: string; nonce: Buffer; ciphertext: Buffer }`

- [ ] **Step 1:** Test gagal: `encrypt("gaji", key32, "k1")` menghasilkan blob dengan nonce 12 byte dan ciphertext.length === plaintext.length + 16; `decrypt(blob, key32)` === "gaji"; `decrypt(blob, key32, Buffer.from("wrong-aad"))` melempar error; `unpack(pack(blob))` deepEqual blob; `encrypt` dengan key 16 byte melempar error.
- [ ] **Step 2:** Jalankan test, pastikan FAIL.
- [ ] **Step 3:** Implementasi dengan `node:crypto` (`createCipheriv("aes-256-gcm", key, nonce)`), AAD via `cipher.setAAD`, tag 16 byte via `cipher.getAuthTag`, nonce 12 byte dari `randomBytes(12)`, validasi key length 32.
- [ ] **Step 4:** Test PASS.
- [ ] **Step 5:** Commit `feat(juara): add AES-256-GCM field encryption module`.

### Task 2: Supabase Auth helpers for juara

**Files:**
- Create: `src/lib/juara/auth.ts`
- Test: `tests/juara/auth.test.ts`

**Interfaces:**
- Consumes: `canViewSalary`, `canViewPnl` dari `src/lib/juara/rbac.ts`.
- Produces:
  - `type JuaraSession = { userId: string; clubId: string; role: JuaraRole }`
  - `parseClubIdFromJwt(claims: Record<string, unknown>): string | null`
  - `buildSession(userId: string, claims: Record<string, unknown>, membership: { clubId: string; role: JuaraRole } | null): JuaraSession | null`

- [ ] **Step 1:** Test gagal: `parseClubIdFromJwt({ club_id: "abc" }) === "abc"`; `parseClubIdFromJwt({}) === null`; `buildSession` dengan membership null → null; dengan membership valid → session dengan role.
- [ ] **Step 2:** Test FAIL.
- [ ] **Step 3:** Implementasi: `club_id` diambil dari `request.jwt.claims` (R11), bukan GUC; fallback ke membership table. `buildSession` return null jika membership null.
- [ ] **Step 4:** Test PASS.
- [ ] **Step 5:** Commit `feat(juara): add Supabase Auth helpers for juara (R11)`.

### Task 3: Migrasi SQL RENCANA (file saja, tidak di-apply)

**Files:**
- Create: `database/juara/migrations/M-00_types.sql` … `M-06_hardening.sql` (sesuai ARCHITECTURE.md §10.3)

**Interfaces:**
- Produces: 7 file SQL yang konsisten dengan `ARCHITECTURE.md` §2–§4 dan R1–R17.

- [ ] **Step 1:** Tulis 7 file migrasi sesuai urutan M-00…M-06 dari ARCHITECTURE.md §10.3: types → tenant/identitas → playbook/slot → player/vault → proyeksi/audit → seed 3 template → hardening. Sertakan `REVOKE ALL ... FROM service_role` untuk `juara_*` dan komentar "RENCANA — jangan di-apply tanpa izin Owner".
- [ ] **Step 2:** Verifikasi struktur: `grep -l "juara_" database/juara/migrations/*.sql` semua file; tidak ada `DROP TABLE` atau `TRUNCATE`; tidak ada nilai kunci/credential.
- [ ] **Step 3:** Commit `docs(juara): add migration files as RENCANA (not applied)`.

### Task 4: PDF exporter dengan watermark dinamis (R13)

**Files:**
- Create: `src/lib/juara/pdf.ts`
- Test: `tests/juara/pdf.test.ts`

**Interfaces:**
- Consumes: `generatePlaybookSummary` dari `src/lib/juara/playbook.ts`.
- Produces:
  - `buildBoardroomPdf(summary: ReturnType<typeof generatePlaybookSummary>, meta: { downloader: string; role: string; timestamp: string }): Promise<Uint8Array>`

- [ ] **Step 1:** Test gagal: `buildBoardroomPdf` mengembalikan `Uint8Array` dengan panjang > 0 dan header PDF (`%PDF-`); metadata watermark string mengandung `RAHASIA` dan `nama_pengunduh` (mock).
- [ ] **Step 2:** Jalankan test, pastikan FAIL.
- [ ] **Step 3:** Implementasi dengan jsPDF + autotable: cover, ringkasan, age matrix, grade quota, SCR, watermark dinamis per halaman (nama, peran, WIB) diagonal 45deg @8%.
- [ ] **Step 4:** Test PASS.
- [ ] **Step 5:** Commit `feat(juara): add boardroom PDF exporter with dynamic watermark`.

### Task 5: Verifikasi Sprint 2

- [ ] **Step 1:** Jalankan semua test `node --test tests/juara/*.test.ts` — catat jumlah pass/fail.
- [ ] **Step 2:** `npm run build` exit 0.
- [ ] **Step 3:** `npm run lint` pada file juara exit 0 (lint repo lama tetap pre-existing).
- [ ] **Step 4:** Tulis `docs/juara/SPRINT2_VERIFICATION.md` dengan bukti exit code.
- [ ] **Step 5:** Commit `chore(juara): record sprint 2 verification`.
