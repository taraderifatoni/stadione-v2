# JUARA.STADIONE.PRO Sprint 6 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Lengkapi UX Sprint 6: tombol "Simpan Playbook" di wizard, session provider client-side, dan halaman daftar Playbook — tanpa apply migrasi DB.

**Architecture:** Wizard menambah tombol "Simpan" yang memanggil `POST /api/juara/v1/playbooks` (sudah ada) dan menampilkan hasil. Session provider membungkus layout `/juara` dengan Supabase Auth listener. Halaman daftar Playbook menampilkan placeholder (RENCANA DB) sampai migrasi di-apply.

**Tech Stack:** Next.js 16.2.12 App Router, React 19, Supabase SSR, Zod 4.

**Spec:** `docs/superpowers/specs/2026-11-22-juara-stadione-pro-design.md`, `docs/juara/ARCHITECTURE.md`.

## Global Constraints

- Satu repo, satu Supabase project/database, satu `auth.users`. Dilarang project/DB/tenant/schema baru.
- `club_id` dari `auth.uid()` ∩ `juara_club_members` ∩ JWT claim; GUC dilarang (R11).
- Migrasi SQL hanya RENCANA — tidak di-apply tanpa izin Owner.
- Dilarang: deploy, DNS, SSL, push, restart container, kredensial, data klub riil, perubahan konfigurasi produksi.

## Review Focus

- Wizard tidak menyimpan password di state (sudah diterapkan Sprint 4/5).
- Session provider tidak boleh crash jika tidak ada session (Task 1).
- Tombol "Simpan" harus menampilkan loading dan error state (Task 2).

---

### Task 1: Session provider client-side

**Files:**
- Create: `src/components/juara/SessionProvider.tsx`
- Modify: `src/app/juara/layout.tsx`

**Interfaces:**
- Produces: `<SessionProvider>` yang membungkus children dan menyediakan session context via Supabase Auth `onAuthStateChange`.

- [ ] **Step 1:** Buat `SessionProvider` client component yang memakai `createClient` dari `@/lib/supabase/client`, mendengarkan `onAuthStateChange`, dan menyediakan context `{ user, loading }`.
- [ ] **Step 2:** Bungkus children di `layout.tsx` dengan `<SessionProvider>`.
- [ ] **Step 3:** `npm run build` exit 0.
- [ ] **Step 4:** Commit `feat(juara): add client-side session provider`.

### Task 2: Tombol "Simpan Playbook" di wizard

**Files:**
- Modify: `src/components/juara/OwnerWizard.tsx`

**Interfaces:**
- Consumes: `POST /api/juara/v1/playbooks` (sudah ada).

- [ ] **Step 1:** Tambah state `saveLoading`, `saveError`, `saveResult`. Tambah tombol "Simpan Playbook" yang hanya muncul setelah `result` tersedia. Tombol memanggil save API, menampilkan loading text dan error jika gagal.
- [ ] **Step 2:** `npm run build` exit 0.
- [ ] **Step 3:** Commit `feat(juara): add save playbook button to owner wizard`.

### Task 3: Halaman daftar Playbook (placeholder RENCANA DB)

**Files:**
- Create: `src/app/juara/playbooks/page.tsx`

**Interfaces:**
- Produces: halaman `/juara/playbooks` dengan pesan "RENCANA — butuh apply migrasi" dan tombol kembali ke wizard.

- [ ] **Step 1:** Buat halaman dengan pesan placeholder dan tombol "Buka Owner Vision Wizard". Tidak memanggil DB.
- [ ] **Step 2:** `npm run build` exit 0 (rute `/juara/playbooks` terdaftar).
- [ ] **Step 3:** Commit `feat(juara): add playbook list page (placeholder, RENCANA DB)`.

### Task 4: Verifikasi Sprint 6

- [ ] **Step 1:** Jalankan semua test `node --test tests/juara/*.test.ts` — catat jumlah pass/fail.
- [ ] **Step 2:** `npm run build` exit 0.
- [ ] **Step 3:** `npm run lint` pada file juara exit 0.
- [ ] **Step 4:** Tulis `docs/juara/SPRINT6_VERIFICATION.md` dengan bukti exit code.
- [ ] **Step 5:** Commit `chore(juara): record sprint 6 verification`.
