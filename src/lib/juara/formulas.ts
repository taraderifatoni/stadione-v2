/**
 * Pure football-domain formulas for JUARA.STADIONE.PRO.
 * Source: docs/juara/RULEBOOK.md + docs/juara/PM_RULINGS.md.
 * No framework imports — safe to use in server, API route, and tests.
 */

export interface AmortizationResult {
  monthlyExact: number
  monthlyDisplay: number
  annual: number
  netBookValueAfter: (monthsElapsed: number) => number
}

export function computeAmortization(capitalized: number, months: number): AmortizationResult {
  if (months <= 0) throw new Error("months must be positive")
  const monthlyExact = capitalized / months
  return {
    monthlyExact,
    monthlyDisplay: Math.round(monthlyExact * 100) / 100,
    // R14: annual is derived from the exact value, never from monthlyDisplay.
    annual: (capitalized * 12) / months,
    netBookValueAfter: (monthsElapsed: number) =>
      capitalized - monthlyExact * monthsElapsed,
  }
}

export type ScrStatus = "GREEN" | "YELLOW_WATCHLIST" | "RED_BREACH"

export function classifyScr(percent: number, maxThreshold = 65): ScrStatus {
  if (percent > maxThreshold) return "RED_BREACH"
  if (percent > 58) return "YELLOW_WATCHLIST"
  return "GREEN"
}

export interface AgeBracket {
  bracket: string
  percent: number
  slots: number
}

const AGE_BRACKETS = ["17-21", "22-24", "25-29", "30-33"] as const

export function buildAgeMatrix(totalSlots: number, horizonYears: 1 | 3): AgeBracket[] {
  const percents =
    horizonYears === 1 ? [25, 25, 40, 10] : [35, 30, 28, 7]
  const slots: number[] = []
  let used = 0
  for (let i = 0; i < percents.length; i++) {
    if (i === percents.length - 1) {
      slots.push(totalSlots - used)
    } else {
      const n = Math.round((totalSlots * percents[i]) / 100)
      slots.push(n)
      used += n
    }
  }
  return AGE_BRACKETS.map((bracket, i) => ({
    bracket,
    percent: percents[i],
    slots: slots[i],
  }))
}

export type GradeQuota = Record<"A" | "B" | "C", [number, number]>

export function computeGradeQuota(target: "CHAMPION_1Y" | "SUSTAINABLE_3Y"): GradeQuota {
  if (target === "CHAMPION_1Y") return { A: [6, 8], B: [11, 13], C: [6, 8] }
  return { A: [4, 6], B: [10, 12], C: [9, 11] }
}

export type AriBand =
  | "DEVELOP"
  | "WATCHLIST"
  | "ROTATION_READY"
  | "ELITE_HOMEGROWN_ASSET"

export function computeAri(components: {
  tactical: number
  physical: number
  technical: number
  psychological: number
}): { score: number; band: AriBand } {
  const score =
    components.tactical * 0.3 +
    components.physical * 0.25 +
    components.technical * 0.25 +
    components.psychological * 0.2
  let band: AriBand = "DEVELOP"
  if (score >= 85) band = "ELITE_HOMEGROWN_ASSET"
  else if (score >= 78) band = "ROTATION_READY"
  else if (score >= 65) band = "WATCHLIST"
  return { score: Math.round(score * 100) / 100, band }
}
