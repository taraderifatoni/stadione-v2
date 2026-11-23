# JUARA.STADIONE.PRO Sprint 3 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire Sprint 1/2 modules into usable HTTP surface: PDF export route, login page, invite API, dan playbook save route — tanpa apply migrasi DB.

**Architecture:** API routes di `src/app/api/juara/v1/*` memvalidasi dengan Zod dan memanggil modul murni. Login page memakai Supabase SSR client. Migrasi tetap RENCANA (tidak di-apply). Enkripsi runtime tidak diaktifkan sampai RLS runtime terverifikasi (Sprint 4).

**Tech Stack:** Next.js 16.2.12 App Router, React 19, Supabase SSR, Zod 4, jsPDF 4.2.

**Spec:** `docs/superpowers/specs/2026-11-22-juara-stadione-pro-design.md`, `docs/juara/ARCHITECTURE.md`, `docs/juara/FINANCE_SPEC.md` §8.

## Global Constraints

- Satu repo, satu Supabase project/database, satu `auth.users`. Dilarang project/DB/tenant/schema baru.
- `club_id` dari `auth.uid()` ∩ `juara_club_members` ∩ JWT claim; GUC dilarang (R11).
- Gaji/signing fee/buy-out/nilai sponsor → AES-256-GCM di aplikasi → `BYTEA` (D2).
- Migrasi SQL hanya RENCANA — tidak di-apply tanpa izin Owner.
- Dilarang: deploy, DNS, SSL, push, restart container, kredensial, data klub riil, perubahan konfigurasi produksi.

## Review Focus

- Route tanpa session → 401 (Task 1, 3, 4).
- Payload tidak valid → 400 dengan issues Zod (Task 3, 4).
- PDF watermark harus dinamis (nama, peran, WIB) — diuji Task 1.
- Login page tidak boleh menyimpan kredensial di client state (Task 2).

---

### Task 1: PDF export route

**Files:**
- Create: `src/app/api/juara/v1/playbooks/export/route.ts`
- Test: `tests/juara/pdf-route.test.ts`

**Interfaces:**
- Consumes: `buildBoardroomPdf` dari `src/lib/juara/pdf.ts`, `generatePlaybookSummary` dari `src/lib/juara/playbook.ts`.
- Produces: `POST /api/juara/v1/playbooks/export` → `application/pdf` response.

- [ ] **Step 1:** Test gagal: POST dengan payload valid mengembalikan status 200 dan content-type `application/pdf`; body dimulai dengan `%PDF-`.
- [ ] **Step 2:** Jalankan test, pastikan FAIL.
- [ ] **Step 3:** Implementasi: parse JSON, validasi dengan `playbookGenerateSchema`, generate summary, build PDF, return `new Response(bytes, { headers: { "Content-Type": "application/pdf" } })`.
- [ ] **Step 4:** Test PASS.
- [ ] **Step 5:** Commit `feat(juara): add PDF export API route`.

### Task 2: Login page juara

**Files:**
- Create: `src/app/juara/login/page.tsx`

**Interfaces:**
- Consumes: `createClient` dari `@/lib/supabase/server`.
- Produces: halaman login dengan form email/password, submit ke Supabase Auth.

- [ ] **Step 1:** Buat halaman login dengan form email/password (client component), submit via `supabase.auth.signInWithPassword`, redirect ke `/juara` setelah sukses. Tampilkan error jika gagal. Tidak menyimpan kredensial di state setelah submit.
- [ ] **Step 2:** `npm run build` exit 0 (rute `/juara/login` terdaftar).
- [ ] **Step 3:** Commit `feat(juara): add login page for juara suite`.

### Task 3: Invite API route

**Files:**
- Create: `src/app/api/juara/v1/members/invite/route.ts`
- Test: `tests/juara/invite.test.ts`

**Interfaces:**
- Produces: `POST /api/juara/v1/members/invite` → `{ ok: true }` jika payload valid; 400 jika tidak.

- [ ] **Step 1:** Test gagal: payload `{ email, role: "OWNER", clubId }` valid → ok; payload dengan role invalid → 400.
- [ ] **Step 2:** Test FAIL.
- [ ] **Step 3:** Implementasi Zod schema + validasi; tidak menyimpan ke DB (RENCANA). Return `{ ok: true, note: "RENCANA — butuh apply migrasi" }`.
- [ ] **Step 4:** Test PASS.
- [ ] **Step 5:** Commit `feat(juara): add invite API route (validation only, DB RENCANA)`.

### Task 4: Verifikasi Sprint 3

- [ ] **Step 1:** Jalankan semua test `node --test tests/juara/*.test.ts` — catat jumlah pass/fail.
- [ ] **Step 2:** `npm run build` exit 0.
- [ ] **Step 3:** `npm run lint` pada file juara exit 0.
- [ ] **Step 4:** Tulis `docs/juara/SPRINT3_VERIFICATION.md` dengan bukti exit code.
- [ ] **Step 5:** Commit `chore(juara): record sprint 3 verification`.
