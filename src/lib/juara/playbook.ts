import { buildAgeMatrix, classifyScr, computeGradeQuota } from "./formulas.ts"
import type { PlaybookGenerateInput } from "./validation.ts"

/** Deterministic Sprint-1 summary. Financial detail is specified in FINANCE_SPEC.md. */
export function generatePlaybookSummary(input: PlaybookGenerateInput) {
  const totalSlots = 27
  return {
    totalSlots,
    horizonYears: input.horizonYears,
    tacticalDna: input.tacticalDna,
    baseFormation: input.baseFormation,
    ageMatrix: buildAgeMatrix(totalSlots, input.horizonYears),
    gradeQuota: computeGradeQuota(
      input.horizonYears === 1 && input.targetOutcome === "CHAMPION"
        ? "CHAMPION_1Y"
        : "SUSTAINABLE_3Y"
    ),
    // Test vector from RULEBOOK TV-06; full engine follows FINANCE_SPEC.md.
    scrStatus: classifyScr(59.8, input.guardrails.scrMax),
  }
}
