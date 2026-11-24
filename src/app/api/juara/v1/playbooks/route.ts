import crypto from "node:crypto"
import { playbookGenerateSchema } from "../../../../../lib/juara/validation.ts"
import { buildPlaybookInsertRow } from "../../../../../lib/juara/playbook-save.ts"
import { getActiveKey } from "../../../../../lib/juara/keyring.ts"
import { createClient } from "../../../../../lib/supabase/server.ts"
import { authzResponse, requireCapability } from "../../../../../lib/juara/server/authz.ts"

export async function GET() {
  const supabase = await createClient()
  const auth = await requireCapability(supabase, "playbook.read")
  if (!auth.ok) {
    if (auth.code === "NO_CLUB") return Response.json({ ok: true, playbooks: [] })
    return authzResponse(auth)
  }

  const { data, error } = await supabase
    .from("juara_playbooks")
    .select("id, version_name, horizon_years, target_sporting_outcome, tactical_dna_type, status, created_at")
    .eq("club_id", auth.clubId)
    .order("created_at", { ascending: false })
    .limit(50)

  if (error) return Response.json({ error: "Gagal membaca playbook" }, { status: 500 })
  return Response.json({ ok: true, playbooks: data ?? [] })
}

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
  const auth = await requireCapability(supabase, "playbook.create")
  if (!auth.ok) return authzResponse(auth)

  const row = buildPlaybookInsertRow(
    parsed.data,
    auth.clubId,
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
