import crypto from "node:crypto"
import { playbookGenerateSchema } from "../../../../../lib/juara/validation.ts"
import { buildPlaybookInsertRow } from "../../../../../lib/juara/playbook-save.ts"
import { getActiveKey } from "../../../../../lib/juara/keyring.ts"
import { createClient } from "../../../../../lib/supabase/server.ts"

export async function POST(request: Request) {
  let payload: unknown
  try {
    payload = await request.json()
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 })
  }
  const parsed = playbookGenerateSchema.safeParse(payload)
  if (!parsed.success) {
    return Response.json({ error: "Invalid payload", issues: parsed.error.issues }, { status: 400 })
  }

  const keyring = getActiveKey()
  if (!keyring) {
    return Response.json(
      { error: "Kunci enkripsi belum terpasang", code: "NO_ENCRYPTION_KEY" },
      { status: 503 }
    )
  }

  const supabase = await createClient()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) {
    return Response.json({ error: "Butuh sesi login", code: "UNAUTHENTICATED" }, { status: 401 })
  }

  const { data: membership, error: membershipError } = await supabase
    .from("juara_club_members")
    .select("club_id, role")
    .eq("user_id", auth.user.id)
    .limit(1)
    .maybeSingle()

  if (membershipError) {
    return Response.json({ error: "Gagal membaca keanggotaan klub" }, { status: 500 })
  }
  if (!membership) {
    return Response.json(
      { error: "Akun belum terhubung ke klub", code: "NO_CLUB" },
      { status: 403 }
    )
  }

  const row = buildPlaybookInsertRow(
    parsed.data,
    membership.club_id,
    crypto.randomUUID(),
    keyring
  )

  const { data: inserted, error } = await supabase
    .from("juara_playbooks")
    .insert(row)
    .select("id")
    .single()

  if (error) {
    return Response.json({ error: "Gagal menyimpan Playbook" }, { status: 500 })
  }
  return Response.json({ ok: true, id: inserted.id }, { status: 201 })
}
