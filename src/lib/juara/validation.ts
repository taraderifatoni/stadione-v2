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
  tacticalDna: z.enum([
    "HIGH_PRESSING", "POSITIONAL_PLAY", "VERTICAL_COUNTER", "BALANCED_HYBRID",
    "TOTAL_FOOTBALL", "CATENACCIO", "WING_PLAY", "DIAMOND_MIDFIELD",
    "FALSE_NINE", "DIRECT_PHYSICAL",
  ]),
  formationMode: z.enum(["AUTO", "MANUAL"]).default("AUTO"),
  baseFormation: z.string().max(20).default(""),
  mentality: z.enum(["DEFENSIVE", "BALANCED", "POSITIVE", "ATTACKING"]).optional(),
  tempo: z.enum(["LOW", "STANDARD", "HIGH"]).optional(),
  pressing: z.enum(["LOW", "MEDIUM", "HIGH", "VERY_HIGH"]).optional(),
  defensiveLine: z.enum(["DEEP", "STANDARD", "HIGH"]).optional(),
  width: z.enum(["NARROW", "STANDARD", "WIDE"]).optional(),
  passingStyle: z.enum(["DIRECT", "MIXED", "POSSESSION"]).optional(),
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
}).superRefine((value, ctx) => {
  if (value.formationMode === "MANUAL") {
    const len = value.baseFormation.trim().length
    if (len < 3 || len > 20) {
      ctx.addIssue({
        code: "custom",
        path: ["baseFormation"],
        message: "Mode manual memerlukan formasi 3–20 karakter",
      })
    }
  }
})

export type PlaybookGenerateInput = z.infer<typeof playbookGenerateSchema>
