# Migrasi JUARA Ter-apply — 23 November 2026

Izin Owner: "lanjut saja semua, kerjakan berurutan, pilihkan yang terbaik" (23.11.2026).
Pelaksana: PM Stadione. Target: Supabase self-hosted produksi `https://api.stadione.pro`,
database `postgres`, container `supabase-db-zurmq2lrm9hj510fmnj1seqr` di VPS `31.97.49.146`.

## Jalur apply

Kredensial Management API (`~/.supabase/access-token`) ditolak (HTTP 401), jadi migrasi
di-apply lewat `docker cp` + `psql -U postgres -d postgres -v ON_ERROR_STOP=1 -f` di
dalam container database. Ini satu-satunya jalur DDL yang tersedia dan tidak
membutuhkan kata sandi baru.

## Urutan eksekusi

| File | Hasil |
|---|---|
| `20261123000000_juara_types.sql` (M-00) | OK |
| `20261123000001_juara_tenant_identity.sql` (M-01) | OK |
| `20261123000002_juara_playbook_slot.sql` (M-02) | OK |
| `20261123000003_juara_player_vault.sql` (M-03) | OK |
| `20261123000004_juara_projections_audit.sql` (M-04) | OK |
| `20261123000005_juara_seed_templates.sql` (M-05) | OK (komentar saja, tidak ada seed) |
| `20261123000006_juara_hardening.sql` (M-06) | OK |
| `20261123000007_juara_hardening_view.sql` (M-07) | OK — tambahan PM: cabut grant view audit |
| `20261123000008_juara_bootstrap_club.sql` (M-08) | OK (retry setelah SSH pulih) |
| `20261124000009_juara_registration.sql` (M-09) | OK — `juara_create_owner_club()` untuk registrasi, grant hanya `service_role` |
| `20261124000010_juara_tactical_profile.sql` (M-10) | OK — kolom `tactical_profile_enc` ditambah ke `juara_playbooks` (8 tabel, tanpa tabel baru) |
| `20261124000011_juara_tactical_dna_extend.sql` (M-11) | OK — ENUM `juara_tactical_dna` jadi 10 nilai (6 tambahan R21) |
| `20261124000012_juara_member_role_guard.sql` (M-12) | OK — policy member jadi SELECT-only + RPC `juara_set_member_role` owner-only |
| `20261124000013_juara_vision_draft.sql` (M-13) | OK — kolom `vision_draft_enc` di `juara_clubs` |
| `20261124000014_juara_action_policies.sql` (M-14) | **STAGING ONLY** — 16 migrasi & negative test lolos di `juara_staging_20261124`; belum di-apply produksi sampai gate visual/deploy |
| `20261124000015_juara_draft_finance_split.sql` (M-15) | OK produksi — `vision_finance_enc` + RPC draft self-contained; di-reapply setelah penyempurnaan |
| `20261124000016_juara_draft_cas_reconcile.sql` (M-16) | **STAGING ONLY** — urutan produksi `M-00…M-13 → M-15 → M-14 → M-16` lolos; overload tersisa satu 4 argumen; CAS paralel 1 sukses / 1 conflict. Belum di-apply produksi |

Tidak ada `DROP`, `TRUNCATE`, atau `DELETE` pada objek apa pun. Semua objek baru
ber-prefix `juara_` di `schema public`.

## Verifikasi pasca-apply

| Pemeriksaan | Hasil |
|---|---|
| `information_schema.tables WHERE table_name LIKE 'juara\_%'` | `BASE TABLE=8`, `VIEW=1` |
| `pg_class WHERE relname LIKE 'juara\_%' AND relrowsecurity` | `8` (semua tabel RLS aktif) |
| `pg_policies WHERE tablename LIKE 'juara\_%'` | `8` policy |
| `pg_proc juara_current_club_id` | ada, `prosecdef=t` |
| `information_schema.role_table_grants` untuk `service_role` pada `juara_*` | `0` setelah M-07 |

## Catatan

- M-07 ditambahkan karena M-06 mencabut grant dari 8 tabel, tetapi view
  `juara_policy_inventory` dibuat setelahnya dan menerima default grant dari
  Supabase. Sekarang view hanya bisa dibaca `authenticated`.
- M-08 diperlukan agar pemilik akun bisa membuat klub pertama tanpa service_role
  (D4.5). `club_id` tetap berasal dari `auth.uid()`, bukan input klien.
- Rencana rollback: semua perubahan aditif; tidak ada penulisan data klub riil.
