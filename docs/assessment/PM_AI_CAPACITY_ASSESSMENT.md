# PM AI Capacity & Feature-Based Restructuring Assessment — Stadione/JUARA

Tanggal: 24 Nov 2026. Status: **ASSESSMENT / REKOMENDASI — belum ada reorganisasi permanen, deploy, migrasi, push, transaksi riil, atau provider berbayar.** Mandat Owner: penilaian untuk AI OpenCode, bukan manusia; presentasi rekomendasi mendahului implementasi struktur.

## 1. Ringkasan eksekutif

- Enam worker existing **ada di DB** tetapi **0 terbukti bisa berjalan** saat assessment: semua ber-`idle_outcome = failed` dengan `provider.free-limit` HTTP 429 pada 08.37–08.38 WIB. Kapasitas terobservasi: **1 sesi PM native aktif**, **1 CTO plausibel**. Konkurensi worker maksimal yang pernah dibuktikan **3**, bukan 6（`docs/assessment/AI_WORKER_CAPACITY.md`）.
- Semua sesi `cost = 0.0`. Model gratis yang dicoba worker tetap kena kuota akun/harian. **Dilarang** memakai provider/model berbayar tanpa lampu hijau Owner. Tidak ada probe kuota baru dan tidak ada tugas worker baru.
- Produksi berjalan (`stadione.service active`, HTTP 200) tetapi **deployed HEAD `6425ae5` tertinggal** dari lokal `063c1c8`. DB produksi baru sampai M-13/M-15 parsial: policy 7 tabel masih `ALL`, `vision_revision` belum ada. Semua acceptance JUARA adalah **staging**, bukan produksi（`docs/assessment/PRODUCTION_STATUS_MAP.md`）.
- Payment static triage mengonfirmasi **empat jalur konkret** yang memungkinkan perubahan state pembayaran tanpa otorisasi/validasi. Ini **REAL BLOCKER** pada level source yang di-deploy, **bukan klaim eksploit live**（`docs/assessment/PAYMENT_STATIC_TRIAGE.md`）.
- Kandidat D3 graphite/navy/cobalt masih **provisional**, belum di-deploy; palet hijau/emas lama ditolak Owner（`docs/juara/D3_PREMIUM_VISUAL_BRIEF.md`, `docs/juara/design/D3_COLOR_REFERENCES.md`）.

## 2. Roster kapasitas AI (ringkas)

| Sesi | Status operasional | Model saat ini | Kompetensi terbukti | Catatan |
|---|---|---|---|---|
| `ses_juara_div1_domain` | ada, 429 free-limit | `opencode/mimo-v2.6-flash-free` | `RULEBOOK.md`, 27 test vector | tidak di-probe ulang |
| `ses_juara_div2_uiux` | ada, 429 free-limit | `opencode/iceman-free` | `UIUX_SPEC.md` 9 workspace | tidak di-probe ulang |
| `ses_juara_div3_core` | ada, 429 free-limit | `opencode/iceman-free` | `ARCHITECTURE.md` 8 tabel/RLS | tidak di-probe ulang |
| `ses_juara_div4_finance` | ada, 429 free-limit | `opencode/iceman-free` | `FINANCE_SPEC.md` SCR/break-even | tidak di-probe ulang |
| `ses_juara_div5_academy` | ada, 429 free-limit | `opencode/iceman-free` | `ACADEMY_INTEGRATION_SPEC.md` | tidak di-probe ulang |
| `ses_juara_div6_devops` | ada, 429 free-limit | `opencode/iceman-free`, agent `build` | `SECURITY_QA_PLAN.md` v1 | tidak di-probe ulang |
| PM `ses_dfd621110ffeVnw419vDE4qR43` | **aktif** | `opencode-go/hy4-flash-free#high` | implementasi slice feature-based, 57–74 test | `parent_id = NULL` di DB (selisih dengan TEAM.md) |
| CTO `ses_dff75dd2effeCFUgcR7oA66Mu8` | plausibel, idle succeeded | `opencode-go/hy4-flash-free#high` | governance/audit | bukan implementer |

Batas: 0 worker runnable berdasarkan bukti terakhir; PM + CTO = maksimal 2 slot, konkurensi output terbukti 1 saat ini. Detail di `AI_WORKER_CAPACITY.md`.

## 3. Peta fitur & utang (validasi inventory)

Assessment paralel selesai. Inventaris utama: **86 kelompok fitur logis** di
`docs/assessment/MASTER_FEATURE_INVENTORY.csv` (+ `.md`), dengan rincian:
- `docs/assessment/B2C_FEATURE_MAP.md` (12 area B2C, 509 baris) dan `PLATFORM_FEATURE_FINDINGS.md`;
- `docs/assessment/JUARA_FEATURE_MAP.md` (11 kapabilitas JUARA) dan `JUARA_TEAM_FINDINGS.md`;
- `docs/assessment/FEATURE_DEPENDENCIES.md` untuk kontrak antarpod;
- `docs/assessment/FEATURE_TEAM_RECOMMENDATION.md` sebagai **usulan utama** yang mengungguli mapping alternatif di findings.

Status `assessment_stage` CSV: `Development 55`, `Production 6`, `Testing 3`, `Backlog 22`.
Pod usulan: `C 34`, `F 17`, `A 12`, `D 10`, `E 7`, `B 6`. **86/86 ownership = Proposed;
PM interim pending Owner approval** — tidak ada yang dianggap disetujui atau di-reassign.

B2C: tidak ada bukti `ACCEPTED`; tidak ada test suite B2C; `DEPLOYED` hanya klaim
platform-level dengan SHA tidak konsisten (`063c1c8` lokal, `6425ae5` P1, `019ebcd` baseline,
`96e78e6` PM_LOG). Tidak ada DRI B2C saat ini; penulis commit terakhir `bigblaz` (Agustus 2026).
Risk tambahan di luar payment: raport publik `Math.random()`, offline queue menjatuhkan tipe
`attendance`/`booking`, check-in offline tanpa auth, invoice POS acak, DOKU walk-in tidak
menghasilkan link.

JUARA: `063c1c8` hanya `ACCEPTED` untuk slice draft/CAS/reconciliation **di staging**.
Produksi, P1, D3 belum accepted; M-14/M-16 staging-only; engine finance `MENUNGGU_ENGINE`;
SEC-02 invite stub; akun demo aktif; malformed-finance regression hilang dari runner terbaru.
RLS anon+authenticated terverifikasi, bukan seluruh role/aksi. D3 visual provisional
(`src/app/juara/juara.css`, `D3_COLOR_REFERENCES.md`, referensi Mobbin) belum di-commit/di-deploy/diterima.

Fakta source yang sudah pasti: `createAdminClient()` dipakai di callback/create/refund;
middleware skip `/api/`; amount dari body; status `paid` ditulis saat URL checkout dibuat.

## 4. Rekomendasi struktur FEATURE-BASED (belum dieksekusi)

**Rekomendasi utama (dari `FEATURE_TEAM_RECOMMENDATION.md`) — proposal, bukan keputusan:**

| Pod | Feature Owner usulan | Investment fitur | Status kapasitas |
|---|---|---|---|
| A Discovery & Booking | `ses_juara_div1_domain` | discovery, venue, slot/tarif, booking/cancel/reschedule/waitlist, calendar/reminder | 0 worker runnable; kompetensi booking **belum terbukti** |
| B Membership & Fitness | `ses_juara_div2_uiux` | plans/subscription, fitness, check-in, freeze/extend/transfer, lifecycle | 0 worker runnable; backend membership belum terbukti |
| C Club Intelligence / JUARA | `ses_juara_div3_core` | vision/draft, playbook/engine/export, squad/tactics, club finance, recruitment, commercial, governance | 0 worker runnable; PM proven di slice CAS |
| D Payments & Front Desk | `ses_juara_div4_finance` | DOKU create/callback/refund, ledger, POS, shift/tender, fee/discount | 0 worker runnable; **blocker aktif**, review independen wajib |
| E Academy & Athlete Development | `ses_juara_div5_academy` | enrollment, attendance, parent links, report cards, coach workflow, integration contract | 0 worker runnable; privacy minor perlu review |
| F Identity & Platform Services | `ses_juara_div6_devops` | auth/profile, tenant/staff/roles, admin, notifications, PWA shell, CI/CD, observability | 0 worker runnable; risiko overload shared review |

PM `ses_dfd621110ffeVnw419vDE4qR43`: portfolio, kontrak, koordinasi dependency, release — bukan
implementer semua fitur. CTO governance/audit saja. Owner manusia: struktur, biaya, provider.
Pilot **maksimal 3 lane aktif** (D payment risk, C JUARA premium UI, A/B/E bergilir), F shared
reviewer/custodian. Enam ownership ≠ enam worker jalan. Tidak ada rename/reassign permanen,
tidak ada paid capacity sebelum Owner menyetujui.

## 5. Payment blocker (dikonfirmasi read-only source + deployed revision)

**REAL BLOCKER — dilaporkan apa adanya, bukan klaim eksploit live.** Empat jalur konkret:
1. `src/app/api/payment/callback/route.ts:3` mengimpor `validateDokuNotification` tetapi tidak
   memanggilnya; body dipercaya, admin client mengubah `payment_records`, `bookings`, notifikasi.
2. `callback/route.ts:62-80` mengubah **semua** transaksi POS DOKU pending tanpa filter invoice
   dan di luar blok `if (payment)`.
3. `create/route.ts:6,7,24-39` menerima `amount` dari body, memakai admin client, menulis
   `status:"paid"` saat URL checkout dibuat.
4. `refund/route.ts:5-12` tanpa auth; `:52-55` menelan kegagalan provider; `:58-83` tetap
   refunded/canceled/approved meski refund provider gagal.

Saya mengunjungi ulang source dan meng-hash file lokal vs file `HEAD` VPS (read-only):
`callback 457dc68e…`, `create bd18a346…`, `refund 9295c908…`, `lib/doku/client ca0ce85d…`,
`lib/doku/refund fbf97cf5…` — **identik**. Jadi temuan berlaku pada source yang di-deploy,
meski HEAD lokal `063c1c8` dan deployed `6425ae5` berbeda.
**UNKNOWN:** proteksi infra/WAF, konfigurasi merchant DOKU, dan constraint DB produksi; ini
mengubah eksploitabilitas, bukan keberadaan jalur kode. Rekomendasi: HMAC+timestamp/replay,
scope update per invoice, derivasi amount server-side + status `pending` sampai callback terverifikasi,
otorisasi kasir/venue dan fail-closed refund. Tidak ada perbaikan/transaksi riil yang dijalankan.

## 6. Urutan sebelum implementasi struktur

1. Owner menetapkan apakah payment blocker ditangani lebih dulu (disarankan: ya, sebelum fitur pod baru).
2. Owner menyetujui/menolak peta pod di atas; belum ada reassignment permanen.
3. Jika worker tetap 429, PM native menjalankan satu slice pada satu waktu; CTO audit read-only.
4. Production cutover terpisah: sinkronkan HEAD `063c1c8` → produksi, migrasi atomik M-14/M-16, backup/restore, smoke; **tidak** termasuk mandat assessment ini.
5. D3 visual menunggu review terpisah; tidak di-deploy.

## 7. Batas bukti

- Tidak ada deploy, push, restart, migrasi, transaksi, kredensial, atau perubahan sesi.
- Tidak ada probe kuota; tidak ada model berbayar dipilih.
- Worker assessment berjalan paralel dan hasilnya disimpan sebagai dokumen pendukung; tidak ada klaim kapasitas baru.
- `git status` lokal memuat pekerjaan D3 provisional dan file Owner Representative; tidak saya ubah dalam assessment ini.
