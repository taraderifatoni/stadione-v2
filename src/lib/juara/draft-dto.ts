import { can, type Capability } from "./capabilities.ts"
import type { JuaraRole } from "./rbac.ts"

type DraftObject = Record<string, unknown>

const BASE_FIELDS = [
  "leagueTier", "horizonYears", "targetOutcome", "tacticalDna",
  "formationMode", "baseFormation", "mentality", "tempo", "pressing",
  "defensiveLine", "width", "passingStyle",
] as const

const PHILOSOPHY_FIELDS = ["star", "competitive", "academy"] as const
const GUARDRAIL_FIELDS = ["equity", "scrMax"] as const

function asObject(value: unknown): DraftObject {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as DraftObject)
    : {}
}

function canSeeEquity(role: JuaraRole): boolean {
  return can("salary.read", role)
}

function canWriteEquity(role: JuaraRole): boolean {
  return role === "OWNER" || role === "CEO"
}

export function draftVersion(raw: string | null): string {
  if (!raw) return "0"
  let h = 5381
  for (let i = 0; i < raw.length; i++) h = ((h << 5) + h + raw.charCodeAt(i)) >>> 0
  return h.toString(16)
}

function allowlisted(draft: DraftObject, role: JuaraRole): DraftObject {
  const out: DraftObject = {}
  for (const key of BASE_FIELDS) if (key in draft) out[key] = draft[key]

  const philosophy = asObject(draft.philosophy)
  const safePhilosophy: DraftObject = {}
  for (const key of PHILOSOPHY_FIELDS) if (key in philosophy) safePhilosophy[key] = philosophy[key]
  out.philosophy = safePhilosophy

  const guardrails = asObject(draft.guardrails)
  const safeGuardrails: DraftObject = {}
  if ("scrMax" in guardrails) safeGuardrails.scrMax = guardrails.scrMax
  if (canSeeEquity(role) && "equity" in guardrails) safeGuardrails.equity = guardrails.equity
  out.guardrails = safeGuardrails
  return out
}

/** Explicit allowlist — never regex-filter nested financial fields. */
export function draftForRole(draft: DraftObject, role: JuaraRole): DraftObject {
  return allowlisted(draft, role)
}

/**
 * Editor terbatas tidak boleh menimpa field privat. Equity dari incoming
 * SELALU dibuang untuk non-owner, lalu nilai lama dipasang jika ada.
 */
export function mergeRestrictedDraft(
  incoming: DraftObject,
  existing: DraftObject,
  role: JuaraRole
): DraftObject {
  const base = allowlisted(incoming, role)
  const oldEquity = asObject(existing.guardrails).equity
  const guardrails: DraftObject = { ...asObject(base.guardrails) }
  delete guardrails.equity

  if (canSeeEquity(role)) {
    const incomingEquity = asObject(incoming.guardrails).equity
    const value = incomingEquity !== undefined ? incomingEquity : oldEquity
    if (value !== undefined) guardrails.equity = value
  } else if (oldEquity !== undefined) {
    guardrails.equity = oldEquity
  }

  return { ...base, guardrails }
}

/** Pemisahan blob privat: hanya OWNER/CEO yang boleh menulis finance. */
export function splitDraftForStorage(
  draft: DraftObject,
  role: JuaraRole
): { publicDraft: DraftObject; finance: DraftObject | null } {
  const publicDraft = allowlisted(draft, role)
  const publicGuardrails = { ...asObject(publicDraft.guardrails) }
  delete publicGuardrails.equity
  publicDraft.guardrails = publicGuardrails

  const equity = asObject(draft.guardrails).equity
  const finance = canWriteEquity(role) && equity !== undefined ? { equity } : null
  return { publicDraft, finance }
}

/** Gabungkan kembali finance blob hanya untuk peran yang berhak. */
export function mergeFinanceIntoDraft(
  publicDraft: DraftObject,
  finance: DraftObject | null,
  role: JuaraRole,
  legacyEquity?: unknown
): DraftObject {
  const merged = allowlisted(publicDraft, role)
  if (!canSeeEquity(role)) return merged
  const guardrails = { ...asObject(merged.guardrails) }
  const equity = asObject(finance ?? {}).equity ?? legacyEquity
  if (equity !== undefined) guardrails.equity = equity
  merged.guardrails = guardrails
  return merged
}

export function allowedGuardrails(draft: DraftObject): DraftObject {
  const source = asObject(draft.guardrails)
  const out: DraftObject = {}
  for (const key of GUARDRAIL_FIELDS) if (key in source) out[key] = source[key]
  return out
}

export function readExistingDraft(raw: string): DraftObject {
  try { return asObject(JSON.parse(raw)) } catch { return {} }
}
