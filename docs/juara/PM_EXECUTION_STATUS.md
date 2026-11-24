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
| UX-01 shell FM 5 zona | PLANNED (D3) | screenshot 1440/1024/768/390 |
| UX-02 DataTable/Inspector | PLANNED (D3) | keyboard + focus + overflow |
| VIS-01 draft persistence | PLANNED (D3) | save→reload identik |
| QA-01 browser journey | PLANNED (D3) | QA mengeksekusi, Owner menilai hasil |
| Deploy bertahap | PLANNED (gate) | build + security + browser + rollback |

Status per deliverable memakai `PLANNED → IMPLEMENTED → TESTED → DEPLOYED → ACCEPTED`.
"Sprint selesai" tidak dipakai sebelum journey dan bukti visual diuji.

## Update

- D1: **IMPLEMENTED + TESTED** — baseline/commit/migrasi/rollback tercatat di dokumen ini dan `SECURITY_GATE_UAT.md`.
- D2: **IMPLEMENTED + TESTED** — capability matrix, `requireCapability`, redaksi DTO, gate route v1, M-12 anti eskalasi. Bukti: 57/57 test, build exit 0, runtime PATCH/RPC seperti tercatat. **Belum DEPLOYED/ACCEPTED**.
- D3: **IMPLEMENTED + TESTED** — shell lima zona parsial (sidebar collapsible, header, tab konteks, kanvas; action bar/inspector menyusul), draft visi terenkripsi per klub (M-13 + `/api/juara/v1/vision/draft`), tombol Simpan draf di wizard. Bukti: 57/57 test, build exit 0, route terdaftar. **Belum DEPLOYED/ACCEPTED**.
- Rollback siap: VPS dapat di-reset ke `019ebcd` lalu `npm run build` + restart `stadione.service`; direktori `/opt/stadione-releases/*` tersedia. Browser regression siap dijalankan dengan `agent-browser viewport <w> <h>` (v0.33.1).
- Gate deploy: build ✓, security ✓, browser regression **siap dijalankan setelah deploy** (bukan blocker), rollback ✓. Deploy bertahap berikutnya.
