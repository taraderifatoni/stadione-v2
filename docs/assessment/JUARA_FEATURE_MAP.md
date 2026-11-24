# Laporan JUARA Feature & Status Map / Konteks: / - bullet

- Konteks: assessment read-only atas fitur dan roadmap JUARA per 24 Nov 2026; tanpa deploy, push, DB write, kredensial, atau perubahan kode/model. Working dir `/home/taradfs/stadione-v2`, branch `main`, HEAD `063c1c851a31606d02050a841225e07a69543a54` (`docs(juara): final release evidence and app rollback rehearsal`). Mandat: `graphify query "JUARA playbook squad finance RLS CAS draft vision"` dijalankan lebih dulu (tanpa node cocok — graf tidak mencakup artefak JUARA), lalu dokumen dan source dibaca langsung.
- Sumber otoritatif: `docs/juara/OWNER_REP_TECHNICAL_PLAN.md` (roadmap R0–R3, P0–P5, backlog GOV/SEC/UX/VIS/DAT/TAC/SQD/FIN/REV/SIM/APR/PDF/OPS/QA), `DECISIONS.md` D1–D5, `PM_RULINGS.md` R1–R21, `PM_EXECUTION_STATUS.md`, `ARCHITECTURE.md`, `RULEBOOK.md`, `FINANCE_SPEC.md`, `ACADEMY_INTEGRATION_SPEC.md`, `SECURITY_QA_PLAN.md`, sprint verification 1–11, audit/evidence Owner Representative, dan source di `src/app/juara`, `src/app/api/juara/v1`, `src/lib/juara`, `src/components/juara`, `database/juara/migrations`.
- Status memakai skala `PLANNED → IMPLEMENTED → TESTED → DEPLOYED → ACCEPTED` (technical plan §17). "Sprint selesai" tidak dipakai sebagai pengganti status. Pisahkan accepted teknis, accepted visual, accepted bisnis.
- Dua kelas bukti tidak boleh dicampur: **(A) accepted staging functional evidence** — hanya lingkup slice draft/CAS/rekonsiliasi pada commit `063c1c8`; **(B) not-accepted production / P1 / D3** — seluruh klaim produksi, P1 umum, dan visual FM. Rincian di §3.

---

## 1. Konvensi kolom

| Kolom | Arti |
|---|---|
| State | Dipisah per tahap: IMPLEMENTED / TESTED / DEPLOYED / ACCEPTED. Tanda `—` = tidak berlaku (desain saja) atau tidak ada bukti. |
| Evidence | Path dokumen/commit yang dapat dibuka; bukan klaim eksekusi mandiri reviewer kecuali disebut. |
| Owner | Pelaksana saat ini: PM (`ses_dfd621110ffeVnw419vDE4qR43`), CTO (audit/keputusan), worker Divisi 1–6 (Sprint 0, kuota habis), Owner Representative (review/roadmap), Owner (keputusan akhir). |
| Pod | Usulan pemilik feature-pod masa depan (bukan struktur yang sudah disetujui). |
| Debt | Utang yang menghalangi ACCEPTED / rilis. |

---

## 2. Peta per kapabilitas

### 2.1 Auth / onboarding (registrasi, login, signup, callback, club bootstrap)

- Source: `src/app/juara/login/page.tsx`, `src/app/juara/signup/page.tsx`, `src/app/juara/auth/callback/route.ts`, `src/app/juara/layout.tsx`; `src/lib/juara/auth.ts`, `auth-callback.ts`, `server-auth.ts`, `invite.ts`, `routing.ts`; `src/app/api/juara/v1/auth/register/route.ts`, `clubs/bootstrap/route.ts`, `clubs/me/route.ts`, `members/invite/route.ts`; `database/juara/migrations/20261123000001_juara_tenant_identity.sql` (M-01), `20261123000008_juara_bootstrap_club.sql` (M-08), `20261124000009_juara_registration.sql` (M-09).
- Dependencies: `auth.users` bersama stadione.pro (D4), RLS + `juara_club_members`, service_role hanya di server untuk register, kunci/M-08 bootstrap, capability gate.
- State: IMPLEMENTED ✓ · TESTED ✓ (40/40 Sprint 9; 57/57 P1) · DEPLOYED ✓ (produksi `e5e03d8` → `8addba9`/`7341260` → P1 `6425ae5`) · ACCEPTED ✗ (E2E milik PM; visual belum diperiksa reviewer).
- Evidence: `SPRINT3_VERIFICATION.md`, `SPRINT5_VERIFICATION.md`, `SPRINT7_VERIFICATION.md`, `SPRINT9_UI_VERIFICATION.md`, `P1_DEPLOY_VERIFICATION.md`, `CTO_AUDIT.md` (08.x–08.3x), `RLS_RUNTIME_EVIDENCE.md`; commit `a17ded9`, `8f360e7`, `e5e03d8`, `bac70bd`, `baae533`, `7e664d6`, `8c6a1c0`, `291e506`.
- Owner: PM implementasi/deploy; CTO temuan keamanan (kredensial demo); Owner keputusan akun demo & data riil. Pod: **Identity & Access Pod**.
- Debt: SEC-02 invite masih stub (route mengembalikan non-success 501, bukan undangan nyata); akun demo `demo@juara.stadione.pro` masih aktif — wajib dihapus sebelum rilis umum; multi-peran/user & batas usia JWT belum diputus; SSO belum; data klub riil gate v1.0; screenshots login/dashboard/playbooks dari E2E PM, belum visual-accepted.

### 2.2 Vision draft (5 langkah, autosave, enkripsi per klub, CAS revision)

- Source: `src/app/api/juara/v1/vision/draft/route.ts`; `src/lib/juara/draft-dto.ts`, `draft-write.ts`, `draft-recovery.ts`, `field-crypto.ts`; `src/components/juara/OwnerWizard.tsx` (tombol Simpan draf); `database/juara/migrations/20261124000013_juara_vision_draft.sql` (M-13), `20261124000015_juara_draft_finance_split.sql` (M-15), `20261124000016_juara_draft_cas_reconcile.sql` (M-16), `20261124000014_juara_action_policies.sql` (M-14).
- Dependencies: keyring/AES-256-GCM, DTO allowlist per peran, `expectedRevision` wajib + RPC 4 argumen M-16, M-14 policy SELECT-only, finance blob authoritative.
- State: IMPLEMENTED ✓ · TESTED ✓ (74/74 dijalankan ulang reviewer) · DEPLOYED **parsial** (M-13 & M-15 produksi; M-14/M-16 **staging only**, UI belum di-deploy) · ACCEPTED **hanya kelas (A)** — `063c1c8` ACCEPTED untuk bukti fungsional staging slice draft/CAS/reconciliation; produksi/P1/D3 ✗.
- Evidence: `OWNER_REP_FINAL_RELEASE_EVIDENCE_AUDIT.md` (acceptance terbatas `063c1c8`), `CAS_RECONCILE_EVIDENCE.md`, `OWNER_REP_FINANCE_HTTP_AUDIT.md`, `OWNER_REP_CLOSURE_FINAL_AUDIT.md`, `OWNER_REP_EVIDENCE_VALIDITY_AUDIT.md`; log `docs/juara/rehearsal-logs/{entrypoint,app-rollback,http-assertions}.log`; `docs/juara/screenshots/evidence-final/MANIFEST.md`; runner `scripts/juara/final_evidence_entrypoint.sh`, `http_assertions.py`; commit `b529669`, `2db2473`, `40db6a6`, `49091e4`, `1a2655c`, `12948d6`, `063c1c8`.
- Owner: PM implementasi & runner; Owner Representative audit berulang; CTO handoff ACK. Pod: **Wizard/Vision Pod** + **Platform Security Pod** (CAS).
- Debt: M-14/M-16 belum di-apply produksi; kasus malformed-finance route 500 hilang dari runner terbaru — harus dipulihkan sebagai regression; cleanup runner masih `CLEANUP_ATTEMPTED` dan menyimpan salinan env produksi di `/tmp`; env staging eksplisit dipakai tetapi auth masih produksi (isolasi tidak penuh); manifest perlu memisahkan capture asli dari metadata rehearsal.

### 2.3 Playbook save / generate / export

- Source: `src/lib/juara/playbook.ts`, `playbook-save.ts`, `formulas.ts`, `validation.ts`, `pdf.ts`; `src/app/api/juara/v1/playbooks/route.ts`, `playbooks/generate/route.ts`, `playbooks/export/route.ts`; `src/components/juara/OwnerWizard.tsx`; `src/app/juara/(workspace)/playbooks/page.tsx`; M-02 (`20261123000002_juara_playbook_slot.sql`), M-10 (`20261124000010_juara_tactical_profile.sql`).
- Dependencies: formula engine, enkripsi AAD `clubId|table|column|rowId|keyId`, authz per aksi, membership/klub aktif, watermark server (R13).
- State: IMPLEMENTED ✓ · TESTED ✓ (13→46 test across sprint; PDF 21+) · DEPLOYED ✓ (save nyata Sprint 7; UI Sprint 9/10; P1 `6425ae5`) · ACCEPTED ✗ (baru teknis/deployed; "belum menghasilkan master plan terintegrasi" menurut technical plan §2).
- Evidence: `SPRINT1_VERIFICATION.md`, `SPRINT3_VERIFICATION.md`, `SPRINT4_VERIFICATION.md`, `SPRINT6_VERIFICATION.md`, `SPRINT7_VERIFICATION.md`, `SPRINT9_VERIFICATION.md`, `SPRINT10_VERIFICATION.md`; commit `b361c6f`, `9018357`, `a17ded9`, `be206be`, `b96b080`, `e5e03d8`, `bac70bd`, `baae533`, `80340d3`, `ed2eea2`, `587d860`.
- Owner: PM; CTO audit teknis; Owner Representative review visual. Pod: **Playbook & Wizard Pod**.
- Debt: generator masih ringkasan/KPI + matriks usia, bukan snapshot terintegrasi; PDF-01 (export dari versi tersimpan + redaksi) belum; metadata server sudah diperbaiki dari payload klien (P1 fix) tetapi visual PDF belum diinspeksi; tombol unduh PDF belum diklik di browser E2E.

### 2.4 Tactics (10 DNA, formasi, Auto/Manual, profil terenkripsi)

- Source: `src/lib/juara/tactics.ts` (288 baris: `TACTICAL_DNA_OPTIONS`, `FORMATION_TEMPLATES`, `resolveFormation`, `buildTacticalProfile`), `validation.ts`, `playbook.ts`, `playbook-save.ts`; `src/components/juara/OwnerWizard.tsx` langkah 3; `src/app/juara/juara.css`; M-10 (`tactical_profile_enc`), M-11 (`20261124000011_juara_tactical_dna_extend.sql`, ENUM 10 nilai).
- Dependencies: R21 (4 DNA kanonik + 6 rasionalisasi kualitatif), riset SI FM24, AES-256-GCM.
- State: IMPLEMENTED ✓ · TESTED ✓ (46/46) · DEPLOYED ✓ (VPS `37ef1b3` → R21 `587d860`) · ACCEPTED ✗ (visual tidak bisa diverifikasi — agent-browser hilang dari PATH setelah restart harness).
- Evidence: `SPRINT10_TACTICS_VERIFICATION.md`, `SPRINT11_RESEARCH_WIZARD.md`, `CTO_AUDIT.md` (08.5x), `PM_RULINGS.md` R21; commit `80340d3`, `ed2eea2`, `587d860`.
- Debt: enam DNA tambahan tidak memakai angka terukur; profil taktik belum menggerakkan engine skuad/minit; playbook pra-M-10 tidak dimigrasikan (tidak ada input asli); screenshot langkah 3 belum diambil ulang; Owner belum menilai visual.

### 2.5 Squad & architecture (slot, player, vault, depth chart, minutes)

- Source: `database/juara/migrations/20261123000002_juara_playbook_slot.sql` (M-02 `juara_squad_slots`), `20261123000003_juara_player_vault.sql` (M-03 `juara_players`, `juara_contracts_vault`); desain `ARCHITECTURE.md` §2.2.4–2.2.6, `RULEBOOK.md` §2–4/§9; teknis `tactics.ts` hanya katalog peran.
- Dependencies: playbook/version, RULEBOOK (26–28 slot, 33 coverage, 22 archetype, <550 menit), data pemain/import, engine alokasi.
- State: schema IMPLEMENTED ✓ / TESTED ✓ (inventaris 8 tabel + RLS 8/8) / DEPLOYED ✓ (M-00…M-13 produksi) / ACCEPTED ✗; **fitur** (depth chart UI, import, minutes/gap engine) PLANNED — tidak ada route `/squad`, tidak ada engine di `src/lib/juara`, tidak ada tabel `juara_squad_assignments`.
- Evidence: `MIGRATION_APPLIED.md`, `SPRINT7_VERIFICATION.md`, `ARCHITECTURE.md` §2/§7.1, `OWNER_REP_TECHNICAL_PLAN.md` §2 ("Schema bukan fitur selesai"), `PM_EXECUTION_STATUS.md` baris 68.
- Owner: Divisi 3 (desain, kuota habis) → PM (migrasi). Pod: **Squad & Tactics Pod**.
- Debt: TAC-01/SQD-01/DAT-01; tidak ada import preview/commit, unique roster vs 33 coverage, invariant menit, gap analysis route; tidak ada `juara_*_assignments`; R1/R9/R12 fields baru (IDP, PROTECTED TECHNICAL ASSET, PHV time-series) masih usulan.

### 2.6 Finance / SCR (formula murni, amortisasi, proyeksi, draft finance)

- Source: `src/lib/juara/formulas.ts` (`computeAmortization`, `classifyScr`, `buildAgeMatrix`, `computeGradeQuota`, `computeAri`), `validation.ts` (`validateScrThreshold`, clamp <58 R15); `database/juara/migrations/20261123000004_juara_projections_audit.sql` (M-04), M-15/M-16 untuk draft finance; `docs/juara/FINANCE_SPEC.md`, `RULEBOOK.md` §5–8/§11–13.
- Dependencies: 5 komponen pembilang + 6 penyebut disimpan terpisah (R2), nilai eksak sebelum pembulatan (R14), finance blob authoritative, keyring.
- State: fungsi murni IMPLEMENTED ✓ / TESTED ✓ (TV-01…TV-27 diverifikasi ulang; 27→74 test) / DEPLOYED ✓ (kode di produksi; M-15 produksi) / ACCEPTED: **kelas (A) untuk source/regression finance** (`40db6a6` diterima, `063c1c8` fungsional staging) · mesin keuangan penuh **PLANNED / belum terhubung** — `scrStatus: MENUNGGU_ENGINE` setelah R21 menghapus test vector 59,8%.
- Evidence: `SPRINT1_VERIFICATION.md`, `SPRINT11_RESEARCH_WIZARD.md`, `FINANCE_SPEC.md` §11.2, `OWNER_REP_FINANCE_HTTP_AUDIT.md` (perbaikan finance diterima pada level source/regression), `OWNER_REP_FIXES_V2_AUDIT.md`, `CAS_RECONCILE_EVIDENCE.md`; commit `b361c6f`, `40db6a6`, `2db2473`, `063c1c8`.
- Owner: Divisi 1/4 (rumus & spesifikasi) → PM (implementasi/regression); Owner Representative finance audit. Pod: **Finance & Commercial Pod**.
- Debt: FIN-01/02/03/REV-01 tidak dibangun (cash 12 bulan, NBV, rate-card, enam stream, SCR dari komponen); angka final multiplier/step-up/termin & template aktif menunggu Owner; M-16 belum produksi; tidak ada P&L/equity terpisah dari operating revenue di engine.

### 2.7 Academy integration (HK-1/HK-2, ARI/IDP, impor, notifikasi)

- Source: `docs/juara/ACADEMY_INTEGRATION_SPEC.md` (desain saja), `ARCHITECTURE.md` §8 HK-1/2/3; hook `academy_id` ada di M-01 (`20261123000001_juara_tenant_identity.sql`). **Tidak ada** `src/app/api/juara/v1/bridge/*`, tidak ada halaman `/juara/academy`, tidak ada worker/outbox.
- Dependencies: D3 (data sintetis `TEMPLATE_PRD`), HMAC-SHA256 + idempotency_key, `public.academies` read-only, keputusan PM atas field R12, kredensial provider.
- State: IMPLEMENTED — · TESTED — (audit dokumen + aritmetika divisional saja) · DEPLOYED ✗ · ACCEPTED ✗ (desain terverifikasi PM, bukan implementasi).
- Evidence: `ACADEMY_INTEGRATION_SPEC.md` §9–§13, `TEAM.md` (Divisi 5 selesai & terverifikasi), `SECURITY_QA_PLAN.md` §13, `DECISIONS.md` D3.
- Owner: Divisi 5 (dokumen, kuota habis) → PM. Pod: **Academy & Integration Pod**.
- Debt: webhook tidak aktif; impor massal CSV/Excel ditunda; N-1…N-8 notifikasi desain saja; penempatan IDP/PROTECTED TECHNICAL ASSET/time-series PHV/dedupe belum diputus (R12); data rapor akademi/IlLeague/FotMob butuh Owner; gate data riil v1.0.

### 2.8 What-if / version lock (simulasi, compare 3, submit, clearance, activate)

- Source: desain pada `FINANCE_SPEC.md` §5, `ARCHITECTURE.md` §7.1 #3–#6, `OWNER_REP_TECHNICAL_PLAN.md` §9.3/§10/§15 (SIM-01, APR-01), state machine §8. `M-04` memuat `juara_playbook_status`, `M-16` memuat revision **draft visi** — bukan version lock playbook. Tidak ada route simulate/compare/submit/clearance/activate di `src/app/api/juara/v1`.
- Dependencies: snapshot input immutable, ruleset version, CAS revision, membership saat approval, hash versi, guardrail.
- State: IMPLEMENTED ✗ · TESTED ✗ · DEPLOYED ✗ · ACCEPTED ✗ (PLANNED). Catatan: CAS draft yang accepted di kelas (A) adalah mekanisme konkurensi draft, **bukan** fitur what-if/version lock.
- Evidence: `FINANCE_SPEC.md` §5, `ARCHITECTURE.md` §7.1, technical plan §9.3/§15, `PM_EXECUTION_STATUS.md` baris 68, `OWNER_REP_TECHNICAL_PLAN.md` §2 ("compare, snapshot, lock belum ada menurut PM").
- Owner: Divisi 3/4 (desain) → PM. Pod: **Scenario & Governance Pod**.
- Debt: SIM-01, APR-01; tidak ada tabel `juara_playbook_versions`/`juara_simulation_runs`/`juara_decisions`/`juara_approvals`; tidak ada state machine `DRAFT→SIMULATED→IN_REVIEW→LOCKED_ACTIVE→ARCHIVED`; approval hash & concurrent activate belum.

### 2.9 RBAC / RLS / encryption (cross-cutting)

- Source: `src/lib/juara/capabilities.ts`, `rbac.ts`, `server/authz.ts`, `server-auth.ts`, `crypto.ts`, `field-crypto.ts`, `keyring.ts`, `draft-dto.ts`; semua route `src/app/api/juara/v1/**`; `src/lib/juara/invite.ts`; `src/middleware.ts`; M-01 (`juara_current_club_id()`), M-06/M-07 (hardening + revoke service_role), M-12 (`juara_set_member_role`, SELECT-only), M-14 (action policies), M-16 (CAS); `docs/juara/SECURITY_QA_PLAN.md`, `ENCRYPTION_KEY_RUNBOOK.md`.
- Dependencies: JWT + `auth.uid()` ∩ membership ∩ claim (R11, GUC dilarang), kunci di environment (pemegang Owner), AAD `club_id|table|column|row_id|key_id`.
- State: IMPLEMENTED ✓ · TESTED ✓ (57/57 P1; 74/74 audit akhir; bypass PostgREST/RPC negatif) · DEPLOYED **parsial** (M-12 + P1 security gates produksi `6425ae5`; M-14/M-16 staging only) · ACCEPTED **terbatas**: isolasi anon + authenticated RLS TERVERIFIKASI dan diterima CTO (`3d00e93`/`695d983`); anti-eskalasi role terverifikasi runtime (`SECURITY_GATE_UAT.md`); **P1 keamanan umum belum accepted** (`OWNER_REP_P1_AUDIT.md`: CHANGES REQUIRED, slice perbaikan diterima bertahap tetapi gate P1 tidak pernah dinyatakan accepted).
- Evidence: `RLS_RUNTIME_EVIDENCE.md` (B1–B5 PASS), `SECURITY_GATE_UAT.md` (PATCH/RPC ditolak), `MIGRATION_APPLIED.md`, `P1_DEPLOY_VERIFICATION.md`, `CTO_AUDIT.md`, `OWNER_REP_P1_AUDIT.md`, `OWNER_REP_FIXES_V2_AUDIT.md`, technical plan §11; commit `e9c8f01`, `0b4f0b0`, `ddc7e30`, `e0630a1`, `d1e9efb`, `2db2473`, `40db6a6`, `12948d6`, `063c1c8`.
- Owner: PM implementasi & UAT; CTO audit/keputusan D1–D5; Owner pemegang kunci & pen-test; Owner Representative review. Pod: **Platform Security & Access Pod**.
- Debt: M-14/M-16 belum produksi (policy `juara_*` live masih `ALL` untuk sebagian tabel menurut P1 audit); SEC-02 invite nyata; 36-sel matrix baru sebagian diroute; threat model admin+runtime key/KMS; secret cleanup; demo account; pen-test live; F-02/F-03 terbuka.

### 2.10 Inbox / notifications

- Source: `ACADEMY_INTEGRATION_SPEC.md` §10 (N-1…N-8, desain + redaksi), `OWNER_REP_TECHNICAL_PLAN.md` §8 entitas `juara_inbox_items`, §5.2 halaman governance. **Tidak ada** tabel `juara_inbox_items`, route, job/outbox, atau UI inbox di source.
- Dependencies: cron worker/outbox, event (T-24 kontrak, ARI, SCR, RAE, IDP), kredensial WAHA/Resend/OneSignal dari Owner, RBAC redaksi.
- State: IMPLEMENTED ✗ · TESTED ✗ · DEPLOYED ✗ · ACCEPTED ✗ (PLANNED/DESAIN).
- Evidence: `ACADEMY_INTEGRATION_SPEC.md` §10, `SPRINT7_VERIFICATION.md` butir 4 (kredensial notifikasi menunggu), `OWNER_REP_TECHNICAL_PLAN.md` §14 P4.
- Owner: Divisi 5 (desain) → PM; Owner kredensial. Pod: **Platform/Integration Pod**.
- Debt: tidak ada outbox/idempotent worker, tidak ada pengiriman nyata, tidak ada UI inbox; noreply/quiet hours belum dikonfigurasi; dilarang mengirim sebelum izin Owner.

### 2.11 SSO / pen-test

- Source: `DECISIONS.md` D2 & D4 HK-3, `SECURITY_QA_PLAN.md` F-03, `SPRINT7_VERIFICATION.md` "Yang belum selesai" butir 2–3, `CTO_AUDIT.md` batas klaim, `OWNER_REP_TECHNICAL_PLAN.md` §18.
- Dependencies: client ID/secret penyedia identitas, DNS `auth.stadione.pro`, SSL/TLS, vendor/anggaran pen-test, lampu hijau Owner terpisah.
- State: IMPLEMENTED ✗ · TESTED ✗ · DEPLOYED ✗ · ACCEPTED ✗ (BLOCKED eksternal).
- Evidence: `DECISIONS.md` D2 ("SSO menyusul", gate DNS/SSL/kredensial), `SPRINT7_VERIFICATION.md`, `CTO_AUDIT.md`, `SECURITY_QA_PLAN.md` §12.2 F-02/F-03.
- Owner: Owner (keputusan/anggaran/DNS), CTO (rekomendasi), PM (eksekusi bila diizinkan). Pod: **Platform Security & Access Pod**.
- Debt: tidak ada SSO/OIDC; tidak ada pen-test live/OWASP; F-02 (DNS/TLS/WAF/KMS/staging HTTPS) dan F-03 terbuka; produksi tidak boleh diklaim "fully verified".

---

## 3. Matriks ringkas

| Kapabilitas | IMPL | TEST | DEPL | ACC | Evidence utama | Owner → Pod |
|---|---|---|---|---|---|---|
| Auth/onboarding | ✓ | ✓ | ✓ | ✗ | `SPRINT9`, `P1_DEPLOY_VERIFICATION` | PM/CTO → Identity & Access |
| Vision draft | ✓ | ✓ | parsial | **(A) staging only** | `OWNER_REP_FINAL_RELEASE_EVIDENCE_AUDIT`, `063c1c8` | PM/Rep → Wizard + Security |
| Playbook save/generate/export | ✓ | ✓ | ✓ | ✗ | `SPRINT1/7/9/10` | PM → Playbook & Wizard |
| Tactics | ✓ | ✓ | ✓ | ✗ | `SPRINT10/11`, `80340d3`–`587d860` | PM → Squad & Tactics |
| Squad/architecture | schema ✓ / fitur ✗ | schema ✓ / fitur ✗ | schema ✓ | ✗ | `MIGRATION_APPLIED`, `ARCHITECTURE` | Divisi 3→PM → Squad & Tactics |
| Finance/SCR | functions ✓ / engine ✗ | ✓ | kode ✓ / engine ✗ | **(A) finance source/regression**, engine ✗ | `FINANCE_SPEC` §11, `40db6a6`, `063c1c8` | Divisi 1/4→PM → Finance & Commercial |
| Academy integration | ✗ | ✗ | ✗ | ✗ | `ACADEMY_INTEGRATION_SPEC` | Divisi 5→PM → Academy & Integration |
| What-if/version lock | ✗ | ✗ | ✗ | ✗ | technical plan §9.3/§15 | Divisi 3/4→PM → Scenario & Governance |
| RBAC/RLS/encryption | ✓ | ✓ | parsial | **RLS runtime diterima CTO**; P1 ✗ | `RLS_RUNTIME_EVIDENCE`, `SECURITY_GATE_UAT` | PM/CTO/Owner → Platform Security |
| Inbox/notifications | ✗ | ✗ | ✗ | ✗ | `ACADEMY` §10 | Divisi 5→PM → Platform/Integration |
| SSO/pen-test | ✗ | ✗ | ✗ | ✗ | `DECISIONS` D2, `SECURITY_QA_PLAN` F-03 | Owner/CTO/PM → Platform Security |

---

## 4. Pemisahan eksplisit bukti

### 4.1 (A) ACCEPTED — staging functional evidence, terbatas

- `063c1c8` — **ACCEPTED untuk bukti fungsional staging slice draft/CAS/reconciliation saja**. Bukan acceptance produksi, seluruh P1, D3, atau palet warna. Reviewer menjalankan 74 tes mandiri (74 pass), membaca tiga runner + log, membuka tiga PNG `evidence-final`. Reviewer **tidak** replay remote staging/build/deployment; log runtime/build berasal dari PM (`docs/juara/OWNER_REP_FINAL_RELEASE_EVIDENCE_AUDIT.md`).
- Lingkup yang diterima: allowlist GET SD + `409 LEGACY_NOT_MIGRATED`; Owner omitted-equity backfill `200`; `409 VERSION_CONFLICT` paralel dengan winner dari response; rollback build `1a2655c` kompatibel skema M-16; finance `100/200 omitted equity → 200`.
- Penerimaan terbatas sebelumnya (jangan digeneralisasi): `40db6a6` perbaikan finance pada level source/regression; `1a2655c` UI recovery/mobile "PASS terbatas" (evidence gate saat itu tetap CHANGES REQUIRED); `12948d6` PARTIAL ACCEPTANCE; `49091e4`, `40db6a6`, `2db2473` etc. bertahap CHANGES REQUIRED → diterima pada bagian tertentu saja.
- Isolasi RLS anon + authenticated TERVERIFIKASI dan diterima CTO (`3d00e93`/`695d983`, `RLS_RUNTIME_EVIDENCE.md` B1–B5); anti-eskalasi role terverifikasi (`SECURITY_GATE_UAT.md`). Ini **bukan** bukti seluruh peran/aksi aman (technical plan §2).

### 4.2 (B) NOT ACCEPTED — produksi / P1 / D3

- **Produksi**: M-14 & M-16 **belum di-apply**; UI slice CAS belum di-deploy; tidak ada izin deploy dalam keputusan reviewer; produksi tidak "fully verified" (SSO, pen-test, kredensial notifikasi, data klub riil tertunda).
- **P1**: `OWNER_REP_P1_AUDIT.md` = CHANGES REQUIRED. Perbaikan 1–6 dikerjakan (`d1e9efb`, `2db2473`, `40db6a6` …) dan bagian-bagiannya diterima, tetapi tidak pernah ada keputusan "P1 ACCEPTED". `PM_EXECUTION_STATUS.md` baris 66 mencatat deploy P1, baris 80–86 menegaskan P1 belum accepted.
- **D3 visual**: `OWNER_REP_CAS_AUDIT.md` = **REVIEWED — CHANGES REQUIRED**, bukan VISUALLY ACCEPTED. Shell lima zona baru parsial; inspector 360–440 px dan action bar 52 px belum dibangun; sembilan rute penuh belum ada. Sesuai `VISUAL_ACCEPTANCE_STANDARD.md`, tanpa gambar yang diperiksa reviewer statusnya **VISUAL REVIEW PENDING**. Palet hijau/emas technical plan §5.3 juga **belum diterima Owner** (catatan §5.3 diperbarui 24 Nov).
- **Batas bukti staging**: REST/DB staging, tetapi auth diarahkan ke produksi; runner dahulu mengubah role cluster-wide `pgrst` (sudah diperbaiki dengan role `pgrst_evclose`); cleanup/env handling masih dicatat sebagai temuan operasional `OWNER_REP_FINAL_RELEASE_EVIDENCE_AUDIT.md` butir 1–3. Jangan menyebut "seluruh stack terisolasi" atau "build produksi terbukti".

---

## 5. Pekerjaan visual D3 di working tree — PROVISIONAL, belum di-deploy

- `src/app/juara/juara.css` — **modified, uncommitted** (23 insert / 23 delete): swap token warna `--ju-navy #101827`, `--ju-navy-2 #1B2A44`, `--ju-ink #172033`, `--ju-muted #5A6578`, `--ju-line #DDE3EC`, `--ju-panel #F3F5F8`, `--ju-accent #3859D6` (cobalt), `--ju-danger #B4232A`, `--ju-success #0F7A5A`; bersamaan dengan perubahan turunan (focus ring, badge, error/notice, table border, warna option state).
- `docs/juara/design/D3_COLOR_REFERENCES.md` — **untracked**: tiga referensi Mobbin (Revolut Business, Deel, Whop) dengan ID/URL dan alasan adopsi/penolakan; gambar di `docs/juara/design/references/{revolut-business,deel,whop}.webp`. Menyatakan token tetap **provisional** sampai reviewer menerima screenshot aplikasi.
- `docs/juara/D3_PREMIUM_VISUAL_BRIEF.md` — **untracked**: mandat Owner, kandidat token graphite/navy, batas slice (Ruang Direksi + preview Skuad sintetis), yang akan diterapkan, dan persyaratan bukti acceptance 1440/1024/768/390 + manifest.
- Status: **provisional / not committed / not built / not deployed / not accepted**. Belum ada screenshot aplikasi berjalan untuk palet ini, belum ada `MANIFEST.md` checkpoint baru, belum ada penilaian reviewer. Sesuai `VISUAL_ACCEPTANCE_STANDARD.md`: VISUAL REVIEW PENDING. Jangan menggabungkan dengan accepted evidence `063c1c8`, dan jangan memakai token ini sebagai "palet final".

---

## 6. Debt lintas roadmap & urutan ketergantungan

- Critical path technical plan §15: definisi data/aturan → fondasi akses → baseline → engine → snapshot → approval/export → pilot. Estimasi P0–P5 = 30–45 hari kerja + buffer 20–30% (7–12 minggu); bukan komitmen tanggal.
- R0/R1 (belum tertutup penuh): gap matrix & prototipe ada, tetapi role/action gate penuh, DTO, shell FM lima zona, import skuad, enam stream pendapatan, tiga skenario, approval/lock, PDF snapshot, inbox tugas, dan audit menyusul.
- Gate reviewer yang masih terbuka: reviewer finance/sepak bola/aturan kompetisi belum ditunjuk; dataset pilot & provenance belum; staging/storage privat/key custody/queue DevOps belum final; QA browser masih ditanggung PM; kontrak v2 & file ownership belum dibekukan (technical plan §20).
- Backlog teknis belum terselesaikan: DAT-01, TAC-01, SQD-01, FIN-01/02/03, REV-01, SIM-01, APR-01, PDF-01, UX-02 (DataTable/Inspector/states), SEC-02, UX-01 lanjutan, OPS-01 restore drill penuh, QA-01 pilot tiga journey.
- Risiko tata kelola: PM kembali mengejar jumlah fitur/test/commit; acceptance harus diukur dari journey, defect yang lolos ke Owner, umur blocker, akurasi klaim, dan deviasi estimasi (technical plan §17).
- Tidak ada perubahan yang dibuat oleh assessment ini. CTO_HANDOFF.md sudah berstatus ACKNOWLEDGED sejak semula; tidak diubah.

---

## 7. Batas assessment ini

- Read-only: tidak ada deploy, push, DB write, kredensial yang dibuka, perubahan kode, atau perubahan model. Satu-satunya file yang ditulis: `docs/assessment/JUARA_FEATURE_MAP.md`.
- Angka test (40/46/57/65/71/74) adalah angka yang tercatat pada artefak; reviewer audit Owner Representative menjalankan ulang subset (mis. 74/74), sedangkan build/runtime remote tetap dilabeli sebagai laporan PM, bukan eksekusi mandiri reviewer.
- Status ACCEPTED di document ini merujuk pada keputusan tertulis yang sudah ada di artefak; tidak menambah penerimaan baru.
