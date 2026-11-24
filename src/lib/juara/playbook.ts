import { buildAgeMatrix, computeGradeQuota } from "./formulas.ts"
import { buildTacticalProfile } from "./tactics.ts"
import type { PlaybookGenerateInput } from "./validation.ts"

/** Deterministic Sprint-1 summary. Financial detail is specified in FINANCE_SPEC.md. */
export function generatePlaybookSummary(input: PlaybookGenerateInput) {
  const totalSlots = 27
  const tacticalProfile = buildTacticalProfile(input)
  return {
    totalSlots,
    horizonYears: input.horizonYears,
    tacticalDna: tacticalProfile.dnaLabel,
    tacticalDnaCode: input.tacticalDna,
    tacticalProfile,
    baseFormation: tacticalProfile.formation,
    ageMatrix: buildAgeMatrix(totalSlots, input.horizonYears),
    gradeQuota: computeGradeQuota(
      input.horizonYears === 1 && input.targetOutcome === "CHAMPION"
        ? "CHAMPION_1Y"
        : "SUSTAINABLE_3Y"
    ),
    // TIDAK memakai test vector TV-06 sebagai hasil klub. Nilai SCR riil
    // menunggu engine FINANCE_SPEC; yang ditampilkan UI adalah ambang input.
    scrStatus: "MENUNGGU_ENGINE",
    scrThresholdPct: input.guardrails.scrMax,
  }
}
