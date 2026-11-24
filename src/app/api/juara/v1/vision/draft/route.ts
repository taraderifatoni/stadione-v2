import { z } from "zod"
import { createClient } from "../../../../../../lib/supabase/server.ts"
import { authzResponse, requireCapability } from "../../../../../../lib/juara/server/authz.ts"
import { getActiveKey } from "../../../../../../lib/juara/keyring.ts"
import { encryptField, decryptField } from "../../../../../../lib/juara/field-crypto.ts"
import { draftForRole, mergeRestrictedDraft, readExistingDraft } from "../../../../../../lib/juara/draft-dto.ts"

const putSchema = z.object({ draft: z.unknown() })
const TABLE = "juara_clubs"
const COLUMN = "vision_draft_enc"

function isMissingFunction(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false
  return error.code === "PGRST202" || /could not find the function/i.test(error.message ?? "")
}

export async function GET() {
  const supabase = await createClient()
  const auth = await requireCapability(supabase, "playbook.edit")
  if (!auth.ok) return authzResponse(auth)

  const keyring = getActiveKey()
  if (!keyring) return Response.json({ error: "Kunci enkripsi belum terpasang" }, { status: 503 })

  const { data, error } = await supabase
    .from(TABLE)
    .select(COLUMN)
    .eq("id", auth.clubId)
    .maybeSingle()
  if (error) return Response.json({ error: "Gagal membaca draf" }, { status: 500 })
  if (!data?.[COLUMN]) return Response.json({ ok: true, draft: null })

  try {
    const blob = Buffer.from((data[COLUMN] as string).slice(2), "hex")
    const plain = decryptField(blob, keyring.key, auth.clubId, TABLE, COLUMN, auth.clubId)
    const parsed = readExistingDraft(plain)
    return Response.json({ ok: true, draft: draftForRole(parsed, auth.role) })
  } catch {
    return Response.json({ error: "Draf tidak dapat dibaca" }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  const supabase = await createClient()
  const auth = await requireCapability(supabase, "playbook.edit")
  if (!auth.ok) return authzResponse(auth)

  const keyring = getActiveKey()
  if (!keyring) return Response.json({ error: "Kunci enkripsi belum terpasang" }, { status: 503 })

  let payload: unknown
  try {
    payload = await request.json()
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 })
  }
  const parsed = putSchema.safeParse(payload)
  if (!parsed.success || typeof parsed.data.draft !== "object" || parsed.data.draft === null || Array.isArray(parsed.data.draft)) {
    return Response.json({ error: "Draf harus berupa objek" }, { status: 400 })
  }

  // Ambil nilai privat lama untuk merge; editor terbatas tidak bisa menimpanya.
  const { data: existingRow } = await supabase
    .from(TABLE)
    .select(COLUMN)
    .eq("id", auth.clubId)
    .maybeSingle()
  let existing: Record<string, unknown> = {}
  if (existingRow?.[COLUMN]) {
    try {
      const blob = Buffer.from((existingRow[COLUMN] as string).slice(2), "hex")
      existing = readExistingDraft(decryptField(blob, keyring.key, auth.clubId, TABLE, COLUMN, auth.clubId))
    } catch {
      return Response.json({ error: "Draf lama tidak dapat dibaca" }, { status: 500 })
    }
  }

  const merged = mergeRestrictedDraft(parsed.data.draft as Record<string, unknown>, existing, auth.role)
  const json = JSON.stringify(merged)
  if (json.length > 20_000) return Response.json({ error: "Draf terlalu besar" }, { status: 413 })

  const blob = encryptField(json, keyring.key, keyring.keyId, auth.clubId, TABLE, COLUMN, auth.clubId)
  const hex = `\\x${blob.toString("hex")}`

  // Adapter transisi: RPC tersedia setelah M-14; fallback untuk schema lama.
  const rpc = await supabase.rpc("juara_set_vision_draft", { p_club_id: auth.clubId, p_blob: hex })
  if (rpc.error && !isMissingFunction(rpc.error)) {
    return Response.json({ error: "Gagal menyimpan draf" }, { status: 500 })
  }
  if (rpc.error && isMissingFunction(rpc.error)) {
    const { error } = await supabase.from(TABLE).update({ [COLUMN]: hex }).eq("id", auth.clubId)
    if (error) return Response.json({ error: "Gagal menyimpan draf" }, { status: 500 })
  }

  return Response.json({ ok: true })
}
