# Audit Kesenjangan JUARA — PRD Bagian 6 vs Wizard (4 keluhan Owner)

**Lingkup:** riset read-only. Tidak ada kode, migrasi, atau dokumen produk yang diubah.
**Tanggal:** 24 November 2026. **Eksekutor:** subagent riset (read-only + tulis catatan ini saja).
**Metode:** `graphify query "wizard owner vision tactics formation validation"` dijalankan lebih dulu (hanya mengembalikan node `AUDIT-REPORT.md` seksi 8 tentang produk B2C stadione.pro — **tidak relevan** dengan JUARA, jadi tidak dipakai sebagai bukti). Seluruh temuan berikut berasal dari dokumen dan source yang dibaca langsung.
**Konvensi sitasi:** sumber adalah artefak lokal, bukan halaman web, maka sitasi ditulis `path:baris` (bukan URL). Ini disengaja agar tidak memalsukan tautan.
**Catatan status penting:** `SPRINT10_TACTICS_VERIFICATION.md` dan `CTO_AUDIT.md:59-69` menyatakan keempat keluhan Owner **sudah dikerjakan secara teknis** (JSON dihapus, 10 gaya + 10 formasi, mode Auto/Manual). Namun keduanya juga menyatakan **verifikasi visual/E2E tidak dilakukan** (`agent-browser` tidak tersedia). Jadi temuan di bawah membedakan *"ada di kode"* vs *"terbukti dirasakan Owner di layar"*.

---

## 1. Elemen PRD Bagian 6 yang belum muncul di wizard

### Takeaway

Wizard saat ini adalah **form 5 langkah + blok hasil statis**, bukan ruang kerja "Football Manager Executive Edition" yang dispesifikasikan PRD Bagian 6. Dari 5 zona, 9 ruang kerja, 6 indikator kesehatan, dan 4 komponen mikro, hampir tidak ada yang hadir di wizard; yang ada hanya sebagian kosakata FM (6 slider parameter). Selain itu, beberapa input wajib PRD Bagian 2.1/UIUX §2.3 juga hilang dari wizard.

### Cited Findings

- PRD 6.2 menetapkan **5 zona persistent**: icon-rail 9 ruang kerja, top ribbon 56px berisi 6 indikator, sub-tab 40px, split-pane canvas + inspector 440px, bottom action bar 48px (`docs/juara/PRD-JUARA.md:316-345`). Implementasi `WorkspaceShell` hanya punya **3 item navigasi** (Ringkasan, Owner Vision, Playbook), topbar berisi judul + email + logout, tanpa ticker 6 indikator, inspector, atau bottom bar (`src/components/juara/WorkspaceShell.tsx:16-20,68-82`).
- 6 indikator vital PRD (Alignment Score A+–F, SCR, sisa CapEx, sisa wage, weighted average age, horizon badge) tidak ditemukan di source (`grep` untuk `Alignment`, `Ringkasan Playbook`, `zone-2` → 0 hasil). Top ribbon hanya menampilkan judul halaman (`WorkspaceShell.tsx:69-81`).
- **Live Summary Card** wajib ada di kanan wizard, sticky 320px, menghitung ulang tiap perubahan, berisi 6 blok: Alignment Score, Age-Bracket Matrix, kuota Grade A/B/C, SCR `56,4% / Maks 65,0%`, contoh amortisasi, timeline milestone (`docs/juara/UIUX_SPEC.md:77-86,119-126,131-146`). Yang ada: `<aside>` statis berisi teks "Catatan" (`src/app/juara/(workspace)/vision/page.tsx:11-23`). Hasil baru muncul **setelah** tombol Generate ditekan (`OwnerWizard.tsx:373-415`) — tidak live.
- Kuota Grade A/B/C **sudah dihitung engine** (`gradeQuota` di `src/lib/juara/playbook.ts:17-21`) tetapi **tidak dirender** wizard; `Generated.gradeQuota` dideklarasikan di `OwnerWizard.tsx:44` lalu tidak dipakai.
- Tombol Zona 5 (Enter What-If Sandbox, Compare with Baseline, Lock Playbook Snapshot, Generate Boardroom PDF) tidak ada. Wizard hanya punya Generate Playbook / Unduh PDF / Simpan Playbook (`OwnerWizard.tsx:403-413,417-425`).
- Komponen mikro PRD 6.3 — Tactical Depth Chart 3 lapis + `DEPTH DEFICIT`, Objective Ability/Ceiling Badge (CA/PA), Contract Timeline Bar, CIES Career Curve Indicator — tidak ada di source (`grep` untuk `archetype`, `Role Familiarity`, `PPDA`, `DEPTH DEFICIT` → 0 hasil di `src/`). PRD: `docs/juara/PRD-JUARA.md:346-359`.
- Input wizard yang **hilang** terhadap PRD 2.1 / UIUX §2.3:
  - Langkah 1 hanya menampilkan select kasta; baseline jumlah pemain terikat kontrak, rata-rata usia skuad, kondisi akademi/SSB, kapasitas penonton tidak ada (`OwnerWizard.tsx:209-220`; banding `PRD-JUARA.md:52-53`, `UIUX_SPEC.md:113`).
  - Langkah 2 hanya satu `targetOutcome`; target terukur **per tahun** tidak ada (`OwnerWizard.tsx:222-240`; banding `UIUX_SPEC.md:114`).
  - Langkah 4 hanya 3 input angka bebas; preset Star-Driven / Balanced Spine + Academy / Academy-First dan slider auto-balance (total 100% otomatis) tidak ada — pengguna harus memastikan sendiri total 100% (`OwnerWizard.tsx:332-347`; banding `UIUX_SPEC.md:116`, `PRD-JUARA.md:69-75`).
  - Langkah 5 hanya equity + SCR max; **target % pendanaan mandiri komersial** tidak ada (`OwnerWizard.tsx:350-367`; banding `PRD-JUARA.md:76-77`, `UIUX_SPEC.md:117`).
- UIUX §1 menyebut 9 rute `/juara/*` dengan 3 aktif; kenyataannya hanya 3 rute workspace yang ada (`src/app/juara/(workspace)/{page, vision/page, playbooks/page}.tsx`). Depth chart, SCR monitor, squad table belum ada meski D1 menjanjikan slice tersebut (`UIUX_SPEC.md:61-71,318-321`).

### Inferences

- Keluhan Owner "riset kurang dalam" partly berakar di sini: dokumentasi merinci pengalaman FM kelas eksekutif, tetapi implementasi berhenti dipermukaan (kosakata slider), bukan ergonomi/info-density yang dijanjikan PRD 6.1-6.3.
- Ketidakhadiran Live Summary membuat wizard terasa seperti "form administratif", bukan "strategic decision engine" seperti tesis PRD 1.1/2.2 — konsisten dengan penilaian UI 1/10 yang dicatat CTO (`docs/juara/CTO_AUDIT.md:39-41`).
- Karena `gradeQuota` sudah dihitung tapi tak dirender, gaps ini **murah** untuk ditutup di P1 (tidak perlu engine baru).

### Gaps

- Tidak bisa dipastikan apakah assessor visual Owner melihat build produksi versi Sprint 10; CTO mencatat `agent-browser` tidak tersedia sehingga screenshot langkah 3 tidak diambil ulang (`SPRINT10_TACTICS_VERIFICATION.md:42-46`, `CTO_AUDIT.md:66-67`). Perlu verifikasi visual langsung sebelum menyimpulkan keluhan sudah selesai.
- Tidak diperiksa apakah token warna PRD 6.1 (`#F8FAFC`, `#0F172A`, `#064E3B`, dst.) sudah terpasang di `juara.css` — di luar fokus pertanyaan ini.

---

## 2. Apakah masih ada kode/internal (enum, JSON, angka mentah) yang tampil ke pengguna?

### Takeaway

Blok JSON `<details>` memang sudah dihapus (sesuai klaim Sprint 10), dan label DNA sudah memakai `dnaLabel` manusia. **Namun masih ada satu kebocoran nyata dan berdampak:** status SCR yang ditampilkan berasal dari **test vector hardcoded 59,8%** (`RULEBOOK` TV-06), bukan dari data/input pengguna. Artinya angka internal pengujian ditampilkan seolah hasil perhitungan playbook Owner. Beberapa enum/formasi juga masih berpotensi tampil mentah lewat fallback.

### Cited Findings

- **Dikonfirmasi sudah dibersihkan:** Sprint 10 mencatat penghapusan total blok `<details>` berisi JSON engine, dan semua nilai tampil memakai label manusia (`docs/juara/SPRINT10_TACTICS_VERIFICATION.md:9-12`). Kode `OwnerWizard.tsx` tidak mengandung `<details>` atau `JSON.stringify` untuk tampilan.
- **Kebocoran utama (P0):** `generatePlaybookSummary` mengisi `scrStatus: classifyScr(59.8, input.guardrails.scrMax)` dengan komentar eksplisit *"Test vector from RULEBOOK TV-06; full engine follows FINANCE_SPEC.md"* (`src/lib/juara/playbook.ts:22-23`). Nilai 59,8% itu lalu dirender sebagai **"Status SCR"** di kartu hasil (`OwnerWizard.tsx:379`, mapping `SCR_LABEL` di `:80-84`). Jadi pengguna melihat status Kuning/Waspada berdasarkan angka uji, bukan equity/scrMax yang ia input. Test vector 59,8% berasal dari `RULEBOOK.md:276` (TV-06).
- `totalSlots` juga hardcoded `27` (`playbook.ts:7`) — angka ini memang sesuai band PRD 26–28 (`RULEBOOK.md:51`), tetapi tidak responsif terhadap baseline skuad yang (juga) tidak dikumpulkan wizard.
- **Enum mentah di payload API, bukan di layar:** engine mengembalikan `tacticalDna` (= `dnaLabel`) **dan** `tacticalDnaCode` (= enum seperti `HIGH_PRESSING`) (`playbook.ts:12-13`). UI hanya merender `result.tacticalDna` (`OwnerWizard.tsx:377`), jadi saat ini aman. Tetapi interface `Generated` tidak mendeklarasikan `tacticalDnaCode` dan field `tacticalDna` bertipe `string` generik (`OwnerWizard.tsx:37-46`) — kontrak rapuh: perubahan engine bisa membuat enum bocor tanpa ada yang menyadari.
- **Fallback raw enum:** `SCR_LABEL[result.scrStatus] ?? result.scrStatus` (`OwnerWizard.tsx:379`) akan menampilkan `GREEN` / `YELLOW_WATCHLIST` / `RED_BREACH` verbatim jika status di luar tiga nilai yang dikenal (`formulas.ts:27-33`). Risiko rendah, tapi ini exactly pola "enum bocor" yang dikeluhkan.
- **Formasi ditampilkan apa adanya:** `result.baseFormation` dirender langsung (`OwnerWizard.tsx:376`), demikian juga `autoFormation` di teks Auto (`:270`). Notasi `4-2-3-1` memang manusiawi, jadi ini dapat diterima; yang kurang adalah tidak ada label deskriptif ("Kontrol modern, dua pivot") seperti di `tactics.ts:108-119`.
- **Angka mentah belum diformat:** input equity memakai `type="number"` dengan nilai `15000000000` (`OwnerWizard.tsx:352-358`), sedangkan UIUX §2.4 mensyaratkan format `Rp 1.650.000.000` dengan tabular numerals (`UIUX_SPEC.md:124`).
- **Bahasa/campuran jargon:** label DNA memakai istilah Inggris/serbaguna — `Gegenpress`, `Tiki-Taka`, `Vertical Counter`, `Total Football`, `Low Block / Catenaccio`, `Wing Play`, `Diamond Midfield`, `False Nine`, `Direct / Physical` — hanya "Seimbang" yang Indonesia (`src/lib/juara/tactics.ts:39-100`). Deskripsinya berbahasa Indonesia, tetapi K6 mewajibkan seluruh antarmuka Bahasa Indonesia (`UIUX_SPEC.md:84,310`).

### Inferences

- Keluhan #1 **benar secara substansi meski JSON sudah hilang**: Owner kemungkinan melihat "Status SCR" yang tidak berubah-ubah saat mengubah input — itu terasa seperti "data internal/angka mentah" bahkan tanpa JSON.
- Prioritas perbaikan bukan sekadar menyembunyikan string, melainkan **menghubungkan hasil ke input pengguna** dan memperketat kontrak tipe antara engine dan UI.
- `tacticalDnaCode` sebaiknya tetap ada di API (untuk audit/enkripsi profil, lihat `SPRINT10_TACTICS_VERIFICATION.md:20-21`), hanya tidak boleh dirender.

### Gaps

- Tidak diverifikasi apakah endpoint `/api/juara/v1/playbooks/generate` melakukan transformasi tambahan sebelum mengirim respons ke UI (dibaca dari `generatePlaybookSummary`, bukan dari route handler). Perlu dicek bila perbaikan dilakukan.
- Tidak ada bukti visual bahwa `SCR_LABEL` fallback pernah terpicu; ini bersifat defensif, bukan insiden aktif.

---

## 3. Apa yang kurang dari benchmark Football Manager menurut dokumen yang ada?

### Takeaway

PRD 6.1 mengakui FM sebagai standar emas *information density* dan pengambilan keputusan berbasis data, lalu menerjemahkannya ke 5 zona, depth chart 3 lapis, CA/PA objektif, dan heatmap kontrak/usia. Implementasi mengambil **kosa kata FM** (6 slider: mentalitas, tempo, pressing, garis, lebar, umpan) tetapi **meninggalkan isi domainnya**: tidak ada PPDA, garis pertahanan dalam meter, ambang penguasaan bola, metrik fisik, 22 archetype, maupun 4-phase game model. 6 gaya bermain tambahan juga tidak memiliki dasar riset di PRD.

### Cited Findings

- PRD 6.1 menyebut FM sebagai "standar emas ... kepadatan informasi dan pengambilan keputusan cepat berbasis data", dengan syarat estetika game (ungu gelap, hijau neon, magenta) **ditolak** (`docs/juara/PRD-JUARA.md:303-315`). Prinsip ini dipegang UIUX §6 (`UIUX_SPEC.md:306-313`).
- 4 DNA kanonik PRD masing-masing punya **4-phase game model terukur** + konsekuensi rekrutmen: PPDA < 8,5 / garis 42–48 m; penguasaan > 58% / umpan progresif > 86% / Rest Defense 2-3; blok 28–34 m / PPDA > 13,0 / winger > 32,5 km/jam / aerial win > 68%; pressing trigger + versatile ≥ 2 peran (`PRD-JUARA.md:413-446`, `RULEBOOK.md:29-38`). **Tidak ada satu pun angka itu di source** (`grep` PPDA/42–48/58%/1.100/32,5/archetype/Role Familiarity → 0 hasil di `src/`).
- 22 archetype peran (2 GK + 3 CB + 3 FB + 5 CM + 4 W + 5 ST, bobot 1–20 pada 4 dimensi) tercantum di PRD 8.2 dan RULEBOOK §4 (`PRD-JUARA.md:447-456`, `RULEBOOK.md:71-84`), tetapi tidak hadir di wizard maupun engine ringkas.
- 6 DNA tambahan (`TOTAL_FOOTBALL`, `CATENACCIO`, `WING_PLAY`, `DIAMOND_MIDFIELD`, `FALSE_NINE`, `DIRECT_PHYSICAL`) **hanya ada di kode** (`tactics.ts:7-17,64-99`, `validation.ts:32-36`) dan di `SPRINT10_TACTICS_VERIFICATION.md:13-16`. PRD 10.1 dan RULEBOOK §1 masih menyatakan enum **hanya 4 nilai** (`PRD-JUARA.md:535`, `RULEBOOK.md:38`). Ini kontradiksi dokumen–kode yang belum diselesaikan.
- Kedalaman 6 DNA baru hanya satu kalimat deskripsi + preset 6 slider; tidak ada matriks 4 fase, tidak ada konsekuensi usia/atribut seperti 4 DNA PRD (`tactics.ts:64-99` vs `PRD-JUARA.md:413-446`).
- "Auto" formasi bukanlah algoritma: `resolveFormation` hanya mengambil `preset.formation`, dengan satu pengecualian (target `MID_TABLE_SUSTAINABLE` + mentality `ATTACKING` → `4-2-3-1`) (`tactics.ts:155-179`). Tidak mempertimbangkan komposisi skuad, 22 archetype, age matrix, celah rekrutmen, atau kandang/tandang sebagaimana PRD 2.1 Balanced Hybrid dan Sprint 2 ("rekomendasi formasi", `PRD-JUARA.md:68,232`).
- Riset referensi visual tidak disintesis: `UI_REFERENCE_LINKS.md` hanya daftar tautan Mobbin; seksi KPI Cards menyatakan **"Tidak ada hasil khusus dari pencarian"** (`:65-68`), dan penutupnya mengakui *"saya tidak bisa menilai visualnya. Owner memilih yang cocok"* (`:72-74`). Tidak ada pemetaan pola → keputusan desain, tidak ada alasan mengapa satu referensi dipilih.
- RULEBOOK §14 sendiri mendaftarkan 8 ketidaktentuan yang belum atau baru sebagian diputuskan (multiplier prestasi, bobot revenue, band gaji, usia representatif, dll.) (`RULEBOOK.md:301-314`); PM merespons R1–R17 dan R18–R20 (`PM_RULINGS.md:7-25,41-49`). Artinya "kedalaman riset" memang sudah dibangun di level rumus keuangan, tetapi **tidak pernah mengalir ke wizard taktik**.

### Inferences

- Keluhan "riset kurang dalam" paling tepat dibaca sebagai: **jumlah opsi sudah bertambah, tetapi kedalaman model di balik tiap opsi tidak ikut bertambah**. Menambah 6 DNA tanpa 4-phase matrix membuat pilihan terasa kosmetik.
- Auto/Manual sudah ada di UI (keluhan #3 terjawab secara struktural), tetapi resolver Auto yang dangkal membuat keluhan itu bisa muncul lagi setelah Owner mencoba dan melihat formasi tidak berubah sesuai logika.
- Dokumen RULEBOOK/PRD yang masih 4-DNA sementara kode 10-DNA berisiko membuat engine, QA, dan UI berbeda asumsi — ini masalah tata kelola, bukan sekadar dokumentasi.

### Gaps

- Tidak ditemukan dokumentasi yang menjelaskan **bagaimana 6 preset DNA baru diturunkan** dari literatur/PRD; hanya keputusan PM di Sprint 10. Tidak bisa dinilai apakah preset tersebut valid secara football-science.
- Tidak bisa dinilai secara visual apakah 10 kartu DNA + 10 template formasi akhirnya menyenangkan dipakai; verifikasi visual Sprint 10 belum dilakukan.
- Tidak dibaca `FINANCE_SPEC.md` dan `ACADEMY_INTEGRATION_SPEC.md` secara penuh; keduanya mungkin berisi detail yang menjelaskan mengapa SCR masih memakai test vector (kemungkinan engine penuh belum selesai).

---

## 4. Rekomendasi prioritas (P0/P1/P2) dengan alasan dan file yang perlu diubah

### Takeaway

P0 harus menutup **kebocoran angka uji SCR ke layar** dan memperketat kontrak UI–engine, plus verifikasi visual. P1 menutup Live Summary, input wizard yang hilang, kedalaman Auto, dan sinkronisasi dokumen 4 vs 10 DNA. P2 membangun ergonomi FM yang belum ada dan mengubah riset Mobbin dari kumpulan tautan menjadi keputusan desain.

### Cited Findings — matriks prioritas

| Prioritas | Rekomendasi | Alasan (bukti) | File yang perlu diubah |
|---|---|---|---|
| **P0-1** | Hentikan penampilan `59.8%` sebagai "Status SCR". Hitung SCR dari komponen nyata (5 pembilang + 6 penyebut, R2) atau — bila engine belum siap — beri label eksplisit **"Contoh simulasi, bukan hasil klub Anda"** dan jangan sebut "Status SCR". | `playbook.ts:22-23` memakai test vector TV-06; dirender sebagai hasil di `OwnerWizard.tsx:379`; `RULEBOOK.md:276`, `PM_RULINGS.md:10` (R2). | `src/lib/juara/playbook.ts`, `src/components/juara/OwnerWizard.tsx` (dan route `/api/juara/v1/playbooks/generate` bila ada transformasi) |
| **P0-2** | Perketat kontrak tampilan: `Generated` eksplisit (label, bukan enum), hapus fallback raw enum, format Rupiah `Rp ...`, pastikan tidak ada `JSON.stringify`/`<details>` kembali. | `OwnerWizard.tsx:37-46,80-84,376-379,354-358`; `playbook.ts:12-13`; `UIUX_SPEC.md:124,310`. | `src/components/juara/OwnerWizard.tsx`, `src/lib/juara/playbook.ts` |
| **P0-3** | Verifikasi visual/E2E langsung di build produksi (langkah 3 + hasil generate) sebelum menyatakan keluhan #1 selesai; minta Owner menilai ulang. | `SPRINT10_TACTICS_VERIFICATION.md:42-46`, `CTO_AUDIT.md:66-67` — screenshot belum diambil, CTO tidak bisa nilai visual. | Tidak ada perubahan kode; artefak verifikasi + screenshot di `docs/juara/screenshots/` |
| **P1-1** | Implementasi **Live Summary Card** sesuai UIUX §2.4: Alignment Score A+–F, age matrix, kuota Grade A/B/C (sudah dihitung di `playbook.ts:17-21`), SCR dinamis + 3 zona, amortisasi contoh, timeline; update realtime saat input berubah. | `UIUX_SPEC.md:77-86,119-126`; `vision/page.tsx:11-23` masih `<aside>` statis; `PRD-JUARA.md:331-338`. | `src/app/juara/(workspace)/vision/page.tsx`, `src/components/juara/OwnerWizard.tsx`, `src/app/juara/juara.css` |
| **P1-2** | Lengkapi input yang hilang: baseline Langkah 1, target per tahun Langkah 2, preset filosofi + auto-balance Langkah 4, target % pendanaan komersial Langkah 5; validasi inline SCR >58% kuning / >65% kunci lanjut. | `OwnerWizard.tsx:209-220,222-240,332-347,350-367`; `PRD-JUARA.md:52-77`; `UIUX_SPEC.md:113-117,125`. | `src/components/juara/OwnerWizard.tsx`, `src/lib/juara/validation.ts` |
| **P1-3** | Perdalam resolver **Auto**: pertimbangkan archetype (22 peran), age matrix, celah skuad, dan konteks kandang/tandang; validasi formasi manual secara struktural (bukan hanya panjang 3–20 char). | `tactics.ts:155-179` hanya lookup + 1 special case; `validation.ts:59-68`; `PRD-JUARA.md:68,232,447-456`. | `src/lib/juara/tactics.ts`, `src/lib/juara/validation.ts`, `src/lib/juara/playbook.ts` |
| **P1-4** | Sinkronkan dokumentasi: putuskan apakah 10 DNA kanonik untuk v1.0. Jika ya, revisi enum di PRD 10.1 & RULEBOOK §1 dan tambahkan 4-phase matrix + konsekuensi rekrutmen untuk 6 DNA baru; jika tidak, tandai sebagai eksperimen UI. | `PRD-JUARA.md:535`, `RULEBOOK.md:38` = 4 nilai; `validation.ts:32-36`, `tactics.ts:7-17` = 10 nilai; `SPRINT10_TACTICS_VERIFICATION.md:13-16`. | `docs/juara/PRD-JUARA.md`, `docs/juara/RULEBOOK.md`, `docs/juara/PM_RULINGS.md` (putusan baru) |
| **P2-1** | Bangun 5-zona workspace & 9 rute sesuai PRD 6.2 / UIUX §1 (top ribbon 6 indikator, sub-tab, inspector 440px, bottom bar 48px). Ini lebih besar dari wizard, perlu keputusan scope ulang D1. | `PRD-JUARA.md:316-345`; `UIUX_SPEC.md:61-71,151-171`; `WorkspaceShell.tsx:16-20,68-82`. | `src/components/juara/WorkspaceShell.tsx`, rute baru di `src/app/juara/(workspace)/`, CSS |
| **P2-2** | Tambah komponen mikro FM: Tactical Depth Chart 3 lapis + DEPTH DEFICIT, CA/PA badge, Contract Timeline Bar, CIES Career Curve. | `PRD-JUARA.md:346-359`; `UIUX_SPEC.md:221-230,236-279`; tidak ada di `src/`. | Komponen baru `src/components/juara/`, data archetype di `src/lib/juara/` |
| **P2-3** | Ubah `UI_REFERENCE_LINKS.md` dari daftar tautan menjadi **pemetaan pola → keputusan desain** (mis. "Stripe → inspectors 440px", "Employment Hero → speedometer SCR"); isi bagian KPI Cards yang kosong. | `UI_REFERENCE_LINKS.md:65-68,72-74`. | `docs/juara/UI_REFERENCE_LINKS.md` |
| **P2-4** | Seragamkan Bahasa Indonesia pada label DNA/parameter; hindari campuran `Wing Play`/`Seimbang` yang tidak konsisten. | `tactics.ts:39-100`; `UIUX_SPEC.md:84,310`. | `src/lib/juara/tactics.ts` |

### Inferences

- P0-1 dan P0-3 saling melengkapi: memperbaiki kode tanpa verifikasi visual berisiko mengulang pola Sprint 9→10 (perbaikan teknis terjadi, tetapi Owner tetap menilai buruk karena tidak melihat bukti).
- P1-1 sampai P1-4 dapat dikerjakan parallel oleh worker berbeda (UI, engine, docs) selama kontrak `Generated` disepakati lebih dulu di P0-2.
- P2-1 adalah keputusan **scope**, bukan sekadar bug: D1 (vertical slice) sengaja membatasi 9 modul, jadi jangan dikerjakan tanpa persetujuan Owner/CTO.

### Gaps

- Tidak dihitung estimasi effort; rekomendasi hanya diprioritaskan berdasarkan dampak terhadap 4 keluhan Owner dan kesesuaian dengan dokumen.
- Tidak diperiksa apakah masih ada test yang bergantung pada `59.8` atau `totalSlots = 27` — perubahan P0-1 perlu diikuti penyesuaian test (46 test di `tests/juara/*.test.ts` menurut `SPRINT10_TACTICS_VERIFICATION.md:27`).
- Tidak ada akses ke penilaian visual Owner secara langsung; semua rekomendasi visual bersandar pada dokumen, bukan pengamatan layar.
