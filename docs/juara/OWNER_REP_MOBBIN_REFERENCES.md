# Referensi Mobbin Terbatas — Perombakan UI JUARA

Tanggal: 24 November 2026.
Konteks: Owner Representative meminta riset referensi **terbatas** — tiga pola desktop
(web) dari Mobbin, sebagai pelengkap. **Football Manager tetap acuan utama** untuk
information density, squad depth, tactics, dan navigasi. Mobbin hanya dipakai untuk
tiga pola struktural yang tidak dijelaskan FM: inspector, decision inbox, dan
perbandingan skenario finansial.

Batasan mandat: dokumen ini saja. Tidak mengubah file aplikasi, tidak deploy, tidak
mengubah `OWNER_REP_TECHNICAL_PLAN.md`, tidak memakai model/layanan berbayar baru.

Tool: `ui-ux-pro-max` (sudah dipakai Owner Representative) + Mobbin MCP
`search_screens`, `platform: "web"`, `mode: "deep"`, `limit: 5` per query.
`task_intent` identik untuk ketiga query:
"Collect three desktop UI patterns for JUARA club management redesign".
`output_destination: "doc"`.

---

## Pola 1 — Dense table + detail inspector

**Layar utama:** [Navattic — Visitors](https://mobbin.com/screens/1ef8248f-ac5c-4c7b-b44c-e7db3f8d9ed3?utm_source=other&utm_medium=ai-assistant&utm_source_platform=mcp)
- ID: `1ef8248f-ac5c-4c7b-b44c-e7db3f8d9ed3`
- App: Navattic, platform web.

**Yang terlihat di layar:** sidebar workspace kiri, tabel visitor berisi kolom
Name/Company/Total time, toolbar search + filter chips + add filter + clear, dan
panel inspector kanan yang menampilkan detail baris terpilih (nama, email, current
URL, last viewed step, session ID, dll.). Baris tabel tetap terlihat saat inspector
terbuka — pengguna tidak kehilangan konteks daftar.

**Pola yang diambil:**
- Tabel padat + inspector kanan yang **menghapus konteks hanya sebagian** (table tetap tampil, bukan halaman baru).
- Toolbar filter berbentuk chip yang bisa di-clear, bukan dropdown tersembunyi.
- Inspector menampilkan field mentah tetapi dalam label yang jelas; untuk JUARA field sensitif tetap harus melewati RBAC.

**Alasan:** sesuai PRD JUARA §6.2 (split-pane canvas + inspector ±440px) dan kebutuhan
Owner untuk memeriksa satu playbook/slot tanpa keluar dari daftar.

**Ditolak:**
- [Vapi — Chat Details](https://mobbin.com/screens/99887a60-dc99-45e3-bfca-ff6788010578?utm_source=other&utm_medium=ai-assistant&utm_source_platform=mcp) — inspector menampilkan UUID dan JSON cost mentah; terlalu developer-oriented dan berisiko mengulang keluhan "kode bocor".
- [Supabase — Users/Authentication](https://mobbin.com/screens/47b3ed04-aa5e-48c8-9467-95fc0253612f?utm_source=other&utm_medium=ai-assistant&utm_source_platform=mcp) — inspector `Raw JSON` persis pola yang harus dihindari JUARA.
- [Twenty — Companies](https://mobbin.com/screens/02d0d302-bdc3-4b3c-bdda-7675ba46819e?utm_source=other&utm_medium=ai-assistant&utm_source_platform=mcp) — kuat, tetapi terlalu CRM-spesifik (ARR, ICP, contact) untuk playbook klub.
- [Base44 — Competitors](https://mobbin.com/screens/c8720695-9fa5-4b98-8d8e-98289b0766b1?utm_source=other&utm_medium=ai-assistant&utm_source_platform=mcp) — inspector edit form tanpa ringkasan status; kurang cocok untuk governance.

---

## Pola 2 — Decision inbox / approval queue

**Layar utama:** [Lemni — Inbox with Approve/Decline](https://mobbin.com/screens/31c9c03a-dff3-4ab4-9710-b2990d13adbe?utm_source=other&utm_medium=ai-assistant&utm_source_platform=mcp)
- ID: `31c9c03a-dff3-4ab4-9710-b2990d13adbe`
- App: Lemni, platform web.

**Yang terlihat di layar:** tiga panel — daftar inbox, isi pesan/permintaan, dan
panel Details berisi Status, Priority, Assigned, Dates, Contact. Tombol
**Decline / Approve** berada di dekat isi permintaan, bukan tersembunyi di menu.

**Pola yang diambil:**
- Tiga panel: queue → konten → keputusan, dengan aksi eksplisit di konteks.
- Status/priority/pemicu ditampilkan sebagai teks + badge, bukan warna saja.
- Cocok untuk Boardroom Inbox JUARA (permintaan kunci playbook, persetujuan
  anggota, persetujuan kontrak/vault).

**Alasan:** PRD JUARA menamai "Boardroom Inbox" sebagai workspace pertama; pola ini
memberi hierarki keputusan yang belum ada di implementasi saat ini.

**Ditolak:**
- [Aboard — Approvals](https://mobbin.com/screens/9ce069a2-2cbe-4c94-a7f5-b57050e50ca0?utm_source=other&utm_medium=ai-assistant&utm_source_platform=mcp) — tabel approval rapi tetapi tidak ada panel detail/aksi; terlalu datar.
- [Assembly — Approvals Inbox](https://mobbin.com/screens/f77c7f8c-610d-4a08-8264-9ea2aaaf5f3f?utm_source=other&utm_medium=ai-assistant&utm_source_platform=mcp) — punya tab "Awaiting your approval" / "Approvals I've requested", bagus untuk konsep, tetapi visual terlalu tipis untuk eksekutif klub.
- [Miro — Access requests](https://mobbin.com/screens/05e59db8-5f5a-4f08-ae23-292fd64fe663?utm_source=other&utm_medium=ai-assistant&utm_source_platform=mcp) — inline approve/deny sederhana, namun konteksnya admin lisensi, bukan keputusan bisnis.
- [Airwallex — Spend requests](https://mobbin.com/screens/64cb7251-edd5-4bfa-ad69-8f89182ffafa?utm_source=other&utm_medium=ai-assistant&utm_source_platform=mcp) — kuat untuk approval finansial, tapi alur kartu/expense terlalu spesifik untuk JUARA; pola statusnya bisa dipinjam kemudian.

---

## Pola 3 — Perbandingan skenario finansial

**Layar utama:** [Monarch — Forecasting](https://mobbin.com/screens/391b7bce-d59d-4b11-898f-713bcd568b6c?utm_source=other&utm_medium=ai-assistant&utm_source_platform=mcp)
- ID: `391b7bce-d59d-4b11-898f-713bcd568b6c`
- App: Monarch, platform web.

**Yang terlihat di layar:** tab **Baseline forecast** dan tombol
**Duplicate existing scenario** diheader, grafik forecast, tabel per tahun, dan
inspector kanan "Edit assumptions" berisi income sources, inflation, yearly
expenses. Artinya skenario baru dibuat dari baseline yang sudah ada, lalu
asumsinya diubah di panel terpisah.

**Pola yang diambil:**
- Baseline + tombol "Duplikasi skenario" + inspector asumsi = kerangka what-if yang
  jujur: pengguna melihat angka dasar, lalu mengubah satu asumsi.
- Tabel per tahun tetap hadir di bawah grafik (angka tetap bisa diaudit).

**Alasan:** ini langsung menjawab gap JUARA "What-If Sandbox / Compare with Baseline"
yang masih berupa tombol disabled. Cocok dipasangkan dengan R14 (amortisasi dari
nilai eksak) dan R2 (5+6 komponen SCR).

**Ditolak:**
- [Causal — Scenarios/Spreadsheet](https://mobbin.com/screens/c40c1200-8716-4dd1-892e-5e928acccec1?utm_source=other&utm_medium=ai-assistant&utm_source_platform=mcp) — sangat kuat untuk analis, tapi grid spreadsheet terlalu teknis untuk Owner klub; FM memberi density, bukan spreadsheet mentah.
- [Origin — Compare scenarios](https://mobbin.com/screens/1c7eb6cd-d2b3-4023-b55e-3760f498f64c?utm_source=other&utm_medium=ai-assistant&utm_source_platform=mcp) — punya tombol compare, tetapi kartu penjelasannya tipis dan tidak ada tabel asumsi.
- [Fey — Graph comparison](https://mobbin.com/screens/729ec564-7ed7-453d-a3f2-86f51b34c96a?utm_source=other&utm_medium=ai-assistant&utm_source_platform=mcp) — perbandingan grafik saham; konteksnya tidak transfer ke keuangan klub.
- [7shifts — Forecast vs actual](https://mobbin.com/screens/e7f4ff6e-88da-4978-839d-66550face4ad?utm_source=other&utm_medium=ai-assistant&utm_source_platform=mcp) — tabel variance berguna, tetapi operasional harian, bukan skenario strategis.

---

## Ringkasan keputusan desain (belum diimplementasi)

| Pola Mobbin | Dipetakan ke | Catatan |
|---|---|---|
| Navattic table + inspector | Zona 4 split-pane JUARA | Field sensitif tetap di-RBAC; jangan pernah tampilkan UUID/JSON mentah |
| Lemni decision inbox | Boardroom Inbox | Status + priority + aksi Approve/Decline dalam satu konteks |
| Monarch scenario | What-If Sandbox | Baseline → duplikat → edit asumsi → tabel per tahun; SCR dari engine riil, bukan contoh |

Football Manager tetap menentukan: information density, squad depth 3 lapis,
tactics DNA + 4-phase model, dan navigasi workspace. Mobbin hanya melengkapi tiga
pola struktural di atas.

---

## Status browser & E2E

Koreksi diterima: `agent-browser` **ada** di
`/home/taradfs/.nvm/versions/node/v24.16.0/bin/agent-browser` (versi 0.33.1).
Kemarin saya hanya memanggil nama perintah tanpa PATH nvm, sehingga `command not found`.

- `agent-browser doctor`: pass (CLI, home, state, socket, Chrome for Testing 151.0.7922.71).
- Uji read-only berhasil: `open https://juara.stadione.pro/juara/login` →
  `TITLE=JUARA — Stadione`, snapshot menampilkan heading, email, password, tombol
  Masuk, link Daftarkan klub; screenshot tersimpan.
- Kemampuan tersedia: navigasi, snapshot aksesibilitas, klik/fill, wait, screenshot,
  eval JS. E2E penuh memungkinkan.
- Sesuai mandat representative, **tidak ada tulis data produksi** dalam pemeriksaan ini
  (tidak login, tidak submit form, tidak simpan playbook).

Rencana E2E tanpa menjadikan Owner tester utama: PM menjalankan alur login →
dashboard → wizard → generate → simpan → arsip, mengambil screenshot per langkah,
menyimpan ke `docs/juara/screenshots/`, lalu Owner hanya memberi penilaian akhir.

---

## Estimasi nyata (native, tanpa model/layanan berbayar)

| Prioritas | Estimasi | Dependency | Acceptance |
|---|---:|---|---|
| RBAC gate + UI tervalidasi | 2–3 hari kerja | `juara_club_members`, helper session, matriks peran | Test matriks peran; API 403 untuk peran terlarang; invite nyata menghasilkan membership; UI menyembunyikan aksi tanpa izin |
| Vertical slice finansial + skuad | 5–8 hari kerja | R2 (5+6 komponen SCR), R14 (nilai eksak), 22 archetype, vault terenkripsi | SCR dihitung dari input klub (bukan 59,8%), 27 slot + kuota grade, depth deficit tampil, tidak ada placeholder sebagai hasil |
| Perluasan (5 zona, 9 rute, what-if, PDF dari playbook tersimpan) | 8–12 hari kerja | finance slice selesai + keputusan scope Owner | Screenshot tiap breakpoint, alur scenario duplicate→edit→compare, PDF dari data tersimpan, E2E browser lolos |

Estimasi mengasumsikan kuota worker masih habis, sehingga pekerjaan dikerjakan native
di sesi PM. Tidak ada biaya/model baru yang dipakai.
