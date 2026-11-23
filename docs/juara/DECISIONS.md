# Decision Log — JUARA.STADIONE.PRO

Semua entri di bawah adalah **KEPUTUSAN CTO atas delegasi Owner**, bukan keputusan PM,
dan **bukan izin deploy/DNS/SSL/kredensial**. Sumber: pesan CTO TDCorp • Stadione
ke PM, 22.11.2026, sesi `ses_dff75dd2effeCFUgcR7oA66Mu8`.

---

## D1 — Pendekatan B disetujui

- **Keputusan:** vertical slice end-to-end + design doc disetujui.
- **Alasan CTO:** domain sarat rumus (SCR, IAS 38, kuota umur CIES, 6 pilar revenue);
  slice membuktikan engine end-to-end sebelum diduplikasi ke 6 divisi.
- **Urutan slice yang ditetapkan:** Master Formula Rulebook → age/grade engine →
  SCR + amortisasi → satu PDF export.
- **Batas:** jangan membangun 9 modul UI sekaligus.
- **Status:** berlaku. Tidak membuka izin deploy.

## D2 — K3 disetujui dengan gate keras

- **Keputusan:** Supabase Auth + RBAC 6 peran dipakai dulu; SSO `auth.stadione.pro`
  menyusul.
- **Alasan CTO:** SSO menyentuh DNS, sertifikat, dan kredensial — masih butuh lampu
  hijau Owner terpisah.
- **Gate keras (tidak bisa ditawar):**
  1. Isolasi `club_id` via Row-Level Security **harus lolos uji cross-tenant**.
  2. Enkripsi **AES-256-GCM di lapisan aplikasi** sebelum `BYTEA` **harus terbukti**
     tidak bisa dibaca admin DB. pgcrypto/GCM di DB tidak memenuhi PRD.
- **Waktu uji:** **Sprint 1**, bukan ditunda ke Sprint 9.
- **Status:** berlaku. Tidak membuka izin deploy/DNS/SSL.

## D3 — UAT: 3 template PRD + adapter import sejak sekarang

- **Keputusan:** pakai 3 template terkalibrasi PRD (1 thn Liga 2; turnaround 3 thn
  Liga 1; model akademi/inkubator) sebagai data uji. Schema dan validator menyiapkan
  jalur import terenkripsi (PRD Sprint 8) sejak sekarang supaya data riil masuk tanpa
  reshape.
- **Alasan CTO:** data klub riil memuat gaji, kontrak, dan PPh 21 — sensitif, butuh
  persetujuan dan lingkungan aman; menunggunya memblokir Sprint 0–8.
- **Gate peluncuran:** data klub riil (dianonimkan/disetujui) = gate sebelum peluncuran
  produksi v1.0, bukan sekarang. Owner akan diminta menyediakan menjelang Sprint 9.
- **Status:** berlaku untuk Sprint 0–8. Tidak membuka izin pakai data riil sekarang.

---

## D4 — Juara adalah BAGIAN dari stadione.pro, bukan sistem terpisah

- **Keputusan:** lanjut pada database, repo, dan identitas yang SAMA dengan
  stadione.pro. **Ini bukan izin deploy/migrasi.**
- **Sumber:** CTO TDCorp • Stadione, 22.11.2026, atas penegasan Owner; sesi
  `ses_dff75dd2effeCFUgcR7oA66Mu8`. D1–D3 tidak diubah.
- **Fakta folder yang diverifikasi CTO:** lokal WSL yang benar
  `/home/taradfs/stadione-v2` (HEAD `02df393`, sama dengan `origin/main`);
  `/home/taradfs/stadione` (Vite/SPA, remote `taracorp/stadione`) bukan yang live
  dan dilarang dipakai. Live: VPS `31.97.49.146`, source `/opt/stadione` (HEAD
  `ea5b162`, **ahead 1** dari origin/main — commit live belum ter-push), proses
  aktif `/opt/stadione-releases/807f6ff` port 3011. `stadione.pro`, `www`, `admin`,
  `pos` aktif; **`juara.stadione.pro` belum ada DNS**.
- **Aturan arsitektur (mengikat):**
  1. Satu repo, satu Supabase project, satu Postgres database. Pakai project live
     (`https://api.stadione.pro`, ref `zurmq2lrm9hj510fmnj1seqr`). **Dilarang** project
     Supabase baru, database baru, atau auth tenant baru.
  2. Kode tetap route group `/juara` di repo `stadione-v2`; host routing via middleware.
  3. Tabel baru di **`schema public` yang sama**, prefix `juara_`:
     `juara_clubs`, `juara_playbooks`, `juara_squad_slots`, `juara_players`,
     `juara_contracts_vault`, `juara_projections`. Alasan prefix, bukan schema baru:
     schema tambahan butuh ubah *exposed schemas* di Supabase = konfigurasi produksi.
  4. Identitas: `auth.users` yang SAMA + tabel `juara_club_members`
     (`user_id → club_id → 6 peran`). SSO `auth.stadione.pro` tetap integration point
     (D2 berlaku).
  5. Isolasi: RLS `club_id` di semua tabel `juara_*`, kunci dari jwt/membership.
     `service_role` B2C tidak dipakai untuk akses juara; hanya trusted server-side
     bila benar-benar perlu, tidak pernah dicatat di log.
  6. Data sensitif (gaji, signing fee, buy-out, nilai sponsor): ciphertext
     **AES-256-GCM di aplikasi** → `BYTEA`, kunci di environment (gate keras D2).
  7. Jembatan ekosistem: `juara_clubs.academy_id` nullable → `public.academies`
     (tabel sudah ada di live) sebagai hook Fase 2. Tabel B2C yang ada tidak diubah.
  8. Database live belum punya tabel `clubs` — wajar; kita menambahkan `juara_clubs`.
     Ini bukan alasan membuat database baru.
- **Status:** berlaku untuk desain dan Sprint 0. Tidak mencakup DNS/SSL/deploy.

---

## D5 — Paralelisasi Sprint 0 (koreksi CTO atas delegasi Owner)

- **Keputusan:** **satu fokus per percakapan worker**, dan **beberapa worker aktif
  bersamaan** menurut dependency. BUKAN "hanya satu worker aktif".
- **Sumber:** koreksi CTO TDCorp • Stadione, 22.11.2026, atas penegasan Owner.
  Arahan CTO sebelumnya ("bagi tugas satu per satu") dimaksudkan sebagai satu fokus
  per worker, bukan eksekusi serial. D1–D4 tidak diubah. Ini **bukan** izin deploy.
- **Alasan:** Owner minta kecepatan; pendekatan B (vertical slice) justru mendukung
  paralelisasi selama ada *integration gate* dan verifikasi PM tiap artefak.
- **Aturan yang tidak berubah:** tiap worker satu fokus; wajib `verify` sebelum
  klaim selesai; lapor `Laporan <Topik> / Konteks: ... / - bullet`; artefak di
  `docs/juara/`; PM membaca file dan menghitung ulang angka kunci sebelum menerima.
- **Gelombang eksekusi:**
  1. Paralel sekarang: Divisi 1 `RULEBOOK.md`, Divisi 2 `UIUX_SPEC.md`,
     Divisi 6 `SECURITY_QA_PLAN.md` **v0**.
  2. Gate = `RULEBOOK.md` selesai + terverifikasi PM: Divisi 3 `ARCHITECTURE.md`,
     Divisi 4 `FINANCE_SPEC.md` (boleh mulai kerangka setelah rulebook, tandai bagian
     yang menunggu arsitektur).
  3. Gate = `ARCHITECTURE.md` ada: Divisi 5 `ACADEMY_INTEGRATION_SPEC.md`.
  4. Terakhir: Divisi 6 revisi QA v0 → **v1** sebagai audit semua artefak.
- **Larangan tetap:** migrasi/apply DB, deploy, DNS, SSL, push, restart container,
  kredensial, data klub riil, perubahan kode produksi.

---

## Masih butuh lampu hijau Owner (tidak termasuk keputusan di atas)

- Deploy ke produksi `juara.stadione.pro`
- DNS dan sertifikat SSL
- Kredensial / rotasi kredensial
- Penggunaan data klub riil
- Perubahan kode produksi di luar izin yang diberikan terpisah
