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

  // Adapter transisi: RPC tersedia setelah M-14; fallback untuk schema lama.
  const rpc = await supabase.rpc("juara_insert_playbook", {
    p_id: row.id,
    p_club_id: row.club_id,
    p_version_name: row.version_name,
    p_horizon_years: row.horizon_years,
    p_target_sporting_outcome: row.target_sporting_outcome,
    p_tactical_dna_type: row.tactical_dna_type,
    p_base_formation: row.base_formation,
    p_philosophy_star_pct: row.philosophy_star_pct,
    p_philosophy_prime_pct: row.philosophy_prime_pct,
    p_philosophy_academy_pct: row.philosophy_academy_pct,
    p_owner_equity_injection_enc: row.owner_equity_injection_enc,
    p_tactical_profile_enc: row.tactical_profile_enc,
    p_scr_max_threshold_pct: row.scr_max_threshold_pct,
  })

  if (rpc.error && rpc.error.code !== "PGRST202" && !/could not find the function/i.test(rpc.error.message ?? "")) {
    return Response.json({ error: "Gagal menyimpan Playbook" }, { status: 500 })
  }
  if (rpc.error) {
    const { error } = await supabase.from("juara_playbooks").insert(row).select("id").single()
    if (error) return Response.json({ error: "Gagal menyimpan Playbook" }, { status: 500 })
  }

  return Response.json({ ok: true, id: row.id }, { status: 201 })
}
