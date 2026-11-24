import type { JuaraRole } from "./rbac.ts"

/** Capability matrix from OWNER_REP_TECHNICAL_PLAN §11 (usulan pilot). */
export type Capability =
  | "squad.read"
  | "squad.edit"
  | "salary.read"
  | "pnl.read"
  | "playbook.read"
  | "playbook.create"
  | "playbook.edit"
  | "playbook.activate"
  | "finance.clearance"
  | "member.invite"
  | "member.roleChange"
  | "export.standard"

const OWNER = "OWNER"
const CEO = "CEO"
const SD = "SPORTING_DIRECTOR"
const COACH = "HEAD_COACH"
const FIN = "FINANCE_CONTROLLER"
const SEC = "CLUB_SECRETARY"

const MATRIX: Record<Capability, JuaraRole[]> = {
  "squad.read": [OWNER, CEO, SD, COACH, FIN, SEC],
  "squad.edit": [OWNER, SD, COACH],
  "salary.read": [OWNER, CEO, FIN],
  "pnl.read": [OWNER, CEO, FIN],
  "playbook.read": [OWNER, CEO, SD, COACH, FIN, SEC],
  "playbook.create": [OWNER, CEO, SD],
  "playbook.edit": [OWNER, CEO, SD],
  "playbook.activate": [OWNER],
  "finance.clearance": [FIN],
  "member.invite": [OWNER, CEO],
  "member.roleChange": [OWNER],
  "export.standard": [OWNER, CEO, SD, FIN],
}

export function can(capability: Capability, role: JuaraRole): boolean {
  return MATRIX[capability].includes(role)
}

export function visibleFields(role: JuaraRole): { salary: boolean; pnl: boolean } {
  return { salary: can("salary.read", role), pnl: can("pnl.read", role) }
}

/**
 * Field-level redaction for API DTOs. Never rely on the client to omit fields.
 */
export function redactForRole<T extends Record<string, unknown>>(dto: T, role: JuaraRole): Partial<T> {
  const { salary, pnl } = visibleFields(role)
  const out: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(dto)) {
    if (!salary && /salary|gaji|contract_?value|equity/i.test(key)) continue
    if (!pnl && /pnl|laba_rugi|profit/i.test(key)) continue
    out[key] = value
  }
  return out as Partial<T>
}
