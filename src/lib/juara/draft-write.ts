import { Buffer } from "node:buffer"
import { encryptField, decryptField } from "./field-crypto.ts"
import type { KeyringEntry } from "./keyring.ts"
import { allowlisted, type DraftObject } from "./draft-dto.ts"

const TABLE = "juara_clubs"
const PUBLIC_COLUMN = "vision_draft_enc"
const FINANCE_COLUMN = "vision_finance_enc"
export const DRAFT_TABLE = TABLE
export const DRAFT_COLUMN = PUBLIC_COLUMN
export const FINANCE_COLUMN_NAME = FINANCE_COLUMN

export interface DraftWriteInput {
  incoming: DraftObject
  existingPublic: DraftObject
  /** null = belum ada finance blob; object = authoritative finance. */
  existingFinance: DraftObject | null
  role: "OWNER" | "CEO" | "SPORTING_DIRECTOR" | "HEAD_COACH" | "FINANCE_CONTROLLER" | "CLUB_SECRETARY"
}

export interface DraftWritePlan {
  publicDraft: DraftObject
  /** null = jangan ubah finance blob yang sudah ada. */
  finance: DraftObject | null
}

function canWriteFinance(role: DraftWriteInput["role"]): boolean {
  return role === "OWNER" || role === "CEO"
}

/**
 * Finance authoritative = finance blob bila ada, baru fallback ke legacy public.
 * Tanpa incoming equity, nilai lama selalu dipertahankan — tidak pernah
 * mengganti finance existing dengan legacy public.
 */
export function planDraftWrite(input: DraftWriteInput): DraftWritePlan {
  const publicDraft = allowlisted(input.incoming, input.role)
  const publicGuardrails = { ...(publicDraft.guardrails as DraftObject | undefined ?? {}) }
  delete publicGuardrails.equity
  publicDraft.guardrails = publicGuardrails

  const incomingEquity = (input.incoming as DraftObject).guardrails
    ? ((input.incoming as DraftObject).guardrails as DraftObject).equity
    : undefined
  const authoritativeEquity = input.existingFinance
    ? (input.existingFinance as DraftObject).equity
    : ((input.existingPublic.guardrails as DraftObject | undefined)?.equity)

  if (!canWriteFinance(input.role)) return { publicDraft, finance: null }
  if (incomingEquity !== undefined) return { publicDraft, finance: { equity: incomingEquity } }
  if (authoritativeEquity !== undefined) return { publicDraft, finance: { equity: authoritativeEquity } }
  return { publicDraft, finance: null }
}

function decryptHex(hex: unknown, keyring: KeyringEntry, clubId: string, column: string): DraftObject {
  if (typeof hex !== "string" || !hex) return {}
  try {
    const blob = Buffer.from(hex.slice(2), "hex")
    const plain = decryptField(blob, keyring.key, clubId, TABLE, column, clubId)
    const parsed = JSON.parse(plain)
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {}
  } catch {
    throw new Error(`Malformed encrypted blob: ${column}`)
  }
}

function encryptHex(value: DraftObject, keyring: KeyringEntry, clubId: string, column: string): string {
  const blob = encryptField(JSON.stringify(value), keyring.key, keyring.keyId, clubId, TABLE, column, clubId)
  return `\\x${blob.toString("hex")}`
}

/** Route-level helper: terima encrypted blobs, hasilkan blobs siap ditulis RPC. */
export function prepareDraftWriteFromEncrypted(args: {
  incoming: DraftObject
  existingPublicHex: string | null
  existingFinanceHex: string | null
  role: DraftWriteInput["role"]
  clubId: string
  keyring: KeyringEntry
}): { publicHex: string; financeHex: string | null } {
  const existingPublic = decryptHex(args.existingPublicHex, args.keyring, args.clubId, PUBLIC_COLUMN)
  let existingFinance: DraftObject | null = null
  if (args.existingFinanceHex) {
    const parsed = decryptHex(args.existingFinanceHex, args.keyring, args.clubId, FINANCE_COLUMN)
    if (!Object.keys(parsed).length) throw new Error("Malformed encrypted blob: vision_finance_enc")
    existingFinance = parsed
  }

  const plan = planDraftWrite({
    incoming: args.incoming,
    existingPublic,
    existingFinance,
    role: args.role,
  })
  return {
    publicHex: encryptHex(plan.publicDraft, args.keyring, args.clubId, PUBLIC_COLUMN),
    financeHex: plan.finance ? encryptHex(plan.finance, args.keyring, args.clubId, FINANCE_COLUMN) : null,
  }
}
