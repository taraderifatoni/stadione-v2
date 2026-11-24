# MANIFEST — Paket Bukti Conflict Recovery

| Field | Isi |
|---|---|
| Checkpoint | `evidence-closure-ready` — commit `49091e4`; schema `2026-11-24 / M-16 (revision CAS, P0001 conflict)` |
| Lingkungan | Local candidate `http://127.0.0.1:3105`, proxy `3104` (auth produksi, REST staging loopback `3103`), DB `juara_evclose_stage`, PostgREST role unik `pgrst_evclose`, browser agent-browser v0.33.1 / Chrome 151, zoom 100% |
| Capture | 24 Nov 2026 ~12:20–12:35 WIB; viewport sesuai nama file |
| Konteks | Role OWNER akun QA demo; dataset sintetis "Stage Club". State: tab memegang revision R dengan input lokal 18 (desktop) / 17 (390px); tab lain menyimpan lebih dulu; tab pertama klik Simpan tanpa reload; lalu recovery. |
| Acuan | `docs/juara/OWNER_REP_TECHNICAL_PLAN.md` §5; `docs/juara/design/boardroom-prototype.html`; `docs/VISUAL_ACCEPTANCE_STANDARD.md`; audit `OWNER_REP_FINANCE_HTTP_AUDIT.md` |
| Bukti | `conflict-1440x900.png`, `conflict-390x844.png`, `recovery-1440x900.png`, `recovery-390x844.png` |
| Deviasi | Inspector 360–440px dan action bar 52px masih belum ada; isi dashboard masih kartu lama — D3 tetap parsial. HTTP paralel eksplisit 200/409 tidak diperoleh karena request PostgREST timeout; bukti CAS paralel berasal dari runner SQL, dan conflict UI deterministik dari dua tab + stale save. |
| Pemeriksaan PM | Saya membuka `conflict-1440x900.png`: pesan "Draf di server sudah berubah. Input Anda di layar tidak hilang", tombol "Muat versi terbaru", input 18 masih ada; DB tetap revision 6 / star 25. `recovery-1440x900.png`: status "Versi terbaru dimuat. Edit lokal Anda masih tersimpan", input 18 tetap ada. Tidak ada overflow 390×844. |
| Review | **PENDING** — Owner Representative wajib membuka gambar. Belum `VISUALLY ACCEPTED`. |

Catatan: runner dan log sanitized berada di `docs/juara/rehearsal-logs/evidence-closure-runner.log`.
Tidak ada deploy UI atau perubahan DB produksi; M-14/M-16 hanya di staging.
