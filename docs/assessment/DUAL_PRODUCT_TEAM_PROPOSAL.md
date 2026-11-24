# Usulan revisi: JUARA utama + Stadione operations

24 November2026. Supersedes struktur A–F pada FEATURE_TEAM_RECOMMENDATION.md.
Status PROPOSED; belum reorganisasi/deploy/provider spend. Owner meminta kedua
produk tercakup, dengan JUARA sebagai proyek utama. KPI/lifecycle/transition dari
rekomendasi sebelumnya tetap berlaku, tetapi mapping domain diganti berikut.

| Pod | Product / outcome | Fitur | Proposed session |
|---|---|---|---|
| J1 Club Workspace & Governance | JUARA | boardroom, premium shell, club access/member governance, inbox/approval | div2_uiux |
| J2 Vision & Playbook | JUARA | wizard, draft/CAS, generate, snapshot versions/compare/export | div3_core |
| J3 Sporting & Player Pathway | JUARA | baseline/import, squad/tactics/depth, minutes/recruitment, academy pathway/integration | div1_domain; div5 contributes academy contract only |
| J4 Club Finance & Commercial | JUARA | contracts/cost/revenue, cashflow/SCR, scenario calculations, sponsor | div4_finance |
| S1 Venue Booking & Membership | Stadione | discovery/venue, court/calendar/pricing/reservation, fitness membership/entitlement | new primary session required |
| S2 Academy Operations | Stadione | enrollment/parent/coach, schedules/attendance, assessment/report/signature | div5_academy |
| S3 Payments & POS | Stadione shared transaction service | DOKU, receipt/refund/reconciliation, walk-in/shift/tenders | new primary session required |
| P1 Identity & Platform | shared product capabilities | account/tenant/workspace auth, staff, notification transport, CI/infra/observability | div6_devops |

J1 owns club-specific member/inbox/approval journey; P1 owns identity primitives.
J2 owns versioned scenario persistence/comparison UI; J4 owns financial calculation
contract, not duplicate scenario storage. J3 academy pathway is club-development,
S2 academy is venue enrollment/classes/parent reporting: connected but distinct.
Club cash projections J4 are not real-money payment collection S3.
S1 owns reservation/member entitlement, S3 monetary settlement; event contract
prevents both agents writing the same state. S3 is one owner, even consumed by
S1/S2. Shared QA/design/security consult never replaces feature owner accountability.

## Capacity / priority

Eight ownership domains do NOT mean eight runnable agents. Existing6 workers have
last-known429, no fresh execution probe; current implementation capacity only PM
proven. Two additional primary sessions needed for steady-state eight owners, plus
provider/quota/concurrency capacity for all. Do not activate new paid provider or
promise8parallel workers. Map proposed owners pending capability trial and Owner
approval; PM interim coordination until activated.

Pilot if3workers become available: lane1 J1 premium UI; lane2 J2 release readiness;
lane3 S3 payment blocker. If security review establishes urgent production exposure,
S3 gets priority capacity; do not bury it behind colour work. J3/J4/S2/S1 remain
contract/backlog work, not falsely reported active delivery. After blocker contained,
reserve roughly2/3 delivery capacity for JUARA; adjust based on measured burden.
At6 active lanes, add J3,J4 and S2/S1 by business priority, not eight nominal teams.
One active task per agent; separate worktrees; contracts/migrations integrated
serially. Owner reviews structure before rollout. PM verifies cost/capacity separately.

## Academy integration

See ACADEMY_INTEGRATION_PLAN.md: retain Stadione Academy operations, integrate with JUARA player pathway via scoped source contracts; no duplicate CRUD or deletion. J3 owns integration journey, S2 source adapter.
