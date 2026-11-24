# PM Execution Status — Mandat Owner Representative 24 Nov 2026

Status: **EKSEKUSI BERJALAN**. Sumber arahan: `docs/juara/OWNER_REP_TECHNICAL_PLAN.md`
(20 bagian) + mandat pesan Owner Representative. Ini ledger PM, bukan dokumen desain.

## Baseline (checkpoint pertama)

| Item | Nilai |
|---|---|
| Commit lokal | `0c2b02c` (docs Mobbin) |
| Remote `origin/main` | `587d860` — tertinggal 1 commit lokal; push sengaja ditunda sampai gate deploy |
| VPS produksi | `019ebcd`, `stadione.service active` |
| Migrasi JUARA | 12 file `M-00…M-11`, semuanya ter-apply di DB produksi |
| Working tree | Bersih untuk file PM. Untracked `OWNER_REP_EXECUTION_MANDATE.md`, `OWNER_REP_TECHNICAL_PLAN.md`, `docs/juara/design/` adalah **milik Owner Representative**, tidak saya commit atau ubah |
| Browser | `/home/taradfs/.nvm/versions/node/v24.16.0/bin/agent-browser`, v0.33.1, `doctor` pass — **bukan blocker** |

**Ruling:** saya tidak menyentuh file Owner Representative dan tidak push sebelum build,
security regression, browser regression, dan rollback siap. Biaya jika salah: remote
tertinggal satu commit docs; tidak ada risiko produksi.

## Tiga deliverable berurutan (satu slice utama)

| # | Deliverable | Dependency nyata | ETA | File ownership PM |
|---|---|---|---:|---|
| D1 | Baseline & traceability: inventory commit/deploy/migrasi, matriks requirement→state, file ownership, rollback manifest | Baseline di atas; tanpa mengubah file Owner Rep | 0,5 hari | `docs/juara/PM_EXECUTION_STATUS.md` |
| D2 | Role/action/field/tenant gates: `requireCapability`, matriks capability, DTO redaction, terapkan ke route v1, uji bypass PostgREST/RPC & anti eskalasi role | D1; prototype role matrix §11; RLS existing; kunci & DB produksi | 2–3 hari | `src/lib/juara/server/**`, `src/lib/juara/capabilities.ts`, `src/app/api/juara/v1/**`, `tests/juara/**`, migrasi M-12 |
| D3 | Shell FM sesuai prototipe + draft persistence + bukti browser 4 layar × viewport | D2 selesai; prototype Owner Rep sebagai sumber visual; agent-browser tersedia | 2–3 hari | `src/app/juara/(workspace)/**`, `src/components/juara/shell/**`, `docs/juara/screenshots/**` |

**Slice utama saat ini:** D1 + D2. D3 masuk setelah security gate hijau.

## Perubahan migrasi yang akan dibuat (dijelaskan sebelum dieksekusi)

- **M-12 (non-destruktif, policy only):** policy `juara_club_members_tenant` saat ini
  berupa `FOR ALL`, sehingga anggota biasa dapat mengubah role dirinya sendiri lewat
  PostgREST. Akan saya ganti menjadi `FOR SELECT` + RPC `juara_set_member_role()`
  `SECURITY DEFINER` yang hanya mengizinkan OWNER klub yang sama. **Tidak ada baris
  yang dihapus/diubah.** Rollback: `DROP POLICY juara_club_members_read` lalu
  `CREATE POLICY juara_club_members_tenant ... FOR ALL` seperti M-01.
- Uji langsung: anggota non-OWNER mencoba `PATCH /rest/v1/juara_club_members?...`
  dan RPC eskalasi → harus ditolak; OWNER lewat RPC → berhasil. Akun uji dibuat
  dan dihapus dalam transaksi seperti UAT RLS sebelumnya.

## Traceability ringkas

| ID | State | Bukti |
|---|---|---|
| GOV-01 baseline & traceability | IMPLEMENTED (D1) | dokumen ini + `git log`/`curl` baseline |
| SEC-01 requireCapability + tenant | PLANNED (D2) | tests + 403 matrix + direct DB bypass |
| SEC-02 invite nyata & anti eskalasi | PLANNED (D2) | M-12 + uji RPC |
| UX-01 shell FM 5 zona | SEBAGIAN — DEPLOYED | 4 zona ada; inspector 360–440px & action bar 52px **belum ada** |
| UX-02 DataTable/Inspector | PLANNED | keyboard + focus + overflow belum diuji terpisah |
| VIS-01 draft persistence | DEPLOYED | save→reload identik (15/45/40), bukti browser |
| QA-01 browser journey | TESTED (bukan accepted) | PM mengeksekusi journey; Owner Representative mengaudit |
| Deploy bertahap | DEPLOYED | build + security + browser + rollback |

Status per deliverable memakai `PLANNED → IMPLEMENTED → TESTED → DEPLOYED → ACCEPTED`.
"Sprint selesai" tidak dipakai sebelum journey dan bukti visual diuji.

## Update

- D1: **IMPLEMENTED + TESTED** — baseline/commit/migrasi/rollback tercatat di dokumen ini dan `SECURITY_GATE_UAT.md`.
- D2: **IMPLEMENTED + TESTED** — capability matrix, `requireCapability`, redaksi DTO, gate route v1, M-12 anti eskalasi. Bukti: 57/57 test, build exit 0, runtime PATCH/RPC seperti tercatat. **Belum DEPLOYED/ACCEPTED**.
- D3: **IMPLEMENTED + TESTED** — shell lima zona parsial (sidebar collapsible, header, tab konteks, kanvas; action bar/inspector menyusul), draft visi terenkripsi per klub (M-13 + `/api/juara/v1/vision/draft`), tombol Simpan draf di wizard. Bukti: 57/57 test, build exit 0, route terdaftar. **Belum DEPLOYED/ACCEPTED**.
- Rollback aplikasi: VPS dapat di-reset ke commit aplikasi sebelumnya lalu `npm run build` + restart. **Policy M-12/M-14 tidak ikut dilemahkan** — rollback bukan dengan membuka `FOR ALL`. Browser regression **tidak dijalankan sebelum deploy** — dijalankan **setelah** deploy ke VPS dengan `agent-browser set viewport <w> <h>` (v0.33.1). Ini koreksi atas catatan sebelumnya yang menyebut "siap dijalankan".
- Gate deploy: build ✓, security ✓, browser regression ✓ (dijalankan setelah deploy), rollback ✓.
- **Deploy bertahap selesai**: VPS `6425ae5`, service active, B2C 200. Lihat `P1_DEPLOY_VERIFICATION.md`.
- D1/D2/D3 sekarang **IMPLEMENTED → TESTED → DEPLOYED**. **ACCEPTED: belum** — menunggu Owner Representative/Owner. Khusus D3 **tidak boleh ditandai accepted**: inspector 360–440px dan action bar 52px belum dibangun, sehingga UX-01 hanya sebagian. Koreksi gate browser: regression dijalankan setelah deploy, bukan sebelum deploy.
- Lanjut tersisa: inspector + action bar + 9 rute (UX-01 lanjutan), SEC-02 invite nyata, finance engine.

## Audit P1 — perbaikan slice berikutnya (belum accepted)

- Sumber: `docs/juara/OWNER_REP_P1_AUDIT.md` (CHANGES REQUIRED).
- Dikerjakan: DTO allowlist draft + merge peran (SD tidak melihat/menimpa equity),
  policy tabel `juara_*` jadi SELECT-only + RPC ber-authz (M-14), invite 501 non-sukses,
  MIME PDF `application/pdf`, rollback policy tidak melemahkan keamanan, rekonsiliasi ledger.
- Gate: 61/61 test, build exit 0. M-14 **belum di-apply** produksi sampai review visual
  dan deploy diizinkan; policy live sudah diverifikasi read-only (tujuh tabel masih `ALL`).
- Visual: paket screenshot baru sesuai `VISUAL_ACCEPTANCE_STANDARD.md` disiapkan sebelum deploy.
- **Bridge E2E (24 Nov 2026):** `python3 scripts/owner-rep/notify.py --check` → `codex-cli 0.171.0`, exit 0. Satu checkpoint `bridge-linux-e2e` berhasil di-queue. Symlink `codex.exe` lama dihapus; script perbaikan Owner Representative memakai absolute Linux node+codex.js, HOME/CODEX_HOME, outbox + retry.
- **Audit lanjutan v2:** perbaikan 1–6 dari `OWNER_REP_P1_AUDIT.md` dikerjakan; bukti `docs/juara/COMMIT_FIXES_V2_EVIDENCE.md`. 65/65 test build 0. Staging M-14/M-15 lolos negative test. M-15 produksi ter-apply; M-14 masih staging-only; UI belum deployed; P1 belum accepted. Visual: `docs/juara/screenshots/commit-fixes-v2/MANIFEST.md` (build kandidat lokal, loading vs loaded terpisah).
- **Audit CAS (fixes-v2):** `docs/juara/CAS_RECONCILE_EVIDENCE.md`. Revision DB, expected revision wajib, UPDATE atomik + return revision, tanpa raw fallback. Rehearsal urutan produksi M-00…M-13 → M-15 → M-14 → M-16 lolos: overload jadi satu, legacy backfill, finance existing terjaga, cross-tenant 0, CAS paralel 1 sukses/1 conflict. M-16 **belum** di-apply produksi; UI belum deploy; P1 belum accepted.
- **Audit CAS lanjutan:** perbaikan finance authoritative, M-16 transaksi penuh + injected failure rollback, backend staging HTTP Owner/SD (save/reload/allowlist/stale/cross-tenant), runner assertif dan log sanitized. Bukti: `docs/juara/CAS_RECONCILE_EVIDENCE.md`, `docs/juara/rehearsal-logs/http-cas.log`, `docs/juara/screenshots/http-cas-stage/`. Belum ada deploy/produksi change; P1 belum accepted.
- **Evidence closure:** runner staging unik/loopback/cleanup, cutover M14+M16 satu transaksi + injected rollback, HTTP encrypted legacy/backfill/finance100-200, conflict UI deterministik + recovery, screenshot 1440/390. Bukti: `docs/juara/rehearsal-logs/evidence-closure-runner.log`, `docs/juara/screenshots/evidence-closure/`. Masih belum deploy/produksi change; P1 belum accepted.
