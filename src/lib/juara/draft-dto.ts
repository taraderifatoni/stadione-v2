import { can, type Capability } from "./capabilities.ts"
import type { JuaraRole } from "./rbac.ts"

type DraftObject = Record<string, unknown>

const BASE_FIELDS = [
  "leagueTier", "horizonYears", "targetOutcome", "tacticalDna",
  "formationMode", "baseFormation", "mentality", "tempo", "pressing",
  "defensiveLine", "width", "passingStyle",
] as const

const PHILOSOPHY_FIELDS = ["star", "competitive", "academy"] as const

function asObject(value: unknown): DraftObject {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as DraftObject)
    : {}
}

function canSeeEquity(role: JuaraRole): boolean {
  return can("salary.read", role)
}

/** Explicit allowlist — never regex-filter nested financial fields. */
export function draftForRole(draft: DraftObject, role: JuaraRole): DraftObject {
  const out: DraftObject = {}
  for (const key of BASE_FIELDS) {
    if (key in draft) out[key] = draft[key]
  }
  const philosophy = asObject(draft.philosophy)
  const safePhilosophy: DraftObject = {}
  for (const key of PHILOSOPHY_FIELDS) {
    if (key in philosophy) safePhilosophy[key] = philosophy[key]
  }
  out.philosophy = safePhilosophy

  const guardrails = asObject(draft.guardrails)
  const safeGuardrails: DraftObject = {}
  if ("scrMax" in guardrails) safeGuardrails.scrMax = guardrails.scrMax
  if (canSeeEquity(role) && "equity" in guardrails) {
    safeGuardrails.equity = guardrails.equity
  }
  out.guardrails = safeGuardrails
  return out
}

/**
 * Editor terbatas tidak boleh menimpa field privat. Nilai lama dipertahankan
 * dari draft yang sudah tersimpan.
 */
export function mergeRestrictedDraft(
  incoming: DraftObject,
  existing: DraftObject,
  role: JuaraRole
): DraftObject {
  const merged: DraftObject = { ...incoming }
  if (!canSeeEquity(role)) {
    const oldEquity = asObject(existing.guardrails).equity
    const incomingGuardrails = asObject(incoming.guardrails)
    merged.guardrails = {
      ...incomingGuardrails,
      ...(oldEquity !== undefined ? { equity: oldEquity } : {}),
    }
  }
  return merged
}

export function readExistingDraft(raw: string): DraftObject {
  try { return asObject(JSON.parse(raw)) } catch { return {} }
}
