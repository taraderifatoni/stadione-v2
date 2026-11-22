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
