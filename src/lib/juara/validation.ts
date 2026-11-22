import { z } from "zod"

/** Input validation for JUARA guardrails. R15: SCR threshold floor is 58%. */

export interface ScrThresholdResult {
  ok: boolean
  normalized: number
  warning?: string
}

export function validateScrThreshold(value: number): ScrThresholdResult {
  if (!Number.isFinite(value)) {
    return { ok: false, normalized: 65, warning: "Nilai SCR tidak valid; memakai default 65%." }
  }
  if (value < 58) {
    return {
      ok: false,
      normalized: 58,
      warning: "Ambang SCR tidak boleh di bawah 58% (zone hijau). Nilai di-clamp ke 58%.",
    }
  }
  if (value > 100) {
    return { ok: false, normalized: 100, warning: "Ambang SCR tidak boleh lebih dari 100%." }
  }
  return { ok: true, normalized: value }
}

export const playbookGenerateSchema = z.object({
  leagueTier: z.enum(["LIGA_1", "LIGA_2", "LIGA_3", "ACADEMY_PRO"]),
  horizonYears: z.union([z.literal(1), z.literal(3)]),
  targetOutcome: z.enum(["CHAMPION", "PROMOTION", "TOP_4", "MID_TABLE_SUSTAINABLE"]),
  tacticalDna: z.enum(["HIGH_PRESSING", "POSITIONAL_PLAY", "VERTICAL_COUNTER", "BALANCED_HYBRID"]),
  baseFormation: z.string().min(3).max(20),
  philosophy: z
    .object({
      star: z.number().int().min(0).max(100),
      competitive: z.number().int().min(0).max(100),
      academy: z.number().int().min(0).max(100),
    })
    .refine((v) => v.star + v.competitive + v.academy === 100, {
      message: "Total rasio filosofi skuad harus 100%",
    }),
  guardrails: z.object({
    equity: z.number().positive(),
    scrMax: z.number().min(58).max(100),
  }),
})

export type PlaybookGenerateInput = z.infer<typeof playbookGenerateSchema>
