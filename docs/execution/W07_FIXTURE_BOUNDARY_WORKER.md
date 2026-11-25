# W07 Fixture Boundary Plan — D6 Independent Review (docs-only)

**Model used:** free `opencode-go/hy4-flash-free`. **Timestamp:** 2026-11-25T16:06:46Z / 23:06 WIB (Asia/Jakarta).
**Status:** `DRAFT — INDEPENDENT FIXTURE BOUNDARY PLAN; NOT AN ACCEPTANCE, NOT RELEASE APPROVAL`.
**Authority boundary:** D6 reads artifacts and writes **only this file**. No app/script/test/board/manifest edit, no runtime execution, no SSH, no DB/migration, no deploy, no provider/payment call, no paid spend, no credentials, no real club data, no OwnerRep ACK. No fallback model was used or requested.

**Sources read (exact scope):**
- `docs/execution/FEATURE_TEAM_MASTER_EXECUTION.md:83-84` — W07 = versioned money/calendar/contracts/cost/revenue DTO+fixtures (J4, J3 baseline contract); acceptance = money precision, recognized cost vs cash separated, rounding and boundary cases reviewed. W08 (`:84`) consumes W07 and adds deterministic output, no equity-as-revenue, double-count tests, negative cash/season boundaries.
- `docs/execution/OWNER_REP_W06_CORRECTED_AUDIT.md:31-35` — D1 owns pure projection tests and prepares the W07 DTO contract; D6 reviews the W07 fixture boundary plan; "W07 is contract/fixture work: no new financial advice claims, payment provider calls or production mutation"; "86-group baseline and Academy boundary unchanged".
- `W07_MONEY_CALENDAR_CONTRACT_WORKER.md` was **not present** when review started, so the fallback finance documents were read first: `docs/juara/FINANCE_SPEC.md` (full, 521 lines) and `docs/juara/briefs/brief-div4-finance.txt`. D1's contract appeared during this review and was read in full (217 lines); §8 records the cross-check and the fixture corrections made here. This plan never edits D1's file.

---

## 1. Baseline 86 — unchanged, and Academy boundary separate

| Stream | Development | Testing | Production | Backlog | Total |
|---|---:|---:|---:|---:|---:|
| JUARA | 3 | 3 | 6 | 22 | **34** |
| Main Stadione | 45 | 0 | 0 | 0 | **45** |
| Academy | 7 | 0 | 0 | 0 | **7** |
| **Total** | **55** | **3** | **6** | **22** | **86** |

No weighted overall percentage, no `PRODUCTION_VERIFIED` added. This plan adds zero scope to W07/W08. Academy → W11 / W14 (S2 source) stays a separate boundary: no connector, no parent/raport/attendance/salary/parent-payment data, no cross-academy claim (master `:87`, `:90`). No fixture here touches Academy or W14.

---

## 2. Currency minor units and rounding — exact deterministic fixtures

**Canonical rule.** All money is base-10: store integer `amount_minor` at scale 2 (1 IDR = 100 minor units) as a **string integer** (`MoneyDTO { currency, amountMinor, scale, kind }`, currency `IDR` only), or `Decimal` internally. Binary floats are forbidden in money fields. Display = `amountMinor / 100` with exactly 2 decimals, `ROUND_HALF_UP` (FINANCE_SPEC §11.1). Negative ties round **away from zero** (not `ROUND_HALF_EVEN`, not toward zero). Scale-2 is an internal computation convention, **not** a claim that a circulating IDR minor coin exists. No FX conversion, no invented currency code, no RNG.

| ID | Input | Expected | Rule / source |
|---|---|---|---|
| FIX-CUR-01 | `1000.004` | `1000.00` → `"100000"` minor | truncate below half |
| FIX-CUR-02 | `1000.005` | `1000.01` → `"100001"` minor | half away from zero |
| FIX-CUR-03 | `1000.006` | `1000.01` | round up |
| FIX-CUR-04 | `-1000.005` | `-1000.01` → `"-100001"` minor | negative tie away from zero; must not become `-1000.00` |
| FIX-CUR-05 | `1650000000/36` = `45833333.3333…` | display `45.833.333,33` — `amountMinor:"4583333333"`, `kind:"DERIVED_ONLY"` | TV-01 monthly display only |
| FIX-CUR-06 | `275000000/12` = `22916666.6666…` | display `22.916.666,67` | re-amort monthly |
| FIX-CUR-07 | `14376000000/0.58 − 24500000000` | `286.206.896,55` | §9.3 Δ sponsor, `DERIVED_ONLY` |
| FIX-CUR-08 | annual amortization | `550.000.000,00` **from exact** `1650000000×12/36`; `12×45.833.333,33 = 549.999.999,96` must be flagged `R14_VIOLATION` (Δ Rp 4) | R14 §9.1 — never seed annual from rounded monthly |
| FIX-CUR-09 | integer invariant | `550000000.00 → "55000000000"`; `-400000000.00 → "-40000000000"` | lossless 2-dp; no thousands separators, no scientific notation |
| FIX-CUR-10 | JSON number / float / `NaN` / `Infinity` money value | `INVALID_MONEY_TYPE`; `Decimal('0.1')+Decimal('0.2') == Decimal('0.3')` | no binary float |
| FIX-CUR-11 | cash/nominal/equity/termin field with `amountMinor mod 100 ≠ 0` (e.g. `"4583333333"` on a cash field) | `CASH_FRACTION_REJECTED`; fractional minor only for `kind:"DERIVED_ONLY"` | D1 §3 cash invariant |
| FIX-CUR-12 | `currency:"USD"` or implicit FX | `UNSUPPORTED_CURRENCY`; no conversion | D1 §3, IDR only |

SCR is **never** money: `PercentDTO { percentMinor, scale:2 }` (`59,80%` → `"5980"`). Rounding is applied **once**, at the ledger/display boundary; intermediate amortization, SCR and cashflow arithmetic carries exact `Decimal`/rational value. Accumulating already-rounded monthly values is an explicit negative fixture (FIX-CUR-08), not a rounding policy.

---

## 3. Fiscal year and leap/calendar boundaries

**Canonical rule.** `fiscal_year_start_month = 7` (July) default; fiscal month `m=1 → Jul … m=12 → Jun`; `projection_year ∈ {1,2,3}`; `Period = { fiscalYear, fiscalMonth, startDate, endDateExclusive }` is **half-open** `[start, end)`; instants in WIB (UTC+7, no DST), no UTC drift, no `Date.now()`-dependent assertion.

| ID | Fixture | Expected | Boundary proven |
|---|---|---|---|
| FIX-CAL-01 | half-open `[2026-07-01T00:00:00+07:00, 2027-07-01T00:00:00+07:00)` | `projection_year = 1`, m1…m12, end exclusive | FY2026-27, D1 §5 |
| FIX-CAL-02 | `[2027-07-01, 2028-07-01)` | `projection_year = 2` | FY2027-28 |
| FIX-CAL-03 | `[2028-07-01, 2029-07-01)` | `projection_year = 3` | FY2028-29 |
| FIX-CAL-04 | `2028-02-29` | FY2027-28, **fiscal month 8**, day 29 of 29; `2028-03-01` → m9 | leap day not shifted into Y3 |
| FIX-CAL-05 | `2027-02-28`, `2029-02-28` | day 28 of 28; any `2027-02-29`/`2029-02-29` → `INVALID_PERIOD` | non-leap controls |
| FIX-CAL-06 | single cutover `2027-07-01T00:00:00+07:00` (also `2028-07-01`, `2029-07-01`) | m12 → m1 with no gap and no overlap; no `23:59:59` double-count | half-open rollover, D1 §5 |
| FIX-CAL-07 | contract start `2028-02-29`, exact monthly `45833333.3333…`, Feb 2028 = 29 days | first-month accrual `1.580.459,77` (1/29); non-leap control start `2027-02-28` → `1.636.904,76` (1/28) | leap daily proration, both 2 dp |
| FIX-CAL-08 | termin dated `2027-06-30` vs `2027-07-01` | first → Y1 m12 inflow; second → Y2 m1 inflow; never both in Y1 | season cutover for cash |
| FIX-CAL-09 | `season_label` inferred from `captured_at`/date/nominal/CSV | `SEASON_REQUIRED`; label comes only from authorized club-season context | D1 §5, N-CAL-03 |
| FIX-CAL-10 | contract date `2028-02-29` with offset `Z`; `contract_end_date < contract_start_date`; `fiscalMonth = 13` | `INVALID_DATE_FORMAT` (calendar dates are `YYYY-MM-DD`; `captured_at`/watermark are ISO-8601 `+07:00`), `INVALID_DATE_RANGE`, `INVALID_PERIOD` | D1 §5, N-CAL-01/04 |

Fiscal-year labelling is derived from the authoritative period, never from a mutable `projection_year` string supplied by input; a conflict between supplied label and period is a validation error, not silent relabelling.

---

## 4. Cost-vs-cash timing (recognized cost ≠ cash movement)

**Canonical rule.** Three orthogonal axes: (A) accounting nature `CAPEX` vs `OPEX`; (B) cash timing `CASH_IN`/`CASH_OUT` vs `NON_CASH_RECOGNIZED`; (C) P&L/SCR `SCR_NUM` (5) / `SCR_DEN` (6) / `BUKAN_SCR`. A value occupies one cell per axis; axes are never swapped. A capitalized amount is **not** an immediate expense; a cash installment is **not** an expense. Owner equity is neither revenue nor cash inflow for SCR.

| ID | Fixture | Expected | Source |
|---|---|---|---|
| FIX-TIME-01 | capitalized `1.650.000.000` on 2026-07-01, 36 months; cash signing-fee installments `300.000.000` (2026-07-01, m1) + `180.000.000` (2027-01-01, m7) + `120.000.000` (2027-04-01, m10) = `600.000.000` (R20 50/30/20) | Y1 recognized amortization `550.000.000` (non-cash); Y1 cash CapEx out `600.000.000`; they never coincide as the same expense | PRD §7.1/§7.2, D1 §5/§6, FINANCE_SPEC §2–§3 |
| FIX-TIME-02 | same contract | full `1.650.000.000` appears in **no** OpEx field and in **no** single cash-out month; cash out is `300/180/120 M` only; amortization + installment both in `scr_num_*` → `DOUBLE_COUNT_EXPENSE` | CapEx ≠ OpEx, D1 N-CLS-06 |
| FIX-TIME-03 | OpEx annual `18.600.000.000`, monthly `1.550.000.000` | 12 monthly wage/ops cash outflows sum to `18.600.000.000`; min buffer `2,5 × 1.550.000.000 = 3.875.000.000` | TV-09 §3.2 |
| FIX-TIME-04 | sponsor + broadcast termin total `9.000.000.000`: `4.500.000.000` (2026-07-01, m1) + `2.700.000.000` (2027-01-01, m7) + `1.800.000.000` (2027-04-01, m10) | 50/30/20, sums to 100%, three **distinct** fiscal months, zero inflow elsewhere; two termin in one month → `TERMIN_SCHEDULE_CONFLICT`; each row labelled `TEMPLATE_PRD`/`INPUT_MANUAL_KLUB` | D1 §5 R20, N-CAL-05, DES §11.4 |
| FIX-TIME-05 | `owner_equity_injection_enc = 5.000.000.000` present in playbook | absent from all `scr_den_*`, from all 6 revenue pillars, and from cash-flow `inflow` subtotal; financing line only with OWN authorization; violation → `EQUITY_AS_REVENUE` | W08 `:84`, D1 §8 N-CLS-01 |
| FIX-TIME-06 | `cash_open = 500.000.000`, inflow `100.000.000`, outflow `1.000.000.000` | `cash_close = -400.000.000` (`"-40000000000"` minor), status `CASH_BREACH`; no auto equity draw, no auto defer without role authorization | §3.3, D1 N-CLS-07 |
| FIX-TIME-07 | identical installment nominal at `2027-06-30` vs `2027-07-01` | booked to Y1 m12 vs Y2 m1 respectively, never duplicated or silently merged | FIX-CAL-08 |
| FIX-TIME-08 | season pass allocation | charged once per **home** game = 19 allocations; 38 is the season match denominator, not the home-game count; away games are cost centres, not break-even points | D1 §8, FINANCE_SPEC §6 |

---

## 5. Capitalization and amortization

**Canonical rule.** `capitalized = transfer_fee_net + training_compensation + solidarity + agent_fee_licensed` (IAS 38, RULEBOOK §5/§8); base salary and match bonuses are never capitalized. `monthly = capitalized / original_duration_months` (exact), `annual = capitalized × 12 / months` (exact, R14). `NBV(t) = capitalized − accumulated amortization`; re-amortization over the remaining **4 years** (R1) from NBV, not original cost.

| ID | Fixture | Expected | Source |
|---|---|---|---|
| FIX-CAP-01 | transfer `1.500.000.000`, licensed agent fee `150.000.000`, plus decoy `base_salary_monthly = 200.000.000`, `performance_bonus = 50.000.000` | capitalized `1.650.000.000`; salary and bonus excluded | PRD §7.1, TV-01 |
| FIX-CAP-02 | international transfer `1.000.000.000`, complete 12–23 history → `+50.000.000`; incomplete history → `+0`; domestic → `+0` | FIFA solidarity `5%` (`0,25%×4 + 0,50%×8`) applied only with complete history; enters capitalized, **never** revenue | RULEBOOK §8, TV-16, D1 §6 |
| FIX-CAP-03 | 36-month contract, cost `1.650.000.000` | exact monthly `45.833.333,3333…`, display `45.833.333,33` (`DERIVED_ONLY`); exact annual `550.000.000,00`; rounded-monthly × 12 rejected | TV-01/02, R14 |
| FIX-CAP-04 | NBV end Y1 `1.100.000.000`, re-amort 4 years | new annual `275.000.000`, new monthly display `22.916.666,67`, Δ `275.000.000` (50% drop) | TV-03/04, R1 |
| FIX-CAP-05 | alternative "2-year total" reading | rejected: would keep `550.000.000` and contradict the required decrease; engine must use 4-year remaining | RULEBOOK §14 A1 |
| FIX-CAP-06 | sport-science CapEx `300.000.000` | capitalized, but **not** in any `scr_num_*`; only registration amortization + agent fees enter SCR numerator | RULEBOOK §12 invariant 3 |
| FIX-CAP-07 | structural shape | `18` projection numbers + `5+6` SCR components + `calculated_scr_pct` + `scr_status` + `cash_buffer_reserve` + `loan_minute_threshold`; explicit field list, no `SELECT *`, no extra undefined field; fractional display amortization carries `kind:"DERIVED_ONLY"`, never `CASH_OR_NOMINAL` | ARCH §2.2.7, D1 §3/§4 |

---

## 6. Double-count and negative-value fixtures

| ID | Fixture | Expected | Source |
|---|---|---|---|
| FIX-NEG-01 | `PercentDTO.percentMinor` = `"5800"`, `"5801"`, `"5804"`, `"6500"`, `"6501"`; `D = 0`; `D = -1`; threshold input `57` | `GREEN`, `YELLOW_WATCHLIST`, `YELLOW_WATCHLIST`, `YELLOW_WATCHLIST`, `RED_BREACH`; `D≤0 → SCR=null + INVALID_DENOMINATOR`; threshold `57` → clamp `"5800"` + warning (R15); classify from 2-dp percent, never round to integer | TV-07, D1 §4.5/§10 |
| FIX-NEG-02 | re-amort lowers one player `550.000.000 → 275.000.000` | numerator `14.651.000.000 → 14.376.000.000` exactly once; SCR `59,80% → 58,68%` (Δ `1,12` pp); subtracting `275.000.000` twice fails | §9.3, TV-06 |
| FIX-NEG-03 | sale: NBV `1.100.000.000`, proceeds `1.200.000.000`, selling-agent fee `60.000.000`, sell-on `40.000.000` | `scr_den_player_trading_profit = 0` **net** (1.200.000.000 − 60.000.000 − 40.000.000 − 1.100.000.000); that player's amortization removed from numerator; NBV **not** recharged in OpEx — recognized once | §4.3 (b), D1 §6/§8 N-CLS-05 |
| FIX-NEG-04 | sale at a loss: NBV `1.100.000.000`, proceeds `1.000.000.000`, no selling costs | `scr_den_player_trading_profit = -100.000.000` with sign preserved; no `abs()`, no clamp to 0; if D then ≤ 0 → `INVALID_DENOMINATOR` | §4.3 |
| FIX-NEG-05 | same `contract_id` appearing twice in vault rows | capitalized counted once (dedup by `contract_id`); mirrors W06 unique-ID/no-double-count rule | W06 analogy |
| FIX-NEG-06 | `cash_close = -400.000.000` from FIX-TIME-06 | remains negative in DTO, no clamp, status `CASH_BREACH` | W08 negative-cash boundary |
| FIX-NEG-07 | aggregate-only input `calculated_scr_pct = 59,8%`, revenue `24.5 M`, **no component rows** | components returned as `null` + reason; engine must not invent 5+6 components for real data (the §9.3 breakdown is a labelled template vector, not PRD fact); `59,8%` shown as club SCR → rejected (R21) | R2, §1.2, D1 N-ROLE-03 |
| FIX-NEG-08 | remediation: loan vs sell, and Grade C NBV `0`, proceeds `200.000.000` | loan removes only wages `w`; sell removes `w + amort`; no double subtraction; Grade C sale = `+200.000.000` pure profit, amort contribution `0` | §4.3 (b)/(c), PRD §7.1 |
| FIX-NEG-09 | gross proceeds `1.200.000.000` placed directly in `scr_den_player_trading_profit`; total CapEx/OpEx aggregate used as numerator | `GROSS_AS_NET_PROFIT` / `INVALID_SCR_SOURCE` — rejected; solidarity and selling agent are never revenue; only the 5 fixed `scr_num_*` fields may be numerator | D1 §6/§8, R2 |

R4/R5 note: revenue pillar bands and A/B/C wage bands are controlled rounding bands, **not** forced hard sums; a fixture that normalizes bands into an exact total is a defect, not a pass.

---

## 7. Provenance and role redaction

**Canonical rule.** Every number/date carries `Provenance { source_label, source_ref, club_id, season_label, source_row?, captured_at, schemaVersion, digest }`; source labels are **only** `TEMPLATE_PRD | INPUT_MANUAL_KLUB` (a derived value keeps a legal label and is typed `kind:"DERIVED_ONLY"` — there is no `DERIVED` label). DTOs are built per role from an explicit allowlist, never `SELECT *`, and forbidden fields are **absent, not `null`**.

| ID | Fixture | Expected | Source |
|---|---|---|---|
| FIX-PROV-01 | 11 SCR components + 3 CapEx + 6 OpEx + revenue pillars + `calculated_scr_pct` | each value has `source_label` ∈ {`TEMPLATE_PRD`, `INPUT_MANUAL_KLUB`} plus `source_ref`, `club_id` from membership, authorized `season_label`, `captured_at +07:00`, `schemaVersion:"w07-money-calendar-v1"`, `digest`; re-amort Δ `275.000.000` is `kind:"DERIVED_ONLY"`, not a third source label; `FILE_ROW`/unknown label → `INVALID_SOURCE_LABEL` | D1 §7, DES §11.4, FINANCE_SPEC §1.2/§9 |
| FIX-PROV-02 | serialize DTO for 6 roles OWN/CEO/FIN/SPO/COA/SEC | OWN/CEO full; FIN M4 ALLOW + M5 ALLOW\* (no ciphertext); SPO M4 ALLOW\* **pagu only**, M5 DENY; COA M4/M5 DENY, dates/status only; SEC M4 DENY, M5 ALLOW\* dates/status only, nominal DENY; forbidden fields absent, not `null` | D1 §9, FINANCE_SPEC §10/§7 |
| FIX-PROV-03 | seed vault with `*_enc` fields (`transfer_fee_capitalized_enc`, `agent_fee_capitalized_enc`, `base_salary_monthly_enc`, `signing_on_fee_total_enc`, `performance_bonus_rules_enc`, `owner_equity_injection_enc`, `sponsor_contract_value_enc`, `ratecard_config_enc`) | no response key/value contains `_enc`, ciphertext, key, token, connection string, individual salary, signing fee, PPh 21, P&L, or sponsor contract value for SPO/COA/SEC; a test-only injected `_enc` key is still stripped → else `SENSITIVE_FIELD_LEAK` | D2/D4, D1 §9 N-PROV-05, FINANCE_SPEC §10 |
| FIX-PROV-04 | two players, salaries `200 M` and `300 M` | denied roles see neither individual values nor the `500 M` aggregate/average — redaction is not defeated by aggregation | ARCH §5.1 |
| FIX-PROV-05 | watermark fixture | `RAHASIA — <nama> | <peran> | <WIB stamp>` only (e.g. `RAHASIA — Budi | OWN | 2026-11-25 23:06 WIB`); no key, token, connection string, or individual salary | FINANCE_SPEC §8.1; no PDF generated now |
| FIX-PROV-06 | fixture namespace | all synthetic, prefix `FX-`; no credential, encryption key, or real club identifier; fixture IDs deterministic | brief boundary, FINANCE_SPEC §12 |
| FIX-PROV-07 | map every `FIX-*` ID to D1's DTO field name/type/unit | mismatch is a finding returned to D1 via PM, not auto-accept; this plan does not edit D1's file | W06 audit `:33` role split |
| FIX-PROV-08 | correction of a historical numeric value | append-only new version with `supersedes`; silent overwrite → `IMMUTABLE_VIOLATION`; digest mismatch → `DIGEST_MISMATCH`; incomplete provenance → `PROVENANCE_INCOMPLETE` | D1 §7/§10 N-PROV-02/03 |
| FIX-PROV-09 | `club_id` from client body or Postgres GUC | `CROSS_TENANT_DENIED` while own-positive control passes; unauthenticated 401 / no-membership 403 | D1 §7/§9, N-PROV-04, N-ROLE-02 |

---

## 8. Cross-check against D1's contract (appeared during this review)

D1's file was read in full **after** this plan's fixtures were drafted. Mapping and reconciled differences (only this file was updated; D1's file was not touched):

| Area | D1 contract anchor | D6 fixture anchor | Disposition |
|---|---|---|---|
| Money type/scale | §3 `MoneyDTO { currency, amountMinor:string, scale:2, kind }`, IDR only | FIX-CUR-09…12 | Aligned: string minor, 2 dp, `CASH_FRACTION_REJECTED`, `UNSUPPORTED_CURRENCY` |
| Rounding once / R14 | §4.1–4.2 | FIX-CUR-05/08, FIX-CAP-03 | Aligned: exact annual `550.000.000`, rounded×12 rejected |
| SCR as percent, not money | §3 `PercentDTO`, §4.5 | FIX-NEG-01 | Corrected: `percentMinor` strings; no integer pre-rounding; `58,04 → YELLOW` |
| Period shape | §5 half-open `[start, end)` | FIX-CAL-01/06 | Corrected: half-open, single cutover instant, no `23:59:59` overlap |
| Termin schedule | §5 R20 `50/30/20` at m1/m7/m10 | FIX-TIME-01/04 | Corrected from equal thirds at m4/m8/m12; distinct months, sum 100% |
| Net trading profit | §6/§8 `GROSS_AS_NET_PROFIT` | FIX-NEG-03/04/09 | Corrected: net of selling agent and sell-on; gross rejected |
| Provenance labels | §7 only two labels; `FILE_ROW` invalid | FIX-PROV-01/08/09 | Corrected: removed `DERIVED` as a `source_label`; it is `kind:"DERIVED_ONLY"`; added append-only `supersedes` and membership-derived `club_id` |
| Role matrix | §9 M4/M5 ALLOW\* nuances | FIX-PROV-02/03 | Corrected: FIN M5 ALLOW\*, SPO M4 pagu-only; forbidden fields absent not `null` |
| Negative fixtures | §10 `N-*` IDs | FIX-CUR-10…12, FIX-NEG-09, FIX-PROV-08/09 | Complementary: D6 supplies exact values, D1 supplies error codes — both required in later evidence |
| Baseline / Academy | §1/§2 | §1 here | Aligned: 86 unchanged, Academy/W14 separate |

No D1 fixture is declared accepted here; these are cross-check findings for PM to route back if D1 disputes any value.

---

## 9. Executable evidence required later (D6 does not execute)

This section defines **what later workers must produce**. D6 only states acceptance criteria; build success or file existence alone is not verification — the reviewer must open and inspect the evidence.

1. **Deterministic fixture test log** — env-isolated runner, `TZ=Asia/Jakarta`, frozen clock `2026-11-25`, pinned dependency versions; one named case per `FIX-*` ID above; log `OWNER_REP_W07_FIXTURE_TESTS.log` with pass/fail counts and **zero skipped**. Required named regressions: `r14_rounded_monthly_must_not_seed_annual`, `leap_day_feb29_fiscal_month_8`, `negative_tie_rounds_away_from_zero`, `negative_cash_not_clamped`, `equity_not_in_denominator`, `no_select_star_per_role_dto`, `termin_50_30_20_distinct_months`, `gross_not_net_trading_profit`.
2. **Fixture manifest** — deterministic JSON with SHA256 per fixture plus source pin (commit/artifact hash and ground-document line refs, including D1 contract `w07-money-calendar-v1`). Two consecutive generations must be byte-identical (sorted keys, no RNG, no live timestamps).
3. **DTO contract cross-reference** — D1's W07 DTO contract must map each FIX ID → field name, type (`string` minor / `PercentDTO` / enum / timestamp), unit, and `kind`; missing or ambiguous mapping is a finding returned to D1 via PM.
4. **Role-redaction proof** — for each of 6 roles, serialized DTO asserted against an explicit allowlist and deny-key regex `/(_enc|salary|gaji|signing_fee|pph|pnl|equity|sponsor_contract_value)/`; include a negative test proving an injected `_enc` key is stripped and that forbidden fields are absent rather than `null`.
5. **Calendar proof** — `TZ=Asia/Jakarta` asserted, half-open periods, leap (`2028-02-29`) and non-leap (`2027-02-28`, `2029-02-28`) controls, exact cutover instants; no test may depend on the machine clock.
6. **Determinism replay** — two runs yield identical canonical JSON and identical manifest SHA256; no random IDs or unpinned timestamps in outputs (the watermark fixture uses the fixed stamp above).
7. **Zero-egress evidence** — log shows no HTTP/provider/payment endpoint calls; sandbox idempotency and named human incident owner remain open, not satisfied here.
8. **Visual acceptance** — none required for this docs-only review. If a DTO is later surfaced in UI, `docs/VISUAL_ACCEPTANCE_STANDARD.md` applies via a **separate** PM checkpoint with fresh evidence; this plan grants no visual acceptance.

---

## 10. Explicitly OUT of scope

No provider calls (payment/mapping/font/image/any paid endpoint), no sandbox idempotency work, no payment flow, no paid spend of any kind. No production mutation, DB/migration/apply, deploy, DNS, SSL, push, restart, SSH, credentials, encryption keys, connection strings, or real club data. No new financial advice, no new rule, no reopening of D1–D4 / R1–R9 / R20 / TV vectors — every number above is derived from the locked finance docs and is a **test fixture**, not advice. No app/script/test/board/manifest edit by this worker; no runtime execution; no ACK; no acceptance or release approval. Academy/W14 (W11 source, optional connector) stays separate with no salary/parent-payment or cross-academy data. Baseline 86 is unchanged; no weighted percentage, no new scope, no J14/J15/J16 resolution. No RNG, no FX, no invented currency units or codes.

---

## 11. Laporan ke PM

Laporan W07 Fixture Boundary Plan (D6 independent review)
Konteks: review fixture boundary W07 money/calendar/contracts/cost/revenue sesuai mandat `OWNER_REP_W06_CORRECTED_AUDIT.md:31-35`; kontrak D1 belum ada saat mulai, fallback ke `FINANCE_SPEC.md`, lalu muncul saat review dan sudah dibaca/dicross-check.
- Satu file ditulis: `docs/execution/W07_FIXTURE_BOUNDARY_WORKER.md` (model free `opencode-go/hy4-flash-free`, timestamp 2026-11-25T16:06:46Z). Tidak ada file/app/test/board/runtime/SSH/DB/deploy/provider/payment lain; tidak ada ACK.
- Fixture deterministik lengkap dengan nilai eksak untuk: minor-unit/ROUND_HALF_UP + R14 Δ Rp 4, FY Juli→Juni half-open 1–3 + leap `2028-02-29` vs kontrol non-leap, cost-vs-cash (equity bukan revenue, termin 50/30/20, `CASH_BREACH` negatif), kapitalisasi/amortisasi IAS 38 (R1/R14), double-count & negatif (TV-07, `INVALID_DENOMINATOR`, laba bersih trading, sign preserved), provenance & redaksi 6 peran (tanpa `SELECT *`, tanpa `_enc` bocor, append-only).
- Cross-check kontrak D1 (§8): 7 penyesuaian — `PercentDTO` bukan uang, period half-open, termin R20 50/30/20, trading profit bersih, hanya dua `source_label` (`DERIVED` → `kind:"DERIVED_ONLY"`), nuansa ALLOW\* peran, field terlarang absen bukan `null`. Semua angka tetap milik D6; tidak ada penerimaan.
- Bukti executable untuk worker berikutnya: log test env-isolated `TZ=Asia/Jakarta`, manifest SHA256 + source pin, cross-reference DTO D1, proof redaksi 6 peran, replay deterministik, bukti zero-egress; reviewer wajib membuka bukti, bukan sekadar cek file ada.
- OUT ditegaskan: tanpa provider/payment, tanpa produksi/DB/deploy, tanpa nasihat keuangan baru, tanpa Academy/W14, baseline 86 tidak berubah, tanpa visual acceptance (docs-only).
- Permintaan ke PM: teruskan cross-check `FIX-*` ke D1; flag mismatch sebagai temuan, jangan auto-accept. D6 tidak mengeksekusi apa pun dalam rencana ini.
