# MANIFEST — Paket Bukti Visual HTTP CAS Staging

| Field | Isi |
|---|---|
| Checkpoint | `finance-cas-http` — commit `40db6a6` |
| Lingkungan | **Local candidate + backend staging terisolasi**: Next `http://127.0.0.1:3100`, proxy `3102` (auth → produksi, REST → PostgREST staging `3101`), DB `juara_http_stage` dengan M-00…M-13 → M-15 → M-14 → M-16. Browser agent-browser v0.33.1 / Chrome 151, zoom 100%. |
| Capture | 24 Nov 2026 ~11:55–12:03 WIB, viewport 1440×900 |
| Konteks | Role OWNER (akun QA demo) dan SD (akun uat sintetis). Dataset sintetis; klub "Stage Club". State: save draf sukses, reload draf, tab kedua yang menyimpan setelah perubahan revision. |
| Acuan | `docs/juara/OWNER_REP_TECHNICAL_PLAN.md` §5; `docs/juara/design/boardroom-prototype.html`; `docs/VISUAL_ACCEPTANCE_STANDARD.md` |
| Bukti | `owner-save-success-1440x900.png` (status "Draf tersimpan"), `owner-reload-1440x900.png` (nilai termuat), `second-tab-save-1440x900.png` (tab kedua; **bukan** bukti conflict UI) |
| Deviasi | Screenshot conflict UI **tidak berhasil diambil** — tab kedua menyimpan sukses karena revision sudah dimuat ulang. Bukti konflik memakai HTTP stale-write (revision tidak berubah) dan runner SQL paralel 1 sukses/1 `REVISION_CONFLICT` di `docs/juara/rehearsal-logs/http-cas.log`. D3 tetap parsial: inspector/action bar belum ada; dashboard masih kartu lama. |
| Pemeriksaan PM | Save sukses menampilkan "Draf tersimpan"; reload menampilkan nilai 33/45/22 dan draf termuat. Tidak ada perubahan produksi. |
| Review | **PENDING** — Owner Representative wajib membuka gambar. Belum `VISUALLY ACCEPTED`. |

Catatan: paket ini membuktikan perilaku backend baru pada staging terisolasi, bukan produksi.
Tidak ada M-14/M-16 yang di-apply ke DB produksi dan tidak ada deploy UI.
