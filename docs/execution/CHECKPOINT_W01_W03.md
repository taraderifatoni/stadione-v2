# Checkpoint — kapasitas + hasil W01/W02/W03 (24 Nov 2026)

Status: **NEW COMPLETED CHECKPOINT** (bukan ACK, bukan self-trigger).
Mandat: `FEATURE_TEAM_MASTER_EXECUTION.md`. Tidak ada deploy, migrasi produksi, transaksi riil,
provider berbayar, atau reorganisasi permanen.

## 1. Kapasitas terukur (bukan klaim 8 parallel)

- Probe bounded nonpaid 6/6 sesi: `rc=1`, pesan `Free usage limit reached` (08.37–08.38 WIB
  sebelumnya; probe ulang sesi ini 14:3x WIB menghasilkan hal sama).
- **Runnable workers = 0 terbukti dari probe terbaru.** PM native = 1 slot aktif; CTO plausibel,
  tidak dihitung implementer. Historical concurrency 3 ≠ kapasitas sekarang.
- Semua sesi `cost = 0.0` historis; tidak ada provider/model berbayar diaktifkan.
- Konsekuensi: W01 → W02 → W03 dikerjakan **serial oleh PM**, bukan paralel.

## 2. Hasil packets

| Packet | Owner aktual | Branch / commit | Hasil | Status |
|---|---|---|---|---|
| W00 | PM | main | board + 3 worktree terpisah + migration register | AcceptedStaging |
| W01 payment safety | PM interim (S3) | `feat/pod/S3/W01-payment-safety` `f1a15d0` | HMAC verifikasi sebelum mutasi, replay store, scope invoice, amount server-side + status `pending`, refund fail-closed; 80/80 test | **Review** |
| W02 release hygiene | PM interim (P1) | `feat/pod/P1/W02-release-hygiene` `f30ac70` | env 0600 guard, cleanup trap, malformed regression eksplisit, pin artifact, runbook; 79/79 test, runner exit 0 | **Review** |
| W03 premium D3 | PM interim (J1) | `feat/pod/J1/W03-premium-d3` `5207fb5`, `7d17acd` | preview sintetis berjalan + 10 screenshot 4 viewport; PM buka semua gambar; 2 defect diperbaiki | **Review** |

Bukti: `docs/execution/ACTIVE_BOARD.csv`, `W02_EVIDENCE.md`, `W03_EVIDENCE.md`,
`docs/juara/screenshots/w03-premium-d3/MANIFEST.md`.

## 3. Temuan dan perbaikan nyata

- **W01**: `validateDokuNotification` tidak pernah dipanggil → kini verifikasi HMAC/header/timestamp
  sebelum mutasi; callback POS loop tanpa filter → kini terikat `reference_id` + tenant; amount dari
  body → kini diturunkan dari `bookings.final_price` / `membership_plans.price`; refund fail-open →
  kini 502 tanpa perubahan status bila provider gagal. Hash source lokal = VPS saat triage.
- **W02**: CLI runner membocorkan env? Tidak — guard hanya mencetak `{ok, mode}`. `set -euo pipefail`
  tanpa `|| true` pada test; temp dibersihkan (bukti: tidak ada `/tmp/w02-release.*`).
- **W03 PM image review**: capture pertama gagal hidrasi (Next dev blokir `127.0.0.1`) dan canvas
  hitam karena theme global gelap; keduanya diperbaiki, capture ulang via `localhost`, fiber React
  terverifikasi. `--ju-accent-dark` hijau → cobalt `#2C46B4`.

## 4. Blocker / batas

- 0 worker runnable → tidak ada parallel lane; S1/S3 new primary belum tersedia.
- Reviewer J2/P1 unavailable → W01/W02/W03 menunggu OwnerRep. **Tidak self-accept.**
- Payment blocker masih **aktif di produksi** sampai perbaikan di branch ini di-review dan dilepas
  lewat gate. Tidak ada containment Gateway yang dijalankan tanpa keputusan Owner.
- D3 tetap **provisional**; tidak di-deploy; palet lama hijau/emas ditolak Owner.
- Database produksi: M-14/M-16 belum ter-apply, policy 7 tabel masih `ALL`, CAS `vision_revision`
  belum ada di `juara_clubs` (bukan `juara_playbooks`).
- R2/R3 (external licence/data/biaya, SSO, data anak) tetap tercatat, tidak disembunyikan untuk
  menaikkan angka 100%. Progres = criteria diterima / total release criteria, bukan 86 group count.

## 5. Langkah berikutnya (otomatis setelah reviewer menerima)

- Merge branch W01/W02/W03 satu per satu (serial), lalu W04 J2 release candidate.
- Siapkan containment payment + staging smoke sebelum release gate; deploy produksi **hanya**
  setelah reviewer acceptance + backup/restore + atomic migration + cutover plan.
- Jika kuota worker pulih, aktifkan maksimal 3 lane dengan path terpisah; jangan janji 8 parallel.
