> SUPERSEDED domain/team mapping: see DUAL_PRODUCT_TEAM_PROPOSAL.md (Owner scope: JUARA primary + Stadione). Lifecycle/KPI sections remain proposal.

# Assessment Feature-Based AI Team — Stadione

24 November 2026. **Usulan untuk review Owner; belum implementasi restrukturisasi.**
Scope: AI OpenCode saja, mencakup seluruh Stadione dan JUARA, bukan enam karyawan.
Assessment source tersedia; status produksi per fitur belum seluruhnya terverifikasi.
PM telah diminta memverifikasi capacity/live status. Unknown tidak boleh disulap menjadi Production.

## Kesimpulan dan alasan struktur

Bentuk enam domain ownership permanen, dengan maksimal tiga jalur delivery aktif
pada pilot. Setiap domain mempunyai satu Feature Owner agent yang menangani seluruh
lifecycle. Bukan enam silo frontend/backend/QA. Enam ownership tidak sama dengan
jaminan enam worker dapat berjalan: TEAM.md melaporkan keenam free workers mencapai
usage limit dan PM kembali mengerjakan sendiri. Sampai capacity probe berhasil,
kapasitas efektif hanya sesi yang terbukti bekerja; paralelisme belum dapat dijanjikan.

Pisahkan domain berdasarkan outcome dan batas data: booking berbeda dari money
movement; membership berbeda dari akademi; JUARA club planning berbeda dari venue
operations. Payments/POS digabung karena transaksi, kas dan refund terkait kuat.
Platform menjadi pemilik kapabilitas bersama, bukan tempat melempar bug fitur.

## Struktur dan mapping existing -> usulan

| Pod | Feature Owner yang diusulkan | Fitur milik tunggal | Kompetensi yang perlu terbukti | Kapasitas agent |
|---|---|---|---|---|
| A Discovery & Booking | ses_juara_div1_domain | Discovery/search, venue public, lapangan/slot/tarif, booking/cancel/reschedule/waitlist, booking calendar & reminders | Next full-stack, scheduling/concurrency, SQL/RLS, UX mobile | 1 primary; peer reviewer bergilir |
| B Membership & Fitness | ses_juara_div2_uiux | Plans/subscription, fitness classes/booking/check-in, freeze/extend/transfer, member lifecycle/expiry | Full-stack CRUD, entitlement state machine, UI/accessibility, background jobs | 1 primary; peer reviewer bergilir |
| C Club Intelligence / JUARA | ses_juara_div3_core | Vision/draft, playbook/engine/export, squad/tactics, club finance forecasts, recruitment, commercial scenarios, club governance | Football rules, deterministic engine, crypto/RBAC, tables/visualization | 1 primary; WIP ketat karena roadmap terbesar |
| D Payments & Front Desk | ses_juara_div4_finance | DOKU create/callback/refund, ledger/receipts, POS walk-in/shift/tender/cash reconciliation, platform fee/discount calculation | Payment state machine, idempotency, security, reconciliation, POS offline sync | 1 primary; mandatory independent review |
| E Academy & Athlete Development | ses_juara_div5_academy | Academy enrollment/classes/attendance, student-parent links, evaluations/report cards/signature, coach workflow, academy integration contract | Full-stack, minors privacy, PDF/reporting, assessment schema | 1 primary; independent privacy review |
| F Identity & Platform Services | ses_juara_div6_devops | Auth/profile/privacy, tenant/workspace/staff/roles, platform administration, notifications delivery, PWA shell/offline framework, platform observability/CI/infrastructure | IAM/RLS, CI/CD, infra/backup, observability, frontend shell | 1 primary; reserve shared review slots |

PM ses_dfd621110ffeVnw419vDE4qR43: portfolio priorities, capacity, contracts,
integration queue, release coordination, dependency escalation. Tidak menjadi
implementer semua fitur. Owner Representative: independent acceptance/arbitration.
Owner manusia: prioritas, biaya/provider dan persetujuan struktur.

**Mapping ini proposal, bukan bukti kompetensi.** Div1 sebelumnya domain research
belum terbukti coder booking; Div2 UI belum terbukti backend membership; Div6 shared
services berisiko overload. Capability trial read-only + satu task kecil staging
setelah approval diperlukan. Jangan mengganti nama sesi/menghapus historical team.

Shared resources adalah kapasitas yang dijadwalkan: F menyediakan infra/security
consult, UI specialist B membantu tokens/review, domain specialist A membantu C.
Owner fitur tetap A/B/C/D/E/C sesuai domain, termasuk incident dan deployment.
Tidak memindahkan accountability ke reviewer/shared QA. Untuk JUARA, C tetap owner
meskipun B membantu desain dan F meninjau security.

## Batas lintas domain yang wajib eksplisit

- Booking owns reservation/availability; D owns payment state/receipt/refund.
  Callback event payment.succeeded hanya mengubah reference/invoice yang tepat.
  A menutup incident user booking; D memperbaiki money adapter bila root cause di D.
- Membership entitlement milik B; transaksi membership milik D; POS UI milik D
  memanggil kontrak check-in B, bukan menulis tabel entitlement sembarang.
- Academy report/consent milik E; profile/auth/parent account milik F; relasi anak
  dan izin melihat raport disepakati E+F dengan E owner journey raport.
- JUARA club financial scenarios milik C, berbeda dari money collection D.
  Integrasi academy->JUARA: E owner sumber/events, C owner import/mapping dan outcome.
- Notifications transport F, template/reminder business rule pod pemilik fitur.
- Reports domain dimiliki pod masing-masing; F owns aggregation platform dashboard.
- CSS tokens/shared components F custodian, B visual adviser; fitur owner tetap
  accountable untuk penerapan dan screenshot. Palette JUARA sedang review premium.

## Lifecycle, incident dan accountability

Setiap feature ID mempunyai satu accountable owner agent, deputy, source boundaries,
contract version, status, acceptance, runbook, dashboards, alerts dan recovery path.
Requirement -> UX -> implementation -> tests -> staging -> review -> release ->
monitoring -> bugfix -> improvement seluruhnya tetap pada pod tersebut.

Production bukan selesai tanggung jawab. Owner menjaga backlog, SLO, regression,
review pascarilis dan insiden. Jika dependency gagal, owning pod mengoordinasikan
sampai journey pulih; root-cause pod menangani repair. PM menetapkan incident lead
maksimal satu, bukan membiarkan dua pod menunggu. Independent reviewer tidak menulis
approval atas pekerjaannya sendiri; review lintas pod dijadwalkan di awal.

Definition of Done: acceptance criteria + code/tests yang sesuai risiko + DTO/RLS
negative tests untuk sensitive paths + screenshot reviewed untuk UI + migration/
rollback + deploy artifact identity + smoke + monitoring/runbook + owner metadata.
Tidak boleh menandai Production dari keberadaan route atau build lulus.

## Paralelisme yang aman dan pembagian workload

Pilot tiga lane: D payment risk triage, C JUARA premium UI, A/B/E bergilir assessment
atau satu vertical slice prioritas. F shared readiness/support dan reviewer; PM
integration coordination. Ini urutan rekomendasi, bukan aktivasi implementasi baru.
Setelah quota/capacity terbukti, tambah sampai enam primary streams; jangan tambah
parallelism jika review queue/merge delay membesar.

Satu agent satu task aktif, paling banyak satu PR siap review per pod. Worktree dan
branch terpisah per feature ID. Sepakati DTO/API/mock fixtures sebelum coding
bersamaan. F menjaga migration registry; satu migration/release coordinator, nomor
migration unik. Shared auth, middleware, tokens dan payment contract wajib review
custodian. Merge integration berurutan, bukan semua agent push/deploy bersamaan.
Independent changes bisa develop/test paralel; perubahan schema incompatible harus
expand-contract dan rehearsed lebih dulu. Tidak membagi satu shared working tree
kepada enam concurrent writers.

Alokasi token/time budget per agent: 60% delivery,20% bugs/debt,10% review,10%
maintenance/monitoring. Ini starting budget, bukan ukuran produktivitas manusia.
Untuk F:40% platform delivery,40% shared service/review,20% maintenance. Jangan
menjadwalkan F sebagai satu agent platform penuh PLUS enam reviewer penuh.
Untuk D selama incident triage: prioritas correctness mengalahkan fitur baru.
C backlog terbesar dipecah phases; jangan memaksa jumlah fitur per pod sama.
Review capacity dan cost per accepted slice setiap minggu; jika F/C overload,
kurangi WIP dahulu lalu usulkan tambahan specialist session.

## Gap SDM AI dan kapasitas

Existing:6 worker terdaftar +1 PM; availability6 worker dilaporkan blocked quota.
Tidak ada bukti enam parallel slots/provider capacity aktif. Gap utama ialah
execution capacity, cross-stack capability Div1/Div2, reviewer independence,
observability/testing non-JUARA dan release discipline, bukan sekadar jumlah sesi.

Minimum pilot membutuhkan3 worker yang benar-benar executable + reviewer capacity
terjadwal + PM. Jika hanya1 aktif, tetap gunakan feature ownership tetapi delivery
serial; laporkan apa adanya. Target steady state6 primary workers + PM dengan peer
review bergilir. Optional tambahan1 reliability/QA reviewer bila utilization shared
review>80% atau review wait>1hari dalam2minggu; bukan hire wajib sejak hari pertama.
Jumlah worker baru/budget provider belum diputuskan. Jangan konversi6 sesi menjadi
6 FTE manusia atau menganggap agent tersedia24/7 tanpa trigger, quota dan host.

## KPI dan target awal (kalibrasi2minggu, bukan SLA produksi yang sudah dijanjikan)

| KPI | Target awal | Bukti/aturan |
|---|---|---|
| Ownership completeness | 100% inventory ID punya tepat1 accountable owner | registry check, proposed sampai approval |
| Evidence validity | 100% checkpoint punya SHA/env/assertion/log;0 klaim pass palsu | reviewer sampling; false claim perlu RCA |
| Delivery predictability | >=80% bounded slices dalam komitmen yang disepakati | denominator semua slices termasuk carryover |
| Lead time | median<=2 hari kerja untuk slice kecil setelah ready; lapor p85 | blocked time ditampilkan terpisah, tidak dihapus |
| Quality |0 escaped critical security/data-loss;100% critical journey regression | staging logs + incident register |
| Change failure rate | <=10% setelah sample cukup, lapor numerator/denominator | rollback/hotfix/incident akibat release |
| Visual acceptance |100% UI changes diperiksa gambar pada viewport wajib | reviewer receipt, bukan jumlah PNG |
| Reliability | service-specific SLO ditetapkan sesudah baseline; draft99.5% monthly | synthetic/real monitoring; bukan claim saat ini |
| Incident response | bila trigger+worker tersedia: triage P1<=15menit, mitigation plan<=60menit | jika unavailable eskalasi human/PM, tidak janji always-on |
| Cost efficiency | track token/cost per accepted slice + rework ratio, trend turun | jangan ukur LOC/commit/token sebanyak-banyaknya |
| Review queue | <=1 hari kerja; WIP1/agent | blocked/review timestamps |

Domain KPIs: A zero double-booking/inventory conflicts; B entitlement/check-in
consistency; C deterministic outputs + protected finance + visual acceptance;
D zero cross-invoice updates/duplicate settlement + reconciliation exceptions;
E tenant/parent isolation + reproducible report values; F auth denial correctness,
backup restore success dan CI/release availability. Target correctness invariants
100% dalam automated critical fixtures; baseline real production dikumpulkan dulu.

Evaluasi harian PM: work queue/blockers/capacity/evidence. Mingguan Owner Rep:
accepted vs rejected slices, incident/rework, budget, dependency waits. Dua mingguan
Owner: outcome/product demo dan keputusan capacity, bukan laporan jumlah commit.

## Transition plan dan gate persetujuan

0. Sekarang: assessment paralel read-only, inventaris repo/roadmap, availability
   verification dan triage payment static findings. Tidak restrukturisasi/deploy.
1. Review Owner: setujui6 domain ownership, pilot3lane, session mapping dan batas
   biaya. Artefak ini menjadi proposal konkret; capacity PM dapat mengubah mapping.
2. Setelah approval,1–2hari: registry ID->owner/deputy, backlog migration, branch/
   worktree isolation, contracts, definition-ready/done, alerts/checkpoint routing.
   Handoff harus memuat bugs/history/runbooks; functional docs tetap referensi.
3. Pilot5hari kerja:3lane dengan task kecil; feature owner mengurus sampai smoke/
   monitoring, reviewer independen. Tidak wajib deploy setiap slice bila gate belum.
4. Evaluasi2minggu: bandingkan lead time, false-pass/rework, cost, incident dan
   dependency waiting dengan baseline. Expand jika capacity dan quality terbukti;
   jika gagal kurangi WIP/perbaiki kontrak tanpa menghapus ownership.

Durasi bersifat planning envelope, bergantung kapasitas AI/provider, bukan janji
selesai platform. Rekomendasi akhir rollout menunggu laporan kapasitas PM dan
persetujuan Owner; assessment deliverables tidak menunggu data yang belum tersedia.
