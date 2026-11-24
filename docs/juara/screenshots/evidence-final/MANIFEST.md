# MANIFEST — Paket Bukti Final evidence validity/rollback

| Field | Isi |
|---|---|
| Checkpoint | `final-release-evidence-ready` — source SHA `12948d6`, candidate build `8SiotUGz9O90saw5m-eQt`, pinned rollback artifact `1a2655c` build `qvS-txjemv-TSPma4ib3y` (lihat `docs/juara/rehearsal-logs/entrypoint.log`) |
| Lingkungan | Local candidate `http://127.0.0.1:3105`, proxy `3104` (auth → produksi GoTrue, REST → staging PostgREST loopback `3103`), DB `juara_evclose_stage`. Batas isolasi: auth produksi, REST/DB staging; bukan seluruh stack terisolasi. |
| Capture | 24 Nov 2026 ~13:10–14:00 WIB (log HTTP `07:00 UTC` = `14:00 WIB`); viewport 1440×900, 1024×768, 768×1024 |
| Konteks | Akun QA OWNER; conflict dibuat dengan request luar yang memajukan revision; alert ditunggu sampai status `Draf di server sudah berubah` sebelum screenshot. |
| Acuan | `docs/juara/OWNER_REP_TECHNICAL_PLAN.md` §5; `docs/VISUAL_ACCEPTANCE_STANDARD.md`; audit `OWNER_REP_CLOSURE_FINAL_AUDIT.md` |
| Bukti | `conflict-1440x900.png`, `conflict-1024x768.png`, `conflict-768x1024.png` |
| Deviasi | D3 tetap parsial. `conflict-1024x768` hanya membuktikan layout; **alert berada di luar crop**. `conflict-768x1024` memperlihatkan awal alert, tetapi **aksi recovery di luar crop**. `server-loaded-390x844` dan `local-restored-390x844` dari paket sebelumnya diterima terbatas untuk status/layout; nilai 25/17 di luar crop, tidak diklaim dibuktikan gambar. |
| Pemeriksaan PM | Saya membuka `conflict-1440x900.png`: alert stabil, tombol "Muat versi terbaru" terlihat, input 17 tetap ada. 1024: form terbaca, alert di luar crop. 768: alert mulai terlihat, aksi di luar crop. Tidak diklaim semua aksi terlihat. |
| Review | **REVIEWED — PARTIAL PASS** — semua 3 PNG dibuka; desktop1440 settled conflict terlihat, 1024/768 diterima terbatas untuk layout dalam crop. Lihat `../../OWNER_REP_EVIDENCE_VALIDITY_AUDIT.md`; release gate masih CHANGES REQUIRED. |

Log asli sanitized: `docs/juara/rehearsal-logs/http-assertions.log`,
`docs/juara/rehearsal-logs/evidence-closure-runner.log`. Entry point:
`scripts/juara/final_evidence_entrypoint.sh`.
