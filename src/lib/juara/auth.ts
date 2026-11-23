import type { JuaraRole } from "./rbac.ts"

export interface JuaraSession {
  userId: string
  clubId: string
  role: JuaraRole
}

export function parseClubIdFromJwt(claims: Record<string, unknown>): string | null {
  const v = claims.club_id
  return typeof v === "string" && v.length > 0 ? v : null
}

export function buildSession(
  userId: string,
  claims: Record<string, unknown>,
  membership: { clubId: string; role: JuaraRole } | null
): JuaraSession | null {
  if (!membership) return null
  const jwtClub = parseClubIdFromJwt(claims)
  // Prefer the membership table as source of truth; JWT claim must agree if present.
  if (jwtClub && jwtClub !== membership.clubId) return null
  return { userId, clubId: membership.clubId, role: membership.role }
}
