# Assessment Dual-Product 8 Pod — JUARA utama + Stadione

Tanggal: 24 Nov 2026. Status: **REKOMENDASI / PROPOSAL ONLY**. Tidak ada reorganisasi permanen,
rename, reassignment actif, deploy, migrasi, penghapusan data, transaksi riil, atau biaya baru.
Menggantikan mapping A–F; mengikuti `DUAL_PRODUCT_TEAM_PROPOSAL.md` dan `ACADEMY_INTEGRATION_PLAN.md`.

## 1. Pemetaan 86 feature ID — tepat satu owner

Sumber: `MASTER_FEATURE_INVENTORY.csv` (86 ID) dipetakan di `DUAL_POD_OWNERSHIP_MAP.csv`
(86 baris + header). Validasi: 86/86 terpetakan, 0 missing, 0 duplikat.

| Pod | Jumlah ID | Accountable owner (proposed) | Deputy (proposed) | Gap kapabilitas |
|---|---:|---|---|---|
| J1 Club Workspace & Governance | 8 | `ses_juara_div2_uiux` | `ses_juara_div6_devops` (identity primitives) | UI/spec proven; approve/invite/RLS negative tests belum |
| J2 Vision & Playbook | 8 | `ses_juara_div3_core` | `ses_juara_div2_uiux` (visual/export) | versioning/export + premium visual acceptance pending |
| J3 Sporting & Player Pathway | 10 | `ses_juara_div1_domain` | `ses_juara_div5_academy` (source contract), PM interim | rulebook proven; squad import/minutes/academy link belum |
| J4 Club Finance & Commercial | 6 | `ses_juara_div4_finance` | `ses_juara_div1_domain` (formula review) | finance spec proven; engine implementation belum |
| S1 Venue Booking & Membership | 19 | **NEW PRIMARY REQUIRED** | `ses_juara_div2_uiux` + PM interim | tidak ada owner eksisting; concurrency/pricing full-stack unproven |
| S2 Academy Operations | 7 | `ses_juara_div5_academy` | `ses_juara_div1_domain` (JUARA consumer) + P1 privacy | enrollment/report PDF/minor privacy gap; source tetap Stadione |
| S3 Payments & POS | 10 | **NEW PRIMARY REQUIRED** | `ses_juara_div4_finance` + independent security review | HMAC/idempotency/payment state machine gap; blocker aktif |
| P1 Identity & Platform | 18 | `ses_juara_div6_devops` | PM interim; overload risk | IAM/CI/observability implementation unproven |

`ownership_activation` semua 86 = `Proposed; PM interim pending Owner approval`.
PM tetap koordinator portofolio; CTO audit read-only; Owner manusia menyetujui struktur/biaya.

## 2. Kapasitas & pilihan provider (tanpa aktivasi berbayar)

- Enam worker ada di DB, last-known `429 provider.free-limit` 08.37–08.38 WIB; **tidak ada
  fresh probe**, jadi 0 *proven runnable* ≠ kepastian kuota masih habis.
- PM terbukti aktif; CTO plausibel tapi tidak dihitung implementer guaranteed.
- Historical max concurrency tiga worker; bukan kapasitas saat ini.
- `cost = 0.0` adalah angka historis, bukan jaminan biaya masa depan.
- Opsi tanpa biaya baru: (a) tunggu reset kuota gratis (estimasi lama ±25.11 07.00 WIB,
  perlu probe bila diizinkan), (b) PM native serial satu slice, (c) CTO review read-only.
- Opsi **berbayar tidak diaktifkan**: tambah primary session / provider apa pun menunggu
  lampu hijau Owner. Tidak ada janji 8 parallel agents.

## 3. Pilot tiga lane (hanya bila worker benar-benar runnable)

| Lane | Pod | Alasan | Kondisi |
|---|---|---|---|
| 1 | J1 | premium UI JUARA, palet masih provisional | butuh visual review, bukan deploy |
| 2 | J2 | release readiness draft/CAS + versioning | acceptance staging sudah, produksi belum |
| 3 | S3 | payment blocker | prioritas naik bila security exposure terkonfirmasi |

Jika hanya PM aktif, semua lane dijalankan **serial** oleh PM. J3/J4/S2/S1 tetap kontrak/backlog,
tidak dilaporkan sebagai delivery aktif. Worktree/branch terpisah per feature ID; kontrak DTO
dan fixture disepakati sebelum coding paralel; migrasi serial.

## 4. Academy Stadione ↔ JUARA (pertahankan, integrasikan)

Keputusan rekomendasi: **Academy Stadione tidak dihapus**. Stadione melayani akademi
multi-olahrasa independen; JUARA football-specific mengonsumsi subset relevan.

| Tanggung jawab | Owner |
|---|---|
| Enrollment/kelas/jadwal/absensi/coach/raport operasional, izin orang tua | **S2** (sumber tunggal) |
| Player pathway, IDP, mentor, alokasi menit, promosi, club-scoped athlete link | **J3** (accountable integrated journey) |
| Kontrak/gaji/valuasi/proyeksi biaya klub | **J4** (private; role-limited DTO ke J3) |
| Identity/acakun canonical ID, auth transport | **P1** |
| Tagihan/pembayaran akademi | **S3** money ledger; S2 hanya referensi enrollment |

Prinsip: satu input source di Stadione; JUARA read model ber-provenance (`lastSyncedAt`,
`sourceVersion`, `grantId`) dengan club-scoped assessment sendiri. Relasi athlete↔academy↔club
many-to-many berperiode; tidak join otomatis memakai nama/email. Klub non-Stadione boleh
manual/import dengan label sumber dan dedup preview. Connector optional, bukan syarat.

Tahap (belum implementasi): 0 assessment schema/permission/data quality tanpa data anak riil;
1 contract + synthetic fixtures `AcademyStudent/AttendanceSummary/AssessmentPublished`, allowlist
field, consent/revocation; 2 MVP satu arah link+preview+import+summary; 3 outbox signed event,
`eventId` idempotency, replay protection, retry/dead-letter, reconciliation, pagination,
delete/revocation; 4 feedback JUARA→Stadione hanya setelah review akses, bukan blanket update.

**Uji wajib sebelum implementasi/acceptance:** cross-club, cross-academy, parent access,
revoked grant menutup read model, repeated/out-of-order event tidak menduplikasi pemain,
duplicate athlete, partial failure tidak menghentikan enrollment/absensi Stadione, delete/retention,
grant/consent scope, dan kontrak DTO kedua pod. Pilot synthetic: satu academy, dua klub, dua
student nama sama, satu parent multi-child. Tidak ada migrasi/hapus data anak sekarang.

## 5. Payment repair & containment plan (disusun, tidak dieksekusi)

Blocker statis terkonfirmasi di `PAYMENT_STATIC_TRIAGE.md`; hash source lokal = VPS untuk
callback/create/refund/client/refund. Rencana konkret:

1. **Containment sementara** (butuh Owner approval): batasi/isolasi `/api/payment/callback`,
   `/api/payment/create`, `/api/payment/refund` di gateway atau route guard sampai HMAC dan
   otorisasi aktif. Jangan ekspos endpoint ke traffic publik tanpa validasi.
2. **Callback**: verifikasi HMAC + header `client-id`/`request-id`/`request-timestamp`/`signature`,
   window waktu, replay store; path sesuai merchant configuration; validasi **sebelum** mutasi.
3. **Scope**: update POS hanya untuk invoice/reference yang sama, di dalam blok `payment`,
   tenant/venue terikat; jangan loop semua DOKU pending.
4. **Create**: amount diturunkan dari harga server-side (booking/member/plan), status awal
   `pending`, idempotency key, `payment_url` wajib ada; `paid` hanya setelah callback terverifikasi.
5. **Refund**: session + peran + venue scope; invoice number benar; fail closed bila provider
   gagal; `requested_by` actor nyata; audit outcome.
6. **Staging test plan**: signed callback → paid; unsigned/tampered/expired → ditolak tanpa
   state change; callback invoice A tidak menyentuh invoice B; amount mismatch ditolak;
   refund provider gagal → tidak approved; cross-venue/cross-tenant ditolak; replay &
   konkurensi idempoten; reconciliation exception terdeteksi. Tanpa transaksi riil, tanpa
   deploy produksi sebelum review.

## 6. Koreksi bukti & batas

- CAS revision `vision_revision`/`vision_legacy_migrated` ada di **`juara_clubs`**, bukan
  `juara_playbooks`; produksi belum memilikinya. `juara_playbooks` punya `tactical_profile_enc`.
- D3 palette graphite/navy/cobalt tetap provisional; screenshot actual app dan review Owner
  belum selesai. Tidak di-deploy.
- Assessment ini tidak mengubah D3, tidak menghapus Academy Stadione, tidak memulai migrasi,
  tidak mengaktifkan provider berbayar, dan tidak mereorganisasi sesi.
