import { createClient } from "../../lib/supabase/server"
import type { JuaraRole } from "./rbac"

export interface JuaraMembership {
  userId: string
  clubId: string
  role: JuaraRole
}

const ROLE_SET = new Set<JuaraRole>([
  "OWNER",
  "CEO",
  "SPORTING_DIRECTOR",
  "HEAD_COACH",
  "FINANCE_CONTROLLER",
  "CLUB_SECRETARY",
])

export function isJuaraRole(value: unknown): value is JuaraRole {
  return typeof value === "string" && ROLE_SET.has(value as JuaraRole)
}

/** Resolve authenticated user + their juara club membership. Uses JWT user, not service_role. */
export async function getJuaraMembership(): Promise<
  | { ok: true; membership: JuaraMembership }
  | { ok: false; status: 401 | 403 | 500; error: string; code?: string }
> {
  const supabase = await createClient()
  const { data: auth, error: authError } = await supabase.auth.getUser()
  if (authError || !auth.user) {
    return { ok: false, status: 401, error: "Butuh sesi login", code: "UNAUTHENTICATED" }
  }

  const { data: row, error } = await supabase
    .from("juara_club_members")
    .select("club_id, role")
    .eq("user_id", auth.user.id)
    .limit(1)
    .maybeSingle()

  if (error) return { ok: false, status: 500, error: "Gagal membaca keanggotaan klub" }
  if (!row || !isJuaraRole(row.role)) {
    return { ok: false, status: 403, error: "Akun belum terhubung ke klub", code: "NO_CLUB" }
  }

  return { ok: true, membership: { userId: auth.user.id, clubId: row.club_id, role: row.role } }
}
