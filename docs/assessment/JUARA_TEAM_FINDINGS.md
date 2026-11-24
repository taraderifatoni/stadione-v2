# JUARA assessment — feature inventory, AI agent roster and dependencies

Assessment date24November2026. Scope: repository/docs, no production interrogation
and no agent capacity probe. CTO_HANDOFF read, already ACKNOWLEDGED. Status below
uses newest Owner Representative audit over older sprint-complete claims. This is
an assessment for a proposed AI-agent organisation, not an implementation order.

## Status discipline

Production means deployment evidence exists for a baseline, not acceptance of
all intended behaviour. Testing means implementation with test/staging evidence;
Development means partial implementation; Backlog means planned/specification
only. A production feature can have a replacement in Testing. Do not collapse
those two states. Latest release audit accepts staging draft/CAS evidence only;
P1/D3/production release of that candidate remain unaccepted.

Sources: docs/juara/OWNER_REP_FINAL_RELEASE_EVIDENCE_AUDIT.md;
PM_EXECUTION_STATUS.md; OWNER_REP_TECHNICAL_PLAN.md§4,5,8,14,15;
src/app/api/juara/v1/**; src/lib/juara/**; src/components/juara/**.

## Master feature slice

|ID|Domain/feature and subfeatures|Status/current evidence|Dependencies / debt|
|---|---|---|---|
|J01|Club access: login, registration, callback, bootstrap, session, current club|Production baseline reported in PM ledger; source auth/register, clubs/bootstrap/me, auth callback|Supabase Auth, membership, tenant context; latest live verification still needed for inventory signoff|
|J02|Club governance: role capability/action checks, field DTO redaction, encrypted fields, RLS|Testing for latest hardened candidate; earlier baseline deployed|All private features; production M14/M16 not applied; do not equate earlier broad policies with current candidate|
|J03|Member invitation, acceptance, expiry, revocation|Development: invite route validates/authz then deliberately501 NOT_IMPLEMENTED|Auth, membership, secure token/outbox; no actual invitation delivery|
|J04|Vision wizard: league/target/horizon/equity/guardrails, allocation100%, tactical inputs|Production baseline; replacement UI Development/Testing|Domain validation and J05; incomplete live summary/season baseline compared to target|
|J05|Encrypted draft save/reload, finance split, atomic revision CAS, role-limited save, conflict recovery|Testing; final release evidence accepted staging,74tests reported verified|J02, keyring, M14/M16; deployment operational cleanup remains|
|J06|Tactics catalog:10 presets, auto/manual formation,6parameters, four-phase profile, labels|Production baseline reported; code/tests present|tactics.ts, validation.ts; False Nine role-vs-style semantics/domain calibration debt; no full tactics workspace|
|J07|Summary playbook generation:27slot count, age matrix, grade quota, tactical profile|Production baseline, code playbook.ts|Wizard; deliberately scrStatus MENUNGGU_ENGINE; not real squad or financial simulation|
|J08|Playbook persistence/list/archive UI|Production baseline reported; latest access-hardening Testing|J02,J07; versioned immutable snapshot/compare not same as current list/save|
|J09|PDF export from existing summary, watermark/redaction|Production baseline; MIME correction in tested candidate|pdf.ts/export route,J08,J02; full finance snapshot report/queue remains backlog|
|J10|Boardroom workspace/shell, premium tokens, responsive navigation|Development; existing basic shell deployed, D3 partial and palette rejected|D3_PREMIUM_VISUAL_BRIEF; actual inspector/decision canvas/actionbar unfinished; screenshot gates mandatory|
|J11|Shared table selection/filters, inspector/drawer, keyboard/focus/error/loading|Development/Backlog depending component; target D3|J10; treat shared UI implementation as pod deliverable not separate functional silo|
|J12|Club-season baseline, versioned competition/calendar/rules|Backlog(P2 foundations)|Club membership + domain fixtures; seasons target schema not evidence of implementation|
|J13|Player baseline/import: CSV preview/validation/duplicates/commit, provenance|Backlog(P2)|J12,J02; tables existing do not imply working import UI/API|
|J14|Squad roster,27unique players, assignments, role/age filters, coverage33, depth chart|Backlog(P2); counts/formulas in J07 not squad feature|J13,J06; unique-player vs coverage invariant|
|J15|Minutes allocation, eligibility, gap analysis, role fit/explanations|Backlog(P2)|J14 + match calendar; contract/finance read DTO contract|
|J16|Tactics workspace/pitch, in/out possession, role requirements|Backlog(P2; catalog already J06)|J14,J06; staged synthetic preview not operational feature|
|J17|Financial foundation: money precision, contracts/cost lines, calendar|Backlog(P3); amortization helper exists in formulas.ts|J12,J14, contract DTO; pure helper is not integrated finance engine|
|J18|CapEx/OpEx, fee/wages/bonus schedule, amortization/NBV, recognition vs cash|Backlog(P3); formula-only components implemented|J17; prevent double counting and time/rounding ambiguities|
|J19|Monthly cash, minimum buffer, runway/downside, cash gaps|Backlog(P3)|J18,J20; need real input-derived outputs|
|J20|Six revenue streams, revenue schedules/source confidence, matchday break-even|Backlog(P3)|Calendar/commercial inputs; formula/domain fixtures; no fixed demo KPI in product|
|J21|SCR internal classification, salary ceiling, explanations/remediation|Backlog(P3); classifyScr helper present, UI says waiting engine|J18,J20; equity must not count as revenue; no regulatory claim without expert rules validation|
|J22|What-if scenarios, compare up to3, immutable version hashes|Backlog(P4)|J14,J18–21; snapshot versioning central shared contract|
|J23|Decision review, finance clearance, owner approval, lock/fork/archive|Backlog(P4)|J22,J02; concurrency/role separation/audit|
|J24|Decision inbox/tasks, due dates/dedup/resolution|Backlog(P4/R2)|J15,J19,J23 + events/outbox; avoid fabricated alerts|
|J25|Snapshot PDF/report/export jobs, private files, durable notifications|Backlog(P4/R2)|J22,J23,J02,shared job infrastructure; existing PDF J09 partial predecessor|
|J26|Recruitment targets, gap-to-pipeline, shortlist, budget ceiling, negotiation|Backlog(R2)|J15,J21,J23; Academy integration spec§6|
|J27|Contracts/renewal/expiry radar, step-up/release clauses, strategic loans|Backlog(R2)|J14,J17,J26; sensitive data & domain review|
|J28|Academy assessment/ARI, IDP, mentor/pathway, target minutes|Backlog(R2); computeAri helper exists only|J13,J15,J27; Academy B2C is related platform domain, not same JUARA feature|
|J29|Sponsor inventory/rate-card/agreements, actual-vs-plan|Backlog(R2)|J20,J19; contract vs pipeline confidence|
|J30|Fine-grained permissions, multi-club selector|Backlog(R2 subject to validated need)|J01/J02; selectors cannot change tenant trust boundary|
|J31|Stadione academy bridge/HMAC webhook, academy sync|Backlog(R3; spec explicitly DESIGN ONLY)|B2C academy canonical identity, J28, external contracts/idempotency|
|J32|Licensed operator stats, telemetry, SSO, ticketing/merchandise integration|Backlog(R3)|External rights/providers + platform booking/payment/identity; no assumed licence/access|
|J33|Bio-banding/PHV, RAE, protected technical asset, predictive player value, health|Backlog beyond pilot|Validated domain/data inputs/permissions; deliberately not pilot blocker|
|J34|Audit trail/events, outbox/retry, observability, staging/migrations/backup/restore|Testing/Development mixed; staging rehearsal proven, target durable pipeline not all built|All pods require common contracts; cleanup/env restoration noted before deployment|

## Existing AI-agent mapping: facts, not assumed live capacity

TEAM.md explicitly lists historical worker sessions created22Nov2026. All six
reported free quota exhausted24Nov. PM opted to execute subsequent work in its own
native session. That is one effective implementation lane, not six active teams.
Roster itself does not prove agent health/model availability today; PM must run
nonmutating capacity probes and record actual configured concurrency/budget.

|Existing session|Recorded functional role/artifact|Proposed feature placement|Specific gap|
|---|---|---|---|
|ses_dfd621110ffeVnw419vDE4qR43|PM, integrator; historical sole implementer after quota exhaustion|Portfolio/integration coordinator, not default owner of every feature|Evidence accuracy, QA precheck, delegation and workload tracking; reviewer found repeated overstated evidence|
|ses_juara_div3_core|Core platform/playbook/squad; ARCHITECTURE.md|Candidate DRI Sporting Planning pod(J04–08,J12–16,J22 core)|Needs tested full-stack delivery evidence and live capacity; doc completion not implementation competence proof|
|ses_juara_div4_finance|Finance/commercial ops; FINANCE_SPEC.md|Candidate DRI Club Economics pod(J17–21,J29)|Need integration/tests/UX capability beyond spec|
|ses_juara_div5_academy|Academy/scouting/bridge; ACADEMY_INTEGRATION_SPEC.md|Candidate DRI Talent Pathway pod(J26–28,J31)|Depends on squad/finance contracts; do not start full implementation before contract gates|
|ses_juara_div2_uiux|UIUX_SPEC.md|Candidate DRI Boardroom Decisions pod(J10–11,J23–25), embedded UI support by booked capacity|Need end-to-end engineering/QA, not designer-only handoff; palette/visual direction still rejected|
|ses_juara_div1_domain|RULEBOOK.md|Shared domain/rules contract steward, assigned review capacity to sporting/economics/talent|No feature owner dilution: pod DRI remains accountable; thresholds not automatically validated expertise|
|ses_juara_div6_devops|SECURITY_QA_PLAN.md|Shared Platform Reliability/Security product steward(J01–03,J34) plus independent release checks|QA must also be owned/executed in every feature pod; central agent must not become all-QA queue|

This mapping is a proposal for JUARA alone. Parent assessment should merge shared
identity/operations and B2C academy counterparts across the entire platform.
Feature pods are work queues with one DRI, not invented additional agents. A sole
agent per pod can perform end-to-end tasks sequentially, with review from a second
agent; availability must be proven before promising parallel speedup. No human
FTE/headcount recommendation applies: user clarified AI OpenCode agents only.

## Dependency contract and feasible parallelism

Foundation contracts: club/season identity + capability/DTO + money/calendar +
version/hash + events. Freeze minimal versioned interface first, then:
- Boardroom/visual can work now from current APIs + labelled synthetic preview.
- Sporting can implement baseline/roster against approved tenant/catalog contracts.
- Economics can implement golden fixtures/pure schedule engine independently from
  real squad DB, using agreed input/output contracts; integration waits roster costs.
- Talent pod can define fixtures/API contract/IDP prototype while waiting roster,
  but full recruitment/loan/academy integrations remain later queue.
- Shared reliability agent can check migration/observability/contracts concurrently.
- Compare/approval/exports depend on stable sporting+economics snapshots; cannot
  make their dependency disappear by spawning more agents.

Use isolated worktree/branch per feature slice, exclusive ownership of migrations
and high-contention files, contract tests at integration, one merge/release lane.
Integration PM serializes migration allocation and deployments; feature DRI owns
postdeploy health, incident response, repair and continuous improvement. Max active
feature slices should equal measured available agent slots minus reviewer/integrator
capacity. Start with at most2 implementation slices +1 reviewer where capacity is
proven; raise only after two cycles meet quality/delivery goals. This is a planning
recommendation, not a statement that those resources currently exist.

## Proposed measures and remaining factual gaps for PM

Per feature DRI: accepted functional journey with runtime/visual evidence; no false
completion claims; cycle time/WIP/blocked time; escaped regressions; response/restore
metrics; postrelease ownership. Do not reward lines of code, commit count or raw
agent output. Shared resources own stable interfaces, runbooks and SLOs for their
services, while consumer pod retains user-facing outcome accountability.

PM must supply: live session/provider/quota/cost/concurrency matrix; last5 accepted
changes by worker; current active tasks and file conflicts; actual production
commit/migration map; telemetry/incident/bug backlog; roadmap priorities and
estimated slice effort. These are not present in TEAM.md and cannot be fabricated.
The historic quota exhaustion is an evidenced bottleneck, not proof that adding
six named pods enables six parallel implementers.
