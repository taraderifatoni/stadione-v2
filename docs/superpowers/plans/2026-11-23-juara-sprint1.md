# JUARA.STADIONE.PRO Sprint 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bangun fondasi Slice 1 yang bisa dijalankan: engine rumus yang benar, RBAC 6 peran, host routing `juara.*`, dan 5-Step Owner Vision Wizard yang menghasilkan Playbook dari angka nyata.

**Architecture:** Satu repo Next.js yang sama, path fisik `src/app/juara/*` (bukan route group agar tidak tabrakan dengan `/`), middleware melakukan rewrite host `juara.stadione.pro` → `/juara`. Rumus adalah modul murni tanpa framework yang dipakai bersama API route dan UI; data sensitif tetap dienkripsi di aplikasi, tetapi Sprint 1 belum menyimpan gaji sungguhan (memakai 3 template PRD, D3).

**Tech Stack:** Next.js 16.2.12 App Router, React 19.2.4, Supabase SSR + RLS, Zod 4, shadcn/Tailwind 4, Node 24 `node:test` + type-stripping (tanpa dependency tes baru).

**Spec:** `docs/superpowers/specs/2026-11-22-juara-stadione-pro-design.md`, `docs/juara/RULEBOOK.md`, `docs/juara/PM_RULINGS.md` R1–R17, `docs/juara/ARCHITECTURE.md`, `docs/juara/UIUX_SPEC.md`, `docs/juara/DECISIONS.md` D1–D5.

## Global Constraints

- Satu repo, satu Supabase project/database, satu `auth.users`; tabel berprefix `juara_` di `schema public`. Dilarang project/DB/tenant/schema baru.
- `club_id` dari `auth.uid()` ∩ `juara_club_members` ∩ JWT claim; GUC `app.current_club_id` dilarang (R11).
- Gaji/signing fee/buy-out/nilai sponsor → AES-256-GCM di aplikasi → `BYTEA`; kunci di environment, bukan di kode, tidak dicetak ke log (D2).
- Angka wajib: amort 45.833.333,33/bln dari nilai eksak & 550.000.000/thn (R14); SCR zona 58/65 & contoh 59,8% = YELLOW; age 25/25/40/10 & 35/30/28/7; Grade 6–8/11–13/6–8; ARI 30/25/25/20 & 85 = ELITE_HOMEGROWN_ASSET; ambang loan < 550 menit/pemain (R9).
- Dilarang: apply migrasi DB, deploy, DNS, SSL, push, restart container, kredensial, data klub riil, perubahan konfigurasi produksi. Semua file migrasi hanya RENCANA.
- Sebelum mengubah kode, baca panduan Next.js versi ini di `node_modules/next/dist/docs/` (AGENTS.md repo).

## Review Focus

- Input `scr_max_threshold_pct < 58` → harus ditolak/di-clamp ke 58 dengan peringatan (R15); diuji Task 2.
- Amortisasi tahunan dihitung dari nilai eksak, bukan dari tampilan bulanan yang dibulatkan (R14); diuji Task 1.
- Peran tanpa hak gaji (HEAD_COACH, SECRETARY) tidak boleh menerima nominal dari API; diuji Task 2.
- Host `juara.stadione.pro` harus rewrite ke `/juara`, bukan ke `/admin` atau `/pos`; diuji Task 3.
- Wizard slider rasio harus selalu berjumlah 100% dan kunci lanjut disabled sampai valid; diuji Task 4.

---

### Task 1: Engine rumus murni (TDD)

**Files:**
- Create: `src/lib/juara/formulas.ts`
- Test: `tests/juara/formulas.test.ts`

**Interfaces:**
- Produces:
  - `computeAmortization(capitalized: number, months: number): { monthlyExact: number; monthlyDisplay: number; annual: number; netBookValueAfter(monthsElapsed: number): number }`
  - `classifyScr(percent: number, maxThreshold = 65): "GREEN" | "YELLOW_WATCHLIST" | "RED_BREACH"`
  - `buildAgeMatrix(totalSlots: number, horizonYears: 1 | 3): Array<{ bracket: string; percent: number; slots: number }>`
  - `computeGradeQuota(target: "CHAMPION_1Y" | "SUSTAINABLE_3Y"): { A: [number, number]; B: [number, number]; C: [number, number] }`
  - `computeAri(components: { tactical: number; physical: number; technical: number; psychological: number }): { score: number; band: "DEVELOP" | "WATCHLIST" | "ROTATION_READY" | "ELITE_HOMEGROWN_ASSET" }`

- [ ] **Step 1: Tulis test yang gagal** di `tests/juara/formulas.test.ts` dengan `node:test` + `assert`:
  - `computeAmortization(1_650_000_000, 36).annual === 550_000_000` dan `monthlyDisplay === 45_833_333.33` (R14).
  - `netBookValueAfter(12) === 1_100_000_000`.
  - `classifyScr(59.8) === "YELLOW_WATCHLIST"`, `classifyScr(58) === "GREEN"`, `classifyScr(65.01) === "RED_BREACH"`.
  - `buildAgeMatrix(27, 1)` menghasilkan persentase `[25,25,40,10]` dan jumlah slot 27; `buildAgeMatrix(27, 3)` → `[35,30,28,7]`.
  - `computeGradeQuota("CHAMPION_1Y")` → A `[6,8]`, B `[11,13]`, C `[6,8]`.
  - `computeAri({tactical:90,physical:88,technical:80,psychological:80})` → `score === 85` dan band `ELITE_HOMEGROWN_ASSET`.
- [ ] **Step 2: Jalankan test, pastikan FAIL** (modul belum ada): `/home/taradfs/.nvm/versions/node/v24.16.0/bin/node --test tests/juara/formulas.test.ts`.
- [ ] **Step 3: Implementasikan kelima fungsi** di `src/lib/juara/formulas.ts`. Gunakan pembulatan dua desimal hanya untuk tampilan; hitung `annual` dari `capitalized * 12 / months` (R14).
- [ ] **Step 4: Jalankan test, pastikan PASS** dengan perintah yang sama.
- [ ] **Step 5: Commit** `feat(juara): add pure formula engine with tests`.

### Task 2: RBAC 6 peran + validasi input

**Files:**
- Create: `src/lib/juara/rbac.ts`, `src/lib/juara/validation.ts`
- Test: `tests/juara/rbac.test.ts`, `tests/juara/validation.test.ts`

**Interfaces:**
- Consumes: Task 1 tidak dipakai di sini.
- Produces:
  - `type JuaraRole = "OWNER" | "CEO" | "SPORTING_DIRECTOR" | "HEAD_COACH" | "FINANCE_CONTROLLER" | "CLUB_SECRETARY"`
  - `canViewSalary(role: JuaraRole): boolean`
  - `canViewPnl(role: JuaraRole): boolean`
  - `canApprovePlaybook(role: JuaraRole): boolean`
  - `validateScrThreshold(value: number): { ok: boolean; normalized: number; warning?: string }`

- [ ] **Step 1:** Test gagal: `canViewSalary("HEAD_COACH") === false`, `canViewSalary("CLUB_SECRETARY") === false`, `canViewPnl("SPORTING_DIRECTOR") === false`, `canViewSalary("OWNER") === true`; `validateScrThreshold(57).normalized === 58` dengan warning, `validateScrThreshold(62).normalized === 62`.
- [ ] **Step 2:** Jalankan test, pastikan FAIL.
- [ ] **Step 3:** Implementasikan sesuai PRD §1.3 + R15: OWNER/CEO/FINANCE penuh gaji; SPORTING_DIRECTOR hanya pagu; HEAD_COACH tidak gaji/P&L; SECRETARY hanya tanggal/status kontrak.
- [ ] **Step 4:** Test PASS.
- [ ] **Step 5:** Commit `feat(juara): add RBAC and guardrail validation`.

### Task 3: Host routing + shell `/juara`

**Files:**
- Modify: `src/middleware.ts` (tambah cabang `juara.` SEBELUM `isPublic`, jangan ubah perilaku admin/pos)
- Create: `src/app/juara/layout.tsx`, `src/app/juara/page.tsx`
- Test: `tests/juara/routing.test.ts`

**Interfaces:**
- Consumes: Task 2 (`canViewSalary`) untuk menyembunyikan widget gaji di shell.
- Produces: `resolveJuaraPath(host: string, pathname: string): string | null` — mengembalikan path rewrite atau `null`.

- [ ] **Step 1:** Test gagal: host `juara.stadione.pro`, path `/` → `/juara/`; host `stadione.pro`, path `/juara` → `/juara` (tetap); host `admin.stadione.pro` → `null` (jangan disentuh middleware juara).
- [ ] **Step 2:** Test FAIL.
- [ ] **Step 3:** Implementasikan `resolveJuaraPath`, pasang di `src/middleware.ts` sebelum logika admin/pos; buat layout 5 zona (rail, top ribbon, sub-tab, split-pane, bottom bar) dengan token dari `UIUX_SPEC.md` §4.1; halaman `/juara` = Boardroom Inbox placeholder.
- [ ] **Step 4:** Test PASS + `npm run build` (exit 0).
- [ ] **Step 5:** Commit `feat(juara): add host routing and executive shell`.

### Task 4: 5-Step Owner Wizard + generate API

**Files:**
- Create: `src/app/juara/vision/page.tsx`, `src/components/juara/OwnerWizard.tsx`, `src/app/api/juara/v1/playbooks/generate/route.ts`
- Test: `tests/juara/wizard.test.ts`

**Interfaces:**
- Consumes: Task 1 (`buildAgeMatrix`, `computeGradeQuota`, `classifyScr`), Task 2 (`validateScrThreshold`).
- Produces: `POST /api/juara/v1/playbooks/generate` menerima payload `{ leagueTier, horizonYears, targetOutcome, tacticalDna, baseFormation, philosophy: {star, competitive, academy}, guardrails: {equity, scrMax} }` dan mengembalikan ringkasan Playbook.

- [ ] **Step 1:** Test gagal: payload dengan `philosophy` berjumlah 99 ditolak (Zod). Payload valid menghasilkan `ageMatrix` 27 slot, `gradeQuota` sesuai target, `scrStatus` dari `classifyScr`.
- [ ] **Step 2:** Test FAIL.
- [ ] **Step 3:** Implementasikan Zod schema di `src/lib/juara/validation.ts` (tambah), route handler memakai fungsi Task 1; wizard React 5 langkah dengan live summary card sesuai `UIUX_SPEC.md` §2 dan token §4; tombol lanjut disabled sampai semua langkah valid.
- [ ] **Step 4:** Test PASS + `npm run lint` (exit 0).
- [ ] **Step 5:** Commit `feat(juara): add owner vision wizard and playbook API`.

### Task 5: Verifikasi penuh & serah terima

- [ ] **Step 1:** Jalankan `/home/taradfs/.nvm/versions/node/v24.16.0/bin/node --test tests/juara/*.test.ts` — semua PASS, catat jumlah test.
- [ ] **Step 2:** Jalankan `npm run lint` dan `npm run build` — exit code 0 untuk keduanya; catat output ringkas ke `docs/juara/SPRINT1_VERIFICATION.md`.
- [ ] **Step 3:** Cek `git status --short`: hanya file yang direncanakan; tidak ada migrasi ter-apply, kredensial, atau file produksi di luar daftar.
- [ ] **Step 4:** Tulis ringkasan serah-terima ke `docs/PM_LOG.md` dengan format `Laporan / Konteks / - bullet`, sebut bukti exit code.
- [ ] **Step 5:** Commit `chore(juara): record sprint 1 verification`.
