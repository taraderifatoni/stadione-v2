# MANIFEST — Paket Bukti Visual P1 Fixes (pradeploy)

| Field | Isi |
|---|---|
| Checkpoint | `commit-p1-fixes` — commit perbaikan `d1e9efb`; build aplikasi yang difoto: produksi `6425ae5` |
| Lingkungan | Production `https://juara.stadione.pro`, Supabase `api.stadione.pro`, browser agent-browser v0.33.1 (Chrome for Testing 151) |
| Capture | 24 Nov 2026 ~10:45–10:47 WIB; zoom 100%; viewport sesuai nama file |
| Konteks | Akun demo `demo@juara.stadione.pro` (bukan data klub riil); klub "Klub Demo JUARA"; draf sintetis; state: dashboard, validasi 95%, auto-balance 100%, simpan draf, reload draf |
| Acuan | `docs/juara/OWNER_REP_TECHNICAL_PLAN.md` §5, `docs/juara/design/boardroom-prototype.html`, `docs/VISUAL_ACCEPTANCE_STANDARD.md` |
| Bukti | `dashboard-1440x900.png`, `dashboard-1024x768.png`, `dashboard-768x1024.png`, `dashboard-390x844.png`, `vision-validation-90.png`, `vision-balanced-100.png`, `vision-saved.png`, `vision-reloaded.png` |
| Deviasi | Shell baru hanya 4 dari 5 zona: sidebar, header 56px, tab konteks 40px, canvas — **inspector 360–440px dan action bar 52px belum ada**. Isi `/juara` masih kartu ringkasan lama, belum meja keputusan/density FM prototipe. Panel kanan wizard masih "Catatan" statis, bukan Live Summary Card. Tidak ada rute kosong baru. |
| Pemeriksaan PM | Saya membuka `vision-validation-90.png`: pesan "Total masih 95%. Sisa 5% belum dialokasikan." dan status live "Total 95% — kurang 5%" tampil. `vision-reloaded.png`: nilai 10/45/45 kembali setelah reload dengan status "Draf dimuat". Tidak ada clipping pada 390×844; bottom nav terlihat. |
| Review | **PENDING** — Owner Representative wajib membuka gambar aktual dan menilai. Belum `VISUALLY ACCEPTED`. |

Catatan: commit `d1e9efb` mengubah backend/security (DTO allowlist, policy, MIME, invite),
bukan markup/CSS. Screenshot dari `6425ae5` sah untuk tampilan yang sama; bukti fungsi
perubahan backend ada di `docs/juara/P1_FIXES_EVIDENCE.md`.
