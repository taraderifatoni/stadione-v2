# JUARA.STADIONE.PRO Sprint 4 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire Sprint 1–3 modules into auth-gated routes: session refresh middleware, Playbook save API (RENCANA DB), dan PDF download button di wizard.

**Architecture:** Middleware memakai Supabase SSR untuk refresh session + redirect `/juara/*` ke `/juara/login` jika tidak ada user. API route Playbook save memvalidasi dengan Zod dan mengembalikan RENCANA (tidak menyimpan ke DB tanpa izin apply). Wizard menambah tombol "Unduh PDF" yang memanggil export route.

**Tech Stack:** Next.js 16.2.12 App Router, React 19, Supabase SSR, Zod 4, jsPDF (sudah terpasang).

**Spec:** `docs/superpowers/specs/2026-11-22-juara-stadione-pro-design.md`, `docs/juara/ARCHITECTURE.md`, `docs/juara/FINANCE_SPEC.md` §8.

## Global Constraints

- Satu repo, satu Supabase project/database, satu `auth.users`. Dilarang project/DB/tenant/schema baru.
- `club_id` dari `auth.uid()` ∩ `juara_club_members` ∩ JWT claim; GUC dilarang (R11).
- Gaji/signing fee/buy-out/nilai sponsor → AES-256-GCM di aplikasi → `BYTEA` (D2).
- Migrasi SQL hanya RENCANA — tidak di-apply tanpa izin Owner.
- Dilarang: deploy, DNS, SSL, push, restart container, kredensial, data klub riil, perubahan konfigurasi produksi.

## Review Focus

- Middleware tidak boleh memblokir rute publik (`/`, `/login`, `/register`) — hanya `/juara/*` (Task 1).
- Playbook save route tanpa session → 401 (Task 2).
- PDF download button harus menampilkan loading state dan error (Task 3).
- Tidak boleh menyimpan kredensial di client state (Task 2).

---

### Task 1: Auth middleware untuk /juara

**Files:**
- Modify: `src/middleware.ts`
- Test: `tests/juara/middleware.test.ts`

**Interfaces:**
- Consumes: `createClient` dari `@/lib/supabase/server` (pola existing).
- Produces: `isJuaraProtected(pathname: string): boolean` — true jika path dimulai dengan `/juara` dan bukan `/juara/login`.

- [ ] **Step 1:** Test gagal: `isJuaraProtected("/juara") === true`, `isJuaraProtected("/juara/login") === false`, `isJuaraProtected("/juara/vision") === true`, `isJuaraProtected("/") === false`.
- [ ] **Step 2:** Jalankan test, pastikan FAIL.
- [ ] **Step 3:** Implementasikan `isJuaraProtected` di `src/lib/juara/routing.ts` (tambah fungsi) dan pasang di middleware: jika `isJuaraProtected` dan tidak ada session (cookie `sb-access-token` atau supabase session), redirect ke `/juara/login`. Jangan ubah logika admin/pos yang ada.
- [ ] **Step 4:** Test PASS + `npm run build` exit 0.
- [ ] **Step 5:** Commit `feat(juara): add auth guard for /juara routes`.

### Task 2: Playbook save API route

**Files:**
- Create: `src/app/api/juara/v1/playbooks/route.ts`
- Test: `tests/juara/playbook-save.test.ts`

**Interfaces:**
- Consumes: `playbookGenerateSchema` dari `src/lib/juara/validation.ts`.
- Produces: `POST /api/juara/v1/playbooks` → `{ ok: true, note: "RENCANA — butuh apply migrasi" }` jika payload valid; 400 jika tidak.

- [ ] **Step 1:** Test gagal: payload valid → 200 `{ ok: true }`; payload dengan philosophy sum 99 → 400.
- [ ] **Step 2:** Jalankan test, pastikan FAIL.
- [ ] **Step 3:** Implementasi Zod validation + return RENCANA (tidak menyimpan ke DB). Tidak memanggil Supabase.
- [ ] **Step 4:** Test PASS.
- [ ] **Step 5:** Commit `feat(juara): add playbook save API route (validation only, DB RENCANA)`.

### Task 3: PDF download button di wizard

**Files:**
- Modify: `src/components/juara/OwnerWizard.tsx`

**Interfaces:**
- Consumes: `POST /api/juara/v1/playbooks/export` (sudah ada).
- Produces: tombol "Unduh PDF" yang memanggil export route, menampilkan loading state dan error.

- [ ] **Step 1:** Tambah state `pdfLoading` dan `pdfError`. Tambah tombol "Unduh PDF" yang hanya muncul setelah `result` tersedia. Tombol memanggil fetch export, lalu download blob sebagai file. Tampilkan loading text saat fetch, error jika gagal.
- [ ] **Step 2:** `npm run build` exit 0.
- [ ] **Step 3:** Commit `feat(juara): add PDF download button to owner wizard`.

### Task 4: Verifikasi Sprint 4

- [ ] **Step 1:** Jalankan semua test `node --test tests/juara/*.test.ts` — catat jumlah pass/fail.
- [ ] **Step 2:** `npm run build` exit 0.
- [ ] **Step 3:** `npm run lint` pada file juara exit 0.
- [ ] **Step 4:** Tulis `docs/juara/SPRINT4_VERIFICATION.md` dengan bukti exit code.
- [ ] **Step 5:** Commit `chore(juara): record sprint 4 verification`.
