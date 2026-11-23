# SPESIFIKASI KEUANGAN & MESIN PENDAPATAN — JUARA.STADIONE.PRO

**Artefak Sprint 0 — Divisi 4 (Club Finance, Commercial & Operations).**
Status: `DESAIN — MENUNGGU VERIFIKASI PM`. Bukan izin migrasi, apply DB, deploy, DNS, SSL,
push, restart, kredensial, kode produksi, atau pemakaian data klub riil.
Rantai komando: Owner → CTO → PM → Divisi 4. Satu fokus: alur komputasi keuangan multi-tahun
dan mesin pendapatan yang memakai **rumus yang sudah dikunci Divisi 1**.

> Catatannya: kerangka dokumen ini mulai ditulis saat `docs/juara/ARCHITECTURE.md` belum ada.
> File itu kini **sudah tersedia dan dibaca penuh** (513 baris), sehingga seluruh bagian
> telah direvisi untuk mengikutsertakannya. **Tidak ada bagian `[MENUNGGU ARCHITECTURE]` yang
> tersisa.** Artefak Divisi 3 tidak diubah.

---

## 0. Hierarki otoritas & keputusan yang tidak dibuka kembali

| Penanda | Arti |
|---|---|
| `[D1]`–`[D4]` | Keputusan CTO atas delegasi Owner. **Sudah berlaku**, bukan asumsi. |
| `[R1]`–`[R9]` | Putusan PM di `PM_RULINGS.md` atas ketidaktentuan RULEBOOK §14. Mengikat Divisi 4. |
| `[PRD §x]` | Angka/teks eksplisit di `PRD-JUARA.md`. Mengikat. |
| `[DES §x]` | Keputusan PM di design doc. Mengikat. |
| `[RULEBOOK §x]` | Rumus terverifikasi Divisi 1, sudah dicek ulang PM. |
| `[TURUNAN]` | Dihasilkan dari rumus/angka di atas; ditulis supaya bisa diaudit. |
| `[ASUMSI]` | Tidak eksplisit; **butuh lampu hijau PM/CTO/Owner** sebelum jadi constraint engine. |

Urutan konflik: **D1–D4 > R1–R9 > PRD eksplisit > DES > RULEBOOK > TURUNAN > ASUMSI**.

Tiga keputusan yang **sudah diputuskan CTO atas delegasi Owner** — dicatat sebagai fakta,
**bukan asumsi**, dan tidak dibuka kembali di dokumen ini:

1. `[D1]` Approach B — vertical slice end-to-end + design doc disetujui.
2. `[D2]` K3 — Supabase Auth + RBAC 6 peran dipakai dulu; SSO `auth.stadione.pro` menyusul.
   Gate keras: isolasi `club_id` lolos uji cross-tenant; AES-256-GCM di aplikasi → `BYTEA`
   terbukti tidak bisa dibaca admin DB (Sprint 1, bukan ditunda).
3. `[D3]` UAT — 3 template PRD + jalur import terenkripsi disiapkan sejak sekarang; data
   klub riil baru jadi gate menjelang peluncuran v1.0.

Arsitektur `[D4]` juga mengikat: satu repo `stadione-v2`, satu Supabase project/database live,
satu `auth.users`; tabel baru di `schema public` ber-prefix `juara_`; RLS `club_id` dari
JWT/membership; `service_role` B2C tidak dipakai untuk juara; data sensitif dienkripsi
AES-256-GCM di aplikasi ke `BYTEA`. Detail kolom mengikuti `ARCHITECTURE.md` §2.

---

## 1. Dua pembedaan yang wajib dijaga

### 1.1 CapEx vs OpEx

| | CapEx (dikapitalisasi) | OpEx (beban langsung) |
|---|---|---|
| Isi `[RULEBOOK §5]` | transfer/kompensasi Grade A & B; signing-on fee; komisi agen berlisensi; perangkat sport science | gaji pokok A/B/C; insentif performa; PPh 21 + jaminan/asuransi cedera; Matchday LOC; Away Logistics; pembinaan akademi/EPA & kit |
| Field `juara_projections` `[ARCH §2.2.7]` | `capex_transfer_fees`, `capex_signing_agent_fees`, `capex_sport_science_infra` | `opex_base_wages`, `opex_performance_bonuses`, `opex_taxes_insurance`, `opex_matchday_operations`, `opex_away_travel_logistics`, `opex_academy_operations` |
| Perlakuan `[PRD §7.1]` | IAS 38: amortisasi garis lurus selama durasi kontrak; NBV dicatat | dibebankan di bulan/musim terjadi |
| Masuk SCR? | **hanya lewat** `scr_num_annual_amortization` (registrasi pemain) + `scr_num_annual_agent_fees` | lewat `scr_num_gross_wages`, `scr_num_fixed_allowances_tax`, `scr_num_guaranteed_bonus` |

**Aturan keras:** total CapEx/OpEx agregat **dilarang** dipakai sebagai pembilang SCR
`[RULEBOOK §12 invariant 3, R2]`. Perangkat sport science adalah CapEx tetapi **bukan**
komponen pembilang SCR (pembilang hanya 5 field yang ditetapkan `[RULEBOOK §6]`).

### 1.2 SCR dari rulebook vs angka contoh PRD

- **Rulebook (mengikat):** SCR dihitung dari **5 komponen pembilang + 6 komponen penyebut**
  yang disimpan sebagai field terpisah **sebelum** hitung `[R2]`.
- **PRD (contoh):** `PRD §10.2` hanya memberi `calculated_scr_pct = 59,8%` dan revenue
  `24.500.000.000`, **tanpa rincian komponen** `[RULEBOOK §14 A2 / TV-08]`.
- Konsekuensi: angka 59,8% dan 24,5 M adalah **test vector agregat**, bukan izin bagi
  backend mengarang komponen. Semua komponen harus berasal dari template/field input yang
  berlabel sumber (`TEMPLATE_PRD` vs `INPUT_MANUAL_KLUB`) `[DES §11.4]`.

---

## 2. Pipeline kalkulasi CapEx/OpEx 3 tahun

`projection_year ∈ {1,2,3}` `[PRD §10.1]`, `fiscal_year_start_month` default **7 (Juli)**
`[PRD §10.1]`. Satu baris per `(club_id, playbook_id, projection_year)` — lihat
`ARCHITECTURE.md` §2.2.7.

```
INPUT (terenkripsi bila sensitif)
  ├─ juara_playbooks: horizon_years, scr_max_threshold_pct, reamortization_years (=4, R1),
  │                   owner_equity_injection_enc (BYTEA)
  ├─ juara_squad_slots: 26–28 slot, target_grade A/B/C, projected_minutes (R9)
  └─ juara_contracts_vault: transfer_fee_capitalized_enc, agent_fee_capitalized_enc,
      base_salary_monthly_enc, signing_on_fee_total_enc, performance_bonus_rules_enc
                     │  dekripsi di memori service SAJA (D2/D4, ARCH §6)
                     ▼
STEP 1 — Kapitalisasi (IAS 38) per kontrak
  capitalized = transfer_fee_net + training_compensation + solidarity + agent_fee_licensed
  bullet: gaji pokok & bonus pertandingan TIDAK dikapitalisasi [PRD §7.1]
  bullet: FIFA solidarity = 5% × transfer internasional bila riwayat 12–23 lengkap
          (0,25%×4 thn + 0,50%×8 thn) [RULEBOOK §8, TV-16]
                     ▼
STEP 2 — Amortisasi & NBV per kontrak
  monthly_amortization = capitalized / original_duration_months
  annual_amortization  = monthly_amortization × 12
  NBV(t) = capitalized − akumulasi amortisasi s.d. t
  re-amort: annual_baru = NBV / reamortization_remaining_years  (4 tahun, R1)
  hasil ditulis ke monthly_amortization_value, net_book_value_current (plaintext,
  sesuai PRD §10.1; kerahasiaan dijaga RLS+RBAC)
                     ▼
STEP 3 — Agregasi 3 tahun
  Year 1: CapEx rekrutmen penuh + OpEx penuh → beban amortisasi penuh
  Year 2: CapEx turun; Championship Step-Up Valuation mulai berlaku [PRD §2.2 Pilar D]
          dengan multiplier = input terkonfigurasi, default netral 1.0 (R7)
  Year 3: CapEx minimal; player trading mulai masuk (5–15%, Pilar D) [RULEBOOK §11]
  Source label wajib per angka: TEMPLATE_PRD | INPUT_MANUAL_KLUB [DES §11.4, ARCH §2.2.1]
                     ▼
STEP 4 — Constraint band (BUKAN hard sum)
  Beban gaji A/B/C = 45–50% / 35–40% / 10–15% → band, pembulatan terkontrol (R5)
  Porsi 6 pilar revenue = target band/relatif, tidak dinormalisasi paksa (R4)
  Jumlah slot 26–28; Grade A 6–8, B 11–13, C 6–8; SCR ≤ scr_max_threshold_pct
                     ▼
OUTPUT → juara_projections (18 field angka + 5+6 komponen SCR + calculated_scr_pct
         + scr_status + cash_buffer_reserve + loan_minute_threshold)
```

Catatan `R8`: kenaikan gaji bertahap pada 15/35/60 penampilan adalah **field input template**,
tanpa besaran hardcode `[PM_RULINGS R8]`. Besaran final = input Owner menjelang gate v1.0.

---

## 3. Jadwal arus kas 12 bulan + Minimum Cash Buffer 2,5×

Tahun fiskal mulai Juli (bulan 1 = Jul … bulan 12 = Jun) `[PRD §10.1]`.

### 3.1 Waterfall per bulan

```
cash_open(m)
  + inflow(m)   = sponsor termin + hak siar/subsidi termin + tiket & hospitality
                  + merchandise + academy/community + player trading (jika ada)
  - outflow(m)  = gaji pokok + PPh 21/jaminan + bonus performa + Matchday LOC
                  + Away Logistics + academy ops + cicilan CapEx tunai (signing fee)
  = cash_close(m)

Gate: cash_close(m) ≥ Minimum Cash Buffer  untuk setiap m = 1…12
```

- Sponsor & hak siar cair per **termin**; gaji dan biaya away keluar **tiap bulan**
  `[PRD §7.2]`. Jumlah termin adalah **input terkonfigurasi, default 3** (PRD menulis
  "misal 3 termin per musim" → bukan angka mengikat) `[ASUMSI → PM/CTO, lihat §12]`.
- Minimum Cash Buffer = **2,5 × OpEx bulanan** `[PRD §7.2, RULEBOOK §6]`.
- `cash_buffer_reserve` disimpan di `juara_projections` `[ARCH §2.2.7]`.

### 3.2 Contoh buffer (test vector TV-09)

```
OpEx tahunan (contoh RULEBOOK TV-09)  = 18.600.000.000
OpEx bulanan                          = 18.600.000.000 / 12 = 1.550.000.000
Minimum Cash Buffer = 2,5 × 1.550.000.000 = 3.875.000.000  ✅ TV-09
```

### 3.3 Perilaku gagal

Jika `cash_close(m) < buffer` → status `CASH_BREACH`, tampilkan: (a) tunda cicilan CapEx
bulan tersebut, (b) tarik tambahan equity (sensitif, butuh OWN), (c) restrukturisasi
termin sponsor. Tidak ada dana keluar otomatis tanpa otorisasi peran.

---

## 4. SCR pipeline (dari rulebook, bukan agregat)

### 4.1 Field komponen `[R2, ARCH §2.2.7]`

**Pembilang — Total Squad Cost (5 field, `scr_num_*`)**

| # | Field | Sumber |
|---|---|---|
| 1 | `scr_num_gross_wages` | gaji kotor tim utama + staf pelatih |
| 2 | `scr_num_fixed_allowances_tax` | tunjangan tetap + PPh 21 ditanggung klub |
| 3 | `scr_num_annual_amortization` | beban amortisasi tahunan registrasi (dari STEP 2) |
| 4 | `scr_num_annual_agent_fees` | biaya agen tahunan |
| 5 | `scr_num_guaranteed_bonus` | estimasi bonus performa terjamin |

**Penyebut — Adjusted Operating Revenue (6 field, `scr_den_*`)**

| # | Field | Sumber |
|---|---|---|
| 1 | `scr_den_sponsorship` | sponsorship |
| 2 | `scr_den_ticketing_hospitality` | tiketing & hospitality |
| 3 | `scr_den_merchandise_net` | merchandise bersih |
| 4 | `scr_den_broadcast_subsidy` | hak siar + subsidi operator liga |
| 5 | `scr_den_other_commercial` | pendapatan komersial lain |
| 6 | `scr_den_player_trading_profit` | laba bersih penjualan pemain |

```
SCR (%) = (Σ5 pembilang / Σ6 penyebut) × 100%        [PRD §7.2, RULEBOOK §6]
Guard: Σ6 penyebut > 0; jika 0 → SCR = NULL + status INVALID_DENOMINATOR,
       jangan pernah dibagi 0 atau dijadi 0%.
```

### 4.2 Tiga zona & ambang

| Zona | SCR | Status engine | Aksi `[PRD §7.2]` |
|---|---|---|---|
| Hijau | ≤ 58,0% | `GREEN` | izinkan ekspansi Grade A / investasi sport science |
| Kuning | 58,1% – 65,0% | `YELLOW_WATCHLIST` | draf kontrak baru butuh otorisasi eksplisit OWN/FIN |
| Merah | > 65,0% | `RED_BREACH` | kunci tombol persetujuan rekrutmen + SCR Remediation Simulator |

Ambang merah mengikuti `scr_max_threshold_pct` (default 65,00; contoh Owner 62,0
`[PRD §10.2]`; Templat B **< 60** `[RULEBOOK §12]`). Turunan yang dipakai engine
`[TURUNAN → konfirmasi PM]`: `GREEN` bila `SCR ≤ 58,00`; `YELLOW` bila
`58,00 < SCR ≤ scr_max_threshold_pct`; `RED` bila `SCR > scr_max_threshold_pct`.
**R15:** input `scr_max_threshold_pct < 58` ditolak validasi (clamp ke 58,00 + peringatan),
karena interval YELLOW mustahil bila ambang lebih rendah dari batas hijau.

Boundary test `[RULEBOOK TV-07]`: 58,0 → GREEN; 58,1 → YELLOW; 65,0 → YELLOW;
65,01 → RED (dengan threshold default 65,00).

### 4.3 Remediasi (3 opsi kuantitatif) `[PRD §7.2]`

Misalkan `N` = pembilang, `D` = penyebut, `T` = target SCR (desimal, mis. 0,58).

| Opsi | Perhitungan | Efek |
|---|---|---|
| (a) Tambah target sponsor | `Δsponsor = N/T − D` | menaikkan `scr_den_sponsorship`; nominal kontrak sponsor dienkripsi di vault (F-06) |
| (b) Lepas/pinjam beban gaji tertinggi | `N' = N − w_gaji` (loan) atau `N − w_gaji − amort` (jual) | turunkan `scr_num_gross_wages`; bila jual, `scr_num_annual_amortization` ikut turun dan `scr_den_player_trading_profit` naik |
| (c) Ganti Grade A → promosi Grade C | `ΔN = w_A − w_C − amort_A` | hindari beban baru; NBV Grade C = 0 → hasil jual 100% pure profit `[PRD §7.1]` |

Semua opsi dihitung di **simulasi**, tidak mengubah playbook terkunci.

---

## 5. What-if simulator

Endpoint `POST /api/juara/v1/playbooks/{id}/simulate-what-if`, target **< 150 ms**,
peran **OWN, CEO, FIN** `[ARCH §7.1 #3]`. Tidak menulis ke playbook `LOCKED_ACTIVE`.

| Kelompok | Variabel | Default | Batas |
|---|---|---|---|
| Komersial | multiplier sponsor/tiket (R7), occupancy, target sponsor tambahan | multiplier **1.0** (netral) | input terkonfigurasi; angka final Owner |
| Skuad | tambah Grade A, promosi Grade C, lepas/pinjam pemail beban tertinggi | dari baseline | kuota A 6–8 / B 11–13 / C 6–8 |
| Kontrak | transfer fee, durasi bulan, `reamortization_years` | 4 tahun (R1) | 2–5 tahun |
| Finansial | `scr_max_threshold_pct`, equity injection (sensitif) | 65,00 / input | OWN/FIN |

Alur: `baseline snapshot` → `terapkan delta variabel` → `hitung ulang STEP 1–4 + SCR +
cashflow` → `diff (baseline vs scenario)` → `status transisi zona + buffer headroom`.
Deterministik: tanpa RNG; setiap angka membawa label sumber. Keluaran DTO **per peran**:
field gaji/kontrak tidak pernah dikirim ke SPO/COA/SEC `[ARCH §5.1]`.

---

## 6. Matchday Break-Even

Rumus `[TURUNAN dari PRD §2.2 Pilar D + RULEBOOK §11, kalibrasi template]`:

```
weighted_ticket_price = Σ (porsi_kategori × harga_kategori)
contribution_per_pax  = weighted_ticket_price − variable_cost_per_pax
break_even_attendance = fixed_matchday_cost / contribution_per_pax
break_even_occupancy  = break_even_attendance / stadium_capacity
```

Komponen: fixed = Matchday LOC + stadiun/security/lighting/marketing per laga kandang;
variable = tiket cetak/validasi, kebersihan, usher per penonton. Season Pass dialokasikan
per laga kandang. Jumlah laga kandang = 19 dari 38 pertandingan musim `[TURUNAN]`
(`RULEBOOK §9`: 38 × 990 = 37.620 menit/musim). Laga tandang adalah pusat biaya
(`opex_away_travel_logistics`), bukan titik break-even tiket.

**Contoh ilustratif (bukan angka PRD, bukan data klub riil):**

```
kapasitas 20.000; price mix 60%×50.000 + 30%×150.000 + 10%×500.000 = 125.000/pax
variable cost 20.000/pax → contribution 105.000/pax
fixed cost 900.000.000/laga
break-even = 900.000.000 / 105.000 = 8.571,43 → dibulatkan 8.572 penonton
occupancy break-even = 8.572 / 20.000 = 42,86%
```

Efek pengganda gaya menyerang pada okupansi `[PRD §2.2 Pilar D]` memakai multiplier
R7 (default 1.0) — **bukan angka hardcode**.

---

## 7. Sponsorship Inventory & Rate-Card

Inventaris wajib `[PRD §2.2 Pilar D, RULEBOOK §11]`:

| # | Item inventaris | Unit | Metrik eksposur | Catatan |
|---|---|---|---|---|
| 1 | Sponsor Utama Dada | 1 | siaran + foto kapten | aset paling bernilai |
| 2 | Lengan | 1 | close-up | sering dijual terpisah |
| 3 | Punggung | 1 | name/box | — |
| 4 | Celana | 1 | — | — |
| 5 | LED Perimeter Board | N slot | menit tayang per laga | bisa 3–6 rotasi |
| 6 | Backdrop Konferensi Pers | 1 | freq. press conference | — |
| 7 | Training Ground Naming Rights | 1 | durasi tahun | kontrak multi-tahun |

Struktur rate-card (per baris): `inventory_item`, `unit_count`, `base_price_enc`,
`exposure_metric`, `term_months`, `renewal_date`, `step_up_multiplier` (R7, default 1.0),
`source_label`. Porsi target sponsorship **40–50%** dari revenue → **band**, bukan hard
sum (R4). **R16:** field rate-card disimpan di kolom `juara_projections.ratecard_config_enc`
(BYTEA, AES-256-GCM aplikasi) — **tanpa tabel ke-9**; implementasi menyusul di desain v1.

**Kerahasiaan:** nilai kontrak sponsor sensitif `[PRD §1.3]` dan disimpan sebagai
`juara_contracts_vault.sponsor_contract_value_enc` (keputusan F-06 Divisi 3,
`ARCH §2.2.6/§10.3`) — **bukan** kolom plaintext di `juara_projections`. Rate-card
nominal hanya tampil untuk OWN/CEO/FIN; SPO **DENY** modul M5, COA **DENY** M5,
SEC hanya tanggal/status `[ARCH §5/§5.1]`. Konfirmasi penempatan F-06 oleh Divisi 6
QA v1 masih terbuka (`ARCH §10.3 #7`).

Championship Step-Up Valuation Tahun ke-2 `[PRD §2.2 Pilar D]` diterapkan via
`step_up_multiplier` yang dikonfigurasi, default 1.0 (R7) — tidak di-hardcode.

---

## 8. PDF Boardroom — spesifikasi generator

Library: **jsPDF + jspdf-autotable** (sudah ada, `[DES §7 K7]`; `PRD §11 Sprint 6`).
Grafik vektor resolusi tinggi; print stylesheet/tipografi dari Divisi 2 `[PRD §11]`.

### 8.1 Watermark wajib (setiap halaman) `[PRD §11 Sprint 6]`

```
RAHASIA — <nama_pengunduh> | <peran> | <stempel_waktu_WIB>
```

- Diagonal, opacity rendah, di belakang konten; **plus** header/footer ringkas.
- `peran` diambil dari `juara_club_members` klub aktif; waktu dengan zona WIB.
- Nama/peran/waktu adalah identitas, **bukan** rahasia; tidak pernah menaruh kunci,
  token, connection string, atau nominal gaji individual di watermark.

### 8.2 Struktur halaman

1. Cover — logo klub, versi playbook, tanggal, status `DRAFT/SIMULATION/LOCKED_ACTIVE`.
2. Executive summary — target prestasi, horizon, SCR status, cash buffer status.
3. CapEx/OpEx 3 tahun — tabel autotable per `projection_year`.
4. Arus kas 12 bulan — grafik air terjun + garis Minimum Cash Buffer.
5. SCR — speedometer + tabel 5+6 komponen (label sumber per angka).
6. Amortisasi IAS 38 — jadwal bulanan/tahunan, NBV, skenario re-amortisasi.
7. Sponsorship inventory & rate-card — **diredaksi sesuai peran**.
8. What-if diff — baseline vs skenario (hanya jika diundang oleh OWN/CEO/FIN).
9. Sign-off — ruang tanda tangan OWN/FIN.

### 8.3 Daftar angka yang WAJIB tampil

| Angka | Sumber | Catatan |
|---|---|---|
| `calculated_scr_pct` + `scr_status` | `juara_projections` | dari 5+6 komponen, bukan agregat CapEx/OpEx |
| 5 komponen pembilang + 6 komponen penyebut | `juara_projections` | R2; field terpisah |
| `scr_max_threshold_pct` | `juara_playbooks` | default 65,00 / Templat B < 60 |
| CapEx 3 field × 3 tahun | `juara_projections` | CapEx ≠ OpEx |
| OpEx 6 field × 3 tahun | `juara_projections` | — |
| 6 pilar revenue per tahun | `juara_projections` | label band, bukan hard sum (R4) |
| `cash_buffer_reserve` + cash_close minimum 12 bulan | `juara_projections` | 2,5× OpEx bulanan |
| `monthly_amortization_value`, `net_book_value_current` | `juara_contracts_vault` | hasil kalkulasi |
| Amortisasi tahunan sebelum/sesudah re-amort | STEP 2 | 550 jt → 275 jt (R1) |
| `weighted_target_age` = 24,40 | `juara_playbooks` | 19/23/27/31 (R6) |
| Kuota slot 26–28; A/B/C 6–8 / 11–13 / 6–8 | `juara_squad_slots` | — |
| `loan_minute_threshold` = 550 | `juara_projections` | per pemain (R9) |
| `break_even_attendance` + occupancy | §6 | label "ilustrasi/template" |

Angka yang **DILARANG** tampil untuk peran tanpa hak: gaji individual, signing fee,
buy-out, PPh 21, P&L, dan nilai kontrak sponsor — DTO dibangun eksplisit per peran,
bukan `SELECT *` `[ARCH §5.1]`.

---

## 9. Contoh hitung penuh — IAS 38 → SCR

Sumber angka kapitalisasi: `[PRD §7.1]` (test vector TV-01…TV-04). Semua dihitung ulang
dengan `Decimal`, hasil di §11.

### 9.1 Kapitalisasi & amortisasi

```
transfer fee                    1.500.000.000
agent fee (berlisensi)            150.000.000
total dikapitalisasi            1.650.000.000      [PRD §7.1]
durasi kontrak awal              36 bulan

amortisasi bulanan (eksak) = 1.650.000.000 / 36 = 45.833.333,3333…
amortisasi bulanan (tampilan) = 45.833.333,33  (PRD membulatkan 45.833.333)
amortisasi tahunan = 1.650.000.000 × 12/36 = 550.000.000 (dari nilai eksak; R14)
CATATAN R14: jangan menghitung tahunan dari nilai bulanan yang sudah dibulatkan
(45.833.333,33 × 12 = 549.999.999,96 — selisih Rp 4).
```

### 9.2 NBV setelah Tahun-1 & re-amortisasi `[R1]`

```
akumulasi amortisasi Y1 = 550.000.000
NBV akhir Y1            = 1.650.000.000 − 550.000.000 = 1.100.000.000
perpanjangan 2 tahun tambahan di akhir Y1 → sisa durasi baru = 4 tahun (R1)
amortisasi tahunan BARU = 1.100.000.000 / 4 = 275.000.000     (turun 50%)
amortisasi bulanan BARU = 275.000.000 / 12 = 22.916.666,67
```

Interpretasi 4 tahun mengikuti putusan PM `[R1]` — **bukan asumsi worker**. Bila dibaca
"2 tahun total", hasilnya tetap 550 jt dan bertentangan dengan klaim PRD bahwa beban
menurun `[RULEBOOK §14 A1]`.

### 9.3 Pengaruh ke SCR

Data agregat PRD `[PRD §10.2 / TV-08]`: revenue = 24.500.000.000; SCR = 59,8%;
implisit Total Squad Cost = 14.651.000.000. PRD **tidak** memberi rincian komponen,
jadi untuk membuktikan pipeline `[R2]` dipakai **rincian ilustratif dari template**
(dibuat sedemikian rupa sehingga berjumlah 14.651.000.000 untuk test vector):

| Komponen pembilang | Nilai ilustratif (bukan angka PRD) |
|---|---:|
| `scr_num_gross_wages` | 11.000.000.000 |
| `scr_num_fixed_allowances_tax` | 1.400.000.000 |
| `scr_num_annual_amortization` (termasuk 550 jt pemain ini) | 1.650.000.000 |
| `scr_num_annual_agent_fees` | 400.000.000 |
| `scr_num_guaranteed_bonus` | 201.000.000 |
| **Total pembilang** | **14.651.000.000** |

```
SCR sebelum = 14.651.000.000 / 24.500.000.000 × 100 = 59,80% → YELLOW_WATCHLIST ✅ TV-06

Re-amortisasi: amortisasi pemain turun 550.000.000 → 275.000.000  (Δ = 275.000.000)
pembilang baru = 14.651.000.000 − 275.000.000 = 14.376.000.000
SCR sesudah    = 14.376.000.000 / 24.500.000.000 × 100 = 58,68% → masih YELLOW
                (turun 1,12 poin; headroom ke GREEN ≤ 58,00% = 0,68 poin)

Remediasi (a) ke GREEN:
Δsponsor = 14.376.000.000 / 0,58 − 24.500.000.000 = 286.206.896,55
```

Catatan audit: 59,8% dan 24,5 M adalah **angka PRD**; 14.651.000.000 adalah **turunan
PRD/TV-08**; kelima rincian di atas adalah **ilustrasi template**, bukan fakta PRD dan
bukan data klub riil. Engine dilarang mengarang rincian untuk data riil `[R2]`.

---

## 10. Ringkasan hak lihat angka (turunan `ARCHITECTURE.md` §5.1)

| Peran | Gaji individual & kontrak | PPh 21 & P&L | Pagu posisi | Tanggal & status kontrak | Modul M4 / M5 |
|---|---|---|---|---|---|
| OWN, CEO, FIN | penuh | penuh | penuh | penuh | ALLOW |
| SPO | DENY | DENY | ALLOW | ALLOW | M4 ALLOW* / M5 **DENY** |
| COA | DENY | DENY | DENY | ALLOW | M4/M5 **DENY** |
| SEC | DENY (tanggal & status saja) | DENY | DENY | ALLOW | M4 DENY / M5 ALLOW* |

Dokumen ini berisi **agregat ilustratif**, bukan nominal gaji individual, dan **tidak
memuat kredensial, kunci enkripsi, atau data klub riil**.

---

## 11. Verifikasi

### 11.1 Skill `verify` (itqan-engineering)

Skill `verify` **tidak tersedia** di harness ini — tidak ada di daftar skill sesi, tidak
pula di `~/.claude/skills/` maupun `~/.opencode/skills/`. Hal ini sudah dicatat oleh
Divisi 1 (`RULEBOOK.md` §15), PM (`PM_RULINGS.md` baris 28–30), dan Divisi 3
(`ARCHITECTURE.md` §10.1). **Tidak diklaim telah digunakan.** Pengganti yang dijalankan:

1. Hitung ulang independen dengan Python `Decimal` (`ROUND_HALF_UP`, 2 desimal).
2. Pengecekan silang terhadap `RULEBOOK.md` §13 TV-01/02/03/04/06/07/08/09/16 dan
   `PM_RULINGS.md` R1–R9.
3. Pengecekan silang field dengan `ARCHITECTURE.md` §2.2.7 (5+6 komponen SCR, ambang 550,
   `reamortization_years = 4`) dan §5.1 (matriks hak lihat).
4. Pengecekan batas wewenang: tidak ada migrasi/apply DB, deploy, DNS, SSL, push, restart,
   kredensial, data klub riil, atau kode produksi; satu-satunya file yang ditulis =
   `docs/juara/FINANCE_SPEC.md`.
5. `graphify`: CLI `graphify` **tidak terpasang** di PATH, dan `graphify-out/graph.json`
   (build 07.09) **tidak mengandung** dokumen `juara_*` sama sekali (0 kecocokan untuk
   `juara|rulebook|amortisasi|capex`). Kueri tidak bisa dipakai sebagai bukti; sumber
   dibaca langsung dari dokumentasi Sprint 0 yang bersangkutan. Ini dicatat, bukan
   dianggap sudah menjalankan kueri.

### 11.2 Hasil hitung ulang (bukti)

| Test | Ekspektasi (sumber) | Hitung ulang | Cocok |
|---|---|---|---|
| Kapitalisasi | 1.650.000.000 (PRD §7.1) | 1.650.000.000 | ✅ |
| Amortisasi bulanan | 45.833.333,33 (TV-01) | 45.833.333,33 | ✅ |
| Amortisasi tahunan | 550.000.000 (TV-02) | 550.000.000 | ✅ |
| NBV akhir Y1 | 1.100.000.000 (TV-03) | 1.100.000.000 | ✅ |
| Re-amort 4 thn (R1) | 275.000.000 (TV-04) | 275.000.000 | ✅ |
| Amort bulanan baru | turunan | 22.916.666,67 | ✅ |
| Δ amortisasi | turunan | 275.000.000 | ✅ |
| SCR sebelum | 59,80% (TV-06) | 59,80% | ✅ |
| Pembilang implisit | 14.651.000.000 (TV-08) | 14.651.000.000 | ✅ |
| SCR sesudah re-amort | turunan | 58,68% | ✅ |
| Δ sponsor ke 58% | turunan | 286.206.896,55 | ✅ |
| Cash buffer 2,5× | 3.875.000.000 (TV-09) | 3.875.000.000 | ✅ |
| Break-even (ilustrasi) | turunan | 8.572 pax / 42,86% | ✅ |

### 11.3 Pengecekan struktural

- 5 komponen pembilang + 6 komponen penyebut → 11 field SCR hadir di `ARCH §2.2.7` ✅
- Zona: 58,0 GREEN / 58,1 YELLOW / 65,0 YELLOW / 65,01 RED (TV-07) ✅
- CapEx 3 field, OpEx 6 field, 6 pilar revenue → cocok dengan `juara_projections` ✅
- `scr_max_threshold_pct` default 65,00; Templat B < 60; contoh Owner 62,0 ✅
- R7 multiplier default 1.0; R8 pemicu 15/35/60 tanpa hardcode; R9 < 550 menit/pemain ✅
- D1–D3 tercatat sebagai keputusan, bukan asumsi ✅
- Tidak ada kredensial/kunci/connection string/nominal gaji individual di dokumen ini ✅

---

## 12. Hal yang tidak bisa diputuskan worker — diteruskan ke Owner (lewat PM)

1. **Angka final multiplier komersial & kenaikan gaji bertahap** (R7/R8): default netral 1.0
   dan field template sudah disiapkan, tetapi Championship Step-Up Valuation Tahun ke-2,
   efek pengganda gaya menyerang, dan besaran kenaikan di 15/35/60 penampilan baru
   menjadi constraint final menjelang gate v1.0.
2. **Jadwal termin sponsor/hak siar final** — PRD hanya memberi contoh "misal 3 termin per
   musim"; worker memakai default 3 sebagai input terkonfigurasi, bukan angka mengikat.
3. **Pemilihan template Aktif per klub** (default 65 vs Templat B `< 60`) — memengaruhi
   ambang `RED_BREACH`; butuh keputusan Owner/PM.
4. **Data klub riil** (dianonimkan/disetujui) untuk UAT/gate v1.0 `[D3]` — bukan sekarang.
5. **Kunci enkripsi, deploy, DNS `juara.stadione.pro`, SSL/TLS, hosting, kredensial** —
   tidak termasuk mandat worker `[D2][D4]`.
6. **Nilai pagu/equity injection** untuk simulasi nyata — `owner_equity_injection_enc`
   disiapkan, tetapi nominalnya bukan keputusan Divisi 4.

Diteruskan ke **PM / Divisi 6** (bukan Owner): konfirmasi penempatan
`sponsor_contract_value_enc` di vault (F-06, `ARCH §10.3 #7`) dan validasi watermark PDF
serta uji beban antrean generasi PDF (PRD §11 Sprint 6).

---

*Dokumen ini adalah kontrak komputasi keuangan untuk Divisi 3 (engine), Divisi 2 (visualisasi
grafik arus kas & SCR), dan Divisi 6 (QA test vector). Perubahan rumus/angka wajib lewat PM
dan penanda versi. Tidak ada migrasi, apply DB, deploy, DNS, SSL, push, restart, kredensial,
data klub riil, atau perubahan kode produksi yang dilakukan dalam penyusunan artefak ini.*
