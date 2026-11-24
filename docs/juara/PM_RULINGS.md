# PM Rulings — JUARA.STADIONE.PRO Sprint 0

Keputusan **PM** atas ketidaktentuan yang dilaporkan Divisi 1 di
`RULEBOOK.md` §14. Bukan keputusan CTO/Owner (D1–D5 tetap di `DECISIONS.md`).
Dapat ditimpa CTO/Owner. Berlaku untuk Divisi 3–6.

| # | Topik | Putusan PM | Alasan |
|---|---|---|---|
| R1 | A1 re-amortisasi | Pakai **4 tahun** sisa durasi baru → 275 jt/tahun | Sesuai klaim PRD bahwa perpanjangan menurunkan beban; 275 < 550 |
| R2 | A2 SCR | Engine wajib menyimpan **5 komponen pembilang + 6 komponen penyebut** sebagai field terpisah sebelum menghitung | Mencegah backend mengarang numerator; PRD hanya memberi angka agregat |
| R3 | A3 band menit | Persentase = **band per tier**, bukan kuota agregat; angka absolut per pemain memakai PRD | 140–190% mustahil bila dijumlahkan |
| R4 | A4 porsi revenue | **Target band/relatif**, bukan bobot yang harus 100%; tidak dinormalisasi paksa | Rentang 93–135% |
| R5 | A5 beban gaji | **Band**, bukan hard sum; pembulatan terkontrol | Rentang 90–105% |
| R6 | A6 usia representatif | **19 / 23 / 27 / 31** → weighted age 24,40 | Mereproduksi `weighted_target_age` PRD §10.2 |
| R7 | A7 multiplier prestasi/gaya main | **Input terkonfigurasi**, default netral 1.0; angka final disediakan Owner menjelang gate v1.0 | Tidak ada nilai di PRD; tidak boleh menghalangi Sprint 0 |
| R8 | A8 kenaikan gaji bertahap | **Field input template**, tanpa besaran hardcode | PRD hanya menetapkan pemicu 15/35/60 penampilan |
| R9 | TV-15 threshold loan | Operatif = **< 550 menit per pemain** (PRD §8.3). Bukan 15% × 37.620 = 5.643 | PRD eksplisit per pemain; baris RULEBOOK TV-15 sudah dikoreksi PM |
| R10 | F-06 kolom kontrak sponsor | `sponsor_contract_value_enc` ditempatkan di **`juara_contracts_vault`**, bukan `juara_projections` | Semantiknya kontrak, tunduk aturan dekripsi yang sama; D3 sudah menempatkan. QA v1 wajib mengonfirmasi |
| R11 | F-04 sumber `club_id` | `auth.uid()` ∩ `juara_club_members` ∩ klaim `request.jwt.claims`; **GUC `app.current_club_id` dilarang** | GUC bisa di-set klien → risiko lintas tenant; PRD §11 legacy kalah dengan D2/D4 gate keras |
| R12 | Usulan field Divisi 5 §2 | **Diterima sebagai desain v1** (dokumentasi): kolom IDP, flag `PROTECTED TECHNICAL ASSET`, time-series PHV, `idempotency_key` untuk dedupe webhook. Tidak ada perubahan DB sekarang | Mendukung ARI/bio-banding dan keamanan webhook; tetap 8 tabel, tanpa tabel baru |
| R13 | N-01 watermark | **Watermark dinamis per halaman** wajib: `RAHASIA — <nama_pengunduh> \| <peran> \| <stempel_WIB>`. UIUX §5.3 dan DoD sudah diselarkan | PRD Sprint 6 + FINANCE §8.1 mengikat; audit jejak pengunduhan |
| R14 | N-02 pembulatan | Amortisasi tahunan dihitung dari **nilai eksak** (1,65 M × 12/36 = 550.000.000), bulatkan di akhir. Jangan dari tampilan bulanan (45.833.333,33 × 12 = 549.999.999,96) | Selisih Rp 4; engine harus memakai nilai eksak |
| R15 | N-05 threshold SCR | `scr_max_threshold_pct < 58` ditolak validasi / di-clamp ke 58,00 + peringatan | Interval YELLOW mustahil bila ambang lebih rendah dari batas hijau |
| R16 | N-03 rate-card | Field rate-card (`base_price_enc`, `term_months`, `renewal_date`, `step_up_multiplier`) disimpan di **`juara_projections.ratecard_config_enc`** (BYTEA, AES-256-GCM). **Tidak ada tabel ke-9** | Dilarang menambah tabel; kolom baru tetap dalam 8 tabel yang sudah dikunci |
| R17 | N-04 ketersediaan `verify` | Perbedaan harness dicatat apa adanya (D5/D6 tersedia; D1/D3/D4/PM tidak). Tidak ada artefak diubah | Fakta lingkungan, bukan kontradiksi desain; klaim dibatasi pada perintah yang benar-benar dijalankan |

## Catatan verifikasi PM terhadap RULEBOOK.md

- File nyata: `docs/juara/RULEBOOK.md`, 338 baris, 27 test vector, tag sumber per aturan.
- Dihitung ulang PM dengan Python `Decimal` (22.11.2026): 1.650.000.000/36 =
  45.833.333,33/bln; ×12 = 550.000.000; NBV Y1 = 1.100.000.000; re-amort 4 thn =
  275.000.000; SCR 59,8% = YELLOW; numerator implisit = 14.651.000.000; buffer =
  3.875.000.000; weighted age = 24,40; ARI (90,88,80,80) = 85,00; solidarity 5% dari
  10 M = 500.000.000. Semua cocok.
- Sumber silang dicek di `docs/juara/PRD-JUARA.md` baris 91, 96, 116, 375, 471, 706.
- Skill `verify` (itqan-engineering) dilaporkan worker **tidak tersedia** di harness ini;
  PM juga tidak memilikinya di daftar skill sesi. Pengganti: aritmetika independen +
  pengecekan silang PRD. Ini dicatat, bukan dianggap sudah memakai skill tersebut.
- Status: **DITERIMA dengan koreksi R9**.

## Putusan lanjutan 23.11.2026 (izin Owner: "pilihkan yang terbaik")

| ID | Topik | Putusan PM | Alasan |
|---|---|---|---|
| R18 | R7 angka final multiplier | Tetap **input terkonfigurasi, default netral 1.00**. Untuk v1.0 PM menetapkan *preset* opsional dan bukan hardcode: prestasi juara/promosi `1.15`, top-4/stabil `1.08`, menengah `1.00`, turnaround `0.90`; gaya main menyerang tinggi hanya mengubah okupansi dengan preset `1.05`. Owner bisa menimpa; semua angka ber-label `INPUT_MANUAL_KLUB` atau `TEMPLATE_PRD` | PRD tidak memuat angka; memaksa angka "final" akan mengarang data. Preset memberi reproducible default tanpa mengunci konfigurasi |
| R19 | R8 besaran kenaikan gaji bertahap | Kenaikan **kumulatif atas gaji pokok**: `+5%` di 15 penampilan, `+10%` di 35, `+15%` di 60. Pemicu mengikuti PRD §9; tidak ada kenaikan di luar tiga ambang ini | Menutup celah R8 tanpa mengubah pemicu PRD; angka konservatif dan termonet darurat |
| R20 | Termin sponsor | `50%` ditagih di bulan ke-1, `30%` bulan ke-7, `20%` bulan ke-10 dari nilai kontrak (R10, tersimpan terenkripsi di vault) | Profil arus kas realistis untuk klub Liga 1/2 Indonesia; memberi headroom SCR tanpa mengubah total |

Catatan: R18–R20 adalah **default yang dipilih PM atas mandat Owner**, bukan angka dari PRD.
Bila Owner memiliki angka berbeda, ubah lewat putusan baru dan tandai versi.

## Putusan 24.11.2026 atas hasil riset tim (R21)

| ID | Topik | Putusan PM | Alasan |
|---|---|---|---|
| R21 | Kanon 10 Tactical DNA & SCR | **10 DNA resmi untuk v1.0** (4 dari PRD + 6 tambahan R21). Empat DNA pertama memakai model 4 fase terukur PRD §8.1 (PPDA, garis 42–48 m, penguasaan >58%, dll.); enam sisanya berlabel **"Rasionalisasi PM (kualitatif)"**, tidak memakai angka yang tidak ada sumbernya. Status SCR **tidak lagi** memakai test vector 59,8%; engine menampilkan ambang input + keterangan "engine penuh belum terhubung". Mentalitas FM adalah baseline enam parameter, False Nine adalah peran (bukan preset), tempo dibedakan dari arah umpan. Filosofi 100% memakai preset + tombol eksplisit "Isi sisa ke produk akademi" (tanpa coercion diam-diam) dan CTA muted dengan pesan sisa. | Riset tiga agen (dokumentasi SI FM24, gap audit PRD, UX alokasi) menunjukkan kosakata FM sebelumnya diambil tanpa mekanismenya dan angka uji bocor ke UI. Label sumber dipertahankan; tidak ada angka dikarang. |

Bukti: `research_notes/Benchmark taktik JUARA Football Manager/`, laporan gabungan di `reports/Benchmark taktik JUARA Football Manager.md`.
