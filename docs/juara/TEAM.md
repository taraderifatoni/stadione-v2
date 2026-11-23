# Tim JUARA.STADIONE.PRO — Sprint 0

Rantai komando: **Owner → CTO (`ses_dff75dd2effeCFUgcR7oA66Mu8`) → PM (`ses_dfd621110ffeVnw419vDE4qR43`) → worker**.
Semua worker dibuat via `opencode run --session <id> --title "<Divisi> — Stadione" --agent general --model opencode-go/hy4-flash-free#high --standalone`, lalu `parent_id` diverifikasi ke sesi PM. Dibuat 22.11.2026.

| # | Divisi (PRD 3.2) | Session ID | Status Sprint 0 | Artefak |
|---|---|---|---|---|
| 1 | Sports Domain, Data Science & Football Finance (The Brain) | `ses_juara_div1_domain` | SELESAI — terverifikasi PM (koreksi R9) | `RULEBOOK.md` |
| 2 | Product UI/UX & Data Visualization | `ses_juara_div2_uiux` | SELESAI — terverifikasi PM | `UIUX_SPEC.md` |
| 3 | Core Platform, Playbook Engine & Squad Architecture | `ses_juara_div3_core` | SELESAI — terverifikasi PM (R10/R11) | `ARCHITECTURE.md` |
| 4 | Club Finance, Commercial & Operations | `ses_juara_div4_finance` | SELESAI — terverifikasi PM | `FINANCE_SPEC.md` |
| 5 | Academy Pathway, Scouting & Integration Hub | `ses_juara_div5_academy` | SELESAI — terverifikasi PM (R12) | `ACADEMY_INTEGRATION_SPEC.md` |
| 6 | DevOps, Security & Quality Assurance (The Shield) | `ses_juara_div6_devops` | SELESAI — v1 terverifikasi PM | `SECURITY_QA_PLAN.md` v1 |

## Urutan penugasan Sprint 0 — D5: paralel per dependency

Lihat `DECISIONS.md` D5. Satu fokus per worker, beberapa worker aktif bersamaan.

1. **Gelombang 1 (berjalan):** Divisi 1 `RULEBOOK.md`; Divisi 2 `UIUX_SPEC.md`;
   Divisi 6 `SECURITY_QA_PLAN.md` v0.
2. **Gate = `RULEBOOK.md` terverifikasi PM:** Divisi 3 `ARCHITECTURE.md`; Divisi 4
   `FINANCE_SPEC.md` (kerangka boleh mulai setelah rulebook, tandai bagian yang
   menunggu arsitektur).
3. **Gate = `ARCHITECTURE.md` ada:** Divisi 5 `ACADEMY_INTEGRATION_SPEC.md`.
4. **Terakhir:** Divisi 6 revisi QA v0 → v1 (audit semua artefak).

Catatan: Divisi 2 tidak bergantung rulebook; Divisi 6 v0 tidak menunggu artefak lain.

## Brief & bukti

- Brief persisten: `docs/juara/briefs/brief-div*.txt`
- Salinan kerja: `/tmp/opencode/brief-{domain,uiux,core,finance,academy,devops}.txt` (tmpfs, bukan source of truth)
- Transkrip standby: `/tmp/opencode/standby-*.json`
- Keputusan yang mengikat: `docs/juara/DECISIONS.md` (D1–D3, CTO atas delegasi Owner)

## Aturan untuk semua worker

- Satu fokus, satu artefak di `docs/juara/`.
- Read-only terhadap kode produk; dilarang deploy/DNS/SSL/push/migrasi/kredensial.
- `graphify` sebelum baca source; `ui-ux-pro-max` sebelum `frontend-design`; `verify` sebelum klaim selesai.
- Lapor: `Laporan <Topik> / Konteks: ... / - bullet`.

## Pembaruan 23.11.2026 — keputusan model worker

Owner memberi mandat "pilihkan yang terbaik". PM memilih **opsi C: lanjut native**
untuk semua pekerjaan JUARA sampai ada keputusan biaya berbayar. Alasan: kuota free
Divisi 6 habis, model berbayar membutuhkan persetujuan pengeluaran, dan pekerjaan
berikutnya bersifat berurutan serta bergantung pada konteks produksi yang sudah ada
di sesi PM. Enam worker tetap sehat di DB dan tidak dihapus; tidak ada tugas baru
yang dikirim sebelum ada model/provider baru yang disetujui Owner.
