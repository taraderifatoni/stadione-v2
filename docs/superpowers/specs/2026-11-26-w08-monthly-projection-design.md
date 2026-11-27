# W08 Monthly Projection — Bounded Pure Design

Status: design direction approved by OwnerRep on 26 November 2026; independent builder check completed 27 November 2026; five conservative v1 semantics await Owner confirmation. This is a deterministic model contract, not accounting/legal advice, an authorization boundary, or production approval.

Sources:
- `docs/execution/OWNER_REP_W07_DTO_ACCEPTANCE_W08_DIRECTIVE.md`
- Accepted W07 worktree `bcc306/w07-dto-pm@3e1466e`
- `docs/juara/RULEBOOK.md` §§5–7

## Intent

Deliver the first independently reviewable W08 slice: a pure monthly projection over the accepted W07 contract, with exact cash conservation, explicit recognition policy, provenance, completeness, and role-safe aggregate DTOs. Numeric behavior must be reviewable before any route, UI, database, provider, or live financial action exists.

## Goals

- Validate every input and reject mixed club/season data plus normalized duplicate/conflicting identities before aggregation.
- Carry opening cash monthly with separate operating, investing, and financing flows; closing cash is exact and may be negative.
- Keep cash timing separate from expense/revenue recognition.
- Require an explicit versioned `NONE` / `EXPENSE` / `CAPITALIZE` classification for every event.
- Count CAPEX as cash only; recognize it through amortization only when an explicit schedule and duration exist.
- Compute SCR only from explicit input flags and versioned model thresholds; expose unavailable/invalid states instead of invented values.
- Emit provenance, policy/model versions, units, periods, completeness, and unavailable reasons.
- Define a role-safe aggregate DTO without authorizing any endpoint or UI.

## Non-goals and anti-goals

- No route, UI, screenshot work, DB migration, provider/payment call, production write, deploy, W09 snapshot, or live financial action.
- No inference of accounting treatment from labels, amounts, dates, source kind, or TypeScript annotations.
- No default classification, amortization duration, opening balance, denominator, threshold, or season authority.
- No silent omission of unsupported/future events or unresolved model semantics.
- No claim that the DTO allowlist is a complete permission design.
- No changes to accepted W07/W05/W06 behavior.

## Constraints

- Money is exact W07 `MoneyDTO`: `{ amountMinor: string, currency: "IDR", scale: 2 }`.
- Dates use W07 strict `YYYY-MM-DD`; periods are half-open and Asia/Jakarta `+07:00`.
- Fiscal context is explicit: July start and a resolved season ID supplied by the caller.
- `asOfDate` is date-granular and inclusive; event `effectiveDate` has no time component.
- Horizon v1 has a technical safety maximum of 120 months. This is an implementation bound, not an accounting rule.
- All public outputs are fresh projections; caller mutation cannot alter results.

## Approaches considered

1. **Policy overlay on W07 events (chosen).** Keep W07 identity, cash, revenue, and SCR flags canonical; add only explicit cost-recognition treatment and model thresholds. This avoids duplicating accepted contracts.
2. **New W08 event schema.** Rejected because it duplicates W07 identity/cash fields and creates drift.
3. **Infer treatment from W07 labels/assumptions.** Rejected because it hides accounting decisions and violates the directive.

## Canonical interface

Constants:

```ts
export const W08_POLICY_VERSION = "w08-monthly-projection-v1"
export const W08_MODEL_VERSION = "w08-monthly-model-v1"
export const W08_MAX_HORIZON_MONTHS = 120
```

Inputs:

```ts
interface MonthlyProjectionInput {
  policyVersion: typeof W08_POLICY_VERSION
  modelVersion: typeof W08_MODEL_VERSION
  clubId: string
  seasonId: string
  resolvedContext: ResolvedFiscalContext
  asOfDate: string
  startPeriod: string // YYYY-MM
  openingCash: MoneyDTO
  events: ContractEvent[]
  modelPolicy: ModelPolicy
}

interface ModelPolicy {
  modelVersion: typeof W08_MODEL_VERSION
  costTreatments: Record<string, CostTreatment>
  scrThresholdsBps: {
    greenMax: number
    yellowMax: number
  }
}

type CostTreatment =
  | { kind: "NONE" }
  | { kind: "EXPENSE"; recognition: "EFFECTIVE_MONTH" }
  | {
      kind: "CAPITALIZE"
      schedule: {
        startPeriod: string // YYYY-MM
        durationMonths: number // positive safe integer
        rounding: "EXACT_MINOR_RESIDUAL_LAST"
      }
    }
```

`projectMonthly(input: unknown, role: W07Role)` returns:

```ts
type ProjectionResult =
  | { ok: true; output: RoleSafeProjectionDTO }
  | { ok: false; issues: ProjectionIssue[] }

interface ProjectionIssue {
  code: string
  path: string
  message: string
}
```

No default value is supplied for any input field. Unsupported policy/model versions fail explicitly.

## Validation order

All validation completes before any cash or recognition arithmetic:

1. Strict input/policy/treatment/schedule/threshold key sets and primitive types.
2. Exact opening cash, club/season IDs, resolved context, as-of date, start period, and horizon.
3. Every W07 event is validated into a fresh normalized DTO.
4. All events match the requested club and season.
5. W07 normalized duplicate/conflicting identity validation runs across the full event array.
6. `costTreatments` covers exactly the normalized event IDs: missing and extra classifications are errors.
7. Treatment consistency:
   - `FINANCING` must be `NONE`, never revenue, SCR numerator, or SCR denominator.
   - `CAPITALIZE` requires investing classification, no revenue/denominator recognition, and a complete explicit schedule.
   - `EXPENSE` recognizes the event amount in its effective month and never creates amortization.
   - `NONE` creates no expense or amortization.
8. A CAPITALIZE schedule beginning before the projection horizon is invalid because v1 has no opening-NBV input. A schedule may extend beyond as-of; the unrecognized remainder is reported.

Events outside the horizon are not silently dropped. They are listed in completeness with `BEFORE_HORIZON` or `AFTER_AS_OF` reasons. Opening cash is authoritative at the horizon start; W08 does not reconstruct prior cash.

## Recognition and cash rules

- **Cash:** W07 `CASH_IN`/`CASH_OUT` events affect the effective month. `NON_CASH` never affects cash. Cash classes remain separate.
- **Revenue:** W07 `revenue: true` recognizes the amount in the effective month. Deferred/accrual revenue schedules are unsupported in v1, not guessed.
- **Expense:** `EXPENSE` recognizes the amount in the effective month.
- **CAPEX:** `CAPITALIZE` records the cash event but no immediate expense. Monthly amortization is derived from the same event ID and explicit schedule.
- **No double count:** a CAPITALIZE event can contribute its full amount to cash and derived monthly amounts to expense/SCR numerator, never the full amount to expense. An EXPENSE event never produces amortization.
- **Installments:** each input event remains a distinct W07 identity. V1 does not infer asset grouping across installments; every CAPITALIZE event must carry its own explicit schedule. Grouping semantics remain an Owner decision.

Amortization uses exact integer minor units. Each non-final month receives the exact truncated share; the final scheduled month receives the residual. Negative totals use the same deterministic rule. No binary floating-point arithmetic is used.

## Monthly output

```ts
interface MonthlyProjectionDTO {
  policyVersion: string
  modelVersion: string
  clubId: string
  seasonId: string
  resolvedContext: ResolvedFiscalContext
  asOfDate: string
  horizon: { startPeriod: string; endPeriodInclusive: string }
  openingCash: MoneyDTO
  periods: MonthlyProjectionPeriodDTO[]
  totals: ProjectionTotalsDTO
  scr: ScrResult
  completeness: ProjectionCompleteness
}

interface MonthlyProjectionPeriodDTO {
  period: string // YYYY-MM
  startDate: string
  endDateExclusive: string
  openingCash: MoneyDTO
  operatingInflow: MoneyDTO
  investingInflow: MoneyDTO
  financingInflow: MoneyDTO
  totalInflow: MoneyDTO
  operatingOutflow: MoneyDTO
  investingOutflow: MoneyDTO
  financingOutflow: MoneyDTO
  totalOutflow: MoneyDTO
  closingCash: MoneyDTO
  recognizedRevenue: MoneyDTO
  recognizedExpense: MoneyDTO
  scrNumerator: MoneyDTO
  scrDenominator: MoneyDTO
  contributions: ProjectionContributionDTO[]
}

interface ProjectionTotalsDTO {
  operatingInflow: MoneyDTO
  investingInflow: MoneyDTO
  financingInflow: MoneyDTO
  totalInflow: MoneyDTO
  operatingOutflow: MoneyDTO
  investingOutflow: MoneyDTO
  financingOutflow: MoneyDTO
  totalOutflow: MoneyDTO
  closingCash: MoneyDTO
  recognizedRevenue: MoneyDTO
  recognizedExpense: MoneyDTO
  scrNumerator: MoneyDTO
  scrDenominator: MoneyDTO
}

interface ProjectionContributionDTO {
  contributionId: string // `${eventId}#${component}#${period}`
  eventId: string
  derivedFromEventId?: string
  sourceKind: SourceKind
  sourceLabel: string
  sourceRef: string
  classification: CostTreatment["kind"]
  component:
    | "CASH_IN"
    | "CASH_OUT"
    | "REVENUE"
    | "EXPENSE"
    | "AMORTIZATION"
    | "SCR_NUMERATOR"
    | "SCR_DENOMINATOR"
  period: string
  amount: MoneyDTO
  units: "IDR_MINOR"
  policyVersion: string
  modelVersion: string
}
```

Cash conservation is exact per month and across the horizon:

`closing = opening + totalInflow - totalOutflow`

`totalOutflow = operatingOutflow + investingOutflow + financingOutflow`

No implicit funding or remedial action is inserted when closing is negative.

## SCR contract

SCR uses recognized numerator/denominator contributions, not raw cash. A CAPITALIZE event contributes amortization to the numerator only when its W07 `scrNumerator` flag is true; the full capex amount never enters the numerator directly.

```ts
type ScrResult =
  | {
      status: "AVAILABLE"
      numerator: MoneyDTO
      denominator: MoneyDTO
      roundedRatioBps: string
      zone: "GREEN" | "YELLOW" | "RED"
      thresholdsBps: { greenMax: number; yellowMax: number }
    }
  | {
      status: "UNAVAILABLE"
      reason: "DENOMINATOR_MISSING" | "DENOMINATOR_ZERO" | "DENOMINATOR_NEGATIVE"
      numerator?: MoneyDTO
      denominator?: MoneyDTO
      unavailableFields: string[]
    }
```

Zone comparison uses exact integer cross-multiplication against the supplied thresholds. `roundedRatioBps` is a named final display boundary using exact half-up rounding. Thresholds are model parameters only; no legal/compliance claim is made.

## Completeness and provenance

```ts
interface ProjectionCompleteness {
  status: "COMPLETE" | "PARTIAL"
  includedEventIds: string[]
  excludedEvents: Array<{
    eventId: string
    reason: "BEFORE_HORIZON" | "AFTER_AS_OF"
  }>
  unrecognizedAmortization: Array<{
    eventId: string
    remainingMinor: string
    reason: "SCHEDULE_EXTENDS_AFTER_AS_OF"
  }>
  unavailableFields: Array<{ field: string; reason: string }>
}
```

Every numeric contribution has a deterministic `contributionId` formed from `eventId`, component, and period. Derived amortization keeps the originating `eventId`, sets `derivedFromEventId`, uses `sourceKind: "DERIVED_ONLY"`, and preserves the originating `sourceLabel`/`sourceRef` for audit. Each aggregate component receives its own contribution row; rows are sorted by `contributionId`. Unsupported semantics are errors or explicit unavailable fields; they are never replaced with defaults.

Completeness is `PARTIAL` when any event is excluded or any amortization remains unrecognized after as-of. An unavailable SCR field is listed explicitly but does not by itself make cash/recognition completeness partial.

## Role-safe aggregate DTO

The numeric core produces `MonthlyProjectionDTO`. The public pure boundary projects it by role:

```ts
type RoleSafeProjectionDTO =
  | { role: "OWN" | "CEO" | "FIN"; projection: MonthlyProjectionDTO }
  | {
      role: "SPO" | "COA" | "SEC"
      policyVersion: string
      modelVersion: string
      clubId: string
      seasonId: string
      periodCount: number
      completenessStatus: "COMPLETE" | "PARTIAL"
      unavailableFieldNames: string[]
    }
```

Restricted roles receive exactly the listed keys: no amounts, SCR status/zone/thresholds, event IDs, source references, contribution classifications, or exclusion details. Unknown role returns `UNSUPPORTED_ROLE`. This is an output allowlist consistent with W07, not proof of future endpoint authorization.

## Builder-check decisions requiring Owner confirmation

These are conservative v1 proposals, not hidden defaults:

1. **As-of boundary:** require `asOfDate` to be the last calendar day of a month. Emit full monthly buckets through that month; exclude events after that date. No mid-month proration is inferred.
2. **Treatment matrix:** `CAPITALIZE` requires `INVESTING` + `CASH_OUT`; `EXPENSE` requires `OPERATING` + `CASH_OUT` or `NON_CASH`; `FINANCING` must be `NONE` with all revenue/SCR flags false. `scrDenominator` requires `revenue: true`; `scrNumerator` requires `EXPENSE` or `CAPITALIZE`.
3. **Supersedes:** reject any W07 event carrying `supersedes` in v1 with `SUPERSEDES_UNSUPPORTED` until chain semantics are supplied.
4. **Outside-horizon events:** exclude the entire event and all schedule-derived amortization. A pre-horizon CAPEX schedule cannot contribute without opening NBV. A future event cannot contribute amortization even if its schedule has started.
5. **SCR window:** summarize horizon totals. `DENOMINATOR_MISSING` means no included denominator-flagged contribution; `ZERO` means contributions exist but sum to zero; `NEGATIVE` means the sum is negative. Known numerator/denominator values remain populated in unavailable results.

## Explicit open decisions for Owner

- Deferred/accrual revenue recognition beyond the effective month.
- Asset grouping and opening NBV when multiple installments capitalize one asset.
- Amortization schedules beginning before the horizon without an explicit opening-NBV input.
- Tax/VAT, FX, actual-vs-budget semantics, provider settlement, and regulatory compliance.
- Permission policy beyond the role-safe DTO allowlist.
- Any threshold values other than explicitly supplied model parameters.

None of these may be silently defaulted in v1.

## Acceptance criteria

- Focused tests and independent hardcoded fixtures cover validation-before-aggregation, duplicate/conflict, mixed club/season, exact cash conservation, negative closing cash, financing vs revenue, expense vs amortization, missing schedule, leap/half-open boundaries, exact rounding, SCR unavailable states, provenance, completeness, and role-safe output.
- Mutation/negative controls prove critical arithmetic and classification assertions fail when intentionally inverted.
- Full suite remains green; repository type-check debt is reported precisely and not misrepresented.
- Build/digest evidence is fresh for source changes. No UI means visual acceptance remains N/A.
- No W09 or production advancement follows from pure calculation success.
