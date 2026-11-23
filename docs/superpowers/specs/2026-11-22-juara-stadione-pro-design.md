# Design Doc — JUARA.STADIONE.PRO (v1)

Tanggal: 2026-11-22
Penulis: PM (sesi `ses_dfd621110ffeVnw419vDE4qR43`)
Status: **DISETUJUI — CTO atas delegasi Owner, 22.11.2026** (lihat `docs/juara/DECISIONS.md` D1–D3). Bukan izin deploy.

Sumber PRD: salinan lengkap ada di `docs/juara/PRD-JUARA.md` (721 baris, hasil
export dari Google Docs yang dibaca Owner). Ini source of truth domain, bukan
`PRD.md` di root repo yang merupakan dokumen produk B2C.

## 1. Intent & mengapa

`juara.stadione.pro` adalah suite B2B untuk pemilik/pengurus klub sepak bola
Indonesia. Masalah yang diatasi: bongkar-pasang skuad 60–80% tiap musim, rekrutmen
tanpa portofolio usia, defisit arus kas, kebocoran aset akademi, dan terputusnya
prestasi dari mesin komersial. Produk menerjemahkan visi Owner menjadi *Master Club
Playbook* multi-tahun yang terukur secara matematis.

Owner meminta project dituntaskan sampai **live**. Mandat ini mencakup seluruh
perjalanan dari desain, implementasi, verifikasi, sampai penyerahan keputusan deploy.

## 2. Goals

- Vertical slice yang benar-benar bisa dipakai: 5-Step Owner Vision Wizard → mesin
  Playbook menghasilkan angka nyata → satu layar Squad & Depth Chart → ringkasan
  keuangan/SCR → ekspor PDF.
- Semua angka berasal dari satu source of truth rumus yang punya test dengan
  angka contoh dari PRD (bukan hardcode di UI).
- Isolasi data per `club_id` (RLS) dan RBAC 6 peran sejak slice pertama.
- Tampilan eksekutif sesuai PRD Bagian 6 (Stadione Pro UI), bukan tema game.
- Siap di-deploy ke `juara.stadione.pro` setelah Owner memberi lampu hijau.

## 3. Non-goals (v1 slice)

- Modul penuh 10 sprint sekaligus: recruitment Kanban, kontrak radar, ARI penuh,
  stadione-bridge, WhatsApp alert, tablet presentation mode menyusul.
- Fase 2 & 3: Rapor Akademi/EPA sync, statistik liga & GPS telemetry, realisasi
  tiket/merchandise.
- Aplikasi mobile native.
- SSO `auth.stadione.pro` di hari pertama (lihat keputusan K3).

## 4. Anti-goals (yang membuat proyek gagal meski "jadi")

- Demo cantik dengan angka palsu / hardcode.
- Kebocoran data lintas klub atau tampilan gaji ke peran yang tidak berhak.
- Deploy tanpa izin Owner; kredensial muncul di log, laporan, atau pesan.

## 5. Constraints

- Repo existing `stadione-v2` adalah platform **B2C** (booking, gym, akademi, POS,
  admin), bukan produk ini. `PRD.md`/`IMPLEMENTATION_PLAN.md` di repo itu tidak
  boleh disamakan dengan PRD juara.
- Stack existing: Next.js **16.2.12**, React 19.2.4, Supabase (`@supabase/ssr`),
  Tailwind 4, shadcn, jsPDF + autotable, TanStack Query, Zod.
- `AGENTS.md` repo: **wajib baca `node_modules/next/dist/docs/` sebelum menulis
  kode** — Next.js versi ini punya breaking change.
- PRD meminta PostgreSQL 16 + RLS + AES-256-GCM, RBAC 6 peran, OpenAPI 3.1,
  IAS 38, UEFA FSR SCR, 6 pilar pendapatan.
- Sesi kerja ini bukan 6 divisi sungguhan; pekerjaan dibagi ke worker fokus dengan
  brief, bukan dengan menggandakan peran dalam satu percakapan.

## 6. Approaches yang dipertimbangkan

| Opsi | Bentuk | Trade-off |
|---|---|---|
| A — Rulebook dulu | Kunci semua rumus + test dulu, UI belakangan | Paling kokoh secara matematis, tapi Owner belum bisa melihat apa pun dan integrasi UI berisiko terlambat |
| **B — Vertical slice end-to-end (DIPILIH PM)** | Shell 5 zona + wizard + mesin playbook + satu layar Squad, semua tipis tapi nyata | Langsung bisa dinilai Owner; sebagian modul dangkal dan diperkuat bergiliran |
| C — Rencanakan 10 sprint dulu | Seluruh cakupan v1.0 dipetakan, baru dieksekusi | Lengkap di atas kertas, tapi baru terlihat setelah lama dan asumsi salah termahal |

**Keputusan PM:** B. Alasan: mandat Owner adalah "sampai live", sehingga jalur
tercepat ke produk yang bisa diverifikasi adalah slice utuh, bukan dokumen atau
rulebook saja. Rulebook tetap dibuat, tetapi sebagai bagian dari slice (K4).
Keputusan PM ini telah disetujui CTO sebagai D1 (lihat `docs/juara/DECISIONS.md`).

## 7. Keputusan teknis (usulan PM, lalu disetujui/diperkuat CTO lewat D1–D4)

- **K1 — Lokasi kode:** repo `stadione-v2` yang sama, route group `/juara`,
  routing host via middleware/rewrite untuk `juara.stadione.pro`. Alasan: dependency
  sudah terpasang, menghindari bootstrap project baru. Alternatif repo terpisah
  lebih bersih tapi menambah setup deploy.
- **K2 — Data (DIPERBARUI D4):** SATU Supabase project / SATU Postgres database yang
  sama dengan stadione.pro (data CTO: `https://api.stadione.pro`, ref
  `zurmq2lrm9hj510fmnj1seqr`). Tabel baru di **`schema public` yang sama** dengan
  prefix `juara_`: `juara_clubs`, `juara_playbooks`, `juara_squad_slots`,
  `juara_players`, `juara_contracts_vault`, `juara_projections`, `juara_club_members`.
  Dilarang membuat Supabase project/database/auth tenant baru, dan dilarang membuat
  schema baru (itu menyentuh *exposed schemas* = konfigurasi produksi). Semua tabel
  `juara_*` ber-`club_id` + RLS dengan kunci dari JWT/membership; `service_role` B2C
  tidak dipakai untuk akses juara. Data sensitif → ciphertext AES-256-GCM di
  aplikasi, disimpan `BYTEA`, kunci di environment. File migrasi ditulis dulu,
  **tidak** di-apply tanpa izin Owner. `juara_clubs.academy_id` nullable →
  `public.academies` sebagai hook Fase 2; tabel B2C yang ada tidak diubah.
- **K3 — Auth (DISETUJUI D2, dipertegas D4):** pakai `auth.users` yang **SAMA**
  dengan stadione.pro + tabel `juara_club_members` (`user_id → club_id → 6 peran`).
  SSO `auth.stadione.pro` tetap integration point, bukan dependensi hari pertama.
  Akses memakai anon + JWT user dengan RLS; `service_role` hanya untuk trusted
  server-side yang benar-benar perlu dan tidak pernah dicatat di log.
- **K4 — Rumus:** satu modul `src/lib/juara/formulas.ts` + test. Angka uji dari PRD:
  kapitalisasi 1,65 M / 36 bulan = Rp 45.833.333/bulan, Rp 550 jt/tahun;
  SCR contoh 59,8% = `YELLOW_WATCHLIST`; age matrix 25/25/40/10 (1 tahun) vs
  35/30/28/7 (3 tahun); ARI 85 = `ELITE_HOMEGROWN_ASSET`.
- **K5 — UI:** token PRD Bagian 6 (Alabaster #F8FAFC, Carbon Slate #0F172A,
  Emerald #064E3B, Gold #D97706; Montserrat/Plus Jakarta Sans + Inter/JetBrains
  Mono). Urutan skill: `ui-ux-pro-max` dulu, baru `frontend-design`/`ui-styling`.
- **K6 — Bahasa antarmuka:** Bahasa Indonesia, terminologi sesuai PRD.
- **K7 — PDF:** jsPDF + autotable yang sudah ada, dengan watermark kerahasiaan.

## 8. Yang diserahkan ke builder (lewat writing-plans + worker)

- Skema 6 tabel inti + RLS + seed 3 template klub (PRD Bagian 10 & Sprint 9).
- Implementasi wizard 5 langkah, engine playbook, Squad & Depth Chart, SCR monitor,
  ringkasan 6 pilar revenue, PDF exporter.
- Test otomatis rumus + RBAC + isolasi tenant.
- Verifikasi build/lint/test dengan bukti exit code sebelum klaim selesai.
- Penyerahan deploy ke Owner: tidak ada deploy/push/migrasi produksi tanpa izin.

## 9. Definition of Done untuk mandat "sampai live"

1. Design doc ini disetujui Owner.
2. Rencana kerja (`writing-plans`) dibuat dan disetujui.
3. Slice terimplementasi, `npm run build` + `npm run lint` + test rumus lulus dengan
   bukti exit code.
4. Ringkasan serah-terima masuk `docs/PM_LOG.md`.
5. Owner memberi lampu hijau + akses untuk deploy dan DNS `juara.stadione.pro`.

## 10. Yang masih butuh Owner

- Persetujuan approach B dan design doc ini.
- Persetujuan K3 (auth Supabase dulu, SSO menyusul).
- Sumber data UAT: 3 template klub dari PRD saja, atau ada data klub riil yang
  harus dipakai (menentukan apakah slice perlu jalur import data).
- Keputusan akhir deploy: target hosting/project, DNS, dan siapa yang memegang
  kredensial. PM tidak memutar, menyalin, atau menampilkan kredensial.

## 11. Hasil builder check — jawaban PM

Reviewer menanyakan 6 hal. Saya jawab di sini supaya tidak ada yang menebak.

1. **Lokasi PRD** — bukan pertanyaan lagi: salinan lengkap di
   `docs/juara/PRD-JUARA.md`. Bagian 6 (UI), 10 (skema/API), 11 (micro-tasks/DoD),
   dan Sprint 9 (3 template klub) ada di sana. Rumus dan test vector selain 4
   contoh di K4 diambil langsung dari dokumen itu (PRD Bagian 7, 8, 9).
2. **Provisioning user under K3** — keputusan PM: **invite-only**. Tidak ada
   signup publik. Owner dibuat sebagai first admin lewat seed SQL yang dijalankan
   manual (butuh izin Owner), lalu Owner mengundang anggota klub dan memilih 1 dari
   6 peran. Ini jejak audit yang paling sederhana dan cocok untuk data sensitif.
3. **Enkripsi** — keputusan PM: **enkripsi di aplikasi** dengan AES-256-GCM
   sebelum data ditulis, kolom DB menyimpan ciphertext (`BYTEA`). Alasan: pgcrypto
   tidak mendukung GCM, dan kunci di DB justru bisa dibaca admin server — melanggar
   PRD Bagian 1.3. Nilai didekripsi di memori service saat kalkulasi, tidak pernah
   dikirim ke RLS/query agregasi SQL. Kunci berada di environment deployment;
   Owner yang memegang dan tidak pernah dicetak ke log/laporan.
4. **Template vs data riil** — keputusan PM: slice berjalan pada **3 template
   terkalibrasi PRD** + input manual skuad eksisting. Jalur impor CSV/Excel
   ditunda; setiap layar wajib melabeli sumber angka ("Template PRD" vs "Input
   manual klub"). Jika Owner punya data riil untuk UAT, ini berubah → lihat §10.
5. **Hak lihat gaji/kontrak** — dijawab PRD Bagian 1.3, ditegaskan di sini:
   Owner/Investor, CEO/VP Commercial, Finance Controller = penuh; Sporting Director
   = pagu anggaran posisi saja, tanpa pajak korporat/gaji individual; Head Coach =
   tidak ada akses gaji maupun laba-rugi; Club Secretary = tanggal dan status
   dokumen kontrak saja, tanpa nominal. Ini yang diuji RBAC dan RLS.
6. **OpenAPI 3.1** — keputusan PM: tidak dibuat artefak `openapi.yaml` terpisah di
   slice ini. Kontrak API memakai Zod schema + tipe TypeScript yang sama antara
   server dan client. OpenAPI formal masuk Sprint 0 cakupan penuh v1.0. Trade-off:
   PRD menyebut constraint ini, jadi ini penundaan yang disengaja dan tercatat.
