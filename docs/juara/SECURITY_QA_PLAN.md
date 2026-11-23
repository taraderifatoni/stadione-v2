# RENCANA PENGUJIAN KEAMANAN, ISOLASI TENANT & QA — JUARA.STADIONE.PRO

**v1 — AUDIT DOKUMEN (seluruh artefak Sprint 0 final)**

| Atribut | Nilai |
|---|---|
| Versi | **v1** — revisi dari v0 (`v0 — RENCANA, belum diaudit`) setelah gelombang akhir artefak Divisi 1–5, D1–D5, dan R1–R12 tersedia |
| Status | `RENCANA + AUDIT DOKUMEN`. **0/36 skenario RBAC, 0/13 RLS, 0/10 enkripsi dijalankan** terhadap runtime/DB/server. |
| Pembuat | worker Divisi 6 — DevOps, Security & Quality Assurance (The Shield) |
| Rantai komando | Owner → CTO (`ses_dff75dd2effeCFUgcR7oA66Mu8`) → PM (`ses_dfd621110ffeVnw419vDE4qR43`) → Divisi 6 |
| Artefak | `docs/juara/SECURITY_QA_PLAN.md` — **satu-satunya file yang ditulis** |
| Wewenang | read-only terhadap kode produk & artefak divisi lain. Dilarang: migrasi/apply DB, deploy, DNS, SSL, push, restart container, kredensial, data klub riil, perubahan kode produksi, pen-test ke server live. |
| Skill `verify` | **Tersedia dan berhasil dimuat di harness Divisi 6 sesi ini** (berbeda dengan laporan Divisi 1/3/4/PM). Dipakai untuk evidence gate: perintah segar dijalankan → output dibaca → klaim ditulis. Rincian §15. |

## Ringkasan perubahan v0 → v1

- v0 = rencana tanpa audit; **v1 = rencana + audit silang** terhadap 8 artefak final dengan nomor baris.
- **Matriks 36 RBAC tetap 12 `ALLOW` / 20 `ALLOW*` / 4 `DENY`**, kini cocok 1:1 dengan `ARCHITECTURE.md` §5 baris 325–334 dan dipetakan ke 9 route `UIUX_SPEC.md` §1.
- **Temuan lama ditutup:** F-01, F-04, F-05, F-06, F-07, F-09, F-10 (F-08 sebagian, lihat §12.1). **F-02/F-03 tetap terbuka** (butuh Owner).
- **Temuan baru N-01…N-05** (watermark statis vs dinamis; urutan pembulatan amortisasi; penyimpanan rate-card; ketidaksesuaian catatan tooling; ambang SCR < 58%).
- **R11** mengunci `club_id` = `auth.uid()` ∩ membership ∩ JWT claim, GUC dilarang; **R10** menempatkan `sponsor_contract_value_enc` di `juara_contracts_vault`; **R12** (IDP, `PROTECTED TECHNICAL ASSET`, time-series PHV, `idempotency_key`) masuk checklist §13 tanpa menambah tabel/DB.
- **8 tabel** `juara_*` dan **8 kolom sensitif** final; situasi `FORCE RLS` pada `juara_club_members` didokumentasikan sebagai pengecualian teknis yang disengaja (§5.2).

---

## 0. Empat pembedaan yang wajib dijaga

1. **Rencana ≠ eksekusi.** Semua `ALLOW`/`DENY`, CT-*, E-*, R12-* di bawah adalah ekspektasi dan prosedur uji, bukan hasil. Tidak ada test suite product, endpoint, migrasi, atau server yang dijalankan. Status pengujian runtime: `BELUM DIEKSEKUSI` (Sprint 1).
2. **Audit dokumen ≠ uji implementasi.** `A✅` = klaim sudah cocok silang dengan artefak final + nomor baris; `I⏳` = harus dibuktikan dengan eksekusi saat implementasi (Sprint 1). Tidak ada satu pun `I⏳` yang dianggap lulus hanya karena dokumen Cocok.
3. **Temuan ≠ koreksi.** §12 mencatat temuan. **Tidak ada koreksi yang diterapkan worker Divisi 6** pada file divisi mana pun. Status koreksi, koreksi yang sudah ada di dokumen lain (mis. R9 di RULEBOOK TV-15) disebut eksplisit.
4. **Keputusan ≠ asumsi.** D1–D5 (CTO delegasi Owner) dan R1–R12 (PM) adalah keputusan final yang mengikat, bukan asumsi, tidak dibuka kembali. Yang masih `PENDING` ditandai eksplisit (§14).

---

## 1. Landasan final (bukan asumsi)

### 1.1 Keputusan CTO (D1–D5, `DECISIONS.md`)

| ID | Isi | Dampak QA |
|---|---|---|
| D1 | Approach B — vertical slice end-to-end | Uji slice: rulebook → age/grade → SCR+amortisasi → 1 PDF. |
| D2 | K3 Supabase Auth + RBAC 6 peran; SSO menyusul. **Gate keras:** RLS cross-tenant lolos + AES-256-GCM aplikasi → `BYTEA` terbukti tak terbaca admin DB, **Sprint 1**. | §5 dan §6 adalah gate, bukan opsional. |
| D3 | UAT 3 template PRD + adapter import terenkripsi sejak sekarang; data riil = gate v1.0 | Data uji hanya `TEMPLATE_PRD` / `INPUT_MANUAL_KLUB`. |
| D4 | Satu repo, satu Supabase project/DB, satu `auth.users`; `schema public` + prefix `juara_*`; RLS `club_id` dari JWT/membership; `service_role` B2C tidak dipakai; AES-256-GCM aplikasi → `BYTEA` | Semua assertion memakai 8 tabel `juara_*`; dilarang project/DB/auth/schema baru. |
| D5 | Paralel per dependency; v0 sekarang, v1 audit menyusul | v1 ini adalah tahap akhir sesuai penugasan. |

### 1.2 Putusan PM (`PM_RULINGS.md` R1–R12) yang dipakai QA

| # | Putusan | Pemakaian dalam v1 |
|---|---|---|
| R1 | Re-amortisasi = 4 tahun → 275 jt/thn | Vektor amortisasi §7; `reamortization_years=4`. |
| R2 | SCR wajib 5 komponen pembilang + 6 penyebut sbg field terpisah | 11 field `scr_num_*`/`scr_den_*` di `juara_projections` (ARCH:221–232). |
| R3 | Band menit = band per-tier, bukan kuota agregat | Uji `projected_minutes` per pemain. |
| R4 | Porsi 6 pilar = band relatif, bukan hard sum | Uji tidak ada normalisasi paksa 100%. |
| R5 | Beban gaji A/B/C = band, pembulatan terkontrol | Uji batas 45–50/35–40/10–15%. |
| R6 | Usia representatif 19/23/27/31 → 24,40 | Vektor weighted age §7. |
| R7 | Multiplier = input terkonfigurasi, default 1.0 | Uji tidak ada hardcode multiplier. |
| R8 | Step-up 15/35/60 = pemicu, tanpa besaran | Uji `salary_step_appearances='{15,35,60}'`. |
| R9 | Loan operative = < 550 menit/pemain (bukan 5.643) | RULEBOOK TV-15 sudah dikoreksi (baris 285); uji `loan_minute_threshold=550`. |
| R10 | `sponsor_contract_value_enc` di `juara_contracts_vault` | F-06 ditutup; 8 kolom sensitif §6.1. |
| R11 | `club_id` = `auth.uid()` ∩ `juara_club_members` ∩ JWT claim; **GUC dilarang** | F-04 ditutup; §5.1, CT-07/CT-12. |
| R12 | IDP, `PROTECTED TECHNICAL ASSET`, time-series PHV, `idempotency_key` diterima sbg desain v1; tanpa tabel baru/DB diubah sekarang | Checklist §13. |

---

## 2. Cakupan audit dokumen (sumber & baris yang dibaca)

| Artefak | Baris | Dipakai untuk |
|---|---|---|
| `docs/juara/RULEBOOK.md` | 338 | 27 test vector; TV-15 terkoreksi R9 (baris 285); A1–A8 §14 |
| `docs/juara/UIUX_SPEC.md` | 389 | 9 route (baris 61–71); watermark PDF (baris 281–302); DoD UI (318–326) |
| `docs/juara/ARCHITECTURE.md` | 513 | 8 tabel (43–52); RLS/R11 (273–317); matriks 36 (325–334); kripto (348–385); endpoint (393–405) |
| `docs/juara/FINANCE_SPEC.md` | 515 | SCR 58,68% & Δ 286.206.896,55 (389–419); watermark dinamis (311–320); verifikasi (437–488) |
| `docs/juara/ACADEMY_INTEGRATION_SPEC.md` | 397 | R12 usulan §2 (79–89); ARI (94–132); HMAC & idempotensi (271–303); verifikasi (352–380) |
| `docs/juara/DECISIONS.md` | 115 | D1–D5 |
| `docs/juara/PM_RULINGS.md` | 34 | R1–R12 |
| `docs/juara/PRD-JUARA.md` | 721 | §1.3, §7, §9, §10, §11 (DoD per sprint) |
| design doc PM (`docs/superpowers/specs/2026-11-22-juara-stadione-pro-design.md`) | 165 | §7 K1–K7; §9; §11.1–11.6 |

`graphify query "JUARA RLS club_id AES-256-GCM sponsor_contract_value_enc juara tables RBAC"` dijalankan lebih dulu; graf (build 07.09.2026) hanya berisi kode B2C dan tidak memuat artefak `juara_*` — konsisten dengan Sprint 0 yang masih desain. Sumber dibaca langsung dari dokumentasi di atas.

---

## 3. Definisi 6 peran × 6 modul (dikonfirmasi dari arsitektur & UI)

### 3.1 Enam peran (PRD §1.3; ARCH §2.2.2 ENUM `juara_role`)

`OWN` Owner/Investor · `CEO` CEO/VP Commercial · `SPO` Sporting Director · `COA` Head Coach · `FIN` Finance Controller · `SEC` Secretary/Team Manager.

### 3.2 Enam modul uji ↔ 9 route (UIUX_SPEC §1, baris 61–71)

| Modul | Nama | Route | Status slice (UIUX) |
|---|---|---|---|
| M1 | Owner Vision & Playbook | `/juara/playbook` (#2) | AKTIF |
| M2 | Squad, Depth Chart & Tactics + Scouting | `/juara/squad` (#3), `/juara/tactics` (#4), `/juara/scouting` (#6) | AKTIF + terdaftar |
| M3 | Academy & ARI | `/juara/academy` (#5) | terdaftar |
| M4 | Finance, SCR & Amortization | `/juara/finances` (#7) | AKTIF |
| M5 | Commercial & Sponsorship | `/juara/commercial` (#8) | terdaftar |
| M6 | Vault & Governance (+ Inbox) | `/juara/vault` (#9), `/juara/inbox` (#1) | status saja / ringkas |

> F-09 ditutup: pemetaan v0 kini bersesuaian dengan 9 entri IA UIUX dan matriks `ARCHITECTURE.md` §5. Route yang "terdaftar" tetap diuji pada level API/RBAC (Sprint 1), bukan diharuskan UI penuh di slice.

**Legenda status pada matriks:** `A✅` = lolos audit dokumen (cocok dengan ARCH §5 baris 327–332 + PRD §1.3 + DES §11.5); `I⏳` = baru bisa diuji saat implementasi Sprint 1 (HTTP 403 vs 0 baris RLS, redaksi field, audit log).

---

## 4. Matriks RBAC — 36 skenario (6 peran × 6 modul)

Semua baris: status **`A✅ / I⏳`** (audit dokumen lolos; eksekusi menunggu Sprint 1). `ALLOW*` = field terlarang **tidak boleh ikut terkirim**, termasuk bernilai `null` (ARCH:344). RLS tidak menggantikan RBAC (ARCH §4.3).

### OWN — Club Owner / Investor

| ID | Modul | Skenario uji | Ekspektasi | Dasar | Bukti saat implementasi (I⏳) | Status |
|---|---|---|---|---|---|---|
| RBAC-01 | M1 | Buat/edit Playbook, ubah rasio, kunci `LOCKED_ACTIVE`, baca equity | ALLOW | PRD §1.3 | 200; equity terdekripsi via `GET /contracts/{id}` beraudit | A✅ / I⏳ |
| RBAC-02 | M2 | Ubah DNA, susun 26–28 slot, gap analysis, profil gaya main | ALLOW | PRD §1.3 | 200; perubahan tersimpan | A✅ / I⏳ |
| RBAC-03 | M3 | Setujui promosi ARI ≥ 85, mentor pairing, kontrak akademi | ALLOW | PRD §1.3 | 200 | A✅ / I⏳ |
| RBAC-04 | M4 | Baca gaji, P&L, SCR, amortisasi; otorisasi kuning/merah | ALLOW | PRD §1.3; DES §11.5 | 200; angka sesuai §7 | A✅ / I⏳ |
| RBAC-05 | M5 | Edit rate-card, 6 pilar, nilai kontrak sponsor | ALLOW | PRD §1.3 | 200; ciphertext di vault | A✅ / I⏳ |
| RBAC-06 | M6 | Buka brankas, dekripsi gaji, ubah RBAC, baca audit log | ALLOW | PRD §1.3 | 200; `GET /audit-log` hanya OWN (ARCH:403) | A✅ / I⏳ |

### CEO — CEO / VP Business & Commercial

| ID | Modul | Skenario uji | Ekspektasi | Dasar | Bukti saat implementasi (I⏳) | Status |
|---|---|---|---|---|---|---|
| RBAC-07 | M1 | Baca Playbook & asumsi; **coba kunci Playbook** | ALLOW* | PRD §1.3 | Baca 200; kunci DENY (khusus OWN, ARCH:399) | A✅ / I⏳ |
| RBAC-08 | M2 | Baca ringkasan skuad; **coba edit depth chart** | ALLOW* | PRD §1.3 | Ringkasan 200; edit DENY | A✅ / I⏳ |
| RBAC-09 | M3 | Baca ringkasan academy; **coba ubah ARI/IDP** | ALLOW* | PRD §1.3 | Ringkasan 200; ubah DENY | A✅ / I⏳ |
| RBAC-10 | M4 | Baca/edit anggaran operasional, pendapatan, SCR | ALLOW | PRD §1.3; DES §11.5 | 200 | A✅ / I⏳ |
| RBAC-11 | M5 | Penuh sponsor, rate-card, inventory iklan, tiket/merchandise | ALLOW | PRD §1.3 | 200 | A✅ / I⏳ |
| RBAC-12 | M6 | Buka kontrak & gaji; **coba ubah RBAC/audit log** | ALLOW* | DES §11.5 | Buka 200; governance DENY | A✅ / I⏳ |

### SPO — Sporting Director / Technical Director

| ID | Modul | Skenario uji | Ekspektasi | Dasar | Bukti saat implementasi (I⏳) | Status |
|---|---|---|---|---|---|---|
| RBAC-13 | M1 | Baca DNA/target usia-grade; **coba ubah equity/visi finansial** | ALLOW* | PRD §1.3 | Baca 200; field finansial DENY | A✅ / I⏳ |
| RBAC-14 | M2 | Penuh arsitektur skuad, kurva usia, rekrutmen, gap analysis | ALLOW | PRD §1.3 | 200; DTO tanpa gaji individu (ACADEMY:77) | A✅ / I⏳ |
| RBAC-15 | M3 | Penuh jalur promosi akademi, ARI, mentor, IDP | ALLOW | PRD §1.3 | 200 | A✅ / I⏳ |
| RBAC-16 | M4 | Baca **pagu posisi**; **coba baca gaji individual, PPh 21, P&L** | ALLOW* | PRD §1.3; DES §11.5 | Pagu 200; field terlarang **tidak boleh muncul walau null** (ARCH:344) | A✅ / I⏳ |
| RBAC-17 | M5 | **Coba baca nilai kontrak sponsor & rate-card** | DENY | PRD §1.3; ARCH §5 | 403 / field tidak dikirim | A✅ / I⏳ |
| RBAC-18 | M6 | Baca tanggal/status kontrak; **coba baca nominal/klausul/gaji** | ALLOW* | DES §11.5 | Tanggal/status 200; nominal DENY (ARCH:342) | A✅ / I⏳ |

### COA — Head Coach / Pelatih Kepala

| ID | Modul | Skenario uji | Ekspektasi | Dasar | Bukti saat implementasi (I⏳) | Status |
|---|---|---|---|---|---|---|
| RBAC-19 | M1 | Baca Tactical DNA; **coba edit/lock Playbook atau baca equity** | ALLOW* | PRD §1.3 | Baca DNA 200; edit/lock/equity DENY | A✅ / I⏳ |
| RBAC-20 | M2 | Penuh depth chart, Tactical DNA, profil gaya main | ALLOW | PRD §1.3 | 200 | A✅ / I⏳ |
| RBAC-21 | M3 | Baca kesiapan promosi & IDP; **coba ubah kontrak/ARI final** | ALLOW* | PRD §1.3 | Baca 200; perubahan kontrak DENY | A✅ / I⏳ |
| RBAC-22 | M4 | **Coba baca gaji, kompensasi, laba-rugi** | DENY | PRD §1.3; DES §11.5 | 403; nol angka finansial | A✅ / I⏳ |
| RBAC-23 | M5 | **Coba baca proyeksi pendapatan / nilai sponsor** | DENY | PRD §1.3 | 403 | A✅ / I⏳ |
| RBAC-24 | M6 | Baca tanggal akhir/status kontrak; **coba baca nominal/klausul** | ALLOW* | DES §11.5 | Tanggal/status 200; nominal DENY (ARCH:341) | A✅ / I⏳ |

### FIN — Finance Controller

| ID | Modul | Skenario uji | Ekspektasi | Dasar | Bukti saat implementasi (I⏳) | Status |
|---|---|---|---|---|---|---|
| RBAC-25 | M1 | Baca asumsi finansial; **coba lock/approve Playbook** | ALLOW* | PRD §1.3 | Baca 200; lock DENY | A✅ / I⏳ |
| RBAC-26 | M2 | Baca biaya skuad/dampak age-grade; **coba edit DNA** | ALLOW* | PRD §1.3 | Baca 200; edit DENY | A✅ / I⏳ |
| RBAC-27 | M3 | Baca dampak biaya akademi; **coba ubah IDP/ARI** | ALLOW* | PRD §1.3 | Baca 200; ubah DENY | A✅ / I⏳ |
| RBAC-28 | M4 | Penuh CapEx/OpEx, arus kas 12 bln, SCR, amortisasi, gaji | ALLOW | PRD §1.3; DES §11.5 | 200; 2 desimal (PRD Sprint 4 DoD) | A✅ / I⏳ |
| RBAC-29 | M5 | Baca pendapatan sbg input SCR; **coba edit rate-card** | ALLOW* | PRD §1.3 | Baca 200; edit DENY | A✅ / I⏳ |
| RBAC-30 | M6 | Penuh brankas kontrak & gaji; **coba ubah RBAC anggota** | ALLOW* | DES §11.5 | Buka 200; governance DENY | A✅ / I⏳ |

### SEC — Club Secretary / Team Manager

| ID | Modul | Skenario uji | Ekspektasi | Dasar | Bukti saat implementasi (I⏳) | Status |
|---|---|---|---|---|---|---|
| RBAC-31 | M1 | Baca nama versi & status; **coba baca visi/equity/rasio** | ALLOW* | PRD §1.3 | Metadata 200; detail DENY | A✅ / I⏳ |
| RBAC-32 | M2 | Baca daftar pemain/posisi utk logistik; **coba edit depth chart** | ALLOW* | PRD §1.3 | Baca 200; edit DENY | A✅ / I⏳ |
| RBAC-33 | M3 | Baca status administrasi akademi; **coba ubah ARI/IDP** | ALLOW* | PRD §1.3 | Baca 200; ubah DENY | A✅ / I⏳ |
| RBAC-34 | M4 | **Coba baca gaji, nominal kontrak, arus kas, P&L** | DENY | PRD §1.3; DES §11.5 | 403; nol angka finansial | A✅ / I⏳ |
| RBAC-35 | M5 | Baca nama aset sponsor; **coba baca nilai/rate-card** | ALLOW* | PRD §1.3 | Nama aset 200; nilai DENY | A✅ / I⏳ |
| RBAC-36 | M6 | Baca **tanggal & status dokumen kontrak saja**; **coba nominal/klausul/gaji** | ALLOW* | DES §11.5 | Tanggal/status 200; nominal DENY (ARCH:342) | A✅ / I⏳ |

**Hitungan ulang terverifikasi:** 6 × 6 = **36**; `ALLOW` **12**, `ALLOW*` **20**, `DENY` **4** (SPO-M5, COA-M4, COA-M5, SEC-M4) — cocok dengan `ARCHITECTURE.md` baris 334 dan perintah hitung §15.

---

## 5. Isolasi tenant — strategi uji RLS cross-tenant (gate keras D2; Sprint 1)

### 5.1 Sumber `club_id` final (F-04 DITUTUP)

`club_id` **tidak pernah** dari body klien dan **tidak memakai** GUC `app.current_setting('app.current_club_id')` (legacy PRD §11 Sprint 0, kalah dengan D2/D4). Sumber final `[R11, ARCH §4.1 baris 273–301]`:

```
auth.uid()  ∩  juara_club_members aktif  ∩  klaim request.jwt.claims.club_id
```

Fungsi `public.juara_current_club_id()` = `SECURITY DEFINER`, `SET search_path=public,pg_temp`, `REVOKE ... FROM PUBLIC`, `GRANT EXECUTE TO authenticated`; **fail-closed** (tanpa keanggotaan aktif → `NULL` → 0 baris). User multi-klub wajib membawa klaim `club_id`.

### 5.2 Inventaris RLS 8 tabel & nuansa `FORCE`

| # | Tabel | RLS | `FORCE RLS` | Catatan uji |
|---|---|---|---|---|
| 1–7 | `juara_clubs`, `juara_playbooks`, `juara_squad_slots`, `juara_players`, `juara_contracts_vault`, `juara_projections`, `juara_audit_logs` | ya | **ya** | `relrowsecurity=true` + `relforcerowsecurity=true` |
| 8 | `juara_club_members` | ya | **tidak sengaja** | `relrowsecurity=true`, `relforcerowsecurity=false`; alasan: helper `SECURITY DEFINER` di §5.1 membaca tabel ini — `FORCE` akan mengenakan RLS pada owner dan memicu rekursi/fail-closed total (ARCH:93, 309, 506). Policy: `user_id = auth.uid() OR club_id = juara_current_club_id()` |

**Penerimaan nuansa (menjawab ARCH §10.3 #8):** pengecualian `FORCE` diterima **bersyarat**: (a) tabel tidak di-`GRANT` kepada `anon`/`authenticated` sebagai owner; (b) helper adalah satu-satunya jalan baca `club_id`; (c) CT-12 membuktikan user tidak bisa melihat keanggotaan klub lain; (d) CT-10 mencatat 8/8 `relrowsecurity=true` dan 7/8 `relforcerowsecurity=true` + alasan baris 93. `juara_audit_logs` append-only (SELECT+INSERT, ARCH:311, 254).

### 5.3 Skenario uji

| ID | Skenario | Cara membuktikan | Ekspektasi | Status |
|---|---|---|---|---|
| CT-01 | User A SELECT 8 tabel `juara_*` | Seed klub A/B + sentinel; baca tanpa filter | Hanya baris A; sentinel B tak muncul di baris/`count()`/agregat | A✅ / I⏳ |
| CT-02 | User A SELECT `WHERE club_id = B` | Query eksplisit lintas tenant | 0 baris, bukan error bocor | A✅ / I⏳ |
| CT-03 | User A UPDATE/DELETE baris B by ID | `rowCount` | 0; data B utuh | A✅ / I⏳ |
| CT-04 | User A INSERT `club_id = B` | API + klien DB uji | Ditolak `WITH CHECK` | A✅ / I⏳ |
| CT-05 | Pencabutan keanggotaan | `is_active=false` + `revoked_at`, request ulang | Akses hilang setelah batas usia JWT (PENDING Owner, §14) | A✅ / I⏳ |
| CT-06 | Hook `academy_id → public.academies` | Join HK-1 | Tak ada tenant lain terekspos; FK read-only (ARCH:464) | A✅ / I⏳ |
| CT-07 | JWT klaim `club_id` palsu | Manipulasi klaim di klien uji | Ditolak: harus cocok dgn membership `auth.uid()` (R11) | A✅ / I⏳ |
| CT-08 | `service_role` B2C ke `juara_*` | Statis: tidak ada pemakaian; dinamis: `REVOKE ALL` per tabel (ARCH:381–385) | Tanpa bypass; **nilai kredensial tidak pernah ditampilkan** | A✅ / I⏳ |
| CT-09 | Audit `CROSS_TENANT_DENIED` | `juara_audit_logs`, `metadata` tanpa plaintext (ARCH:248, 252) | Percobaan tercatat | A✅ / I⏳ |
| CT-10 | Inventaris 8/8 tabel | Katalog `relrowsecurity`, `relforcerowsecurity` | 8/8 RLS aktif; 7/8 FORCE + pengecualian terdokumentasi | A✅ / I⏳ |
| CT-11 | Memakai GUC `app.current_club_id` | Set GUC lalu query | **Ditolak / diabaikan** — bukan sumber `club_id` (R11) | A✅ / I⏳ |
| CT-12 | Policy `juara_club_members` | User A baca members | Hanya `user_id=self` atau member klub A; tak ada klub B | A✅ / I⏳ |
| CT-13 | Webhook HMAC `club_id` klub lain + duplikat `idempotency_key` | `POST /bridge/*` dengan HMAC valid, payload B | `CROSS_TENANT_DENIED`, tanpa *existence oracle*; event duplikat tidak diproses 2× (ACADEMY:281, 293) | A✅ / I⏳ |

---

## 6. Kolom sensitif & pembuktian enkripsi aplikasi (gate keras D2)

### 6.1 Delapan kolom sensitif final (F-06 DITUTUP)

| # | Tabel | Kolom | Isi |
|---|---|---|---|
| 1 | `juara_playbooks` | `owner_equity_injection_enc` | Suntikan ekuitas Owner |
| 2 | `juara_contracts_vault` | `base_salary_monthly_enc` | Gaji pokok bulanan |
| 3 | `juara_contracts_vault` | `signing_on_fee_total_enc` | Signing-on fee |
| 4 | `juara_contracts_vault` | `transfer_fee_capitalized_enc` | Transfer terkapitalisasi |
| 5 | `juara_contracts_vault` | `agent_fee_capitalized_enc` | Komisi agen |
| 6 | `juara_contracts_vault` | `release_clause_enc` | Klausul buy-out |
| 7 | `juara_contracts_vault` | `performance_bonus_rules_enc` | JSON bonus 70:30 |
| 8 | `juara_contracts_vault` | **`sponsor_contract_value_enc`** | Nilai kontrak sponsor — **R10: di vault, bukan `juara_projections`** |

Sesuai `ARCHITECTURE.md` §6.4 baris 374–376 dan `FINANCE_SPEC.md` baris 294–299. Angka turunan (`monthly_amortization_value`, `net_book_value_current`, `calculated_scr_pct`, revenue agregat) sengaja plaintext; kerahasiaan via RLS+RBAC.

### 6.2 Format & kunci (nama saja — DILARANG menulis nilai kunci)

```
[version:1][key_id_len:1][key_id][nonce:12][ciphertext || GCM tag:16]
AAD = club_id | table_name | column_name | row_id | key_id        (ARCH §6.2)
Nama environment: JUARA_ENCRYPTION_KEYS , JUARA_ACTIVE_KEY_ID     (ARCH §6.3)
Pemegang kunci: Owner. Worker/PM/CTO tidak menerima/melihat/menyalin/mencetak nilai.
```

AAD mengikat ciphertext ke tenant/tabel/kolom/baris → cipher tidak bisa dipindah (mendukung CT-02/03). `key_id` memungkinkan rotasi tanpa reshape (E-09). Tidak ada fungsi dekripsi di SQL.

### 6.3 Skenario pembuktian

| ID | Skenario | Cara membuktikan | Ekspektasi | Status |
|---|---|---|---|---|
| E-01 | Ciphertext vs plaintext | Sentinel ditulis via aplikasi ke DB uji; baca byte mentah sbg admin DB uji | Entropi tinggi; nol substring sentinel; struktur GCM terdeteksi | A✅ / I⏳ |
| E-02 | Admin DB tak bisa membaca | SELECT `bytea` tanpa kunci | Tetap ciphertext; tak ada dekripsi di DB | A✅ / I⏳ |
| E-03 | GCM integrity — kunci salah | Dekripsi kunci uji salah | Gagal autentikasi, tanpa plaintext parsial | A✅ / I⏳ |
| E-04 | GCM integrity — tamper | Ubah 1 byte ciphertext/tag | Gagal tag check | A✅ / I⏳ |
| E-05 | Kebocoran log | Tangkap stdout/stderr saat enkripsi/dekripsi | Nol sentinel & nol kunci | A✅ / I⏳ |
| E-06 | Hardcode | Secret/static scan source | Nol literal kunci; hanya nama variabel | A✅ / I⏳ |
| E-07 | Backup/export | Dump DB uji & artefak ekspor | Nol plaintext | A✅ / I⏳ |
| E-08 | Pemisahan akses | User ber-`SELECT` vault tapi tanpa hak aplikasi | Tetap ciphertext; dekripsi DENY | A✅ / I⏳ |
| E-09 | Rotasi via `key_id` | Rotasi kunci di lingkungan uji | Ciphertext lama terbaca dgn `key_id` lama | A✅ / I⏳ |
| E-10 | AAD binding | Pindahkan cipher antar klub/kolom/baris uji | Dekripsi gagal (AAD tidak cocok) | A✅ / I⏳ |

---

## 7. Uji silang angka kunci (bukti perintah segar di §15)

| Angka | Sumber artefak | Hitung ulang | Status audit |
|---|---|---|---|
| Amortisasi bulanan | RULEBOOK TV-01:271; FINANCE:371 | `1.650.000.000 / 36 = 45.833.333,3333…` → tampil **45.833.333,33** | A✅ |
| Amortisasi tahunan | RULEBOOK TV-02:272; FINANCE:372 | **550.000.000,00** dari nilai **eksak** ×12 (lihat N-02) | A✅ |
| NBV akhir Y1 | RULEBOOK TV-03:273; FINANCE:379 | **1.100.000.000,00** | A✅ |
| Re-amortisasi 4 thn (R1) | RULEBOOK TV-04:274; FINANCE:381 | **275.000.000,00**/thn | A✅ |
| Amortisasi bulanan baru | turunan FINANCE:382 | 22.916.666,67 | A✅ |
| SCR sebelum | TV-06:276, TV-08:278; FINANCE:406 | 14.651.000.000 / 24.500.000.000 = **59,80%** → `YELLOW_WATCHLIST` | A✅ |
| SCR sesudah re-amort | FINANCE:410 | 14.376.000.000 / 24.500.000.000 = **58,68%** (turun 1,12 poin) | A✅ |
| Δ sponsor ke 58% | FINANCE:414 | 14.376.000.000/0,58 − 24.500.000.000 = **286.206.896,55** | A✅ |
| Weighted age | RULEBOOK TV-12:282, R6 | 19/23/27/31 × 25/25/40/10 = **24,40** | A✅ |
| ARI | TV-20…24:290–294; ACADEMY:129–132 | **85,00 / 72,25 / 79,10 / 63,25** (bobot 30/25/25/20) | A✅ |
| Cash buffer | TV-09:279; FINANCE:152 | **3.875.000.000** | A✅ |
| Solidaritas FIFA | TV-16:286 | 5% × 10 M = **500.000.000** | A✅ |
| Loan threshold | R9; RULEBOOK:285; ARCH:237 | **550 menit/pemain**, bukan 5.643 | A✅ |
| Struktur | ARCH:327–332 / 43–52 / 374–376 | **36 sel RBAC (12/20/4), 8 tabel, 8 kolom `*_enc`** | A✅ |

> **Penandaan penting:** 58,68% dan 286.206.896,55 adalah **turunan** dari rincian ilustratif `FINANCE_SPEC` §9.3 (baris 396–419), bukan angka eksplisit PRD. Test suite wajib memberi label "ilustrasi/template", bukan "fakta PRD", dan dilarang mengarang rincian komponen untuk data riil `[R2]`.

---

## 8. Rencana CI/CD — **RENCANA SAJA, TIDAK DIJALANKAN**

| Tahap | Aktivitas (rencana) | Gate |
|---|---|---|
| 0 | format, lint, typecheck | G1 bersih |
| 1 | `npm run build` (Next.js 16.2.12; baca `node_modules/next/dist/docs/` sblm kode — AGENTS.md) | G2 exit 0 |
| 2 | Unit: 27 TV + boundary SCR (58,0/58,1/65,0/65,01) + ARI (64,99/65/77/77,99/78/84/84,99/85) + **urutan pembulatan §7** | G3a 27/27 |
| 3 | Integrasi tenant: CT-01…CT-13; inventaris 8/8 RLS + 7/8 FORCE; GUC ditolak | G3b 13/13 |
| 4 | RBAC: RBAC-01…36; redaksi field SPO/COA/SEC | G3c 36/36 |
| 5 | Kripto: E-01…E-10; 8 kolom `*_enc`; AAD binding | G3d 10/10 |
| 6 | PDF: render + **watermark dinamis per halaman** (nama/peran/WIB) + uji antrean worker + redaksi peran | G3e lolos snapshot |
| 7 | Bridge: HMAC-SHA256 raw body, verifikasi sebelum parse, `idempotency_key`, CT-13 | G3f lolos |
| 8 | Security gate: secret scan, SAST, dependency audit, cek 8 kolom, cek file migrasi **ada** (tanpa apply), cek tak ada kredensial | G4/G5/G6 |
| 9 | Artifact: log tanpa plaintext/kunci | G7 bersih |

**Gate manual Owner (tidak otomatis):** apply migrasi M-00…M-06, deploy, DNS `juara.stadione.pro`, SSL/TLS, kredensial, kunci & rotasi, data klub riil, pen-test live. Tidak ada job yang boleh melewatinya.

---

## 9. Topologi staging vs produksi (konseptual — tanpa DNS/SSL)

| Aspek | Lingkungan uji (rencana) | Produksi (rencana, di luar wewenang v0/v1) |
|---|---|---|
| Kode | Route group `/juara` di repo `stadione-v2` yang sama | Sama |
| Routing | Middleware/rewrite; URL preview/internal | `juara.stadione.pro` — **belum ada DNS; tidak dibuat** |
| Data | Instance uji/ephemeral CI, 3 template + sentinel A/B | Satu Supabase project/DB live (D4), `schema public`, 8 tabel `juara_*` |
| Identitas | User uji di `auth.users` instance uji + `juara_club_members` | `auth.users` yang sama dengan stadione.pro |
| Enkripsi | Kunci uji di environment (nilai tidak dicatat) | Kunci dipegang Owner |
| TLS/SSL | Tidak ada konfigurasi sertifikat | Menunggu Owner |
| Bridge | HMAC secret uji (nama saja), endpoint tidak aktif | Menunggu Owner; tidak ada webhook nyata sekarang |

Batas: tidak ada project/DB/auth tenant baru; tidak ada perubahan *exposed schemas*; tabel B2C existing tidak diubah (ARCH §1, HK-1).

---

## 10. Test suite outline & urutan eksekusi

| No | Suite | Isi | Status |
|---|---|---|---|
| S1 | `formula.unit` | 27 TV + boundary + urutan pembulatan | A✅ dokumen / I⏳ eksekusi |
| S2 | `rls.integration` | CT-01…CT-13, 8 tabel, GUC ditolak | A✅ / I⏳ |
| S3 | `rbac.matrix` | RBAC-01…36 + redaksi field | A✅ / I⏳ |
| S4 | `crypto.app` | E-01…E-10, 8 kolom, AAD | A✅ / I⏳ |
| S5 | `pdf.export` | 15–25 hlm, watermark **dinamis** tiap halaman, antrean, redaksi peran | A✅ / I⏳ (lihat N-01) |
| S6 | `bridge.hmac` | HMAC raw-body, idempotensi, CT-13 | A✅ / I⏳ |
| S7 | `ci.security` | secret scan, SAST, dependency, inventaris migrasi (tanpa apply) | A✅ / I⏳ |
| S8 | `manual.owner-gate` | apply/deploy/DNS/SSL/kredensial/data riil/pen-test live | **TIDAK dijalankan worker** |

Urutan: S1 → S2 → S3 → S4 → S5 → S6 → S7 → (S8 hanya setelah Owner). Gate keras D2 = S2 + S4 hijau sebelum Sprint 1 dinyatakan lolos; kegagalan = fail-fast.

---

## 11. Definition of Done — v1

| ID | Kriteria | Sumber | Status audit | Status uji |
|---|---|---|---|---|
| DoD-01 | RLS 8/8 tabel; cross-tenant lolos; GUC ditolak | D2 gate 1; CT-01…13; R11 | A✅ | I⏳ Sprint 1 |
| DoD-02 | AES-256-GCM aplikasi → 8 `BYTEA`; admin DB tak baca plaintext; AAD | D2 gate 2; E-01…10 | A✅ | I⏳ Sprint 1 |
| DoD-03 | 36 skenario RBAC 12/20/4; field terlarang tidak dikirim | PRD §11 Sprint 1; ARCH:334 | A✅ | I⏳ Sprint 1 |
| DoD-04 | Amortisasi & SCR akurat 2 desimal; SCR merah mengunci rekrutmen | PRD §11 Sprint 4; §7 | A✅ | I⏳ Sprint 4 |
| DoD-05 | PDF 15–25 hlm + **watermark dinamis** (nama, peran, WIB) tiap halaman | PRD:702; FINANCE:311–320 | A✅ (FINANCE) / **N-01 (UIUX)** | I⏳ Sprint 6 |
| DoD-06 | `build`+`lint`+test rumus dengan exit code | DES §9.3 | A✅ desain | I⏳ |
| DoD-07 | Nol secret/plaintext di log & artefak; `juara_audit_logs` append-only | D4; ARCH:243–254 | A✅ | I⏳ |
| DoD-08 | 3 template PRD; label "Template PRD" vs "Input manual klub" | D3; DES §11.4; ACADEMY:309–312 | A✅ | I⏳ |
| DoD-09 | R12 didokumentasikan, tanpa tabel baru/DB diubah | R12 | A✅ | I⏳ (desain lanjutan) |
| DoD-10 | HMAC bridge + idempotensi; endpoint tidak aktif sekarang | ACADEMY:271–303 | A✅ | I⏳ Sprint 8 |
| DoD-11 | Gate data riil & deploy hanya setelah Owner | D3; DES §9.5 | A✅ | TIDAK dijalankan |

---

## 12. Temuan & resolusi

**Status koreksi:** tidak ada koreksi yang diterapkan Divisi 6. "DITUTUP" berarti temuan lama sudah dijawab oleh artefak/divisi lain dan diverifikasi silang di sini — bukan berarti diuji di runtime.

### 12.1 Temuan v0 yang ditutup

| ID | Temuan lama | Penutup (sumber baris) | Status |
|---|---|---|---|
| F-01 | Enkripsi "di DB"/pgcrypto vs gate D2 | ARCH:30, 348–376; FINANCE:34–36; R11 | **DITUTUP** — enkripsi aplikasi → `BYTEA` |
| F-04 | GUC `app.current_club_id` vs JWT/membership | R11 (PM_RULINGS:19); ARCH:273–317; ACADEMY:74 | **DITUTUP** — `auth.uid()` ∩ membership ∩ JWT; GUC dilarang; nuansa FORCE §5.2 |
| F-05 | Nama tabel PRD vs prefix `juara_*` | ARCH:43–57, 474–484 (M-00…M-06) | **DITUTUP** — 8 tabel `juara_*` |
| F-06 | Nilai kontrak sponsor tak terenkripsi | R10 (PM_RULINGS:18); ARCH:183, 194, 375; FINANCE:294–299 | **DITUTUP** — `sponsor_contract_value_enc` di `juara_contracts_vault`, dikonfirmasi QA v1 |
| F-07 | Import ditunda vs adapter disiapkan | ACADEMY:305–312 | **DITUTUP** — adapter disiapkan, impor massal ditunda |
| F-08 | A1–A8 belum diputus | PM_RULINGS R1–R9; RULEBOOK TV-15:285 sudah dikoreksi R9 | **DITUTUP untuk A1–A8**; catatan tooling tetap → N-04 |
| F-09 | 9 workspace vs 6 modul | UIUX:61–71; ARCH:325–334 | **DITUTUP** — §3.2 |
| F-10 | Tabel audit log belum ada | ARCH:52, 54, 243–254 (`juara_audit_logs`) | **DITUTUP** — tetap 8 tabel, bukan tenant baru |

### 12.2 Temuan v0 yang tetap terbuka (butuh Owner)

| ID | Temuan | Sumber | Status |
|---|---|---|---|
| F-02 | PRD minta DNS/TLS 1.3/Cloudflare WAF/KMS + staging HTTPS | PRD:666–667 | **TERBUKA** — ditunda ke lampu hijau Owner |
| F-03 | PRD minta SSO OAuth2/OIDC & pen-test penuh | PRD:669, 714 | **TERBUKA** — SSO menyusul (D2); pen-test live dilarang tanpa izin |

### 12.3 Temuan baru v1 (audit artefak final)

| ID | Keparahan | Temuan (inkonsistensi) | Sumber baris | Dampak | Aksi yang diminta |
|---|---|---|---|---|---|
| **N-01** | **MEDIUM** | Watermark PDF tidak konsisten: UIUX memakai teks statis `"KONFIDENSIAL — DEWAN DIREKSI"` @8%, sedangkan PRD/FINANCE mewajibkan dinamis `"RAHASIA — <nama_pengunduh> | <peran> | <stempel_waktu_WIB>"` di tiap halaman; DoD UIUX hanya menulis "watermark" tanpa identitas | `UIUX_SPEC.md:286, 325` vs `FINANCE_SPEC.md:311–320` vs `PRD-JUARA.md:702` | S5 bisa lolos spesifikasi UI tapi gagal audit jejak (PRD Sprint 6) | PM: tegaskan dynamic watermark sebagai yang mengikat; Divisi 2 sinkronkan token; QA pakai FINANCE/PRD sbg oracle |
| **N-02** | **MEDIUM** | Urutan pembulatan: teks menyatakan `45.833.333,33 × 12 = 550.000.000`, padahal hasilnya `549.999.999,96`. Nilai 550 jt hanya benar bila annual dihitung dari nilai **eksak** `1.650.000.000/36` lalu dibulatkan | `RULEBOOK.md:271–272` (TV-01/02), `FINANCE_SPEC.md:371–372` | Selisih Rp 4; engine bisa salah 4 rupiah bila mengalikan tampilan bulanan | PM/Divisi 1/4: nyatakan "hitung annual dari nilai eksak, bulatkan di akhir"; QA jadikan aturan S1 (terbukti §15) |
| **N-03** | **LOW** | Rate-card punya field `base_price_enc`, `term_months`, `renewal_date`, `step_up_multiplier`, tapi tidak ada tabel penyimpan koresponden di inventaris 8 tabel; `sponsor_contract_value_enc` hanya mencakup nilai kontrak | `FINANCE_SPEC.md:289–290` vs `ARCHITECTURE.md:43–57, 374–376` | Field rate-card berisiko tidak tersimpan / disimpan di tempat tak terdokumentasi | PM/Divisi 3/4: petakan ke kolom JSON existing atau justifikasi; **dilarang** menambah tabel ke-9 |
| **N-04** | **LOW** | Catatan ketersediaan skill `verify` bertentangan: 4 artefak melaporkan tidak tersedia, ACADEMY melaporkan tersedia & dipakai, Divisi 6 sesi ini benar-benar memuatnya | `RULEBOOK.md:320`, `PM_RULINGS.md:31–33`, `ARCHITECTURE.md:491`, `FINANCE_SPEC.md:441–444` vs `ACADEMY_INTEGRATION_SPEC.md:354` | Rekam verifikasi antar divisi tidak konsisten | PM: catat perbedaan harness, bukan koreksi angka; Divisi 6 pakai skill & laporkan terus terang (§15) |
| **N-05** | **LOW** | Aturan zona turunan: GREEN ≤ 58,00; YELLOW `58,00 < SCR ≤ scr_max_threshold_pct`. Jika threshold diset < 58 (bukan kasus Templat B yang < 60), interval YELLOW menjadi mustahil | `FINANCE_SPEC.md:202–205` | Ambang ekstrem bisa menghasilkan status tak terdefinisi | PM: tetapkan perilaku bila `scr_max_threshold_pct < 58` atau batasi validasi input ≥ 58 |

---

## 13. Penerapan R12 (checklist v1) — tanpa tabel baru, tanpa DB diubah

R12 menerima usulan Divisi 5 sebagai **dokumentasi desain v1**. Tidak ada `ALTER TABLE`, tidak ada tabel ke-9, tidak ada apply. Penempatan field final masih butuh keputusan PM (ACADEMY §13.7).

| ID | Item R12 | Penempatan rencana (belum di-apply) | Pemeriksaan QA | Status |
|---|---|---|---|---|
| R12-01 | 3 target IDP per siklus 12 minggu + tanggal siklus | Kolom/objek pada `juara_players` (atau JSON di kolom existing) — **PENDING keputusan PM** | Uji 3 target, review minggu ke-12, 0 data riil | A✅ desain / I⏳ |
| R12-02 | Flag `PROTECTED TECHNICAL ASSET` | Status `text` (bukan ENUM baru — ACADEMY:70); calon kolom boolean di `juara_players` **PENDING** | Uji late-maturer teknik tinggi masuk Bio-Banding; tidak ada ENUM ke-15 | A✅ desain / I⏳ |
| R12-03 | Time-series PHV (sitting/standing height, berat) tiap 3 bulan | Rencana: struktur/time-series dalam tabel `juara_*` existing ber-`club_id` + RLS; **PENDING** | Uji interval 3 bulan, `phv_maturity_stage`, tidak ada tabel baru | A✅ desain / I⏳ |
| R12-04 | `idempotency_key` dedupe webhook | Payload Zod `min(8)` (ARCH:453); rencana simpannya di `juara_audit_logs.metadata` + pengecekan aplikasi; constraint unik butuh izin terpisah | CT-13: event duplikat diproses 1×; HMAC sebelum parse | A✅ desain / I⏳ |

> R12 **tidak** mengubah daftar 8 tabel, 14 ENUM, atau 8 kolom sensitif pada v1 ini. Semua perubahan skema future mengikuti M-00…M-06 + izin Owner.

---

## 14. Hal yang tidak bisa diputuskan worker — diteruskan ke Owner via PM

1. Deploy, DNS `juara.stadione.pro`, SSL/TLS, hosting, kredensial (D2/D4; F-02).
2. Apply migrasi M-00…M-06 dan siapa yang menjalankan (ARCH §10.3 #1).
3. Kunci enkripsi: pemegang, nama secret final, prosedur rotasi (DES §11.3; ARCH §6.3).
4. Data klub riil teranonymisasi untuk UAT/gate v1.0 (D3) — bukan sekarang.
5. SSO `auth.stadione.pro` dan izin pen-test/OWASP ke live (D2; F-03).
6. Multi-peran per user & batas usia JWT saat pencabutan keanggotaan (ARCH §10.3 #6; CT-05).
7. Penempatan final field R12 (R12-01…04) — tanpa tabel baru (ACADEMY §13.7).
8. Resolusi N-01 (watermark dinamis), N-02 (urutan pembulatan), N-03 (penyimpanan rate-card), N-05 (threshold < 58%).
9. Angka final multiplier/step-up/jadwal termin & template aktif (R7/R8; FINANCE §12) — bukan constraint saat ini.

---

## 15. Rekam verifikasi — skill `verify` (dipakai, bukan sekadar diklaim)

**Ketersediaan jujur:** skill `verify` (itqan-engineering) **berhasil dimuat** di harness Divisi 6 sesi ini (perintah `skill verify` mengembalikan isi skill). Ini berbeda dengan laporan Divisi 1/3/4/PM yang menyatakannya tidak tersedia (N-04). Sesuai batas wewenang, tidak dibuat `verify.md`/`state.json`/`log.md` eksternal; rekam bukti ditempatkan di sini. Deliverable berupa dokumen, jadi pembuktiannya adalah **perintah segar + output dibaca**, bukan test suite aplikasi.

| # | Klaim | Perintah (dijalankan segar) | Output yang dibaca |
|---|---|---|---|
| V-1 | Sumber final terbaca | `wc -l` 8 artefak + `read` | 338/389/513/515/397/115/34/721 baris; sesuai §2 |
| V-2 | Angka kunci | `python3` + `Decimal(ROUND_HALF_UP)` | 45.833.333,33; annual eksak **550.000.000,00**; NBV 1.100.000.000; re-amort 275.000.000; SCR 59,80→58,68; Δ 286.206.896,55; weighted 24,40; ARI 85/72,25/79,10/63,25; buffer 3.875.000.000; solidaritas 500.000.000 → **11/11 cocok** |
| V-3 | Urutan pembulatan (N-02) | Perhitungan sama, `monthly*12` vs `exact*12` | `45.833.333,33 × 12 = 549.999.999,96`; `(1.650.000.000/36)*12 = 550.000.000,00` → temuan N-02 **terbukti** |
| V-4 | Struktur 36/8/8 | `grep -oE` pada ARCH:327–332, 43–52, 375 | RBAC `12 ALLOW + 20 ALLOW* + 4 DENY = 36`; tabel 8/8; kolom `_enc` 8/8 |
| V-5 | Matriks v1 = 36 | `grep -c '^| RBAC-' SECURITY_QA_PLAN.md` (sebelum rewrite) | 36 — tidak ada skenario hilang |
| V-6 | Watermark (N-01) | `grep -n` string pada UIUX & FINANCE | UIUX:286 statis vs FINANCE:314 dinamis → temuan N-01 **terbukti** |
| V-7 | Tanpa kredensial | `grep -nEi 'password|secret_key|api[_-]?key|private[_-]?key|BEGIN ...PRIVATE KEY|@supabase.co|zurmq2lrm9hj510fmnj1seqr'` | Nol nilai; hanya nama env `JUARA_ENCRYPTION_KEYS`, `JUARA_ACTIVE_KEY_ID` dan konsep `service_role` |
| V-8 | Batas wewenang | `git status --short docs/juara/` | Hanya `docs/juara/` berubah; satu file milik Divisi 6 ditulis; tidak ada kode produksi |
| V-9 | graphify | `graphify query "..."` | Dijalankan; tanpa node `juara_*` (graf 07.09) — wajar |

**Pernyataan jujur:** yang "lolos" pada V-1…V-9 adalah **audit dokumen dan aritmetika**, bukan pengujian sistem. Tidak ada endpoint, RLS policy, migrasi, PDF, webhook, atau server yang dieksekusi. Semua status `I⏳` pada matriks dan DoD belum terbukti secara runtime. Tidak ada klaim "pengujian lulus".

---

*v1 — rencana + audit dokumen Sprint 0. Revisi berikutnya hanya bila ada perubahan keputusan (PM/CTO/Owner) atau hasil eksekusi Sprint 1 yang perlu dicatat sebagai bukti baru.*
