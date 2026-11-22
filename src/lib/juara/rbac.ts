/** Six-role RBAC matrix from PRD §1.3 and design doc §11.5. */

export type JuaraRole =
  | "OWNER"
  | "CEO"
  | "SPORTING_DIRECTOR"
  | "HEAD_COACH"
  | "FINANCE_CONTROLLER"
  | "CLUB_SECRETARY"

const SALARY_ROLES = new Set<JuaraRole>(["OWNER", "CEO", "FINANCE_CONTROLLER"])
const PNL_ROLES = new Set<JuaraRole>(["OWNER", "CEO", "FINANCE_CONTROLLER"])
const APPROVAL_ROLES = new Set<JuaraRole>(["OWNER", "FINANCE_CONTROLLER"])

export function canViewSalary(role: JuaraRole): boolean {
  return SALARY_ROLES.has(role)
}

export function canViewPnl(role: JuaraRole): boolean {
  return PNL_ROLES.has(role)
}

export function canApprovePlaybook(role: JuaraRole): boolean {
  return APPROVAL_ROLES.has(role)
}
