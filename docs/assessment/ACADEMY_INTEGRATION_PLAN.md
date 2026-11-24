# Academy Stadione ↔ JUARA — usulan integrasi

Keputusan rekomendasi24November2026: **pertahankan Academy Stadione; integrasikan,
bukan hapus atau duplikasi.** Belum instruksi migrasi/deletion/deploy. Menjadi bagian
dari DUAL_PRODUCT_TEAM_PROPOSAL dan menajamkan scope J3/S2.

## Outcome dan sumber data utama

| Data/fitur | Owner tunggal | Konsumen |
|---|---|---|
| Akademi/program, pendaftaran, kelas/jadwal, absensi, coach assignment | S2 Academy Stadione | JUARA menerima yang relevan sesuai grant |
| Hubungan siswa–orang tua, izin akses/berbagi, raport operasional | S2; identity primitive P1 | JUARA subset berizin, tidak semua data anak |
| Tagihan/pembayaran akademi | S3 money ledger; S2 enrollment references | JUARA tidak memerlukan detail pembayaran orang tua |
| Identitas akun/auth | P1 | S2/J3 via canonical IDs |
| ID atlet lintas sistem/link record | P1 canonical ID contract; S2 source student ID | J3 maintains club-scoped link |
| Posisi/role klub, readiness, IDP, mentor, alokasi menit, promosi U-team/first-team | J3 JUARA | coach dapat melihat feedback terbatas bila diizinkan |
| Kontrak/gaji/valuation/proyeksi biaya klub | J4 JUARA | J3 role-limited DTO; bukan portal orang tua |

J3 accountable end-to-end untuk journey import/link academy→player pathway, termasuk
sync errors/retry/support. S2 accountable kualitas dan izin source data; P1 auth
transport support tidak mengambil ownership journey.

## Fitur bersama, bukan dua input wajib

Enrollment/attendance/report akademi dicatat di Stadione sekali. JUARA menampilkan
referensi/read model dengan provenance,lastSyncedAt,sourceVersion. Penilaian klub
berbeda dari raport akademi: tidak overwrite skor source; rumus/versi/author jelas.
Jangan menyatukan tabel semata karena nama academy sama. Tenant academy/venue dan
club bisa berbeda organisasi. Relasi many-to-many athlete↔academy↔club harus eksplisit
berperiode, dengan grant per academy/club, bukan email/nama sebagai join otomatis.

Klub JUARA yang belum memakai Stadione tetap dapat memakai import/manual baseline;
source diberi label dan dedup preview. Integrasi optional, bukan syarat berlangganan
kedua produk. Academy Stadione tetap melayani akademi independen/non-football;
JUARA football-specific tidak boleh mengganti seluruh domain akademi multi-olahraga.

## Phases dan kontrak teknis (belum implementation approval)

0. Assessment: cek schema/student/parent/tenant IDs, permissions, real data quality,
   duplicate candidates dan use cases. Jangan migrasi data anak riil pada assessment.
1. Contract+synthetic fixtures: AcademyStudent/AttendanceSummary/AssessmentPublished;
   mapping sourceStudentId,academyId,clubId,athleteId,grantId,schemaVersion,sourceVersion.
   Allowlist fields; scoped consent/authority records dan revocation behavior.
2. MVP satu arah: admin link academy→club, preview daftar eligible/duplicates,
   explicit import/link, attendance+assessment summaries, provenance/error status.
   Source tetap diStadione; tidak membuat enrollment/attendance editor kedua diJUARA.
3. Robust sync: transactional outbox,eventId/idempotency, replay protection,
   authenticated signed events, retries+dead-letter,reconciliation,pagination,
   deletion/revocation events. Consumer menolak event lama (sourceVersion), audit
   link/unlink/export. HMAC saja tidak cukup tanpa timestamp/replay dan tenant checks.
4. Feedback terkontrol: rekomendasi pathway/IDP dariJUARA dapat ditampilkan diStadione
   setelah review akses; bukan bidirectional blanket update atau salary sync.

## Security dan acceptance

Minimisasi data anak; pisahkan health/biometric/contact/financial sebagai excluded
secara default. S2 permission/grant wajib sebelum sinkronisasi. Uji cross-club,
cross-academy,parent access, revoked grant, repeated/out-of-order event, duplicate
athlete, partial failure dan delete/retention policy. Detail policy/legal retention
perlu ditetapkan pada implementasi dengan aturan yang berlaku, bukan diasumsikan.

Pilot synthetic: satu academy+dua klub, dua student dengan nama sama, satu parent
multi-child. Replayed event tidak menggandakan pemain; revoked grant menutup akses
read model sesuai policy; input source hanya sekali; kegagalan consumer tidak
menghentikan enrollment/attendance Stadione. Contract tests kedua pod dan evidence
UI4viewport wajib sebelum acceptance.

## Prioritas dan paralelisme

Sekarang S2 dan J3 boleh menyusun contract/read-only assessment paralel. Implementasi
integrasi setelah baseline pemain JUARA dan identitas/izin sumber stabil (R3 awal
sesuai roadmap, dapat dipercepat hanya bila dependency siap). Tidak menghambat D3,
draft release atau perbaikan pembayaran. J3 owns integrated journey; S2 owns source
adapter. PM tidak menghapus Academy Stadione dan tidak memulai migrasi tanpa review
rencana konkret. Tidak ada alasan membuat dua tim mengerjakan CRUD yang sama.
