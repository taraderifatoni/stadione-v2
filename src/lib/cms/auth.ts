import "server-only"

import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

export type CmsActor = { id: string; email: string | null }

export async function requirePlatformAdmin(): Promise<
  | { ok: true; actor: CmsActor }
  | { ok: false; status: 401 | 403; error: string }
> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { ok: false, status: 401, error: "Silakan masuk sebagai platform admin." }

  const admin = createAdminClient()
  const { data } = await admin
    .from("venue_roles")
    .select("role")
    .eq("user_id", user.id)
    .eq("role", "platform_admin")
    .limit(1)

  if (!data?.length) return { ok: false, status: 403, error: "Akses Content & CMS hanya untuk platform admin." }

  return { ok: true, actor: { id: user.id, email: user.email ?? null } }
}
