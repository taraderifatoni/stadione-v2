# MASTER FORMULA RULEBOOK — JUARA.STADIONE.PRO

**Artefak Sprint 0 — Divisi 1 (Sports Domain, Data Science & Football Finance / The Brain)**
Status: `DRAFT FOR PM/CTO REVIEW` — bukan izin deploy, migrasi, atau produksi.
Pembuat: worker Divisi 1. Rantai komando: Owner → CTO → PM → Divisi 1.
Sumber otoritatif domain: `docs/juara/PRD-JUARA.md` (721 baris). **Bukan** `PRD.md` di root repo (itu produk B2C).
Pendukung: `docs/superpowers/specs/2026-11-22-juara-stadione-pro-design.md` (DES), `docs/juara/DECISIONS.md` (D1–D4).

---

## 0. CARA BACA & HIERARKI OTORITAS

Penanda di setiap aturan:

| Penanda | Arti |
|---|---|
| `[PRD §x]` | Fakta/angka eksplisit dari salinan PRD lengkap. Mengikat. |
| `[DES §x]` | Keputusan/klarifikasi PM di design doc. Mengikat setelah disetujui. |
| `[D1]`–`[D4]` | Keputusan CTO atas delegasi Owner. **Sudah berlaku**, bukan asumsi. |
| `[TURUNAN]` | Hasil hitung/interpretasi dari angka PRD. Rumus ditulis supaya bisa diaudit. |
| `[ASUMSI]` | Tidak eksplisit di PRD; **butuh lampu hijau PM/CTO** sebelum jadi constraint engine. |

Urutan konflik: **D1–D4 > PRD eksplisit > DES > TURUNAN > ASUMSI**. Jangan menimpa keputusan CTO dengan interpretasi sendiri.

Tiga keputusan yang **sudah ditetapkan** dan tidak dibuka kembali: **approach B / vertical slice** `[D1]`, **K3 = Supabase Auth + RBAC 6 peran, SSO menyusul** `[D2]`, **UAT = 3 template PRD + adapter import terenkripsi sejak sekarang** `[D3]`. Arsitektur data: satu repo, satu DB, satu `auth.users`, tabel `juara_*` di `schema public`, RLS `club_id`, AES-256-GCM di aplikasi → `BYTEA` `[D4]`.

---

## 1. EMPAT TACTICAL DNA + KONSEKUENSI USIA/FISIK `[PRD §2.1 Langkah 3, §8.1]`

| # | DNA | Parameter taktis terukur | Konsekuensi rekrutmen (usia + atribut) |
|---|---|---|---|
| 1 | **HIGH_PRESSING** (Gegenpressing) | Build-up < 4 umpan menembus blok; transisi serangan balik < 5 detik; garis pertahanan **42–48 m**; **PPDA < 8,5**; counter-press 3–4 pemain terdekat | Gelandang & penyerang **21–25 thn**, **High-Speed Running > 1.100 m/laga**; investasi lebih besar sport science & recovery |
| 2 | **POSITIONAL_PLAY** (Dominant Possession) | Penguasaan bola **> 58%**; sirkulasi dari GK/CB; rotasi half-space; **PPDA 9,0–11,0**; counter-press 6 detik; Rest Defense **2-3 / 3-2** wajib | GK, CB, pivot **25–30 thn**, **akurasi umpan progresif > 86%**; kecerdasan taktis tinggi |
| 3 | **VERTICAL_COUNTER** (Compact Block) | Direct bypass ke target man; eksploitasi ruang < 6 detik; winger **> 32,5 km/jam**; blok **28–34 m**; **PPDA > 13,0**; low block 4-4-2 | Duet CB senior **27–31 thn**, **aerial win > 68%**; winger muda eksplosif **20–24 thn**; efisien anggaran |
| 4 | **BALANCED_HYBRID** | Dominan di kandang, pragmatis tandang; pressing selektif via *pressing triggers* (umpan ke bek sayap); transisi sesuai superioritas jumlah pemain | Pemain **versatile ≥ 2 peran posisi** dari 22 archetype; fleksibilitas taktis tinggi |

Aturan turunan: `tactical_dna_type` harus salah satu ENUM `HIGH_PRESSING | POSITIONAL_PLAY | VERTICAL_COUNTER | BALANCED_HYBRID` `[PRD §10.1]`. Alert High-Pressing pada response contoh menuntut **minimal 4 pemain depan/sayap usia 20–24 thn dengan skor fisik ≥ 15** (skala 1–20) `[PRD §10.2]`.

---

## 2. AGE-BRACKET MATRIX — 26–28 PEMAIN `[PRD §2.2 Pilar A]`

| Kelompok usia | Peran | Target 1 thn (Juara Liga 2) | Proyek 3 thn | Fungsi |
|---|---|---|---|---|
| 17–21 | Emerging & Academy Core | **25%** (6–7 pemain) | **35%** (9–10) | regulasi pemain muda, energi pressing, pertumbuhan market value |
| 22–24 | Pre-Prime Dynamic Engine | **25%** (6–7) | **30%** (8) | intensitas lari, siap puncak dalam 12–18 bulan |
| 25–29 | Peak Performance Spine | **40%** (10–11) | **28%** (7–8) | pengunci kemenangan, peredam tekanan muda |
| 30–33 | Senior Leadership & Mentors | **10%** (2–3) | **7%** (2) | kapten/mentor di Kiper–CB–Pivot |

Aturan: total slot **26–28** `[PRD §2.2]`; pembulatan ke bilangan bulat wajib menghasilkan jumlah persis 26–28 `[TURUNAN]`. Peak performance umum **24–29 thn** `[PRD §1.1]`.

`weighted_target_age` = Σ(representative_age_bracket × bobot) `[TURUNAN dari PRD §10.2 response 24.4]`. Representatif yang mereproduksi angka PRD: 19 / 23 / 27 / 31 → 24,4. **Konvensi representatif (31 vs 31,5) masih [ASUMSI] — lihat §13.**

---

## 3. KUOTA GRADE A/B/C + BEBAN GAJI `[PRD §2.2 Pilar B, §10.1]`

| Grade | Kuota (target 1 thn) | Beban gaji | Syarat / penempatan |
|---|---|---|---|
| **A** Marquee / Difference-Maker | **6–8** | **45–50%** total anggaran gaji | Wajib di poros tengah: 1 GK/CB pemimpin, 1 playmaker/box-to-box, 1 clinical finisher, 2 winger pengubah hasil; tidak boleh menumpuk satu posisi |
| **B** Competitive Regular | **11–13** | **35–40%** | > 2.000 menit musim sebelumnya; 100% cocok dengan gaya main Owner |
| **C** High-Potential Academy | **6–8** | **10–15%** | EPA U-16/U-18/U-20 atau talenta lokal; kontrak 3–4 thn dengan kenaikan bertahap |

FIELD: `target_grade` ENUM `'A'|'B'|'C'`; `current_ability_grade` ENUM `'A+'|'A'|'B+'|'B'|'C'`; `potential_ceiling_grade` ENUM `'A+'|'A'|'B'` `[PRD §10.1]`. Contoh response: 7/12/8 = 27 pemain `[PRD §10.2]`.

Skema filosofi (Wizard langkah 4): Star-Driven / Balanced Spine + Academy (rekomendasi: 6–8 tulang punggung Grade A/B membimbing 30% lulusan terbaik) / Academy-First (min. **40–45%** slot tim utama U-22 + 4–5 mentor senior) `[PRD §2.1]`.

---

## 4. 22 ARCHETYPE PERAN `[PRD §8.2]`

Setiap slot wajib memakai archetype spesifik dengan bobot **skala 1–20** pada 4 dimensi: **Technical, Tactical/Mental, Physical, Leadership** `[PRD §8.2]`.

| Unit | Jumlah | Archetype |
|---|---|---|
| Penjaga Gawang | 2 | Sweeper Keeper (Build-Up & High Line); Traditional Shot-Stopper (Low Block) |
| Bek Tengah | 3 | Ball-Playing Defender (BPD); Aggressive Stopper / Front-Foot Defender; Covering / Sweeper CB |
| Bek Sayap | 3 | Inverted Full-Back; Complete Wing-Back (Overlap Lebar); Defensive Full-Back |
| Gelandang Bertahan & Tengah | 5 | Deep-Lying Playmaker (Regista); Ball-Winning Destroyer (Anchor); Box-to-Box Engine (Mezzala); Advanced Playmaker (No. 10); Carrilero |
| Penyerang Sayap | 4 | Inverted Inside Forward; Touchline Winger; Wide Playmaker; Raumdeuter |
| Penyerang Tengah | 5 | Pressing Forward; Complete Forward; Target Man; Poacher / Clinical Finisher; False Nine |

**Total = 2+3+3+5+4+5 = 22** `[TURUNAN]`. `position_code` contoh: GK, RCB, LCB, RB, LB, CDM, RCM, LCM, RW, LW, ST `[PRD §10.1]`.

---

## 5. CHART OF ACCOUNTS — CapEx / OpEx `[PRD §2.2 Pilar C, §10.1]`

**CapEx** (dikapitalisasi): transfer/kompensasi Grade A & B; signing-on fee; komisi agen berlisensi; perangkat sport science (GPS vest, recovery medis, analisis video).
Fields: `capex_transfer_fees`, `capex_signing_agent_fees`, `capex_sport_science_infra`.

**OpEx** (beban langsung): gaji pokok per Grade A/B/C; insentif performa (menang kandang/tandang, clean sheet, target); PPh 21 + jaminan sosial/asuransi cedera; Matchday LOC; Away Logistics; pembinaan akademi/EPA & kit/equipment.
Fields: `opex_base_wages`, `opex_performance_bonuses`, `opex_taxes_insurance`, `opex_matchday_operations`, `opex_away_travel_logistics`, `opex_academy_operations`.

`projection_year` = 1, 2, 3 `[PRD §10.1]`. `fiscal_year_start_month` default 7 (Juli) `[PRD §10.1]`.

---

## 6. SCR — Squad Cost Ratio `[PRD §2.2 Pilar C, §7.2, §10.1]`

**Rumus eksak** `[PRD §7.2]`:

```
SCR (%) = (Total Squad Cost / Adjusted Operating Revenue) × 100%
```

**Pembilang (Total Squad Cost)** = Gaji kotor tim utama + staf pelatih
\+ Tunjangan tetap & PPh 21 ditanggung klub
\+ Beban amortisasi tahunan registrasi pemain
\+ Biaya agen tahunan
\+ Estimasi bonus performa terjamin.

**Penyebut (Adjusted Operating Revenue)** = Sponsorship
\+ Ticketing & Hospitality
\+ Merchandise bersih
\+ Hak siar & subsidi operator liga
\+ Pendapatan komersial lain
\+ Laba bersih penjualan pemain (player trading profit).

**3 zona intervensi** `[PRD §7.2]`:

| Zona | SCR | Status engine | Aksi |
|---|---|---|---|
| Hijau | **≤ 58,0%** | `GREEN` | Izinkan ekspansi Grade A / investasi sport science |
| Kuning | **58,1% – 65,0%** | `YELLOW_WATCHLIST` | Draf kontrak baru butuh otorisasi eksplisit Club Owner / Finance Controller |
| Merah | **> 65,0%** | `RED_BREACH` | Kunci tombol persetujuan rekrutmen; tampilkan SCR Remediation Simulator: (a) tambah target sponsor Rp X, (b) lepas/pinjam beban gaji tertinggi, (c) ganti Grade A → promosi Grade C |

`scr_max_threshold_pct` default **65,00** `[PRD §10.1]`; contoh input Owner 62,0 `[PRD §10.2]`.
**Minimum Cash Buffer Reserve = 2,5 × OpEx bulanan** `[PRD §7.2]` (sponsor/hak siar cair per termin; gaji & away keluar tiap bulan).

---

## 7. IAS 38 — KAPITALISASI, AMORTISASI, NBV, PELEPASAN `[PRD §7.1]`

**Yang dikapitalisasi**: transfer fee bersih; training compensation + solidarity mechanism saat akuisisi; komisi agen FIFA-licensed untuk kontrak pertama. **Gaji pokok & bonus pertandingan TIDAK dikapitalisasi** (OpEx) `[PRD §7.1]`.

```
Amortisasi bulanan = Total biaya kapitalisasi / Durasi kontrak awal (bulan)   [PRD §7.1]
Amortisasi tahunan = Amortisasi bulanan × 12                                  [PRD §7.1]
Net Book Value (NBV) pada tanggal perpanjangan = Kapitalisasi awal − Akumulasi amortisasi   [PRD §7.1]
Amortisasi tahunan BARU = NBV / Sisa durasi kontrak baru (tahun)              [PRD §7.1]
Laba/Rugi pelepasan = Harga jual bersih (setelah biaya agen jual & sell-on) − NBV  [PRD §7.1]
```

Contoh PRD: transfer 1.500.000.000 + agen 150.000.000 = kapitalisasi **1.650.000.000**, kontrak 36 bulan → **550.000.000/tahun**, **45.833.333/bulan** `[PRD §7.1]`.
Alumni akademi (Grade C): **NBV = 0** → seluruh hasil jual bersih = **100% pure profit** `[PRD §7.1]`.
Field: `monthly_amortization_value`, `net_book_value_current`, `*_enc BYTEA` `[PRD §10.1]` + `[D4]` (AES-256-GCM di aplikasi, kunci environment, tidak pernah dilog).

"> **Interpretasi re-amortisasi [TURUNAN, butuh konfirmasi]**: PRD menyatakan perpanjangan 2 tahun tambahan di akhir Tahun ke-1 'menurunkan beban amortisasi tahunan'. Agar klaim itu benar secara matematis, sisa durasi baru harus **4 tahun** (2 sisa kontrak lama + 2 tambahan) → 275.000.000/tahun. Jika dibaca sebagai '2 tahun total', hasilnya 550.000.000/tahun (tidak turun) → bertentangan dengan teks PRD. Lihat §13."

---

## 8. KOMPENSASI 70:30 & FIFA SOLIDARITY `[PRD §7.3]`

**Split kompensasi** `[PRD §7.3]`: **70% gaji pokok tetap + 30% insentif variabel terukur**.

| Komponen variabel | Aturan |
|---|---|
| Appearance Fee | Dibayar hanya jika tampil **≥ 45 menit** di liga resmi |
| Win & Draw Bonus Pool | Bobot lawan: **1,0×** menang kandang; **1,5×** menang tandang; **2,0×** menang rival papan atas |
| Clean Sheet Bonus | GK & pertahanan, **≥ 60 menit tanpa kebobolan** |
| Championship / Promotion Escalator | Kollektif dari hadiah juara/promosi + kenaikan nilai sponsor musim berikutnya |

**FIFA Solidarity & Training Compensation** `[PRD §7.3]` (riwayat klub pembina usia **12–23**):

| Rentang usia | Tarif per tahun | Total |
|---|---|---|
| 12–15 | **0,25%** nilai transfer internasional | 1% (4 tahun) |
| 16–23 | **0,50%** nilai transfer internasional | 4% (8 tahun) |
| **Total kewajiban** | | **5%** |

Sistem memotong 5% dari biaya bersih pembelian dan menghitung piutang solidaritas untuk alumni yang transfer ke luar negeri `[PRD §7.3]`.

---

## 9. MENIT BERMAIN & ANTI-LEAKAGE `[PRD §8.3, §8.4]`

**Total menit skuad = 38 pertandingan × 990 menit = 37.620 menit/musim** `[PRD §8.3]`. Catatan turunan: 990 = 90 menit × 11 pemain di lapangan `[TURUNAN]`.

| Tier | Populasi | Alokasi menit (teks PRD) | Aturan |
|---|---|---|---|
| 1 — Core Spine Starters | 8–9 Grade A/B | 75–90% (2.800–3.400 menit) | stabilitas taktis & chemistry |
| 2 — First-Team Rotation | 7–8 Grade B | 45–65% (1.700–2.400 menit) | kartu, kelelahan, perubahan taktik |
| 3 — Academy Breakthrough | 5–6 Grade C U-21 | 20–35% (750–1.300 menit) | dilarang 90 menit penuh terus-menerus; 8–10 starter terkontrol + 15–20 masuk menit 60–75 |
| 4 — Developmental/Loan Pool | 4–5 U-20 | < 15% (< 550 menit) → `ELIGIBLE FOR STRATEGIC LOAN` | klausul jaminan **≥ 65% menit** + recall clause paruh musim |

**Anti-Talent Leakage** `[PRD §8.4]`:
1. **24-Month Renewal Lock** — alert darurat 24 bulan sebelum kontrak berakhir untuk usia **20–27** Grade A/B; tidak ada aset utama yang masuk 12 bulan terakhir tanpa keputusan perpanjang/jual.
2. **Step-Up Milestone Contract** — kontrak pertama akademi **3 tahun + 2 tahun opsi klub**; kenaikan gaji otomatis di **15, 35, 60** penampilan resmi.
3. **Tiered Release Clause** — minimal **4×–6×** total investasi pembinaan + gaji tahunan pemain.

---

## 10. LTAD, RAE/BIO-BANDING, ARI `[PRD §9.1–9.3]`

**LTAD 4 fase** `[PRD §9.1]`:

| Fase | Usia | Fokus | Gate evaluasi |
|---|---|---|---|
| 1 Foundation & Technical Mastery | 12–14 | bilateral, koordinasi, 4v4/7v7 | **Dilarang** nilai dari menang-kalah; ukur sentuhan berkualitas & keputusan progresif |
| 2 Tactical DNA Assimilation | 15–16 (U-16) | prinsip 4 fase, 11v11, monitoring growth spurt | pemantauan beban fisik ketat |
| 3 Role Specialization | 17–18 (U-18) | 1 peran utama + 1 sekunder dari 22 archetype; video mingguan | **ACWR 0,8–1,3** |
| 4 Transition & First-Team | 19–21 (U-20) | Succession Matrix + mentor senior; latihan senior ≥ 3×/pekan | kekuatan otot fungsional |

**RAE & Bio-Banding** `[PRD §9.2]`: birth quarter Q1–Q4; jika **> 65%** skuad akademi berasal dari Q1/Q2 → peringatan bias seleksi. PHV (sitting height, standing height, berat) diukur **tiap 3 bulan** → PRE/CIRCA/POST_PHV; *late maturer* berteknik tinggi ditandai `PROTECTED TECHNICAL ASSET` dan masuk sesi Bio-Banding.

**ARI (0–100)** `[PRD §9.3]`:

```
ARI = 0,30 × Tactical DNA Alignment
    + 0,25 × Physical & Availability (termasuk kehadiran latihan bebas cedera > 90%)
    + 0,25 × Technical Execution Under Pressure
    + 0,20 × Psychological & Professional Habits
```

| ARI | Keputusan otomatis |
|---|---|
| **< 65** | Tetap di skuad usia; fokus IDP |
| **65–77** | Watchlist + latihan gabungan tim utama tiap pekan |
| **78–84** | Siap Promosi Rotasi → slot Tier 3 |
| **≥ 85** | **`ELITE_HOMEGROWN_ASSET`** → kontrak profesional 3–5 tahun sebelum dipantau klub lawan |

IDP: **3 target perbaikan** per siklus **12 minggu** `[PRD §9.3]`.

---

## 11. ENAM PILAR PENDAPATAN `[PRD §2.2 Pilar D]`

| Pilar | Porsi target | Catatan |
|---|---|---|
| Sponsorship & Aktivasi Korporat | **40–50%** | inventaris: dada, lengan, punggung, celana, LED perimeter, backdrop, training ground naming; *Championship Step-Up Valuation* di Tahun ke-2 |
| Ticketing & Matchday Hospitality | **20–30%** | kapasitas, Economy/VIP/VVIP-Corporate Box, Season Pass, efek pengganda gaya menyerang pada okupansi |
| Merchandise & Memorabilia | **10–15%** | jersey player issue/replica, koleksi kapsul kolaborasi, lelang match-worn terverifikasi |
| Liga / Hak Siar / Hadiah | **15–20%** | subsidi ILeague + prize money |
| Player Trading & Solidaritas | **5–15% mulai Tahun ke-2** | grade C yang jadi kunci |
| Akademi, SSB & Komunitas | **3–5%** | iuran siswa, turnamen usia muda, sekolah afiliasi |

Field: `rev_sponsorship_corporate`, `rev_ticketing_hospitality`, `rev_merchandise_memorabilia`, `rev_league_broadcast_prize`, `rev_player_trading_net`, `rev_academy_community` `[PRD §10.1]`.
**Multiplier paparan PRD hanya kualitatif** ("kenaikan nilai sponsor otomatis jika target tercapai", "efek pengganda gaya menyerang") — **tidak ada angka eksplisit** → `[ASUMSI]` lihat §13.

---

## 12. SPESIFIKASI KALIBRASI 3 TEMPLATE KLOB `[PRD §2.1, §11 Sprint 9] + [D3]`

Tiga template wajib (pre-loaded blueprint). Semua angka dihasilkan oleh rulebook ini, **bukan input manual bebas**; setiap layar wajib melabeli sumber "Template PRD" vs "Input manual klub" `[DES §11.4]`.

| Template | Skenario | Input kunci (harus diisi) | Invariants yang harus lolos |
|---|---|---|---|
| **Templat A** | Akselerasi Juara Liga 2 dalam 1 musim `[PRD §11 Sprint 9]` | horizon 1 thn; target `CHAMPION`; Liga 2; DNA bebas (contoh HIGH_PRESSING); equity & scr_max | age 25/25/40/10; Grade A 6–8; SCR ≤ scr_max; 24-month lock aktif |
| **Templat B** | Turnaround & stabilisasi finansial Liga 1, siklus 3 thn, **SCR < 60%** `[PRD §11 Sprint 9]` | horizon 3 thn; target stabilisasi; Liga 1; scr_max **< 60** | age 35/30/28/7; SCR **< 60%** (lebih ketat dari default 65); cash buffer 2,5× |
| **Templat C** | Inkubator Talenta & Academy-First `[PRD §11 Sprint 9]` | horizon 3–5 thn; filosofi Academy-First; EPA U-16/18/20 | slot U-22 **40–45%**; 4–5 mentor senior; ARI ≥ 85 → kontrak 3–5 thn; player trading mulai Tahun ke-2 |

Kalibrasi minimum yang harus dibuktikan per template `[TURUNAN]`:
1. Jumlah slot 26–28 dan pembulatan age bracket konsisten (§2).
2. Grade A/B/C memenuhi kuota (§3) dan beban gaji memenuhi band (§3).
3. `calculated_scr_pct` dihitung dari komponen §6, **bukan** dari total CapEx/OpEx agregat.
4. Arus kas 12 bulan memiliki buffer ≥ 2,5× OpEx bulanan (§6).
5. Semua angka sensitif tersimpan sebagai ciphertext `BYTEA` (D4/D2) — tidak ada plaintext di log/laporan.

**Template = data simulasi, bukan data riil.** Data klub riil (dianonimkan/disetujui) baru jadi gate sebelum peluncuran produksi v1.0 `[D3]` — minta ke Owner menjelang Sprint 9. Jalur import terenkripsi disiapkan sejak sekarang `[D3]`.

---

## 13. TEST VECTOR — SEMUA BISA DIHITUNG ULANG

Angka di kolom "Hasil" sudah diverifikasi ulang dengan aritmetika desimal (Python `Decimal`) — lihat §15.

| ID | Rumus / aturan | Input contoh (sumber) | Hitung | Hasil benar | Status |
|---|---|---|---|---|---|
| TV-01 | Amortisasi bulanan `[PRD §7.1]` | 1.650.000.000 / 36 bulan | 1.650.000.000 ÷ 36 | **45.833.333,33**/bulan (PRD membulatkan jadi 45.833.333) | ✅ |
| TV-02 | Amortisasi tahunan `[PRD §7.1]` | 1.650.000.000 × 12/36 = 550.000.000 | nilai eksak; **jangan** kalikan tampilan bulanan yang sudah dibulatkan (45.833.333,33 × 12 = 549.999.999,96) | **550.000.000**/tahun | ✅ (R14) |
| TV-03 | NBV akhir Tahun-1 `[PRD §7.1]` | 1.650.000.000 − 550.000.000 | − | **1.100.000.000** | ✅ |
| TV-04 | Re-amortisasi `[PRD §7.1]` + `[TURUNAN]` | NBV 1.100.000.000 / 4 thn sisa baru | 1.100.000.000 ÷ 4 | **275.000.000**/thn (turun 50% dari 550 jt) | ✅ (interpretasi 4 thn → butuh konfirmasi) |
| TV-05 | Laba pelepasan akademi `[PRD §7.1]` | NBV 0; jual bersih 2.000.000.000 | 2.000.000.000 − 0 | **2.000.000.000 pure profit (100%)** | ✅ |
| TV-06 | Klasifikasi SCR `[PRD §7.2]` | SCR 59,8% | 58,1 ≤ 59,8 ≤ 65,0 | **`YELLOW_WATCHLIST`** (sesuai response PRD §10.2) | ✅ |
| TV-07 | Boundary SCR `[PRD §7.2]` | 58,0 / 58,1 / 65,0 / 65,01 | bandingkan | GREEN / YELLOW / YELLOW / RED | ✅ |
| TV-08 | Penyebut & pembilang balik `[PRD §7.2]` + `[TURUNAN]` | revenue 24.500.000.000; SCR 59,8% | 0,598 × 24.500.000.000 | **Total Squad Cost implisit = 14.651.000.000** (komponen tidak dipaparkan PRD → lihat §14) | ✅ |
| TV-09 | Cash buffer `[PRD §7.2]` | OpEx 18.600.000.000 / 12 = 1.550.000.000/bulan; ×2,5 | — | **3.875.000.000** | ✅ |
| TV-10 | Age 1 thn, 27 slot `[PRD §2.2]` | 25%/25%/40%/10% | 7+7+11+2 | **27 slot**, dalam band 26–28 | ✅ |
| TV-11 | Age 3 thn, 27 slot `[PRD §2.2]` | 35%/30%/28%/7% | 9+8+8+2 | **27 slot** | ✅ |
| TV-12 | Weighted age `[PRD §10.2]` | 19,23,27,31 × 0,25,0,25,0,40,0,10 | 4,75+5,75+10,8+3,1 | **24,4** (cocok dengan `weighted_target_age` PRD) | ✅ (konvensi usia → ASUMSI) |
| TV-13 | Grade distribution `[PRD §10.2]` | 7 + 12 + 8 | — | **27**; A∈6–8, B∈11–13, C∈6–8 | ✅ |
| TV-14 | Total menit `[PRD §8.3]` | 38 × 990 | — | **37.620**; 990 = 90×11 | ✅ |
| TV-15 | Threshold loan `[PRD §8.3]` | proyeksi menit **per pemain** < 550 | ambang eksplisit PRD, BUKAN 15% × 37.620 | **< 550 menit/pemain → ELIGIBLE FOR STRATEGIC LOAN** | ✅ (dikoreksi PM, lihat `PM_RULINGS.md` R9) |
| TV-16 | FIFA solidarity `[PRD §7.3]` | transfer 10.000.000.000 | 0,25%×4 = 1%; 0,50%×8 = 4% | **100.000.000 + 400.000.000 = 500.000.000 (5%)** | ✅ |
| TV-17 | 70:30 `[PRD §7.3]` | paket 10.000.000.000 | 0,70 / 0,30 | **7.000.000.000 tetap + 3.000.000.000 variabel** | ✅ |
| TV-18 | Win bonus `[PRD §7.3]` | pool dasar 1.000.000.000 | ×1,0 / ×1,5 / ×2,0 | **1,0 M / 1,5 M / 2,0 M** | ✅ |
| TV-19 | Archetype `[PRD §8.2]` | 2+3+3+5+4+5 | — | **22** | ✅ |
| TV-20 | ARI weights `[PRD §9.3]` | 30+25+25+20 | — | **100%** | ✅ |
| TV-21 | ARI ≥85 `[PRD §9.3]` | (90,88,80,80) | 27+22+20+16 | **85,00 → ELITE_HOMEGROWN_ASSET** | ✅ |
| TV-22 | ARI 65–77 `[PRD §9.3]` | (80,70,75,60) | 24+17,5+18,75+12 | **72,25 → Watchlist** | ✅ |
| TV-23 | ARI 78–84 `[PRD §9.3]` | (82,80,78,75) | 24,6+20+19,5+15 | **79,10 → Siap Promosi Rotasi** | ✅ |
| TV-24 | ARI <65 `[PRD §9.3]` | (70,60,65,55) | 21+15+16,25+11 | **63,25 → tetap di skuad usia** | ✅ |
| TV-25 | RAE warning `[PRD §9.2]` | 30 siswa; Q1+Q2 = 20 | 20/30 = 66,7% | **> 65% → peringatan bias seleksi** | ✅ |
| TV-26 | Release clause `[PRD §8.4]` | investasi 500 jt + gaji thn 2.000 jt = 2.500 jt; ×4…×6 | — | **10.000–15.000 jt** | ✅ |
| TV-27 | 24-month lock `[PRD §8.4]` | kontrak berakhir 2029-06-30 | −24 bulan | **alert mulai 2027-06-30** | ✅ |

---

## 14. HAL YANG TIDAK EKSPLISIT / BUTUH KEPUTUSAN PM–CTO

| # | Ketidaktentuan | Dampak engine | Rekomendasi Divisi 1 |
|---|---|---|---|
| A1 | **Re-amortisasi**: "2 tahun tambahan" tidak didefinisikan sebagai sisa durasi baru 2 atau 4 tahun (§7) | Mengubah beban tahunan 275 jt vs 550 jt | Tetapkan **4 tahun** (sisa 2 + tambahan 2) agar klaim "menurunkan beban" di PRD benar; minta konfirmasi PM/CTO |
| A2 | **SCR response PRD §10.2** hanya memberi SCR 59,8% & revenue 24,5 M, tanpa rincian pembilang (§13 TV-08) | Backend bisa mengarang komponen numerator | Wajibkan engine menyimpan 5 komponen pembilang + 6 komponen penyebut sebagai field terpisah sebelum menghitung |
| A3 | **Band menit §9 saling overlap** (75–90% + 45–65% + 20–35% = 140–190%; dan 2.800–3.400 menit/pemain × 8–9 ≠ 75–90% dari 37.620) | Constraint agregat bisa mustahil dipenuhi | Perlakukan persentase sebagai **band per-tier**, bukan kuota agregat; atau minta PM menetapkan ulang normalisasi |
| A4 | **Porsi revenue 6 pilar** 93–135% (88–120% di Tahun-1 tanpa trading) (§11) | Tidak bisa dijadikan constraint penjumlahan | Perlakukan sebagai **target band/target relativ**, bukan bobot yang harus berjumlah 100%; normalisasi perlu keputusan |
| A5 | **Beban gaji A+B+C** 90–105% (§3) | Sama dengan A4 | Band, bukan hard sum; gunakan pembulatan terkontrol |
| A6 | **Usia representatif weighted_target_age** 31 vs 31,5 (§2) | 24,4 vs 24,45 → selisih pembulatan | Tetapkan 19/23/27/31 untuk mereproduksi test vector PRD |
| A7 | **Multiplier prestasi & gaya main** tidak bernilai angka (§11) | Simulasi sponsor/tiket tidak reproducible | Minta PM/CTO menetapkan tabel multiplier atau nyatakan sebagai input Owner |
| A8 | **Grade C salary band 10–15%** vs kontrak 3–4 thn bertahap (§3) | Butuh jadwal kenaikan | Rincian kenaikan di 15/35/60 penampilan sudah ada (§9); besaran kenaikan belum ada → input template |

Semua item di atas **bukan keputusan sepihak Divisi 1**; ditulis sebagai rekomendasi untuk PM/CTO.

---

## 15. REKAM VERIFIKASI

- Skill `verify` (itqan-engineering) **tidak terpasang** di environment ini (tidak ada di daftar skill OpenCode maupun `~/.claude/skills`). Tidak bisa dipakai; pengganti: verifikasi aritmetika independen dengan Python `Decimal` dan pengecekan silang terhadap angka eksplisit PRD.
- Hasil verifikasi independen (22.11.2026): TV-01 45.833.333,33 & 550.000.000; TV-03 1.100.000.000; TV-04 275.000.000; TV-08 14.651.000.000; TV-09 3.875.000.000; TV-12 24,40; TV-14 37.620; TV-16 500.000.000; TV-20–TV-24 100 / 85,00 / 72,25 / 79,10 / 63,25; TV-19 22. **Semua cocok** dengan tabel §13.
- Cakupan: 27 test vector, seluruhnya menyertakan rumus dan hasil hitung.
- Pengecekan batas wewenang: tidak ada migrasi, deploy, DNS, SSL, push, restart, kredensial, atau perubahan kode produk. Satu-satunya file yang ditulis: `docs/juara/RULEBOOK.md`.
- Sumber dibaca: `docs/juara/PRD-JUARA.md` §1–2, §3–4, §7, §8, §9, §10, §11; `docs/juara/DECISIONS.md` D1–D4; design doc §7, §8, §9, §10, §11; `docs/juara/briefs/brief-div1-domain.txt`.
- `graphify query "..."` dijalankan lebih dulu; tidak ditemukan modul rumus `juara_*` di kode produk — rulebook ini memang artefak Sprint 0 pertama.

---

## 16. YANG MASIH BUTUH LAMPU HIJAU OWNER (DITERUSKAN VIA PM)

1. **Data klub riil** (dianonimkan/disetujui) untuk UAT/gate peluncuran v1.0 `[D3]` — bukan sekarang.
2. **Deploy, DNS `juara.stadione.pro`, SSL/TLS, kredensial, dan kunci enkripsi** — tidak termasuk mandat worker; tidak disentuh `[D2][D4]`.
3. **Nilai multiplier komersial & besaran kenaikan gaji bertahap** (A7/A8) bila Owner ingin angka final, bukan band.
4. **Konfirmasi interpretasi A1–A6** oleh PM/CTO sebelum engine mengunci constraint.

---

*Dokumen ini adalah sumber angka untuk Divisi 3 (engine), Divisi 4 (finance), Divisi 5 (academy), Divisi 2 (visualisasi), Divisi 6 (test). Perubahan angka wajib lewat PM + penanda versi.*
