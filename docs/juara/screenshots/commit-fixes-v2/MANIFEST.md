# MANIFEST — Paket Bukti Visual Commit Fixes v2

| Field | Isi |
|---|---|
| Checkpoint | `commit-fixes-v2` — commit stabil `2db2473`; build kandidat `npm run build` exit 0 pada commit yang sama (perubahan setelah capture hanya dokumentasi/manifest, bukan UI) |
| Lingkungan | **Local candidate** `http://127.0.0.1:3100` (`next start`, port 3100), Supabase `https://api.stadione.pro`, browser agent-browser v0.33.1 / Chrome for Testing 151, zoom 100% |
| Capture | 24 Nov 2026 ~11:18–11:25 WIB; viewport sesuai nama file; state loading dan loaded terpisah |
| Konteks | Role OWNER via akun QA `demo@juara.stadione.pro`; klub "Klub Demo JUARA" (data demo, bukan klub riil). Dataset: 2 playbook contoh; draf sintetis 10/45/45. Langkah: login → dashboard → Owner Vision langkah 4 → ubah bintang jadi 10 → Lanjut (validasi) → Isi sisa ke akademi → Simpan draf → reload. |
| Acuan | `docs/juara/OWNER_REP_TECHNICAL_PLAN.md` §5; `docs/juara/design/boardroom-prototype.html`; `docs/VISUAL_ACCEPTANCE_STANDARD.md` |
| Bukti | `dashboard-loading-1440x900.png` (sebelum data selesai), `dashboard-1440x900.png`, `dashboard-1024x768.png`, `dashboard-768x1024.png`, `dashboard-390x844.png` (loaded), `vision-validation-1440x900.png`, `vision-balanced-1440x900.png`, `vision-saved-1440x900.png`, `vision-reloaded-1440x900.png` |
| Deviasi | Shell baru baru 4/5 zona: inspector 360–440px dan action bar 52px belum ada. Isi `/juara` masih kartu ringkasan + tabel playbook, bukan meja keputusan berdensity FM dari prototipe. Panel kanan wizard masih "Catatan", bukan Live Summary Card. Tidak ada rute kosong baru. |
| Pemeriksaan PM | Saya membuka `dashboard-1440x900.png`: data loaded ("Selamat datang, Klub Demo JUARA", Liga 2, 2 playbook), bukan "Memuat ringkasan"/"Belum ada klub". `vision-validation-1440x900.png` menampilkan total 95% + pesan sisa 5%; `vision-reloaded-1440x900.png` menampilkan 10/45/45 setelah reload. Loading state disimpan terpisah. Tidak ada clipping 390×844. |
| Review | **PENDING** — Owner Representative wajib membuka gambar aktual. Belum `VISUALLY ACCEPTED`. |

Catatan: build kandidat memakai env produksi untuk Supabase dan kunci enkripsi yang sama,
tetapi berjalan lokal sebelum deploy UI. M-15 sudah ter-apply di DB produksi agar RPC
draft dapat diuji; **M-14 masih staging-only**, deploy UI belum dilakukan.
