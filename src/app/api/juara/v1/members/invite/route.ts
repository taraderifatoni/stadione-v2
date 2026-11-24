import { createClient } from "../../../../../../lib/supabase/server.ts"
import { authzResponse, requireCapability } from "../../../../../../lib/juara/server/authz.ts"
import { inviteSchema } from "../../../../../../lib/juara/invite.ts"

export async function POST(request: Request) {
  const supabase = await createClient()
  const auth = await requireCapability(supabase, "member.invite")
  if (!auth.ok) return authzResponse(auth)

  let payload: unknown
  try {
    payload = await request.json()
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 })
  }
  const parsed = inviteSchema.safeParse(payload)
  if (!parsed.success) {
    return Response.json({ error: "Invalid payload", issues: parsed.error.issues }, { status: 400 })
  }

  // RENCANA SEC-02: undangan nyata dengan token sekali pakai dan expiry.
  // Gate izin sudah aktif; penulisan membership menyusul.
  return Response.json({ ok: true, note: "RENCANA — butuh invite nyata (SEC-02)" })
}
