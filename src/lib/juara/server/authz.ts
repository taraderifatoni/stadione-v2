import type { SupabaseClient } from "@supabase/supabase-js"
import { can, type Capability } from "../capabilities.ts"
import type { JuaraRole } from "../rbac.ts"

export interface AuthzOk {
  ok: true
  userId: string
  clubId: string
  role: JuaraRole
}

export interface AuthzDenied {
  ok: false
  status: 401 | 403 | 500
  error: string
  code: "UNAUTHENTICATED" | "NO_CLUB" | "FORBIDDEN" | "READ_FAILED"
}

const ROLES = new Set<JuaraRole>([
  "OWNER", "CEO", "SPORTING_DIRECTOR", "HEAD_COACH", "FINANCE_CONTROLLER", "CLUB_SECRETARY",
])

function isRole(value: unknown): value is JuaraRole {
  return typeof value === "string" && ROLES.has(value as JuaraRole)
}

/**
 * Single authorization path for server routes: session → membership → capability.
 * Does not trust a club_id from the request.
 */
export async function requireCapability(
  supabase: SupabaseClient,
  capability: Capability
): Promise<AuthzOk | AuthzDenied> {
  const { data: auth, error: authError } = await supabase.auth.getUser()
  if (authError || !auth.user) {
    return { ok: false, status: 401, error: "Butuh sesi login", code: "UNAUTHENTICATED" }
  }

  const { data, error } = await supabase
    .from("juara_club_members")
    .select("club_id, role")
    .eq("user_id", auth.user.id)
    .limit(1)
    .maybeSingle()

  if (error) {
    return { ok: false, status: 500, error: "Gagal membaca keanggotaan klub", code: "READ_FAILED" }
  }
  if (!data || !isRole(data.role)) {
    return { ok: false, status: 403, error: "Akun belum terhubung ke klub", code: "NO_CLUB" }
  }
  if (!can(capability, data.role)) {
    return { ok: false, status: 403, error: "Anda tidak memiliki izin untuk aksi ini", code: "FORBIDDEN" }
  }

  return { ok: true, userId: auth.user.id, clubId: data.club_id, role: data.role }
}

export function authzResponse(denied: AuthzDenied): Response {
  return Response.json({ error: denied.error, code: denied.code }, { status: denied.status })
}
