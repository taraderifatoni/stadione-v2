# W07 Money / Calendar / Contracts DTO — Contract & Fixture Plan (D1)

**Model used:** free `opencode-go/hy4-flash-free`. **Timestamp:** 2026-11-25 23:06:04 WIB (Asia/Jakarta, UTC+7).
**Status:** `DRAFT — D1 CONTRACT PREPARATION; NOT A NEW ACCEPTANCE, NOT RELEASE APPROVAL`. D1 hanya membaca artefak dan menulis **file ini saja**. Tanpa runtime/SSH/DB/deploy/provider call/perubahan app-script-test-board-manifest, tanpa OwnerRep ACK, tanpa paid fallback.

**Sources read (read-only):** `docs/execution/FEATURE_TEAM_MASTER_EXECUTION.md:80-92` (W07 `:83`, W08 `:84`, W09 `:85`, W14 `:90`), `docs/execution/OWNER_REP_W06_CORRECTED_AUDIT.md:31-35`, `docs/juara/FINANCE_SPEC.md` (§1, §2, §3, §4, §7, §10, §11), `docs/juara/RULEBOOK.md` (§5–§8, §11–§13, §15), `docs/juara/PM_RULINGS.md` (R2, R10, R14, R18–R20, R21), `docs/juara/ARCHITECTURE.md:321-344` (RBAC 6×6 + §5.1), `docs/juara/OWNER_REP_FINANCE_HTTP_AUDIT.md:13-18,52-57`, `docs/juara/ACADEMY_INTEGRATION_SPEC.md:26-45`, `docs/execution/W05_CSV_FINAL_CONTRACT_WORKER.md`, `docs/execution/W06_READONLY_ROSTER_CONTRACT_WORKER.md`, `docs/execution/PROGRESS_ROLLUP_86_GROUPS.md`.

**Proposed contract version:** `w07-money-calendar-v1`. Perubahan skala, enum, atau aturan pembulatan **wajib menaikkan versi**; versi lama menjadi riwayat, bukan ditimpa.

---

## 1. Baseline 86 — preserved exactly

| Stream | Development | Testing | Production | Backlog | Total |
|---|---:|---:|---:|---:|---:|
| JUARA | 3 | 3 | 6 | 22 | **34** |
| Main Stadione | 45 | 0 | 0 | 0 | **45** |
| Academy | 7 | 0 | 0 | 0 | **7** |
| **Total** | **55** | **3** | **6** | **22** | **86** |

Sumber: `FEATURE_OWNERSHIP_REGISTER.csv`, `PROGRESS_ROLLUP_86_GROUPS.md:8-19`. Enam grup Production tetap *baseline-reported* dengan `current deployment verification pending`; nol `PRODUCTION_VERIFIED`. **Tidak ada weighted overall percentage**, tidak ada angka 80–90%. W07 tidak menyelesaikan J17/J18/J19 hanya karena kontrak ini.

---

## 2. Scope, boundary, dan hal yang tidak diklaim

- W07 adalah **contract/fixture work** untuk DTO uang, kalender, kontrak, biaya, dan pendapatan — **bukan** engine (W08), bukan snapshot/compare (W09). Menurut master plan `:83`, bukti yang diuji PM/D6 adalah *money precision, recognized cost vs cash separated, rounding and boundary cases reviewed*.
- **Tidak ada financial advice.** Semua angka di bawah adalah test vector ilustratif dari `RULEBOOK §13` / `FINANCE_SPEC §11.2` / `TEMPLATE_PRD`, bukan rekomendasi investasi, bukan data klub riil, bukan P&L klub sesungguhnya. `59,8%` dan `24,5 M` adalah angka agregat PRD untuk uji, **bukan** keluaran engine yang ditampilkan ke UI (lihat R21 dan `W06_READONLY_ROSTER_CONTRACT_WORKER.md:32`).
- **Tidak ada payment provider, sandbox call, kredensial, kunci enkripsi, atau paid spend.** Tidak ada mutasi produksi, migrasi, apply DB, deploy, DNS/SSL, restart, atau SSH. Provider sandbox/idempotency contract tetap OPEN.
- **Academy boundary unchanged.** AC01–AC07 tetap terpisah, `STALE_OR_UNKNOWN`, OPEN. W14 konektor Academy↔JUARA opsional tetap P2/OPEN (J3 accountable, S2 source) dengan consent, source-once, idempotent sync, revocation, cross-academy denial, dan **no salary/parent-payment leak**. W07 tidak mengaktifkan webhook, tidak membaca data Academy, tidak memindahkan gaji/iuran orang tua ke DTO keuangan JUARA.
- W01–W06 yang sudah diterima, 239/239→237/237 suite, pin build/digest, dan visual acceptance yang sudah disetujui **tidak dibuka kembali**.

---

## 3. Money representation & currency

| Aspek | Kontrak W07 | Alasan / sumber |
|---|---|---|
| Tipe internal | **Arbitrary-precision decimal**, bukan IEEE-754 float. Dilarang `number`/`float` untuk uang di engine maupun di fixture. | `FINANCE_SPEC §11.1` memakai Python `Decimal` |
| Tipe DTO | `MoneyDTO { currency, amountMinor, scale, kind }` — `amountMinor` adalah **string integer** (tanpa pemisah ribuan, tanpa notasi ilmiah, tanda minus eksplisit hanya untuk nilai negatif yang sah). | Menghindari presisi `Number` JS; seluruh angka uang GPS/JSON harus string |
| `currency` | Hanya **`IDR`** (ISO 4217) untuk W07. Nilai lain → `UNSUPPORTED_CURRENCY`, **jangan** dikonversi dengan FX implisit. | Tidak ada source FX; tidak ada multi-currency arithmetic |
| `scale` | **2** untuk seluruh DTO moneter engine (mengikuti verifikasi 2 desimal `FINANCE_SPEC §11.1`). Ini konvensi presisi komputasi, **bukan klaim IDR memiliki koin 2 desimal**. | TV-01 `45.833.333,33` |
| Invariant uang tunai | Field yang merepresentasikan **kas nyata / nominal kontrak / equity / tagihan termin** wajib `amountMinor mod 100 = 0` (rupiah bulat). Sisa 2 desimal hanya boleh pada field `kind: DERIVED_ONLY` (amortisasi tampilan, `break_even_attendance` fraksi, `Δsponsor` remediasi). Pelanggaran → `CASH_FRACTION_REJECTED`. | Kas tidak bisa membayar pecahan rupiah |
| Rasio / persen | Bukan `MoneyDTO`. Pakai `PercentDTO { percentMinor: string, scale: 2 }` (mis. `59,80%` → `"5980"`). Jangan pernah menyimpan SCR Margi sebagai uang. | `RULEBOOK §6`, TV-06/07 |
| Nilai sensitif | Disimpan sebagai `*_enc BYTEA` (AES-256-GCM aplikasi, AAD = `clubId` + row-id). DTO **tidak pernah** membawa ciphertext, kunci, atau connection string. Field turunan plaintext (`monthly_amortization_value`, `net_book_value_current`) boleh tampil hanya untuk peran berhak. | `D4`, `ARCH §5.1`, `FINANCE_SPEC §9.1` |

**Contoh DTO (sintetis):**
```
{ "currency":"IDR", "amountMinor":"4583333333", "scale":2, "kind":"DERIVED_ONLY" }  // 45.833.333,33
{ "currency":"IDR", "amountMinor":"55000000000", "scale":2, "kind":"CASH_OR_NOMINAL" } // 550.000.000
{ "percentMinor":"5980", "scale":2 }  // 59,80% — bukan uang
```

---

## 4. Rounding & precision rules

1. **Round once, at the boundary.** Engine menghitung dengan presisi penuh; pembulatan `ROUND_HALF_UP` ke 2 desimal hanya saat menulis nilai tampilan/DTO. Dilarang merangkai pembulatan (R14).
2. **R14 test vector:** `1.650.000.000 × 12/36 = 550.000.000` (eksak). Dari tampilan bulanan `45.833.333,33 × 12 = 549.999.999,96` → **salah**, selisih Rp 4. Fixture wajib menolak hasil kedua.
3. **Re-amortisasi (R1):** NBV `1.100.000.000 / 4 tahun = 275.000.000/tahun`; bulanan `275.000.000 / 12 = 22.916.666,67` (eksak `22.916.666,666…`). Jangan hitung tahunan dari bulanan yang sudah dibulatkan.
4. **Remediasi (a):** `Δsponsor = N/T − D`; contoh `14.376.000.000 / 0,58 − 24.500.000.000 = 286.206.896,55` → `DERIVED_ONLY`, bukan tagihan sponsor yang dibulatkan ke rupiah di DTO tunai.
5. **Klasifikasi SCR terjadi sebelum pembulatan persen.** Bandingkan nilai persen eksak/2-desimal terhadap ambang; **jangan** membulatkan ke bilangan bulat. `58,04%` tetap **GREEN**? Tidak — `58,04 > 58,00` → **YELLOW**; `58,00` → GREEN; `58,01` → YELLOW; `65,00` → YELLOW; `65,01` → RED (TV-07, `scr_max_threshold_pct` default 65,00). R15: input `< 58` ditolak/di-clamp ke `58,00` + peringatan.
6. **Pembulatan pagination/allocasi wajib deterministik** tanpa RNG. Jika ada sisa pembagian bulan/termin, aturan alokasi ditulis eksplisit di fixture (mis. sisa jatuh ke termin terakhir), bukan `Math.round` disturb.

---

## 5. Fiscal & calendar boundaries

| Aturan | Kontrak |
|---|---|
| Awal tahun fiskal | `fiscal_year_start_month` default **7 (Juli)** `[PRD §10.1]`; bulan 1 = Jul … bulan 12 = Jun. Konfigurasi lain butuh putusan PM/CTO, bukan pilihan fixture. |
| `projection_year` | Hanya `1`, `2`, atau `3`; satu baris per `(club_id, playbook_id, projection_year)`. |
| Periode | `Period { fiscalYear, fiscalMonth 1..12, startDate, endDateExclusive }` **half-open `[start, end)`**. Contoh bulan 1 = `[YYYY-07-01, YYYY-08-01)`. Mencegah double-count pada tengah malam. |
| Tanggal vs timestamp | `contract_start_date` / `contract_end_date` / `renewal_date` = `YYYY-MM-DD` (calendar day, tanpa zona). `captured_at` / `imported_at` / watermark = ISO-8601 dengan offset **`+07:00`** (WIB, tanpa DST). |
| `season_label` | **Selalu** dari club-season context terautorisasi, **never inferred** dari tanggal, nominal, atau CSV (W05 `§2.1`, W06 `§2`). Missing → `SEASON_REQUIRED`. |
| Termin (R20) | `50%` bulan ke-1 (Jul), `30%` bulan ke-7 (Jan), `20%` bulan ke-10 (Apr). Fixture wajib memastikan ketiga termin jatuh di fiscalMonth yang benar, jumlah 100%, dan tidak dihitung dua kali lintas bulan. |
| Contract clock | 24-month renewal lock: end `2029-06-30` → alert mulai `2027-06-30` (TV-27). Step-up appearances `{15,35,60}` (R19) adalah **pemicu**, bukan tanggal; besaran `+5%/+10%/+15%` kumulatif atas gaji pokok. |
| Boundary cases diuji | rollover `2029-06-30 → 2029-07-01`; tahun lompat `2028-02-29`; akhir bulan 31 Jan; kontrak melintang dua tahun fiskal; `contract_end_date < contract_start_date`; `fiscalMonth = 13`; tanggal dengan offset `Z`/UTC yang salah; season pass dialokasikan ke 19 laga kandang (bukan 38). |

---

## 6. Classification: recognized cost vs cash vs P&L/revenue

Tiga sumbu **ortogonal** — satu angka boleh masuk satu sel per sumbu, tidak boleh ditukar:

| Sumbu | Nilai | Contoh |
|---|---|---|
| **A — accounting nature** | `CAPEX` (dikapitalisasi IAS 38, diamortisasi) vs `OPEX` (dibebankan saat terjadi) | transfer+agen+signing fee+sport science = CapEx; gaji, PPh 21, bonus, Matchday LOC, Away Logistics, academy ops = OpEx (`RULEBOOK §5`) |
| **B — cash timing** | `CASH_OUT` / `CASH_IN` aktual vs `NON_CASH_RECOGNIZED` | cicilan signing fee tunai = cash out; amortisasi = non-cash recognized; termin sponsor diterima kas di bulan termin |
| **C — P&L / SCR** | `SCR_NUM` (5 field) / `SCR_DEN` (6 field) / `BUKAN_SCR` | amortisasi tahunan masuk `scr_num_annual_amortization`; `scr_den_player_trading_profit` adalah **laba bersih**, bukan gross transfer proceeds |

**Aturan keras:**

- `SCR (%) = (Σ5 pembilang / Σ6 penyebut) × 100%`. **Total CapEx/OpEx agregat dilarang jadi pembilang** (R2, `FINANCE_SPEC §1.1`). Engine wajib menyimpan 11 komponen sebagai field terpisah **sebelum** hitung; backend dilarang mengarang komponen dari angka agregat PRD.
- Penyebut `Σ6 = 0` → `SCR = NULL` + `INVALID_DENOMINATOR`. **Jangan** dibagi 0 atau dijadikan `0%`.
- Amortisasi adalah beban P&L/SCR **non-kas**; cicilan kas signing fee adalah cash out **tetapi bukan beban P&L di periode yang sama** (kapitalisasi). Keduanya tidak boleh dijumlahkan sebagai dua expense SCR.
- Cashflow 12 bulan: `cash_open + inflow − outflow = cash_close`, gate `cash_close(m) ≥ 2,5 × OpEx bulanan` untuk semua `m`. Contoh TV-09: `18.600.000.000 / 12 = 1.550.000.000`, buffer `3.875.000.000`. Jika breach → `CASH_BREACH`, tampilkan opsi (tunda cicilan CapEx / tambah equity dengan otorisasi OWN / restrukturisasi termin). **Tidak ada dana keluar otomatis.**
- Player trading: hasil jual bersih (setelah agen jual & sell-on) − NBV. Alumni akademi NBV = 0 → 100% pure profit (TV-05). **Gross transfer proceeds tidak boleh masuk `scr_den_player_trading_profit`.**
- FIFA solidarity 5% (`0,25%×4 + 0,50%×8`, TV-16) adalah kewajiban/komponen kapitalisasi, **bukan** pendapatan.
- `kind` pada `MoneyDTO` wajib diisi; consumer (W08/W09) tidak boleh menebak makna dari angka saja.

---

## 7. Immutable source provenance

Setiap angka/ tanggal dalam fixture dan DTO membawa tuple provenance:

```
Provenance {
  source_label: "TEMPLATE_PRD" | "INPUT_MANUAL_KLUB",   // DES §11.4 — label sumber wajib
  source_ref:   "PRD §7.1" | "TV-01" | "PM_R19" | "...",
  club_id:      from authenticated membership only,    // R11: auth.uid() ∩ membership ∩ JWT; GUC dilarang
  season_label: authorized club-season context,
  source_row:   1-based bila berasal dari CSV W05,
  captured_at:  ISO-8601 +07:00,
  schemaVersion:"w07-money-calendar-v1",
  digest:       sha256(schemaVersion | club_id | normalized payload)  // pola import_id W05 §3.1
}
```

- **Append-only.** Koreksi nilai = versi baru dengan penunjuk `supersedes`; **dilarang** overwrite nilai historis. W09 akan memakai hash/version provenance ini untuk snapshot dan compare ≤3 — W07 hanya menyiapkan bentuknya, tidak mengimplementasi snapshot.
- `source_label = "FILE_ROW"` **bukan** source label yang sah (itu row locator); pakai `source_row` terpisah — koreksi yang sama seperti W05 `§3.1`.
- Nilai ilustratif harus diberi label `TEMPLATE_PRD` + `source_ref` TV; **dilarang** menampilkan rincian pembilang ilustratif (`14.651.000.000` dan lima komponennya) sebagai data klub riil (FINANCE_SPEC `§9.3`).
- Sensitive values tetap terenkripsi di vault; AAD `clubId` + row-id tidak berubah saat dibaca lintas modul (pola `W04_DTO_NEGATIVE_REVIEW_WORKER.md:32`).

---

## 8. No equity-as-revenue, no double-count

| Larangan | Kontrak pencegah |
|---|---|
| Equity ⇒ revenue | `owner_equity_injection_enc` adalah **financing inflow**, bukan salah satu dari 6 `scr_den_*`, bukan salah satu dari 6 pilar revenue, tidak masuk subtotal `inflow` kas. Muncul hanya sebagai baris financing terpisah **dengan otorisasi OWN**. |
| Equity ditimpa angka lain | Regresi W01 (`OWNER_REP_FINANCE_HTTP_AUDIT.md:13-18,52-57`): seed `equity=100` + finance `200` → PUT tanpa equity tetap **100**; seed `equity=100` + finance absent → `finance` fail closed sampai Owner backfill; malformed finance fail closed tanpa menaikkan revision. Helper harus benar-benar dipakai route. |
| Gross ⇒ net | `scr_den_player_trading_profit` = laba bersih, bukan proceeds. Solidarity/agent jual tidak dihitung dua kali. |
| Amortisasi ⇒ double expense | Amortisasi P&L dan cicilan kas signing fee tidak pernah dijumlahkan dalam `scr_num_*`. |
| CapEx agregat ⇒ SCR | Dilarang (R2). Hanya 5 field pembilang yang ditetapkan. |
| Pemain ⇒ double headcount | 27 unique player IDs tetap dihitung sekali meski seorang pemain memenuhi beberapa coverage slot (W06). |
| Termin ⇒ double month | 50/30/20 R20 masing-masing satu fiscalMonth; season pass satu kali per laga kandang (19, bukan 38). |
| Sumber ⇒ angka dobel | `TEMPLATE_PRD` dan `INPUT_MANUAL_KLUB` untuk field yang sama tidak boleh keduanya masuk agregat; pilih satu yang authoritative, sisanya menjadi provenance catatan. |

---

## 9. Role visibility (DTO eksplisit per peran)

Alias sesuai `ARCHITECTURE.md:327-342`: **OWN** Owner, **CEO** CEO/VP Commercial, **SPO** Sporting Director, **COA** Head Coach, **FIN** Finance Controller, **SEC** Secretary/Team Manager.

| Peran | M4 Finance/SCR/Amortisasi | M5 Commercial/Sponsor | Field sensitif |
|---|---|---|---|
| OWN | ALLOW | ALLOW | penuh (dekripsi diizinkan) |
| CEO | ALLOW | ALLOW | penuh |
| FIN | ALLOW | ALLOW* | penuh |
| SPO | ALLOW* (pagu saja; **tanpa** gaji individual/PPh 21/P&L) | **DENY** | DENY gaji & P&L; tanggal/status kontrak ALLOW |
| COA | **DENY** | **DENY** | DENY gaji, PPh 21, P&L, pagu; tanggal/status ALLOW |
| SEC | **DENY** | ALLOW* (tanggal/status saja; nominal DENY) | DENY nominal & P&L |

- Response dibangun dari **allowlist eksplisit per peran**, bukan `SELECT *`. Field terlarang **tidak boleh ikut terkirim meski bernilai `null`** (`ARCH §5.1`, QA RBAC-16/18/24/36).
- Tidak ada `*_enc`, kunci, token, connection string, atau nominal gaji individual di DTO mana pun — termasuk untuk OWN/CEO/FIN pada endpoint non-vault.
- `club_id` berasal dari membership; client-supplied `club_id` tidak bisa memberi akses. Unauthenticated → 401, no-membership → 403, lintas tenant → 403 dengan own-positive control.
- Dilarang memperluas peran finance untuk melewati validasi (W05 `§5`).
- Watermark PDF (R13) memakai `RAHASIA — <nama> | <peran> | <stempel WIB>`; bukan identitas rahasia, tidak memuat nominal gaji.

---

## 10. Negative fixtures (sintetis, untuk PM/D6)

| ID | Input / state | Expected |
|---|---|---|
| N-MON-01 | `amountMinor` sebagai JSON number / float / `NaN` / `Infinity` | `INVALID_MONEY_TYPE` |
| N-MON-02 | `"currency":"USD"` atau konversi FX implisit | `UNSUPPORTED_CURRENCY` |
| N-MON-03 | `amountMinor:"45833333.33"` / `"1.650.000.000"` / notasi ilmiah | `INVALID_MINOR_UNIT` |
| N-MON-04 | Kas dengan `amountMinor mod 100 ≠ 0` | `CASH_FRACTION_REJECTED` |
| N-MON-05 | SCR dikirim sebagai `MoneyDTO` | `INVALID_RATIO_TYPE` |
| N-RND-01 | Monthly `45.833.333,33 × 12` dipakai sebagai tahunan | `549.999.999,96` ditolak; `550.000.000` diterima (R14) |
| N-RND-02 | SCR dibulatkan ke bilangan bulat sebelum klasifikasi | tolak; klasifikasi dari `percentMinor` 2 desimal |
| N-RND-03 | SCR `58,01` diklaim GREEN | `YELLOW_WATCHLIST` |
| N-RND-04 | `scr_max_threshold_pct = 57` | clamp `58,00` + warning (R15) |
| N-CAL-01 | `fiscalMonth = 13` / `2028-02-30` | `INVALID_PERIOD` |
| N-CAL-02 | Off-by-one rollover `2029-06-30 → 2029-07-01` | bulan 12 → bulan 1, tidak ada celah/tumpang tindih |
| N-CAL-03 | `season_label` ditebak dari `captured_at` atau CSV | `SEASON_REQUIRED` |
| N-CAL-04 | `contract_end_date < contract_start_date`; offset `Z` pada tanggal kalender | `INVALID_DATE_RANGE` / `INVALID_DATE_FORMAT` |
| N-CAL-05 | Termin 50/30/20 jatuh di bulan yang salah atau dua termin di bulan sama | `TERMIN_SCHEDULE_CONFLICT` |
| N-CLS-01 | Equity `100` masuk `scr_den_sponsorship` / pilar revenue | `EQUITY_AS_REVENUE` (ditolak) |
| N-CLS-02 | PUT finance tanpa equity menimpa equity `100` menjadi `200` | regresi W01 — ditolak, equity tetap `100` |
| N-CLS-03 | `Σ6 penyebut = 0` | `SCR = NULL` + `INVALID_DENOMINATOR`, bukan `0%` |
| N-CLS-04 | Total CapEx/OpEx agregat dipakai sebagai pembilang SCR | `INVALID_SCR_SOURCE` (R2) |
| N-CLS-05 | Gross transfer proceeds masuk `scr_den_player_trading_profit` | `GROSS_AS_NET_PROFIT` |
| N-CLS-06 | Amortisasi + cicilan signing fee sama-sama masuk `scr_num_*` | `DOUBLE_COUNT_EXPENSE` |
| N-CLS-07 | `cash_close(m) < 3.875.000.000` | `CASH_BREACH`, tanpa auto-payout |
| N-PROV-01 | `source_label:"FILE_ROW"` / unknown label | `INVALID_SOURCE_LABEL` |
| N-PROV-02 | `source_row` hilang; `digest` tidak cocok; `schemaVersion` lama | `PROVENANCE_INCOMPLETE` / `DIGEST_MISMATCH` |
| N-PROV-03 | Overwrite nilai historis tanpa `supersedes` | `IMMUTABLE_VIOLATION` |
| N-PROV-04 | `club_id` dari body klien / GUC | `CROSS_TENANT_DENIED` (own-positive control tetap lolos) |
| N-PROV-05 | Ciphertext atau kunci muncul di DTO | `SENSITIVE_FIELD_LEAK` |
| N-ROLE-01 | SPO/COA/SEC meminta `scr_num_*`, gaji, atau equity | field **absen** dari payload (bukan `null`), atau 403 |
| N-ROLE-02 | Unauthenticated / no-membership / foreign tenant | 401 / 403 / 403 |
| N-ROLE-03 | `TEMPLATE_PRD` 59,8% ditampilkan sebagai SCR klub | dilarang; tampilkan ambang input + "engine penuh belum terhubung" (R21) |

Semua fixture memakai data **sintetis**; tidak ada data klub riil, tidak ada provider call, tidak ada mutasi DB.

---

## 11. Gate & yang masih terbuka

- Kontrak ini **diajukan untuk diuji PM/D6**; bukan penerimaan. Bukti yang diminta: presisi uang, pemisahan recognized cost vs cash, pembulatan sekali di boundary, boundary kalender, provenance immutable, dan per-role negative assertions.
- **External gates OPEN:** provider sandbox/idempotency; named human incident owner (**PM hanya interim technical escalation DRI**, bukan venue person); production verification & final release; reviewer visual acceptance untuk state yang berubah. Tanpa ACK loop/self-trigger.
- W08 (finance engine, cashflow/SCR/commercial inputs) dan W09 (immutable snapshot, compare ≤3, deltas, export) tetap bergantung pada kontrak ini + W05; tidak diimplementasi di sini.

---

## 12. Yang TIDAK dilakukan D1

- Tidak menjalankan runtime/build/test/SSH/jaringan/DB/migrasi/deploy/DNS/SSL/provider call; tidak mengambil screenshot; tidak mengakses produksi.
- Tidak memberikan nasihat keuangan, tidak menetapkan angka final Owner (R18–R20 adalah default PM yang sudah ada), tidak memakai kredensial/kunci/connection string.
- Tidak mengubah draf sebelumnya, `FEATURE_OWNERSHIP_REGISTER.csv`, app, script, test, board, manifest, atau file lain selain file ini; tidak menulis ke sesi peran lain; tidak memicu OwnerRep ACK.
- Tidak menyatakan weighted percentage; tidak menyatakan produksi terverifikasi; tanpa paid fallback.

**Lapor balik:** ke PM `ses_dfd621110ffeVnw419vDE4qR43` melalui hasil sesi ini.
