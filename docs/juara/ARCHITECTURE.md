# ARSITEKTUR TEKNIS — JUARA.STADIONE.PRO (Sprint 0, Divisi 3)

**Artefak Sprint 0 — Divisi 3 (Core Platform, Playbook Engine & Squad Architecture).**
Status: `DESAIN — MENUNGGU VERIFIKASI PM`. Bukan izin migrasi, deploy, DNS, SSL, push, restart, kredensial, atau kode produksi.
Rantai komando: Owner → CTO → PM → Divisi 3. Satu fokus per worker.

Sumber otoritatif, urutan konflik: **D1–D5 (`DECISIONS.md`) > PM_RULINGS R1–R9 > PRD eksplisit > design doc (DES) §7/§11 > RULEBOOK > turunan**. D4 **sudah dikunci**, bukan asumsi, dan tidak dibuka kembali.

| Sumber | Dipakai untuk |
|---|---|
| `docs/juara/DECISIONS.md` D1–D5 | Approach B, K3, D3, **D4 = satu repo/DB/auth.users**, paralelisasi |
| `docs/juara/PM_RULINGS.md` R1–R9 | R1 4 tahun, R2 komponen SCR, R6 usia 19/23/27/31, R9 < 550 menit |
| `docs/juara/RULEBOOK.md` | Rumus + field yang harus disimpan engine (§2, §3, §6, §7, §9, §10) |
| `docs/juara/PRD-JUARA.md` §1.3, §10.1–10.2, §11 | 6 peran, 6+1 tabel, endpoint, DoD |
| `docs/superpowers/specs/2026-11-22-juara-stadione-pro-design.md` §7 K1–K7, §11.1–11.6 | Keputusan teknis, invite-only, enkripsi aplikasi, Zod |
| `docs/juara/SECURITY_QA_PLAN.md` (read-only, artefak Divisi 6 v0) | Penyelarasan matriks 6×6, temuan F-01…F-10, skenario CT/E |

---

## 1. Prinsip arsitektur — hal yang WAJIB dibedakan

D4 mengikat delapan aturan. Tabel ini adalah checksum terhadap arsitektur lama yang **tidak** dipakai:

| Dimensi | Arsitektur JUARA (benar, mengikat) | Yang dilarang / legacy (PRD lama) |
|---|---|---|
| Database | **SATU** Postgres live yang sama dengan stadione.pro | Supabase project baru, database baru, tenant baru |
| Penempatan tabel | `schema public` yang sama, prefix **`juara_`** | Schema `juara` baru (menyangkut *exposed schemas* = konfigurasi produksi) |
| Identitas | **`auth.users` yang SAMA** + `juara_club_members` | `auth.users` tenant baru, tabel `users` duplikat |
| Koneksi | `anon` + JWT user; RLS mengeksekusi isolasi | `service_role` B2C untuk akses juara (dicabut grant-nya — §6.4) |
| Enkripsi | **AES-256-GCM di aplikasi** → `BYTEA`, kunci di environment | pgcrypto / GCM di DB, kunci di DB, fungsi dekripsi di SQL |
| Isolasi | RLS `club_id` = tenant boundary | Hak peran disalahartikan sebagai pengganti RLS; GUC `app.current_club_id` yang bisa di-set klien (F-04) |
| Kontrak API | **Zod schema** + tipe TS bersama di slice ini | `openapi.yaml` formal (ditunda ke Sprint 0 cakupan penuh — DES §11.6) |
| Lokasi kode | Route group `/juara` di repo `stadione-v2`, host routing via middleware | Repo terpisah, sistem terpisah, subdomain yang sudah ada DNS-nya |

Catatan D4: database live **belum punya tabel `clubs`**. Itu wajar — kita menambahkan `juara_clubs`, **bukan** membuat database baru. Tabel B2C yang ada (`public.academies`, `public.venues`, `auth.users`, dll.) **tidak diubah**.

---

## 2. Model data

### 2.1 Inventaris tabel

| # | Tabel | Peran | club_id |
|---|---|---|---|
| 1 | `juara_clubs` | Root tenant, parameter klub | `id` (alias generated `club_id`) |
| 2 | `juara_club_members` | Keanggotaan + 6 peran (`auth.users` bersama) | FK → `juara_clubs.id` |
| 3 | `juara_playbooks` | Cetak biru visi Owner + asumsi finansial | FK → `juara_clubs.id` |
| 4 | `juara_squad_slots` | 26–28 slot, depth chart, mentor | FK → `juara_clubs.id` + `juara_playbooks.id` |
| 5 | `juara_players` | Profil teknis/biologis, ARI | FK → `juara_clubs.id` |
| 6 | `juara_contracts_vault` | Brankas kontrak + amortisasi IAS 38 | FK → `juara_clubs.id` + `juara_players.id` |
| 7 | `juara_projections` | CapEx/OpEx/6 pilar revenue + SCR | FK → `juara_clubs.id` + `juara_playbooks.id` |
| 8 | `juara_audit_logs` | Tabel pendukung (keputusan F-10, DoD-07) | FK → `juara_clubs.id` |

7 tabel pertama = daftar eksplisit D4/DES K2. Tabel ke-8 (`juara_audit_logs`) diusulkan untuk menutup **F-10**: PRD §11 Sprint 4 meminta `audit_logs`, sementara daftar D4 tidak menyebutnya. Ini bukan tabel tenant baru; tetap di `schema public`, prefix `juara_`, ber-`club_id`, dan RLS sama.

Tipe ENUM dibuat di `schema public` dengan prefix `juara_` agar tidak menimpa enum B2C:
`juara_league_tier`, `juara_role`, `juara_number_source`, `juara_playbook_status`, `juara_outcome`, `juara_dna`, `juara_grade`, `juara_ability_grade`, `juara_ceiling_grade`, `juara_depth_tier`, `juara_phv_stage`, `juara_birth_quarter`, `juara_contract_status`, `juara_scr_status`.

### 2.2 DDL konseptual (FILE SAJA — TIDAK di-apply)

> Semua `CREATE TABLE` di bawah adalah **spesifikasi untuk file migrasi** (§8). Tidak ada perintah `supabase db push`, `psql`, atau eksekusi DDL yang dijalankan worker ini.

#### 2.2.1 `public.juara_clubs`
```sql
id                    uuid PRIMARY KEY DEFAULT gen_random_uuid()
club_id               uuid GENERATED ALWAYS AS (id) STORED   -- kunci tenant seragam untuk RLS
name                  varchar(150) NOT NULL
league_tier           juara_league_tier NOT NULL             -- LIGA_1|LIGA_2|LIGA_3|ACADEMY_PRO
stadium_capacity      integer
avg_home_attendance   integer
fiscal_year_start_month smallint NOT NULL DEFAULT 7          -- PRD §10.1
academy_id            uuid NULL REFERENCES public.academies(id) ON DELETE SET NULL  -- hook Fase 2, B2C tidak diubah
source_label          juara_number_source NOT NULL DEFAULT 'TEMPLATE_PRD'          -- DES §11.4
created_at, updated_at timestamptz NOT NULL DEFAULT now()
```
Index: `UNIQUE (academy_id) WHERE academy_id IS NOT NULL` (satu akademi → satu klub JUARA), `(league_tier)`.
Catatan: `academy_id` nullable dan **read-only terhadap `public.academies`**; tidak ada `INSERT/UPDATE/DELETE` ke tabel B2C dari modul juara.

#### 2.2.2 `public.juara_club_members`
```sql
id          uuid PRIMARY KEY DEFAULT gen_random_uuid()
club_id     uuid NOT NULL REFERENCES public.juara_clubs(id) ON DELETE CASCADE
user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE   -- auth.users YANG SAMA
role        juara_role NOT NULL                            -- OWN|CEO|SPO|COA|FIN|SEC
is_active   boolean NOT NULL DEFAULT true
invited_by  uuid NULL REFERENCES auth.users(id)
invited_at  timestamptz, joined_at timestamptz, revoked_at timestamptz
created_at  timestamptz NOT NULL DEFAULT now()
CONSTRAINT juara_members_one_role UNIQUE (club_id, user_id)
```
Index: `(user_id) WHERE is_active`, `(club_id, role) WHERE is_active`.
Satu user = satu peran per klub (DES §11.2: Owner memilih 1 dari 6 peran). Multi-peran untuk satu user **belum diputuskan** → daftar Owner (§10).
RLS: `USING (user_id = auth.uid() OR club_id = public.juara_current_club_id())`. **Tidak memakai `FORCE ROW LEVEL SECURITY`** pada tabel ini — alasan teknis di §6.3 (rekursi helper). `relrowsecurity = true` tetap terpenuhi untuk CT-10.

#### 2.2.3 `public.juara_playbooks`
```sql
id                       uuid PRIMARY KEY DEFAULT gen_random_uuid()
club_id                  uuid NOT NULL REFERENCES public.juara_clubs(id) ON DELETE CASCADE
version_name             varchar(100) NOT NULL
horizon_years            smallint NOT NULL CHECK (horizon_years BETWEEN 1 AND 5)
target_sporting_outcome  juara_outcome NOT NULL          -- CHAMPION|PROMOTION|TOP_4|MID_TABLE_SUSTAINABLE
tactical_dna_type        juara_dna NOT NULL              -- 4 nilai sesuai RULEBOOK §1
base_formation           varchar(20) NOT NULL
philosophy_star_pct      numeric(5,2) NOT NULL
philosophy_prime_pct     numeric(5,2) NOT NULL
philosophy_academy_pct   numeric(5,2) NOT NULL
-- R6: 4 usia representatif + bobot, field terpisah (bukan angka agregat saja)
age_rep_19_pct           numeric(5,2) NOT NULL DEFAULT 25
age_rep_23_pct           numeric(5,2) NOT NULL DEFAULT 25
age_rep_27_pct           numeric(5,2) NOT NULL DEFAULT 40
age_rep_31_pct           numeric(5,2) NOT NULL DEFAULT 10
weighted_target_age      numeric(5,2) NOT NULL            -- 19/23/27/31 → 24,40
owner_equity_injection_enc bytea NULL                     -- SENSITIF
scr_max_threshold_pct    numeric(5,2) NOT NULL DEFAULT 65.00
reamortization_years     smallint NOT NULL DEFAULT 4       -- R1: sisa durasi baru = 4 tahun
status                   juara_playbook_status NOT NULL DEFAULT 'DRAFT'
source_label             juara_number_source NOT NULL DEFAULT 'TEMPLATE_PRD'
locked_at, locked_by     timestamptz NULL, uuid NULL REFERENCES auth.users(id)
created_at, updated_at   timestamptz NOT NULL DEFAULT now()
```
Index: `(club_id, status)`, `(club_id, created_at DESC)`. Constraint: hanya `OWN` yang boleh menulis `status='LOCKED_ACTIVE'` (ditegakkan di layer API + policy terpisah, §5/§7).

#### 2.2.4 `public.juara_squad_slots`
```sql
id                       uuid PRIMARY KEY DEFAULT gen_random_uuid()
club_id                  uuid NOT NULL REFERENCES public.juara_clubs(id) ON DELETE CASCADE
playbook_id              uuid NOT NULL REFERENCES public.juara_playbooks(id) ON DELETE CASCADE
position_code            varchar(10) NOT NULL             -- GK, RCB, ..., ST
tactical_role_archetype  varchar(50) NOT NULL             -- 22 archetype, divalidasi app terhadap RULEBOOK §4
depth_tier               juara_depth_tier NOT NULL        -- STARTER|BACKUP|U21_SHADOW
target_age_min, target_age_max smallint NOT NULL
target_grade             juara_grade NOT NULL             -- A|B|C
target_minutes_pct       numeric(5,2) NOT NULL
projected_minutes        integer NOT NULL DEFAULT 0       -- dipakai R9 (< 550 menit/pemain)
assigned_player_id       uuid NULL REFERENCES public.juara_players(id) ON DELETE SET NULL
mentor_slot_id           uuid NULL REFERENCES public.juara_squad_slots(id) ON DELETE SET NULL
created_at               timestamptz NOT NULL DEFAULT now()
```
Index: `(club_id, playbook_id)`, `(playbook_id, position_code)`, `(assigned_player_id) WHERE assigned_player_id IS NOT NULL`, `(mentor_slot_id)`.
Constraint app: total slot 26–28 (RULEBOOK §2), Grade A/B/C 6–8 / 11–13 / 6–8 (§3).

#### 2.2.5 `public.juara_players`
```sql
id                       uuid PRIMARY KEY DEFAULT gen_random_uuid()
club_id                  uuid NOT NULL REFERENCES public.juara_clubs(id) ON DELETE CASCADE
full_name                varchar(150) NOT NULL
date_of_birth            date NOT NULL
birth_quarter            juara_birth_quarter NOT NULL     -- Q1..Q4 (RAE, RULEBOOK §10)
phv_maturity_stage       juara_phv_stage NOT NULL         -- PRE_PHV|CIRCA_PHV|POST_PHV|ADULT
nationality              varchar(50)
is_foreign_quota         boolean NOT NULL DEFAULT false
primary_role             varchar(50) NOT NULL
secondary_role           varchar(50) NULL
current_ability_grade    juara_ability_grade NOT NULL     -- A+|A|B+|B|C
potential_ceiling_grade  juara_ceiling_grade NOT NULL     -- A+|A|B
academy_readiness_index  numeric(5,2) NULL                -- ARI 0..100
-- RULEBOOK §10: komponen ARI disimpan terpisah agar 30/25/25/20 bisa diaudit
ari_component_tactical   numeric(5,2) NULL
ari_component_physical   numeric(5,2) NULL
ari_component_technical  numeric(5,2) NULL
ari_component_psychological numeric(5,2) NULL
is_homegrown_epa         boolean NOT NULL DEFAULT false
estimated_market_value   bigint NOT NULL DEFAULT 0        -- bukan kolom sensitif menurut D4
source_label             juara_number_source NOT NULL DEFAULT 'TEMPLATE_PRD'
created_at, updated_at   timestamptz NOT NULL DEFAULT now()
```
Index: `(club_id, current_ability_grade)`, `(club_id, birth_quarter)`, `(club_id, date_of_birth)`, `(club_id, is_homegrown_epa) WHERE is_homegrown_epa`.

#### 2.2.6 `public.juara_contracts_vault`
```sql
id                          uuid PRIMARY KEY DEFAULT gen_random_uuid()
club_id                     uuid NOT NULL REFERENCES public.juara_clubs(id) ON DELETE CASCADE
player_id                   uuid NOT NULL REFERENCES public.juara_players(id) ON DELETE CASCADE
contract_start_date         date NOT NULL                  -- terlihat SEC/COA/SPO
contract_end_date           date NOT NULL                  -- terlihat SEC/COA/SPO
contract_status             juara_contract_status NOT NULL DEFAULT 'ACTIVE'
base_salary_monthly_enc     bytea NOT NULL                 -- SENSITIF
signing_on_fee_total_enc    bytea NULL                     -- SENSITIF
transfer_fee_capitalized_enc bytea NULL                    -- SENSITIF
agent_fee_capitalized_enc   bytea NULL                     -- SENSITIF
release_clause_enc          bytea NULL                     -- SENSITIF (buy-out)
performance_bonus_rules_enc bytea NULL                     -- SENSITIF (JSON 70:30, menang, clean sheet)
sponsor_contract_value_enc  bytea NULL                     -- SENSITIF (F-06, lihat catatan)
monthly_amortization_value  bigint NOT NULL DEFAULT 0      -- hasil kalkulasi (PRD §10.1)
net_book_value_current      bigint NOT NULL DEFAULT 0      -- hasil kalkulasi
original_duration_months    smallint NOT NULL
reamortization_remaining_years smallint NOT NULL DEFAULT 4  -- R1
salary_step_appearances     smallint[] NOT NULL DEFAULT '{15,35,60}'  -- R8: pemicu saja, tanpa besaran
source_label                juara_number_source NOT NULL DEFAULT 'TEMPLATE_PRD'
created_at, updated_at      timestamptz NOT NULL DEFAULT now()
```
Index: `(club_id, player_id)`, `(club_id, contract_end_date)`, `(club_id, contract_status)`.

**Keputusan F-06:** nilai kontrak sponsor sensitif menurut PRD §1.3. QA v0 mengira calon kolomnya di `juara_projections`; Divisi 3 menempatkan `sponsor_contract_value_enc` di **vault kontrak** karena secara semantik itu adalah kontrak dan harus tunduk pada aturan dekripsi yang sama. Perlu dikonfirmasi Divisi 6 pada QA v1 (§10).

#### 2.2.7 `public.juara_projections`
```sql
id                         uuid PRIMARY KEY DEFAULT gen_random_uuid()
club_id                    uuid NOT NULL REFERENCES public.juara_clubs(id) ON DELETE CASCADE
playbook_id                uuid NOT NULL REFERENCES public.juara_playbooks(id) ON DELETE CASCADE
projection_year            smallint NOT NULL CHECK (projection_year BETWEEN 1 AND 3)
-- CapEx (RULEBOOK §5)
capex_transfer_fees        bigint NOT NULL DEFAULT 0
capex_signing_agent_fees   bigint NOT NULL DEFAULT 0
capex_sport_science_infra  bigint NOT NULL DEFAULT 0
-- OpEx (RULEBOOK §5)
opex_base_wages            bigint NOT NULL DEFAULT 0
opex_performance_bonuses   bigint NOT NULL DEFAULT 0
opex_taxes_insurance       bigint NOT NULL DEFAULT 0
opex_matchday_operations   bigint NOT NULL DEFAULT 0
opex_away_travel_logistics bigint NOT NULL DEFAULT 0
opex_academy_operations    bigint NOT NULL DEFAULT 0
-- 6 pilar revenue (RULEBOOK §11)
rev_sponsorship_corporate  bigint NOT NULL DEFAULT 0
rev_ticketing_hospitality  bigint NOT NULL DEFAULT 0
rev_merchandise_memorabilia bigint NOT NULL DEFAULT 0
rev_league_broadcast_prize bigint NOT NULL DEFAULT 0
rev_player_trading_net     bigint NOT NULL DEFAULT 0
rev_academy_community      bigint NOT NULL DEFAULT 0
-- R2: 5 komponen pembilang SCR, field terpisah (WAJIB sebelum hitung)
scr_num_gross_wages             bigint NOT NULL DEFAULT 0
scr_num_fixed_allowances_tax    bigint NOT NULL DEFAULT 0
scr_num_annual_amortization     bigint NOT NULL DEFAULT 0
scr_num_annual_agent_fees       bigint NOT NULL DEFAULT 0
scr_num_guaranteed_bonus        bigint NOT NULL DEFAULT 0
-- R2: 6 komponen penyebut SCR, field terpisah
scr_den_sponsorship             bigint NOT NULL DEFAULT 0
scr_den_ticketing_hospitality   bigint NOT NULL DEFAULT 0
scr_den_merchandise_net         bigint NOT NULL DEFAULT 0
scr_den_broadcast_subsidy       bigint NOT NULL DEFAULT 0
scr_den_other_commercial        bigint NOT NULL DEFAULT 0
scr_den_player_trading_profit   bigint NOT NULL DEFAULT 0
-- Turunan (BUKAN dari total CapEx/OpEx agregat — RULEBOOK §12 invariant 3)
calculated_scr_pct         numeric(5,2) NOT NULL
scr_status                 juara_scr_status NOT NULL       -- GREEN|YELLOW_WATCHLIST|RED_BREACH
cash_buffer_reserve        bigint NOT NULL DEFAULT 0        -- 2,5 × OpEx bulanan (TV-09)
loan_minute_threshold      integer NOT NULL DEFAULT 550     -- R9: < 550 menit/pemain
created_at, updated_at     timestamptz NOT NULL DEFAULT now()
CONSTRAINT juara_proj_unique UNIQUE (club_id, playbook_id, projection_year)
```
Index: `(club_id, scr_status)`, `(playbook_id, projection_year)`.

#### 2.2.8 `public.juara_audit_logs` (pendukung, F-10)
```sql
id             bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY
club_id        uuid NOT NULL REFERENCES public.juara_clubs(id) ON DELETE CASCADE
actor_user_id  uuid NULL REFERENCES auth.users(id)
action         text NOT NULL             -- VAULT_DECRYPT | ROLE_CHANGE | PLAYBOOK_LOCK | CROSS_TENANT_DENIED | INVITE
target_table   text NULL
target_id      uuid NULL
occurred_at    timestamptz NOT NULL DEFAULT now()
metadata       jsonb NOT NULL DEFAULT '{}'::jsonb   -- HANYA ID/nama/label; DILARANG plaintext sensitif atau kunci
```
Index: `(club_id, occurred_at DESC)`, `(club_id, action)`. Append-only: tidak ada policy `UPDATE`/`DELETE` untuk `authenticated`.

### 2.3 Foreign key lintas hook
Satu-satunya FK ke tabel B2C: `juara_clubs.academy_id → public.academies(id)`. Tidak ada FK langsung dari tabel juara ke `public.venues`, `public.venue_roles`, atau tabel B2C lain. `user_id` merujuk `auth.users` (identitas bersama), bukan tabel `public.users` duplikat.

---

## 3. Provisioning invite-only (DES §11.2)

1. **Seed Owner** — baris `juara_club_members` untuk Owner pertama dibuat lewat **file seed SQL yang dijalankan manual** dengan izin Owner terpisah. Tidak ada signup publik, tidak ada `auth.users` baru dari modul juara.
2. **Undang anggota** — `OWN` memanggil `POST /api/juara/v1/invites` → aplikasi membuat undangan bertanda `invited_by`, `invited_at`, peran dari 6 ENUM, dan `club_id` dari `juara_current_club_id()` (bukan body klien).
3. **Terima undang** — userexisting `auth.users` mengaktifkan keanggotaan (`is_active=true`, `joined_at`); akun baru tidak dibuat oleh modul juara.
4. **Pencabutan** — `is_active=false` + `revoked_at`; akses hilang setelah pembatasan usia JWT yang ditetapkan arsitektur (CT-05, §10).
5. **Jejak audit** — setiap invite/peran/perubahan status tercatat di `juara_audit_logs` tanpa plaintext.

---

## 4. RLS — isolasi tenant (`club_id` dari JWT/membership)

### 4.1 Sumber `club_id` (F-04)
`club_id` **tidak pernah** berasal dari input klien dan **tidak** memakai `current_setting('app.current_club_id')` sebagaimana PRD §11 Sprint 0 (itu legacy dan bisa di-set klien). Sumber: `auth.uid()` (dari JWT tervalidasi) **di-intersek** dengan `juara_club_members` aktif dan klaim `club_id` dari `request.jwt.claims` (di-set PostgREST dari JWT, bukan GUC bebas):

```sql
CREATE FUNCTION public.juara_current_club_id()
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public, pg_temp
AS $fn$
  WITH active AS (
    SELECT club_id FROM public.juara_club_members
    WHERE user_id = auth.uid() AND is_active
  ),
  claim AS (
    SELECT NULLIF(coalesce(
      current_setting('request.jwt.claims', true)::jsonb ->> 'club_id',''),'')::uuid AS jwt_club_id
  )
  SELECT club_id FROM (
    SELECT a.club_id FROM active a, claim c
      WHERE c.jwt_club_id IS NOT NULL AND a.club_id = c.jwt_club_id
    UNION ALL
    SELECT a.club_id FROM active a, claim c
      WHERE c.jwt_club_id IS NULL AND (SELECT count(*) FROM active) = 1
  ) x LIMIT 1;
$fn$;
REVOKE ALL ON FUNCTION public.juara_current_club_id() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.juara_current_club_id() TO authenticated;
```

Sifat: **fail-closed** (tanpa keanggotaan aktif → `NULL` → 0 baris); klaim JWT palsu (CT-07) tetap ditolak karena harus cocok dengan baris membership milik `auth.uid()`; user multi-klub wajib membawa klaim `club_id` (jika tidak, fungsi mengembalikan `NULL`).

### 4.2 Policy generik (berlaku pada 8 tabel)
```sql
ALTER TABLE public.<tabel> ENABLE ROW LEVEL SECURITY;
CREATE POLICY juara_<tabel>_tenant ON public.<tabel> FOR ALL TO authenticated
  USING (club_id = public.juara_current_club_id())
  WITH CHECK (club_id = public.juara_current_club_id());
ALTER TABLE public.<tabel> FORCE ROW LEVEL SECURITY;   -- kecuali juara_club_members, lihat §6.3
```
Khusus `juara_audit_logs`: policy `SELECT` + `INSERT` saja (append-only). Khusus `juara_club_members`: `USING (user_id = auth.uid() OR club_id = public.juara_current_club_id())`, **tanpa FORCE**.

### 4.3 Hubungan RLS vs RBAC
RLS menjawab **"baris klub mana yang terlihat"**; RBAC menjawab **"field/aksi apa yang boleh dipakai"**. Keduanya wajib lolos. `DENY` pada matriks §5 boleh berupa HTTP 403 (middleware) **atau** 0 baris RLS — Divisi 6 mencatat keduanya terpisah (QA §3). RLS **tidak** mengenkripsi dan **tidak** menyaring field gaji; itu domain enkripsi (§6) + RBAC.

### 4.4 Uji cross-tenant (gate keras D2 — Sprint 1)
Desain ini mendukung CT-01…CT-10: dua klub sentinel A/B, user A tidak pernah melihat baris/agregat/pesan error B, INSERT/UPDATE/DELETE lintas `club_id` ditolak `WITH CHECK`, tidak ada *existence oracle*, inventaris `relrowsecurity=true` 8/8, dan tidak ada GUC yang bisa di-set klien.

---

## 5. Matriks RBAC — 6 peran × 6 modul (36 sel)

Sumber: PRD §1.3 + DES §11.5; diselaraskan dengan matriks 36 skenario `SECURITY_QA_PLAN.md` v0 (RBAC-01…36). `ALLOW` = penuh; `ALLOW*` = terbatas/ter-redaksi (field terlarang **tidak boleh ikut terkirim**); `DENY` = 403/0 baris.

| Peran ↓ / Modul → | M1 Playbook & Visi | M2 Squad, Depth & Tactics | M3 Academy & ARI | M4 Finance, SCR, Amortisasi | M5 Commercial & Sponsor | M6 Vault & Governance |
|---|---|---|---|---|---|---|
| **OWN** Owner/Investor | ALLOW (01) | ALLOW (02) | ALLOW (03) | ALLOW (04) | ALLOW (05) | ALLOW (06) |
| **CEO** CEO/VP Commercial | ALLOW* (07) | ALLOW* (08) | ALLOW* (09) | ALLOW (10) | ALLOW (11) | ALLOW* (12) |
| **SPO** Sporting Director | ALLOW* (13) | ALLOW (14) | ALLOW (15) | ALLOW* (16) | **DENY** (17) | ALLOW* (18) |
| **COA** Head Coach | ALLOW* (19) | ALLOW (20) | ALLOW* (21) | **DENY** (22) | **DENY** (23) | ALLOW* (24) |
| **FIN** Finance Controller | ALLOW* (25) | ALLOW* (26) | ALLOW* (27) | ALLOW (28) | ALLOW* (29) | ALLOW* (30) |
| **SEC** Secretary/Team Manager | ALLOW* (31) | ALLOW* (32) | ALLOW* (33) | **DENY** (34) | ALLOW* (35) | ALLOW* (36) |

Hitungan ulang: `ALLOW` **12** (OWN 6, CEO 2, SPO 2, COA 1, FIN 1, SEC 0) + `ALLOW*` **20** + `DENY` **4** (SPO-M5, COA-M4, COA-M5, SEC-M4) = **36**. Sesuai QA v0.

### 5.1 Aturan field sensitif (turunan PRD §1.3 + DES §11.5 — poin 5)
| Peran | Gaji individual & kontrak (nominal/klausul) | PPh 21 & P&L | Pagu anggaran posisi | Tanggal & status kontrak |
|---|---|---|---|---|
| OWN, CEO, FIN | **Penuh** (dekripsi diizinkan) | Penuh | Penuh | Penuh |
| SPO | DENY | DENY | **ALLOW** (tanpa gaji individual/pajak/P&L) | ALLOW |
| COA | DENY | **DENY** (tidak ada laba-rugi) | DENY | ALLOW |
| SEC | DENY (hanya tanggal & status) | DENY | DENY | **ALLOW** (nominal tetap DENY) |

Implementasi: middleware RBAC memakai peran dari `juara_club_members` untuk klub aktif, memeriksa allow-list sebelum memanggil layanan dekripsi; response dibangun dari DTO eksplisit per peran (bukan `SELECT *`). Mengirim field terlarang — meski nilainya `null` — dianggap gagal (QA RBAC-16/18/24/36).

---

## 6. Desain enkripsi aplikasi AES-256-GCM → BYTEA (gate keras D2)

### 6.1 Lapisan
Modul server-only `src/lib/juara/crypto.ts` (**desain saja, tidak ditulis**; wajib Node.js runtime — `crypto.createCipheriv`, bukan Edge runtime). Markdown ini tidak berisi kunci, token, connection string, atau nilai rahasia apa pun.

### 6.2 Format ciphertext (`bytea`)
```
[version:1][key_id_len:1][key_id:UTF-8][nonce:12][ciphertext || GCM tag:16]
```
- `version = 0x01` untuk AES-256-GCM.
- `nonce` = 12 byte acak dari CSPRNG, unik per (kunci, pesan).
- `tag` = 16 byte GCM, diverifikasi sebelum plaintext dipakai (AEAD integritas, E-03/E-04).
- `key_id` (mis. `k1`) menunjuk ke variabel environment; memungkinkan rotasi tanpa reshape (E-09): tulis dengan kunci aktif, baca dengan kunci sesuai `key_id`.

**AAD (Additional Authenticated Data)** wajib:
```
club_id | table_name | column_name | row_id | key_id
```
mengikat ciphertext ke tenant, tabel, kolom, dan baris — cipher tidak bisa dipindah antar klub/kolom/baris (mendukung CT-02/CT-03).

### 6.3 Manajemen kunci
- Nama variabel environment (nama saja): `JUARA_ENCRYPTION_KEYS` (peta `key_id → kunci base64 32 byte`) dan `JUARA_ACTIVE_KEY_ID`.
- **Pemegang kunci: Owner.** Worker/PM/CTO tidak menerima, melihat, menyalin, atau mencetak nilai kunci. Rotasi = keputusan Owner dengan lampu hijau terpisah.
- Kunci **tidak pernah** ada di database, repo, log, laporan, artefak CI, atau dokumen ini. Tidak ada fungsi SQL dekripsi — admin DB hanya melihat `bytea` ber-entropi tinggi (E-01/E-02/E-08).
- Dekripsi terjadi **di memori service saat kalkulasi**; plaintext **tidak pernah** dikirim ke RLS, query agregasi SQL, log, atau response peran tanpa hak (DES §11.3).

### 6.4 Kolom terenkripsi (8 kolom)
`juara_playbooks.owner_equity_injection_enc`; `juara_contracts_vault.{base_salary_monthly_enc, signing_on_fee_total_enc, transfer_fee_capitalized_enc, agent_fee_capitalized_enc, release_clause_enc, performance_bonus_rules_enc, sponsor_contract_value_enc}`.
Semua `bytea`. Angka turunan (`monthly_amortization_value`, `net_book_value_current`, `calculated_scr_pct`, revenue agregat) sengaja **plaintext** sesuai PRD §10.1; kerahasiaannya dijaga RLS + RBAC.

### 6.5 Pencabutan `service_role` (CT-08)
Supabase memberi grant default kepada `service_role` untuk tabel baru di `public`. Migrasi file wajib **hanya** mencabut grant pada tabel juara (eksplisit per tabel):
```sql
REVOKE ALL ON public.juara_clubs, public.juara_club_members, public.juara_playbooks,
              public.juara_squad_slots, public.juara_players, public.juara_contracts_vault,
              public.juara_projections, public.juara_audit_logs FROM service_role;
```
**Dilarang** `REVOKE ALL ON ALL TABLES IN SCHEMA public FROM service_role` — itu akan merusak grant B2C yang sudah ada. Runtime juara hanya memakai `anon` + JWT user. `service_role` tidak pernah dicatat/log.

---

## 7. Kontrak API slice pertama (Zod — OpenAPI formal ditunda, DES §11.6)

Prefix: `/api/juara/v1/...` di dalam route group `/juara`. Semua request membawa JWT; `club_id` **tidak** diterima dari body (diambil dari `juara_current_club_id()`). Zod schema dipakai bersama server/client, satu sumber tipe TypeScript.

### 7.1 Daftar endpoint (slice pertama)
| # | Method & path | Fungsi | Peran |
|---|---|---|---|
| 1 | `POST /api/juara/v1/invites` | Invite anggota + 1 peran | OWN |
| 2 | `POST /api/juara/v1/playbooks/generate` | 5-parameter wizard → 26–28 slot + proyeksi + SCR | OWN (simulasi: CEO/SPO/FIN read) |
| 3 | `POST /api/juara/v1/playbooks/{id}/simulate-what-if` | Simulasi < 150 ms, tidak mengubah data terkunci | OWN, CEO, FIN |
| 4 | `PATCH /api/juara/v1/playbooks/{id}/lock` | Kunci `LOCKED_ACTIVE` | OWN saja |
| 5 | `GET /api/juara/v1/clubs/{club_id}/squad-gap-analysis` | Audit skuad vs playbook → 5 aksi rekomendasi | OWN, SPO, COA (redaksi) |
| 6 | `GET /api/juara/v1/contracts/{id}` | Buka brankas (dekripsi ter audit) | OWN, CEO, FIN |
| 7 | `GET /api/juara/v1/clubs/{club_id}/projections` | CapEx/OpEx/6 pilar + SCR | OWN, CEO, FIN (SPO: pagu) |
| 8 | `GET /api/juara/v1/audit-log` | Riwayat akses sensitif | OWN |
| 9 | `POST /api/juara/v1/bridge/academy-sync` | Webhook ARI/promosi (HK-2) | HMAC, bukan user JWT |
| 10 | `POST /api/juara/v1/bridge/league-stats-sync` | Webhook statistik liga (HK-2) | HMAC, bukan user JWT |

### 7.2 Zod schema inti (ringkasan)
```ts
const Role = z.enum(['OWN','CEO','SPO','COA','FIN','SEC']);
const NumberSource = z.enum(['TEMPLATE_PRD','INPUT_MANUAL_KLUB']);
const Dna = z.enum(['HIGH_PRESSING','POSITIONAL_PLAY','VERTICAL_COUNTER','BALANCED_HYBRID']);

const PlaybookGenerateInput = z.object({
  club_id: z.string().uuid(),                 // diverifikasi == juara_current_club_id()
  league_tier: z.enum(['LIGA_1','LIGA_2','LIGA_3','ACADEMY_PRO']),
  horizon_years: z.number().int().min(1).max(5),
  target_sporting_outcome: z.enum(['CHAMPION','PROMOTION','TOP_4','MID_TABLE_SUSTAINABLE']),
  tactical_dna_type: Dna,
  base_formation: z.string().max(20),
  squad_philosophy: z.object({
    star_grade_a_pct: z.number().min(0).max(100),
    competitive_grade_b_pct: z.number().min(0).max(100),
    academy_grade_c_pct: z.number().min(0).max(100),
  }),
  financial_guardrails: z.object({
    owner_equity_injection: z.number().int().nonnegative(),   // dienkripsi sebelum simpan
    scr_max_threshold_pct: z.number().min(0).max(100).default(65),
  }),
  source_label: NumberSource.default('TEMPLATE_PRD'),        // DES §11.4
}).strict().refine(v => v.club_id /* == club aktif */, { message: 'club_id di luar tenant' });

const ScrBreakdown = z.object({
  numerator: z.object({                                      // R2: 5 field
    gross_wages: z.number().int(), fixed_allowances_tax: z.number().int(),
    annual_amortization: z.number().int(), annual_agent_fees: z.number().int(),
    guaranteed_bonus: z.number().int(),
  }),
  denominator: z.object({                                    // R2: 6 field
    sponsorship: z.number().int(), ticketing_hospitality: z.number().int(),
    merchandise_net: z.number().int(), broadcast_subsidy: z.number().int(),
    other_commercial: z.number().int(), player_trading_profit: z.number().int(),
  }),
  calculated_scr_pct: z.number().min(0),
  scr_status: z.enum(['GREEN','YELLOW_WATCHLIST','RED_BREACH']),
});

const InviteInput = z.object({ email: z.string().email(), role: Role }).strict();
const BridgeWebhookInput = z.object({
  club_id: z.string().uuid(),
  event: z.enum(['ARI_UPDATE','PROMOTION_READY','LEAGUE_STATS']),
  payload: z.record(z.unknown()),
  occurred_at: z.string().datetime(),
  idempotency_key: z.string().min(8),
}).strict();
```
Response DTO dibuat eksplisit per peran (§5.1): field gaji/kontrak tidak pernah disertakan untuk SPO/COA/SEC. OpenAPI 3.1 formal = utang Sprint 0 cakupan penuh, tercatat (DES §11.6), bukan dihapus.

---

## 8. Tiga integration hook

| ID | Hook | Mekanisme | Batas |
|---|---|---|---|
| **HK-1** | Data akademi | `juara_clubs.academy_id` nullable → `public.academies(id)` (sudah ada di live) | Hook **Fase 2**; FK read-only; tabel B2C tidak diubah; join wajib tidak membocorkan tenant lain (CT-06) |
| **HK-2** | Webhook masuk (stadione-bridge) | `POST /bridge/academy-sync` + `/bridge/league-stats-sync`; header `X-Stadione-Signature: HMAC-SHA256` atas raw body, secret di environment (nama saja), verifikasi sebelum parse, `idempotency_key` | Hanya trusted server; `club_id` tetap divalidasi terhadap membership; tidak ada data klub riil sekarang (D3) |
| **HK-3** | Identitas & SSO | `auth.users` bersama (D4/K3); `auth.stadione.pro` sebagai integration point, **bukan dependensi hari pertama** (D2) | SSO menyusul butuh lampu hijau Owner (DNS/SSL/kredensial); tidak disentuh worker ini |

---

## 9. Urutan file migrasi (FILE SAJA — JANGAN di-apply)

> Daftar ini adalah **rencana nama file** di `supabase/migrations/`, mengikuti konvensi `202607300000NN_*.sql` yang sudah ada (terakhir `20260730000011_counters.sql`). Worker ini **tidak membuat, tidak menjalankan, tidak meng-apply** file-file ini. Eksekusi hanya setelah izin Owner terpisah.

| Urut | Nama file (rencana) | Isi |
|---|---|---|
| M-00 | `20261122000000_juara_types.sql` | 14 ENUM `juara_*`, fungsi `juara_touch_updated_at()`; **tanpa DDL tabel** |
| M-01 | `20261122000001_juara_clubs_members.sql` | `juara_clubs`, `juara_club_members`, `juara_current_club_id()`, `juara_has_role()`, policy + GRANT/REVOKE; `academy_id` FK ke `public.academies` |
| M-02 | `20261122000002_juara_playbooks_squad.sql` | `juara_playbooks`, `juara_squad_slots`, policy, index, constraint 26–28/grade |
| M-03 | `20261122000003_juara_players_contracts.sql` | `juara_players`, `juara_contracts_vault` (8 kolom `*_enc`), policy, index |
| M-04 | `20261122000004_juara_projections_audit.sql` | `juara_projections` (5+6 komponen SCR, ambang 550), `juara_audit_logs` append-only, policy |
| M-05 | `20261122000005_juara_templates_seed.sql` | 3 template PRD (A/B/C), `source_label='TEMPLATE_PRD'`; **tanpa data klub riil** (D3) |
| M-06 | `20261122000006_juara_hardening.sql` | `REVOKE ALL ... FROM service_role` untuk `juara_*`, `FORCE RLS` verifikasi, view inventaris policy untuk CT-10 |

Aturan urutan: tipe → root tenant+identitas → playbook/slot → player/vault → proyeksi/audit → seed → hardening. Setiap file membawa `BEGIN; … COMMIT;` dan komentar header `"JUARA — FILE SAJA. JANGAN di-apply tanpa izin Owner."`

---

## 10. Verifikasi, batas wewenang, dan yang butuh Owner

### 10.1 Verifikasi
- Skill `verify` (itqan-engineering) **tidak tersedia** di harness ini (tidak ada di daftar skill sesi; dicatat pula oleh Divisi 1 di RULEBOOK §15 dan PM di PM_RULINGS baris 28–30). Tidak digunakan, dan **tidak diklaim đã digunakan**.
- Pengganti yang dijalankan: (a) hitung ulang 36 sel RBAC → 12/20/4 = 36; (b) cocokkan 7 nama tabel D4/DES K2 + 1 audit → 8/8; (c) cocokkan field R1/R2/R6/R9 dengan RULEBOOK; (d) cross-check daftar 8 kolom sensitif dengan QA §5.1; (e) pastikan tidak ada kredensial/connection string/token di dokumen; (f) pastikan hanya satu file ditulis dan bukan kode produksi.
- `graphify query` dijalankan lebih dulu untuk memetakan konvensi Supabase/RLS existing; tidak ditemukan modul `juara_*` di kode produksi (wajar, Sprint 0 baru desain).

### 10.2 Batas wewenang — tidak dilakukan
Tidak ada migrasi/apply DB, deploy, DNS, SSL, push, restart container, kredensial, data klub riil, perubahan kode produk, atau pendaftaran domain. Satu-satunya file yang ditulis: `docs/juara/ARCHITECTURE.md`.

### 10.3 Diteruskan ke Owner (lewat PM) — tidak bisa diputuskan worker
1. Izin **apply file migrasi** M-00…M-06 dan siapa yang menjalankan.
2. **Kunci enkripsi**: siapa memegang, nama secret final, dan prosedur rotasi (DES §11.3).
3. Deploy, **DNS `juara.stadione.pro`**, SSL/TLS, hosting, dan kredensial (D2/D4; PRD Sprint 0 F-02).
4. **Data klub riil** teranonymisasi untuk UAT/gate v1.0 (D3) — bukan sekarang.
5. SSO `auth.stadione.pro` dan izin pen-test/OWASP ke live (D2; F-03).
6. Konfirmasi **multi-peran per user** (saat ini 1 peran/klub) dan usia JWT sebelum pencabutan keanggotaan (CT-05).
7. Konfirmasi penempatan `sponsor_contract_value_enc` di vault (F-06) oleh Divisi 6 QA v1.
8. Konfirmasi nuansa `FORCE RLS` pada `juara_club_members` (§4.2) oleh Divisi 6 QA v1 — `relrowsecurity=true` tetap terpenuhi, `FORCE` sengaja tidak dipakai untuk mencegah rekursi helper `SECURITY DEFINER`.

### 10.4 Temuan yang ditutup desain ini
F-01 (terminologi enkripsi aplikasi, bukan DB), F-04 (`club_id` JWT∩membership, bukan GUC klien), F-05 (prefix `juara_*`), F-06 (kolom sponsor dienkripsi, keputusan penempatan di §2.2.6), F-10 (`juara_audit_logs`). F-02/F-03/F-07/F-08/F-09 tetap menjadi catatan PM/dinas lain sesuai `SECURITY_QA_PLAN.md`.

---

*Dokumen ini adalah kontrak arsitektur untuk Divisi 4 (finance), Divisi 5 (academy), Divisi 2 (visualisasi), dan Divisi 6 (QA). Perubahan nama tabel/kolom wajib lewat PM dan penanda versi.*
