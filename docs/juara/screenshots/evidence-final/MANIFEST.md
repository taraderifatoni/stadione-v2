# MANIFEST — Paket Bukti Final evidence validity/rollback

| Field | Isi |
|---|---|
| Checkpoint | `evidence-validity-ready` — commit SHA tercatat di `docs/juara/rehearsal-logs/http-assertions.log` (`candidate_sha=`) |
| Lingkungan | Local candidate `http://127.0.0.1:3105`, proxy `3104` (auth → produksi GoTrue, REST → staging PostgREST loopback `3103`), DB `juara_evclose_stage`. Batas isolasi: auth produksi, REST/DB staging; bukan seluruh stack terisolasi. |
| Capture | 24 Nov 2026 ~06:10–06:20 WIB; viewport 1440×900, 1024×768, 768×1024 |
| Konteks | Akun QA OWNER; conflict dibuat dengan request luar yang memajukan revision; alert ditunggu sampai status `Draf di server sudah berubah` sebelum screenshot. |
| Acuan | `docs/juara/OWNER_REP_TECHNICAL_PLAN.md` §5; `docs/VISUAL_ACCEPTANCE_STANDARD.md`; audit `OWNER_REP_CLOSURE_FINAL_AUDIT.md` |
| Bukti | `conflict-1440x900.png`, `conflict-1024x768.png`, `conflict-768x1024.png` |
| Deviasi | D3 tetap parsial (inspector/action bar belum ada). `server-loaded-390x844` dan `local-restored-390x844` dari paket sebelumnya diterima terbatas untuk status/layout; nilai 25/17 berada di luar crop sehingga **tidak diklaim dibuktikan oleh gambar tersebut** — nilai diverifikasi melalui snapshot aksesibilitas di log PM. Paket ini tidak mengulang mobile yang sudah diterima. |
| Pemeriksaan PM | Saya membuka `conflict-1440x900.png`: alert konflik sudah stabil, bukan "Menyimpan draf", tombol "Muat versi terbaru" terlihat, input bintang 17 tetap ada. Regression 1024/768 menampilkan alert yang sama tanpa overflow. |
| Review | **PENDING** — Owner Representative wajib membuka gambar. |

Log asli sanitized: `docs/juara/rehearsal-logs/http-assertions.log`,
`docs/juara/rehearsal-logs/evidence-closure-runner.log`. Entry point:
`scripts/juara/final_evidence_entrypoint.sh`.
