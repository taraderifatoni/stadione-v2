# CTO Audit — Stadione / Juara

## [2026-11-23 21.0x WIB] — Audit Sprint 7 + Produksi (mandat Owner)
- Status: TERVERIFIKASI DARI REPO + HTTP + TEST LOKAL; RLS RUNTIME BELUM.
- Mandat Owner: "lanjut saja semua, kerjakan berurutan, pilihkan yang terbaik" — CTO audit read-only, tidak mengeksekusi perubahan.

### Terverifikasi
- Repo: HEAD `9428b88`, `e5e03d8` (kode) + `9428b88` (dok) ada; `main...origin/main` = 0 0 (sinkron); working tree bersih.
- Artefak: `SPRINT7_VERIFICATION.md`, `MIGRATION_APPLIED.md`, `ENCRYPTION_KEY_RUNBOOK.md` ada.
- Test: CTO jalankan `node --test tests/juara/*.test.ts` → 39 tests, 39 pass, 0 fail.
- Build: exit 0 (dari artefak verifikasi PM; CTO tidak menjalankan ulang build produksi).
- Kunci enkripsi: `.env.production` & `.env.local` ter-ignore git (`.gitignore:34 .env*`). Tidak ada nilai kunci literal di file ter-commit — yang cocok hanya placeholder/nama variabel di runbook & plan. Kunci tidak pernah dicetak.
- Deploy live (CTO curl sendiri): `/juara` 307→`/juara/login`, `/juara/login` 200, `stadione.pro` 200.
- Commit VPS `825d8db` (merge --no-ff lokal) berbeda dari lokal `9428b88` — normal, commit lokal VPS dipertahankan.

### TIDAK terverifikasi — jangan diklaim
- **UAT RLS runtime penuh**: script `juara-uat.sh` belum jalan. CTO cek SSH `root@31.97.49.146` sekali → `Connection timed out during banner exchange`, exit 255. Ini mengonfirmasi klaim PM. TIDAK ada bukti `anon = 0 baris` / `authenticated = baris klub`. Jangan tulis "RLS terverifikasi" di laporan mana pun sampai UAT benar-benar dijalankan.
- Migrasi M-00…M-08 ter-apply (8 tabel + 1 view, RLS 8/8, policy 8/8, grant service_role = 0): CTO tidak bisa query DB langsung (kredensial tidak tersedia & CTO dilarang menampilkan kredensial). Ini bersandar pada artefak PM `MIGRATION_APPLIED.md`, bukan verifikasi mandiri.
- SSO, pen-test live, kredensial notifikasi, data klub riil: butuh input eksternal. Tidak ada klaim terverifikasi.

### Putusan yang dicatat
- R18 multiplier R7 default/configurable; R19 kenaikan gaji 5/10/15% di 15/35/60 penampilan; R20 termin sponsor 50/30/20.
- Model worker: opsi C native.

### Rekomendasi CTO
- Mandat Owner terlaksana. Sprint 7 + deploy diterima secara teknis.
- Prioritas berikutnya: UAT RLS runtime begitu SSH pulih (bukan klaim, tapi eksekusi script). Jangan tandai produksi "fully verified" sebelum itu.
- SSO / pen-test / notifikasi / data klub riil tetap menunggu input Owner/vendor — minta Owner sediakan kredensial & anggaran bila mau lanjut.

## [2026-11-23 23.x WIB] — Audit UAT RLS authenticated (final)
- Status: TERVERIFIKASI — UAT RLS runtime SELESAI
- SSH pulih (`SSH_OK` — CTO cek mandiri). PM eksekusi `juara-uat.sh` via admin API/service key di VPS (nilai tidak dicetak). Handoff ACKNOWLEDGED, commit `3d00e93`.
- B1 insert user A → 201 PASS; B2/B3 user B baca → 200 `[]` PASS; B4 user B insert ke Club A → 403/42501 PASS; B5 bootstrap RPC → 200 UUID PASS. Dokumen `RLS_RUNTIME_EVIDENCE.md` bagian B lengkap & konsisten.
- CTO verifikasi mandiri pasca-UAT: GET anon ke `juara_playbooks` → HTTP 200 body `[]` (data UAT benar-benar dibersihkan, tidak ada row bocor). Commit `695d983`, repo bersih & sinkron (0 0).
- Kebersihan: `qa_token.txt` sudah hilang; `/tmp/opencode/juara-migrations.tgz` & `juara-uat.sh` masih ada (artefak non-sensitif, berguna — bukan kredensial).
- **Batas klaim dipertahankan**: "UAT RLS runtime TERVERIFIKASI" (anon + authenticated). Produksi **BELUM** "fully verified" — SSO, pen-test, kredensial notifikasi, data klub riil masih tertunda (input eksternal). PM benar tidak mengklaim lebih.
- Rekomendasi: tutup item UAT RLS sebagai selesai. Sisa 4 item eksternal menunggu Owner/vendor.

## [2026-11-24 08.x WIB] — Audit Sprint 9 UI & alur pakai (keluhan UI 1/10)
- Status: TERVERIFIKASI TEKNIS; PENGALAMAN PAKAI但 bersandar pada E2E PM (CTO tidak bisa melihat gambar).
- Owner nilai UI 1/10 & aplikasi "tidak berfungsi". PM akui verifikasi lama berhenti di test/build/HTTP — pengakuan jujur, bagus. Prioritas tunggal: JUARA bisa dipakai manusia.
- Repo: commit `baae533` (UI rebuild + register + wizard) & `ab5c181` (dok) ada; `main...origin/main` 0 0 sinkron; working tree bersih. Deploy VPS `8addba9`, service active.
- Verifikasi CTO: `node --test tests/juara/*.test.ts` → 40 pass / 0 fail. Build & ESLint exit 0 (dari artefak PM). Artefak `SPRINT9_UI_VERIFICATION.md` lengkap.
- Produksi (CTO curl sendiri): `/juara` 307, `/juara/login` 200, `/juara/signup` 200, `stadione.pro` 200.
- Register HTTP 201 + migrasi M-09 `juara_create_owner_club` (service_role only) — bersandar pada artefak PM; CTO tidak menguji tulis ke DB produksi.
- E2E agent-browser: login → dashboard (nama klub nyata) → wizard 5 langkah → generate → simpan → arsip `CHAMPION 1Y`. Ini DATA E2E PM. CTO tidak bisa melihat screenshot (`/tmp/opencode/{login,dashboard,playbooks}.png`) — Owner harus nilai visual sendiri apakah sudah layak.
- **TEMUAN KEAMANAN**: kredensial demo benar-benar tampil di HTML produksi `/juara/login` (CTO curl + grep, nilai tidak dicetak di log ini). PM transparan soal ini di dokumen, tapi tetap risiko: akun demo dengan kata sandi known-public di endpoint publik. Rekomendasi: (1) hapus demo account sebelum rilis umum, (2) sembunyikan kredensial dari halaman login produksi — tampilkan hanya di internal docs atau di balik beta flag. Butuh keputusan Owner.
- Screenshot masih di `/tmp` (tmpfs, volatil) — minta PM salin ke `storage/` persisten seperti inspirasi.
- Batas klaim dipertahankan: UI & alur utama terverifikasi lewat E2E PM; SSO, pen-test, notifikasi, data riil tetap eksternal. Responsivitas 320/768/1024/1440 baru lewat CSS, belum di-screenshot.
