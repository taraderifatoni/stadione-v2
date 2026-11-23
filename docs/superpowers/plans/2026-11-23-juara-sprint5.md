# JUARA.STADIONE.PRO Sprint 5 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Lengkapi alur auth dan enkripsi runtime: callback OAuth, halaman signup invite-only, dan utility enkripsi field — tanpa apply migrasi DB.

**Architecture:** Callback route menangani code exchange Supabase Auth. Signup page hanya menerima invite token (tidak ada signup publik). Enkripsi runtime memakai modul `crypto.ts` yang sudah ada, dengan AAD dari `club_id|table|column|row_id|key_id`. RLS runtime ditunda sampai migrasi di-apply (izin Owner).

**Tech Stack:** Next.js 16.2.12 App Router, React 19, Supabase SSR, Node 24 `node:test`.

**Spec:** `docs/superpowers/specs/2026-11-22-juara-stadione-pro-design.md`, `docs/juara/ARCHITECTURE.md` §3/§4, `docs/juara/PM_RULINGS.md` R10/R11/R12.

## Global Constraints

- Satu repo, satu Supabase project/database, satu `auth.users`. Dilarang project/DB/tenant/schema baru.
- `club_id` dari `auth.uid()` ∩ `juara_club_members` ∩ JWT claim; GUC dilarang (R11).
- Gaji/signing fee/buy-out/nilai sponsor → AES-256-GCM di aplikasi → `BYTEA` (D2).
- Migrasi SQL hanya RENCANA — tidak di-apply tanpa izin Owner.
- Dilarang: deploy, DNS, SSL, push, restart container, kredensial, data klub riil, perubahan konfigurasi produksi.

## Review Focus

- Callback route tanpa `code` → redirect ke login, bukan crash (Task 1).
- Signup page tidak menyimpan password di state setelah submit (Task 2).
- Enkripsi runtime AAD harus menyertakan `club_id` (Task 3).
- Tidak boleh menyimpan kredensial di client state (Task 2).

---

### Task 1: Auth callback route

**Files:**
- Create: `src/app/auth/callback/route.ts`
- Test: `tests/juara/auth-callback.test.ts`

**Interfaces:**
- Consumes: `createClient` dari `@/lib/supabase/server`.
- Produces: `GET /auth/callback?code=...` → redirect ke `/juara` jika sukses, `/juara/login?error=...` jika gagal.

- [ ] **Step 1:** Test gagal: route dengan `code` valid mengembalikan redirect 302 ke `/juara`; route tanpa `code` redirect ke `/juara/login`.
- [ ] **Step 2:** Jalankan test, pastikan FAIL.
- [ ] **Step 3:** Implementasi: parse `code` dari searchParams; jika ada, exchangeCodeForSession; redirect sesuai hasil. Jika tidak ada code, redirect ke login.
- [ ] **Step 4:** Test PASS.
- [ ] **Step 5:** Commit `feat(juara): add auth callback route`.

### Task 2: Signup page invite-only

**Files:**
- Create: `src/app/juara/signup/page.tsx`

**Interfaces:**
- Consumes: `createClient` dari `@/lib/supabase/client`.
- Produces: halaman signup yang hanya bisa diakses dengan invite token (query param `?token=...`).

- [ ] **Step 1:** Buat halaman signup dengan form email/password/nama klub. Jika tidak ada `token` query param, tampilkan pesan "Invite token diperlukan". Tidak menyimpan password di state setelah submit.
- [ ] **Step 2:** `npm run build` exit 0 (rute `/juara/signup` terdaftar).
- [ ] **Step 3:** Commit `feat(juara): add invite-only signup page`.

### Task 3: Enkripsi runtime helper

**Files:**
- Create: `src/lib/juara/field-crypto.ts`
- Test: `tests/juara/field-crypto.test.ts`

**Interfaces:**
- Consumes: `encrypt`, `decrypt`, `pack`, `unpack` dari `src/lib/juara/crypto.ts`.
- Produces:
  - `encryptField(plaintext: string, key: Buffer, keyId: string, clubId: string, table: string, column: string, rowId: string): Buffer`
  - `decryptField(blob: Buffer, key: Buffer, clubId: string, table: string, column: string, rowId: string): string`

- [ ] **Step 1:** Test gagal: `encryptField` menghasilkan Buffer; `decryptField(encryptField(...))` === plaintext; AAD salah → throw.
- [ ] **Step 2:** Jalankan test, pastikan FAIL.
- [ ] **Step 3:** Implementasi: AAD = `clubId|table|column|rowId|keyId` (R10/R11). Pack/unpack di dalam fungsi.
- [ ] **Step 4:** Test PASS.
- [ ] **Step 5:** Commit `feat(juara): add field-level encryption runtime helper`.

### Task 4: Verifikasi Sprint 5

- [ ] **Step 1:** Jalankan semua test `node --test tests/juara/*.test.ts` — catat jumlah pass/fail.
- [ ] **Step 2:** `npm run build` exit 0.
- [ ] **Step 3:** `npm run lint` pada file juara exit 0.
- [ ] **Step 4:** Tulis `docs/juara/SPRINT5_VERIFICATION.md` dengan bukti exit code.
- [ ] **Step 5:** Commit `chore(juara): record sprint 5 verification`.
