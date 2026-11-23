# SPESIFIKASI MODUL — ACADEMY PATHWAY, SCOUTING & INTEGRATION HUB — JUARA.STADIONE.PRO

**Artefak Sprint 0 — Divisi 5 (Academy Pathway, Scouting & Integration Hub).**
Status: `DESAIN — BUKAN IZIN DEPLOY, MIGRASI, WEBHOOK AKTIF, ATAU PENGIRIMAN NOTIFIKASI`.
Rantai komando: Owner → CTO (`ses_dff75dd2effeCFUgcR7oA66Mu8`) → PM (`ses_dfd621110ffeVnw419vDE4qR43`) → Divisi 5.
Deliverable ini ditulis SETELAH gate Divisi 3 (`ARCHITECTURE.md`, 513 baris, terverifikasi PM) tercapai.
Satu fokus per worker. Satu-satunya file yang ditulis: `docs/juara/ACADEMY_INTEGRATION_SPEC.md`.

---

## 0. Hierarki otoritas dan sumber

Urutan konflik (mengikat): **D1–D5 (`DECISIONS.md`) > PM_RULINGS R1–R11 > PRD eksplisit > design doc DES §7/§11 > RULEBOOK > turunan Divisi 5**.

| Sumber | Dipakai untuk |
|---|---|
| `docs/juara/DECISIONS.md` D1–D5 | Approach B, K3/SSO menyusul, 3 template + adapter import, **D4 satu repo/DB/auth.users**, D5 paralelisasi + gate |
| `docs/juara/PM_RULINGS.md` R1–R11 | R7 multiplier, R8 step-up tanpa besaran, **R9 < 550 menit/pemain**, R10 kolom sponsor, **R11 club_id = auth.uid() ∩ membership ∩ JWT claim (GUC dilarang)** |
| `docs/juara/RULEBOOK.md` §1, §3, §6, §8–§10, §12–§13 | DNA/archetype, kuota+band gaji, SCR, kompensasi 70:30, menit, anti-leakage, LTAD/RAE/ARI, test vector |
| `docs/juara/ARCHITECTURE.md` §2, §4–§9 | Nama 8 tabel `juara_*`, 14 ENUM berprefix `juara_`, RLS, AES-256-GCM→BYTEA, RBAC 36 sel, hook HK-1/2/3, endpoint `/bridge/*` |
| `docs/juara/PRD-JUARA.md` §2.3, §7.3, §8.3–8.4, §9.1–9.3, Sprint 7–8 | Hook masa depan, solidaritas FIFA, alokasi menit, anti-leakage, LTAD/RAE/IDP/ARI, cakupan Sprint 7–8 |
| `docs/superpowers/specs/2026-11-22-juara-stadione-pro-design.md` §7, §11 | K1–K7, invite-only, enkripsi aplikasi, penundaan OpenAPI/impor massal |

PRD yang dipakai adalah `docs/juara/PRD-JUARA.md` (721 baris), **bukan** `PRD.md` root repo (produk B2C).

### 0.1 Keputusan yang SUDAH mengikat — bukan asumsi, tidak dibuka kembali

| ID | Keputusan CTO atas delegasi Owner | Dampak ke Divisi 5 |
|---|---|---|
| **D1** | Approach B — vertical slice end-to-end | Modul akademi/rekrutmen dirancang tipis tapi nyata, tidak membangun 10 modul UI sekaligus |
| **D2** | K3 = Supabase Auth + RBAC 6 peran; SSO `auth.stadione.pro` menyusul | Bridge/webhook tidak bergantung SSO hari pertama; gate keras RLS + enkripsi aplikasi tetap di Sprint 1 |
| **D3** | UAT = 3 template PRD + adapter import terenkripsi sejak sekarang | Semua angka di dokumen ini = **data simulasi `TEMPLATE_PRD`**; impor massal CSV/Excel ditunda; data klub riil = gate v1.0 |
| **D4** | JUARA = bagian dari stadione.pro; satu repo, satu DB, satu `auth.users`, `schema public`, prefix `juara_` | Tidak ada tabel/schema/tenant/DB baru; `juara_clubs.academy_id → public.academies` (FK read-only, Fase 2) |
| **D5** | Satu fokus per worker, paralel dengan integration gate | Dokumen ini tidak mengubah artefak Divisi 1–4, 6 |

R1–R11 adalah putusan **PM** (dapat ditimpa CTO/Owner), mengikat Divisi 3–6. R8/R9/R11 langsung dipakai di §6–§8.

### 0.2 Dua pembedaan yang WAJIB dipertahankan

| Pembedaan | Yang dimaksud di dokumen ini | Yang dilarang / tidak terjadi |
|---|---|---|
| **Desain webhook vs webhook aktif** | Spesifikasi kontrak, header HMAC-SHA256, idempotensi, dan endpoint `/api/juara/v1/bridge/academy-sync` + `/league-stats-sync` **didesain** (`ARCHITECTURE.md` §7.1 #9–10, HK-2). | Tidak ada endpoint yang di-deploy, diaktifkan, di-DNS-kan, atau menerima data eksternal nyata sekarang. Tidak ada kredensial/secret yang dibuat, dilihat, atau dicetak. |
| **Data simulasi vs data klub riil** | Semua contoh angka, pagu gaji, ARI, dan proyeksi menit berlabel `TEMPLATE_PRD` / `INPUT_MANUAL_KLUB` (DES §11.4). 3 template terkalibrasi = data uji `[D3]`. | Data klub riil (gaji, kontrak, PPh 21) tidak dipakai, tidak diminta, tidak disalin. Gate UAT v1.0 menunggu Owner `[D3]`. |

Dua pembedaan lain yang sama pentingnya: **desain notifikasi vs notifikasi terkirim** (§10: tidak ada email/WhatsApp yang dikirim), dan **desain field vs kolom DB aktif** (§2: usulan penambahan kolom tidak di-apply, tidak mengubah `ARCHITECTURE.md`).

---

## 1. Peta ke model data `ARCHITECTURE.md`

### 1.1 Tabel yang dipakai Divisi 5 (semua sudah ada di desain Divisi 3)

| Tabel | Peran Divisi 5 | Field kunci yang dipakai |
|---|---|---|
| `public.juara_clubs` | Root tenant + hook akademi | `id`/`club_id`, `academy_id` (nullable FK → `public.academies`, Fase 2), `source_label` |
| `public.juara_playbooks` | Sumber target kuota/grade/age + `scr_max_threshold_pct` | `id`, `status`, `scr_max_threshold_pct`, `source_label` |
| `public.juara_squad_slots` | Gap Analysis, Tier 3/4, rekrutmen, loan | `position_code`, `tactical_role_archetype`, `target_grade`, `target_age_min/max`, `projected_minutes`, `assigned_player_id`, `depth_tier` |
| `public.juara_players` | Profil akademi, ARI, RAE/PHV, IDP | `date_of_birth`, `birth_quarter`, `phv_maturity_stage`, `primary_role`, `secondary_role`, `current_ability_grade`, `potential_ceiling_grade`, `academy_readiness_index`, `ari_component_*`, `is_homegrown_epa`, `source_label` |
| `public.juara_contracts_vault` | Contract Expiry Radar, step-up, release clause | `contract_end_date`, `contract_status`, `salary_step_appearances` (`{15,35,60}`), `release_clause_enc`, `sponsor_contract_value_enc` `[R10]` |
| `public.juara_projections` | Pagu gaji & gate SCR | `calculated_scr_pct`, `scr_status`, `scr_num_*` (5), `scr_den_*` (6), `loan_minute_threshold` (default 550) `[R2][R9]` |
| `public.juara_club_members` | RBAC + sumber `club_id` | `user_id`, `role`, `is_active` `[R11]` |
| `public.juara_audit_logs` | Jejak akses/brankas/bridge | `actor_user_id`, `action`, `metadata` (tanpa plaintext sensitif) |

**Tidak ada tabel baru.** Kebutuhan yang belum ter-cover oleh kolom di atas ditulis sebagai *usulan tambahan* di §2 dan diberi label **butuh keputusan PM** — bukan keputusan Divisi 5, bukan perubahan artefak Divisi 3.

### 1.2 ENUM berprefix `juara_` yang dipakai (14, sesuai `ARCHITECTURE.md` §2.1/M-00)

`juara_birth_quarter` (Q1–Q4), `juara_phv_stage` (PRE_PHV|CIRCA_PHV|POST_PHV|ADULT), `juara_grade` (A|B|C), `juara_ability_grade` (A+|A|B+|B|C), `juara_ceiling_grade` (A+|A|B), `juara_depth_tier` (STARTER|BACKUP|U21_SHADOW), `juara_role` (OWN|CEO|SPO|COA|FIN|SEC), `juara_number_source` (TEMPLATE_PRD|INPUT_MANUAL_KLUB), `juara_contract_status`, `juara_scr_status` (GREEN|YELLOW_WATCHLIST|RED_BREACH), `juara_dna`, `juara_league_tier`, `juara_outcome`, `juara_playbook_status`.

Nilai turunan yang **bukan** ENUM baru (disimpan sebagai `text`/status perhitungan, bukan enum skema): `ELITE_HOMEGROWN_ASSET`, `ELIGIBLE FOR STRATEGIC LOAN`, `PROTECTED TECHNICAL ASSET`, status IDP/watchlist. Ini mencegah penambahan ENUM di luar 14 yang sudah disepakati.

### 1.3 Isolasi, enkripsi, RBAC — mengikat

- `club_id` **selalu** berasal dari `auth.uid()` ∩ `juara_club_members` aktif ∩ klaim `request.jwt.claims` — **GUC `app.current_club_id` dilarang** `[R11]`. Semua query modul akademi/rekrutmen memakai `public.juara_current_club_id()`; `club_id` dari body request/webhook tidak pernah dipercaya sebagai tenant.
- `service_role` B2C **tidak dipakai** untuk akses juara. Bridge memakai trusted server + HMAC, bukan `service_role`.
- Data sensitif (gaji, signing fee, buy-out, nilai sponsor) tetap **AES-256-GCM di aplikasi → `BYTEA`**; kunci di environment, pemegang = Owner, tidak pernah dicetak. Dokumen ini tidak memuat kunci/secret/connection string.
- RBAC 36 sel berlaku penuh. Untuk modul ini yang paling relevan: **SPO** boleh melihat *pagu anggaran posisi* tetapi **DENY** gaji individual/pajak/P&L; **COA** DENY gaji & laba-rugi; **SEC** hanya tanggal & status kontrak; **OWN/CEO/FIN** penuh (dekripsi ter-audit). Kartu rekrutmen yang dikirim ke SPO wajib dibangun dari DTO eksplisit tanpa field gaji individual.

## 2. Kebutuhan data yang belum ada di skema Divisi 3 — catatan, bukan keputusan

| Kebutuhan Divisi 5 | Kolom di `ARCHITECTURE.md` | Status |
|---|---|---|
| 3 target IDP per siklus 12 minggu + tanggal siklus | tidak ada | **USULAN** tambahan kolom/objek di `juara_players` (atau tabel turunan `juara_*` dengan `club_id` + RLS). Butuh keputusan PM; **tidak di-apply**, tidak mengubah Divisi 3 |
| Flag `PROTECTED TECHNICAL ASSET` | tidak ada (hanya `is_homegrown_epa`, `phv_maturity_stage`) | **USULAN** kolom boolean; butuh keputusan PM |
| Riwayat ukuran PHV per 3 bulan (sitting height, standing height, berat) | tidak ada (hanya `phv_maturity_stage`) | **USULAN** tabel turunan/time-series; butuh keputusan PM |
| `academy_evaluation_score`, `pathway_stage` (PRD Hook 1) | tidak ada | **Fase 2** — Hook 1, bukan Sprint 0/7. Tidak ditambahkan sekarang |
| `ILeague.id` / FotMob / GPS mapping (PRD Hook 2) | tidak ada | **Fase 2/3** — butuh data operator liga dari Owner; tidak ditambahkan sekarang |
| Dedupe `idempotency_key` bridge | tidak ada (field hanya di payload webhook) | **USULAN** mekanisme penyimpanan; butuh keputusan PM/DevOps |

---

## 3. Individual Development Plan (IDP) dan Academy Readiness Index (ARI)

### 3.1 ARI — rumus yang sudah dikunci `[PRD §9.3] [RULEBOOK §10/§13]`

```
ARI = 0,30 × Tactical DNA Alignment
    + 0,25 × Physical & Availability
    + 0,25 × Technical Execution Under Pressure
    + 0,20 × Psychological & Professional Habits
```

Bobot **30 / 25 / 25 / 20 = 100%** (TV-20). Komponen disimpan **terpisah** di `juara_players.{ari_component_tactical, ari_component_physical, ari_component_technical, ari_component_psychological}` agar 30/25/25/20 bisa diaudit; hasil di `academy_readiness_index` (`numeric(5,2)`, 0–100).

| Komponen | Sumber penilaian | Kolom |
|---|---|---|
| Tactical DNA Alignment (30%) | Pelatih akademi + analis video; kepatuhan prinsip 4 fase Tactical DNA tim utama | `ari_component_tactical` |
| Physical & Availability (25%) | Yo-Yo IRT 1/2, sprint 10m/30m, CMJ, **kehadiran latihan bebas cedera > 90%** | `ari_component_physical` |
| Technical Execution Under Pressure (25%) | Umpan progresif, first-touch orientation, duel 1v1 di laga EPA resmi | `ari_component_technical` |
| Psychological & Professional Habits (20%) | Disiplin waktu, etos latihan tambahan, mental saat tertinggal, feedback mentor senior | `ari_component_psychological` |

**Aturan hitung (turunan yang diaudit):** hitung dengan presisi penuh (desimal), bulatkan **half-up ke 2 desimal** untuk penyimpanan/tampilan (`numeric(5,2)`), lalu evaluasi ambang pada nilai tersimpan. Skala tiap komponen 0–100.

### 3.2 Threshold ARI — daftar wajib (bukti verifikasi ada di §12)

| ARI | Keputusan otomatis | Tindakan sistem |
|---|---|---|
| **< 65** | Tetap di skuad usia | Fokus IDP spesifik; tidak masuk promosi |
| **65 – 77** | `WATCHLIST` | Latihan gabungan tim utama tiap pekan |
| **78 – 84** | `SIAP_PROMOSI_ROTASI` | Rekomendasi masuk slot **Tier 3** (Academy Breakthrough) di playbook berjalan |
| **≥ 85** | `ELITE_HOMEGROWN_ASSET` | Perintah otomatis ke Direktur Olahraga: ikat kontrak profesional **3–5 tahun** sebelum dipantau pemandu bakat lawan |

Batas bersifat inklusif pada batas bawah tiap band: `65.00` → Watchlist; `78.00` → Rotasi; `85.00` → Elite. Nilai `77.99` tetap Watchlist, `84.99` tetap Rotasi.

**Test vector (dari `RULEBOOK.md` TV-20…TV-24, dihitung ulang di §12):**

| Input (T, P, Te, Ps) | Hitung | ARI | Keputusan |
|---|---|---|---|
| (90, 88, 80, 80) | 27 + 22 + 20 + 16 | **85,00** | ELITE_HOMEGROWN_ASSET |
| (80, 70, 75, 60) | 24 + 17,5 + 18,75 + 12 | **72,25** | Watchlist |
| (82, 80, 78, 75) | 24,6 + 20 + 19,5 + 15 | **79,10** | Siap Promosi Rotasi |
| (70, 60, 65, 55) | 21 + 15 + 16,25 + 11 | **63,25** | Tetap di skuad usia |

### 3.3 IDP Card

- Setiap pemain akademi memiliki **kartu perkembangan hidup (IDP Card)** dengan **3 target perbaikan teknis/taktis per siklus 12 minggu** `[PRD §9.3]`.
- Siklus: `START → 3 target → review di minggu ke-12 → target berikutnya`. IDP menjadi dasar komponen Tactical/Technical/Psychological pada ARI berikutnya; Physical memakai tes berkala + ambang kehadiran > 90%.
- Target IDP wajib selaras dengan fase LTAD (§4) dan archetype `primary_role`/`secondary_role` dari 22 Tactical Role Taxonomy.
- Implementasi field → usulan §2 — **tidak di-apply** sekarang.

---

## 4. LTAD — 4 fase terintegrasi `[PRD §9.1] [RULEBOOK §10]`

| Fase | Usia | Fokus utama | Gate evaluasi / aturan | Hubungan dengan data |
|---|---|---|---|---|
| **1 — Foundation & Technical Mastery** | 12–14 | Bilateral technical execution, koordinasi motorik, kecerdasan spasial (*spatial intelligence*) via 4v4/7v7 | **Dilarang** nilai dari menang-kalah; ukur sentuhan berkualitas + keberanian keputusan progresif | `birth_quarter`, `phv_maturity_stage` |
| **2 — Tactical DNA Assimilation & Growth Protection** | 15–16 (U-16) | Prinsip 4 fase permainan, transisi 11v11, pemantauan beban saat growth spurt | Monitoring beban fisik ketat + PHV tiap 3 bulan | `phv_maturity_stage`, komponen `ari_component_physical` |
| **3 — Role Specialization & Competitive Resilience** | 17–18 (U-18) | 1 peran utama + 1 sekunder dari **22 archetype**; analisis video mandiri mingguan | **ACWR 0,8 – 1,3** | `primary_role`, `secondary_role`, `ari_component_tactical` |
| **4 — Transition & First-Team Integration** | 19–21 (U-20) | Succession Matrix + mentor senior; latihan tim senior **≥ 3×/pekan**; kekuatan otot fungsional | Kesiapan duel fisik level senior; ARI ≥ 85 → kontrak 3–5 thn | `is_homegrown_epa`, ARI, `juara_squad_slots.mentor_slot_id`, Tier 3 |

Fase 1–3 = jalur akademi/EPA; Fase 4 = jembatan ke skuad utama. Tidak ada evaluasi menang-kalah di Fase 1 — ini constraint engine, bukan preferensi UI.

---

## 5. RAE, Bio-Banding, dan PROTECTED TECHNICAL ASSET `[PRD §9.2] [RULEBOOK §10]`

### 5.1 Birth-quarter tagging (RAE)

- `juara_players.birth_quarter` (ENUM `juara_birth_quarter`) diisi otomatis dari `date_of_birth`: **Q1 Jan–Mar, Q2 Apr–Jun, Q3 Jul–Sep, Q4 Okt–Des**.
- **Aturan peringatan:** jika **> 65%** skuad akademi berasal dari **Q1/Q2**, sistem memberi peringatan bias seleksi kepada Kepala Akademi (COA) — ditampilkan di Boardroom Inbox, bukan notifikasi terkirim (§10).
- Test vector TV-25: 20 dari 30 siswa Q1/Q2 = **66,7% > 65% → peringatan aktif**. Ambang 65% eksplisit PRD, bukan turunan.

### 5.2 PHV & Bio-Banding

- Ukur **sitting height, standing height, berat** **tiap 3 bulan** → estimasi usia biologis: `PRE_PHV | CIRCA_PHV | POST_PHV | ADULT` (ENUM `juara_phv_stage`).
- *Late maturer* dengan teknik tinggi ditandai **`PROTECTED TECHNICAL ASSET`** (usulan flag §2) dan masuk **sesi latihan Bio-Banding** — bermain melawan lawan dengan kematangan biologis setara, agar teknik & kepemimpinan berkembang tanpa terintimidasi keunggulan fisik lawan.
- Bio-Banding adalah pengelompokan **latihan**, bukan promosi ke skuad; promosi tetap lewat ARI (§3).

---

## 6. Recruitment Target Matrix (dari Gap Analysis) + pagu gaji

### 6.1 Sumber: Gap Analysis yang sudah didefinisikan Divisi 3

`GET /api/juara/v1/clubs/{club_id}/squad-gap-analysis` (`ARCHITECTURE.md` §7.1 #5) menghasilkan audit skuad vs playbook → 5 aksi rekomendasi untuk OWN/SPO/COA (redaksi). Divisi 5 mendefinisikan **turunan** menjadi kartu kebutuhan rekrutmen (Sprint 7 DoD: setiap slot kosong otomatis memunculkan kartu dengan batas anggaran gaji terkunci sesuai sisa ruang SCR).

### 6.2 Algoritma turunan (semua angka berlabel `TEMPLATE_PRD`)

```
Untuk setiap juara_squad_slots aktif pada playbook terpilih:
  gap  ← assigned_player_id IS NULL
         ATAU current_ability_grade(assigned) < target_grade
  kartu ← {
      slot_id, position_code, tactical_role_archetype,
      target_grade (A|B|C), target_age_min/max, depth_tier,
      jalur_internal: kandidat dengan ARI 78–84 (Tier 3) → utamakan promosi,
      pagu_gaji_maksimal_idr: lihat §6.3,
      source_label, scr_status, label_otorisasi
  }
```

Prioritas: **promosi internal (ARI ≥ 78) didahulukan** sebelum rekrutmen eksternal — ini menyambungkan ARI ke Gap Analysis dan mendukung filosofi Academy-First / Templat C.

### 6.3 Pagu gaji maksimal (desain; bukan angka final)

```
denom_SCR = Σ 6 komponen scr_den_*                         [R2]
numer_SCR = Σ 5 komponen scr_num_*                         [R2]
scr_max   = juara_playbooks.scr_max_threshold_pct

sisa_ruang_scr_idr = max(0, (scr_max/100) × denom_SCR − numer_SCR)

bobot_band_g   = A: [0,45 – 0,50] | B: [0,35 – 0,40] | C: [0,10 – 0,15]   [RULEBOOK §3]
pagu_slot_g    = min( sisa_ruang_scr_idr × bobot_band_g,
                      sisa_kuota_band_g_dari_anggaran_gaji_proyeksi )
                ÷ jumlah slot kosong grade g              [jika > 1 slot]
```

- Band A/B/C adalah **band, bukan hard sum** `[R5]` → `bobot_band_g` diparameterisasi, tidak di-hardcode; kalibrasi akhir menunggu Owner (lihat §13).
- **Gate SCR** `[RULEBOOK §6]`: `GREEN` → pagu diterbitkan; `YELLOW_WATCHLIST` → pagu diterbitkan berlabel **"butuh otorisasi eksplisit OWN/FIN"**; `RED_BREACH` → **tombol persetujuan rekrutmen dikunci**, pagu tidak diterbitkan, tampilkan 3 opsi remediasi (tambah sponsor / lepas-pinjam beban gaji tertinggi / ganti Grade A dengan promosi Grade C).
- Pagu yang dikirim ke **SPO** hanya angka agregat per posisi — **tanpa gaji individual, PPh 21, atau P&L** (RBAC §5.1). Nilai simulasi tidak pernah dienkripsi ulang menjadi plaintext di log.
- Pagu adalah **simulasi**, bukan penawaran nyata; setiap kartu mencantumkan `source_label` ("Template PRD" vs "Input manual klub") `[DES §11.4]`.

### 6.4 Kanban Pipeline (pendukung)

Papan alur negosiasi (Sprint 7) memakai status `SHORTLIST → CONTACT → NEGOTIATION → OFFER → SIGNED/REJECTED` sebagai **status aplikasi** (bukan ENUM skema baru). Setiap transisi status tercatat di `juara_audit_logs` tanpa plaintext sensitif. Tidak ada kontrak/kredensial yang dibuat otomatis.

---

## 7. Contract Expiry Radar, anti-talent-leakage, step-up & release clause `[PRD §8.4] [RULEBOOK §9]`

### 7.1 Contract Expiry Radar — 24 bulan

```
Sumber: juara_contracts_vault.contract_end_date, contract_status
        juara_players.date_of_birth, current_ability_grade

Kriteria alert:  usia 20–27 tahun  DAN  grade A/B  DAN  sisa masa kontrak = 24 bulan
```

- Alarm otomatis **T-24 bulan** sebelum kontrak berakhir (TV-27: kontrak berakhir `2029-06-30` → alert mulai `2027-06-30`).
- **Hard gate T-12:** tidak ada aset utama yang dibiarkan memasuki **12 bulan terakhir** kontrak tanpa keputusan **perpanjang** atau **jual terencana** → eskalasi ke OWN/CEO/FIN.
- Tanggal & status kontrak terlihat oleh OWN/CEO/FIN/SPO/COA/SEC sesuai RBAC; **nominal tetap DENY** untuk SPO/COA/SEC.

### 7.2 Step-Up Milestone Contract

- Kontrak profesional pertama lulusan akademi: **3 tahun + 2 tahun opsi klub**.
- Kenaikan gaji otomatis di **15, 35, 60 penampilan resmi** tim senior — tersimpan di `juara_contracts_vault.salary_step_appearances = '{15,35,60}'`.
- **Besaran kenaikan belum ditetapkan** → field input template, **tanpa besaran hardcode** `[R8]`. Dicatat sebagai catatan menunggu Owner (§13), **bukan keputusan Divisi 5**.
- Skenario `ELITE_HOMEGROWN_ASSET` (ARI ≥ 85): kontrak profesional **3–5 tahun** `[PRD §9.3]` — tidak bertentangan dengan 3+2; 3+2 adalah struktur lulusan akademi, 3–5 adalah rentang untuk aset elite.

### 7.3 Tiered Release Clause & FIFA Solidarity

- Klausul tebus **minimum 4×–6×** total investasi pembinaan + gaji tahunan pemain (TV-26: 500 jt + 2.000 jt = 2.500 jt → **10.000–15.000 jt**). Disimpan terenkripsi di `release_clause_enc` (AES-256-GCM → BYTEA).
- FIFA Solidarity & Training Compensation (riwayat usia 12–23): **12–15: 0,25%/thn (1%/4 thn)**; **16–23: 0,50%/thn (4%/8 thn)** → **total 5%** dari nilai transfer internasional (TV-16: 10 M → 500 jt). Sistem memotong 5% saat hitung biaya bersih pembelian dan menghitung piutang solidaritas alumni yang transfer ke luar negeri `[PRD §7.3]`.
- Kompensasi 70:30 (70% pokok tetap + 30% insentif variabel) dan aturan Appearance Fee (≥ 45 menit), Win/Draw (1,0× / 1,5× / 2,0×), Clean Sheet (≥ 60 menit tanpa kebobolan), Championship Escalator — mengikat, dirinci di `RULEBOOK.md` §8; `performance_bonus_rules_enc` menyimpan JSON aturan (terenkripsi).

---

## 8. Strategic Loan — ambang < 550 menit `[PRD §8.3] [R9]`

- Ambang operatif: **< 550 menit proyeksi bermain per pemain** → status **`ELIGIBLE FOR STRATEGIC LOAN`**. Disimpan di `juara_projections.loan_minute_threshold` (default **550**) dan dibandingkan dengan `juara_squad_slots.projected_minutes`.
- **Bukan** 15% × 37.620 = 5.643 menit. Itu kesalahan interpretasi yang sudah dikoreksi PM `[R9 / TV-15]`.
- Total menit skuad = 38 laga × 990 menit = **37.620 menit/musim** (990 = 90 × 11) — konteks alokasi, bukan ambang loan.
- Tier 4 = 4–5 pemain U-20. Dokumen syarat peminjaman wajib memuat: **klausul jaminan ≥ 65% menit** + **recall clause paruh musim** bila target menit tidak tercapai.
- Tier 3 (Academy Breakthrough, 5–6 Grade C U-21, 750–1.300 menit): dilarang 90 menit penuh terus-menerus; kombinasi **8–10 starter terkontrol** + **15–20 masuk menit ke-60…75**. Persentase menit = band per-tier, bukan kuota agregat `[R3]`.

---

## 9. stadione-bridge — pintu integrasi masa depan (DESAIN SAJA)

### 9.1 Dua hook yang sudah ada di arsitektur

| Hook | Mekanisme | Status |
|---|---|---|
| **HK-1 — Rapor Akademi** | `juara_clubs.academy_id` nullable → `public.academies(id)`; FK **read-only**, tabel B2C tidak diubah; satu akademi → satu klub | **Fase 2** — hook disiapkan, tidak dipakai sekarang `[D4]` |
| **HK-2 — stadione-bridge (webhook masuk)** | `POST /api/juara/v1/bridge/academy-sync` + `/bridge/league-stats-sync`; HMAC-SHA256; bukan user JWT | **Didesain, tidak aktif** (§9.2–9.3) |
| **HK-3 — Identitas/SSO** | `auth.users` bersama; `auth.stadione.pro` = integration point | SSO menyusul, butuh lampu hijau Owner (DNS/SSL/kredensial) `[D2]` |

### 9.2 Otentikasi HMAC-SHA256 — kontrak yang mengikat

```
Header   : X-Stadione-Signature
Algoritma: HMAC-SHA256 atas RAW BODY (verifikasi SEBELUM parse JSON)
Secret   : variabel environment (NAMA saja; nilai dipegang Owner, tidak pernah dicetak)
Idempotensi: idempotency_key (min. 8 karakter) per event
```

- Format penulisan header final (mis. prefiks `sha256=`) mengikuti konvensi yang disepakati Divisi 3/6; **yang mengikat**: algoritma HMAC-SHA256, raw body, verifikasi sebelum parse.
- **HMAC mengotentikasi pengirim, bukan tenant.** `club_id` di payload tetap divalidasi terhadap `auth.uid() ∩ juara_club_members ∩ JWT claim` `[R11]` — payload yang membawa `club_id` klub lain ditolak (`CROSS_TENANT_DENIED`, tanpa *existence oracle*).
- Tidak memakai `service_role`; tidak ada kredensial, token, atau secret yang dibuat/dilihat/disalin/ditampilkan di artefak ini.
- Setiap event bridge yang diterima dicatat di `juara_audit_logs` (`action` bertipe `text`, mis. `BRIDGE_ACADEMY_SYNC`), `metadata` hanya ID/label — tanpa plaintext sensitif.

### 9.3 Webhook — spesifikasi payload (Zod, `ARCHITECTURE.md` §7.2)

```ts
const BridgeWebhookInput = z.object({
  club_id: z.string().uuid(),                                  // divalidasi vs membership, BUKAN dipercaya begitu saja
  event: z.enum(['ARI_UPDATE','PROMOTION_READY','LEAGUE_STATS']),
  payload: z.record(z.unknown()),
  occurred_at: z.string().datetime(),
  idempotency_key: z.string().min(8),
}).strict();
```

| Endpoint | Event | Efek yang **didesain** (tidak dijalankan sekarang) |
|---|---|---|
| `POST /api/juara/v1/bridge/academy-sync` | `ARI_UPDATE` | Update 4 komponen ARI + `academy_readiness_index` → evaluasi threshold §3.2 |
| `POST /api/juara/v1/bridge/academy-sync` | `PROMOTION_READY` | Siap Promosi Rotasi / Elite → kartu rekrutmen internal & alarm ke Boardroom Inbox (§10) |
| `POST /api/juara/v1/bridge/league-stats-sync` | `LEAGUE_STATS` | Statistik pertandingan liga → menit bermain, appearance counter (pemicu 15/35/60), Tier 3/4 |

`openapi.yaml` formal ditunda (DES §11.6); kontrak = Zod + tipe TS bersama. Status: **desain/slice pertama — bukan endpoint aktif, bukan data riil** `[D3]`.

### 9.4 Jalur impor CSV/Excel — DITUNDA (label eksplisit)

> **LABEL: JALUR IMPOR MASSAL CSV/EXCEL — DITUNDA (DES §11.4, Sprint 8, `[D3]`).**

- Yang **sudah disiapkan sejak sekarang** `[D3]`: **skema + validator adapter import terenkripsi** (`source_label = INPUT_MANUAL_KLUB`) supaya data riil masuk tanpa reshape.
- Yang **ditunda**: fitur impor massal data pemain lewat templat Excel/CSV tervalidasi (Sprint 8, PRD baris 711).
- Setiap layar wajib melabeli sumber angka: **"Template PRD"** vs **"Input manual klub"** `[DES §11.4]`.
- Data klub riil = gate sebelum peluncuran v1.0; diminta Owner menjelang Sprint 9 — **bukan sekarang, tidak disalin, tidak dipakai**.

---

## 10. Notifikasi email / WhatsApp — DESAIN SAJA, TIDAK DIKIRIM

> **LABEL: SELURUH ATURAN DI BAGIAN INI ADALAH DESAIN. TIDAK ADA EMAIL ATAU WHATSAPP YANG DIKIRIM, TIDAK ADA KREDENSIAL/PROVIDER/NOMOR PENGIRIM YANG DIBUAT ATAU DITAMPILKAN.**

Pola: cron worker (didefinisikan Divisi 3, Sprint 7) menulis **kartu ke Boardroom Inbox**; pengiriman email/WhatsApp adalah **adapter yang dinonaktifkan** sampai ada lampu hijau Owner (menyangkut kredensial & integrasi eksternal).

| # | Event / pemicu | Sumber aturan | Penerima (peran) | Kanal (desain) | Payload (redaksi) | Status |
|---|---|---|---|---|---|---|
| N-1 | Kontrak T-24 bulan, usia 20–27, Grade A/B | §7.1 | OWN, CEO, FIN | Inbox + email | nama klub, inisial pemain, tanggal akhir, status | DESAIN |
| N-2 | Masuk 12 bulan terakhir tanpa keputusan | §7.1 | OWN, CEO, FIN | Inbox + email | ID slot, tanggal, label eskalasi | DESAIN |
| N-3 | ARI ≥ 85 → Elite Homegrown Asset | §3.2 | OWN, SPO | Inbox + email | ID pemain, ARI, rekomendasi kontrak 3–5 thn | DESAIN |
| N-4 | ARI 78–84 → Siap Promosi Rotasi | §3.2 | SPO, COA | Inbox | ID pemain, ARI, slot Tier 3 | DESAIN |
| N-5 | `projected_minutes < 550` → Strategic Loan | §8 | SPO, COA | Inbox | ID pemain, menit, klausul ≥65% + recall | DESAIN |
| N-6 | `calculated_scr_pct` = YELLOW / RED | §6.3 | OWN, CEO, FIN | Inbox + email | status SCR, label otorisasi (tanpa komponen sensitif) | DESAIN |
| N-7 | RAE > 65% Q1/Q2 | §5.1 | COA (Kepala Akademi) | Inbox | persentase, kuartal, label bias | DESAIN |
| N-8 | Siklus IDP 12 minggu selesai | §3.3 | COA, SPO | Inbox | ID pemain, 3 target, tanggal review | DESAIN |

Aturan redaksi (mengikat): **tanpa gaji individual, PPh 21, P&L, nominal kontrak, buy-out, atau nilai sponsor**; tidak ada kunci/secret; tautan mengarah ke halaman internal `/juara` dengan RLS; penerima dibatasi oleh RBAC 36 sel. Prioritas jam kerja dan *quiet hours* = input konfigurasi, bukan keputusan Divisi 5.

---

## 11. Urutan ketergantungan (Sprint 7–8) — desain, bukan eksekusi

| Urut | Item Divisi 5 | Bergantung pada | Gate |
|---|---|---|---|
| 1 | Pemetaan field §1–§2 | `ARCHITECTURE.md` (Divisi 3) | ✅ tercapai |
| 2 | ARI + IDP (§3), LTAD (§4), RAE/Bio-Banding (§5) | RULEBOOK §10, PRD §9 | verifikasi §12 |
| 3 | Recruitment Target Matrix + pagu (§6) | Gap Analysis endpoint (Divisi 3 #5), SCR R2 | keputusan PM soal `bobot_band_g` |
| 4 | Contract Radar + anti-leakage (§7), Strategic Loan (§8) | `juara_contracts_vault`, R8/R9 | besaran step-up = Owner |
| 5 | stadione-bridge (§9), impor ditunda (§9.4) | D3/D4, HMAC konvensi Divisi 3/6 | endpoint tidak diaktifkan |
| 6 | Notifikasi (§10) | cron worker Divisi 3 | kredensial/provider = Owner |

Tidak ada langkah di atas yang mengubah artefak divisi lain atau menyentuh produksi.

---

## 12. Rekam verifikasi

**Skill `verify` (itqan-engineering):** tersedia sebagai plugin di harness ini dan **berhasil dimuat** melalui mekanisme skill (catatan: Divisi 1/3 sebelumnya melaporkannya tidak tersedia; perbedaan lingkungan ini dicatat, bukan disembunyikan). Part A diterapkan: **perintah segar dijalankan, output dibaca, baru klaim ditulis**. Perintah dan outputnya tercantum di bawah — bukti, bukan vibes. Tidak ada journal `state.json`/`verify.md` dari plugin yang dibuat, karena mandat penulisan dibatasi hanya `docs/juara/`.

### 12.1 Daftar threshold ARI (wajib — diminta brief)

```
bobot   : 30 / 25 / 25 / 20  → jumlah 100%
ARI < 65           → tetap di skuad usia (fokus IDP)
ARI 65 – 77        → WATCHLIST, latihan gabungan tim utama tiap pekan
ARI 78 – 84        → SIAP_PROMOSI_ROTASI, slot Tier 3
ARI >= 85          → ELITE_HOMEGROWN_ASSET, kontrak 3–5 tahun
```

### 12.2 Perintah verifikasi segar & hasil (dijalankan pada artefak ini)

| # | Perintah (ringkas) | Yang dibuktikan | Hasil |
|---|---|---|---|
| V-1 | `python3` hitung 4 test vector ARI + jumlah bobot dengan `Decimal` | 30+25+25+20 = 100; 85,00 / 72,25 / 79,10 / 63,25 | ✅ cocok TV-20…TV-24 |
| V-2 | `python3` cek RAE 20/30 = 66,7% > 65%; loan 550 ≠ 5.643; 2029-06-30 − 24 bln = 2027-06-30 | TV-25, R9/TV-15, TV-27 | ✅ cocok |
| V-3 | `grep -n` token wajib pada file artefak | 65/78/85, 30/25/25/20, HMAC-SHA256, X-Stadione-Signature, academy-sync, league-stats-sync, PROTECTED TECHNICAL ASSET, ELIGIBLE FOR STRATEGIC LOAN, 550 | ✅ semua hadir |
| V-4 | `grep -n` 8 nama tabel `juara_*` di artefak vs `ARCHITECTURE.md` | tidak ada tabel baru / salah nama | ✅ 8/8 cocok |
| V-5 | `grep -inE` pola kredensial/secret value/connection string + `wc -l` + `git status --short` | tanpa kredensial; satu file ditulis; bukan kode produksi | ✅ bersih |

> Output lengkap V-1…V-5 dibaca langsung oleh worker sebelum bagian ini ditulis; ringkasannya dilaporkan ke PM di akhir sesi. Bila PM menjalankan ulang, perintah yang sama dapat dipakai sebagai bukti segar.

### 12.3 Pengecekan batas wewenang

Tidak ada: migrasi/apply DB, deploy, DNS, SSL, push, restart container, perubahan kode produk, pendaftaran domain, kredensial, data klub riil, webhook yang diaktifkan, atau notifikasi nyata. Satu-satunya file yang ditulis: `docs/juara/ACADEMY_INTEGRATION_SPEC.md`.

---

## 13. Hal yang tidak bisa diputuskan Divisi 5 — diteruskan ke Owner lewat PM (catatan, BUKAN keputusan)

1. **Data klub riil** (dianonimkan/disetujui) untuk UAT/gate v1.0 `[D3]` — bukan sekarang.
2. **Besaran kenaikan gaji bertahap** pada 15/35/60 penampilan `[R8 / RULEBOOK A8]` — field input template; angka final menunggu Owner.
3. **Kalibrasi akhir `bobot_band_g`** (A 45–50%, B 35–40%, C 10–15%) dan multiplier komersial `[R5/R7]` bila Owner ingin angka final, bukan band/default 1.0.
4. **Secret HMAC bridge, provider & kredensial email/WhatsApp, nomor pengirim** — nama variabel environment saja yang tercatat; nilai tidak pernah dibuat/dilihat/dicentang oleh worker.
5. **Izin deploy, DNS `juara.stadione.pro`, SSL/TLS** untuk mengaktifkan webhook/notifikasi — di luar mandat `[D2/D4]`.
6. **SSO `auth.stadione.pro`** dan izin pen-test/OWASP ke live — menyusul `[D2]`.
7. **Keputusan PM/CTO atas usulan skema §2** (kolom IDP, flag `PROTECTED TECHNICAL ASSET`, time-series PHV, store dedupe `idempotency_key`) — apakah ditambahkan ke `juara_players` atau tabel turunan `juara_*` ber-`club_id` + RLS. Tidak di-apply sekarang; tidak mengubah `ARCHITECTURE.md`.
8. **Data pemetaan eksternal** `ILeague.id` / FotMob / GPS (Hook 2) dan data Rapor Akademi/EPA (Hook 1) untuk Fase 2/3 — butuh sumber dari Owner/operator liga.

---

*Dokumen ini adalah kontrak desain Divisi 5 untuk Sprint 7–8 dan pintu integrasi Fase 2/3. Seluruh angka berasal dari `RULEBOOK.md`/`PRD-JUARA.md` dan bersifat simulasi `TEMPLATE_PRD` sampai Owner memberi data riil. Perubahan nama tabel/kolom/ambang wajib lewat PM dan penanda versi.*
