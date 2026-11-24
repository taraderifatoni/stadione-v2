import { z } from "zod"
import { createClient } from "../../../../../../lib/supabase/server.ts"
import { authzResponse, requireCapability } from "../../../../../../lib/juara/server/authz.ts"
import { getActiveKey } from "../../../../../../lib/juara/keyring.ts"
import { encryptField, decryptField } from "../../../../../../lib/juara/field-crypto.ts"

const putSchema = z.object({ draft: z.unknown() })
const TABLE = "juara_clubs"
const COLUMN = "vision_draft_enc"

function aad(clubId: string) {
  return { clubId, table: TABLE, column: COLUMN, rowId: clubId }
}

export async function GET() {
  const supabase = await createClient()
  const auth = await requireCapability(supabase, "playbook.edit")
  if (!auth.ok) return authzResponse(auth)

  const keyring = getActiveKey()
  if (!keyring) {
    return Response.json({ error: "Kunci enkripsi belum terpasang" }, { status: 503 })
  }

  const { data, error } = await supabase
    .from(TABLE)
    .select(COLUMN)
    .eq("id", auth.clubId)
    .maybeSingle()

  if (error) return Response.json({ error: "Gagal membaca draf" }, { status: 500 })
  if (!data?.[COLUMN]) return Response.json({ ok: true, draft: null })

  try {
    const blob = Buffer.from((data[COLUMN] as string).slice(2), "hex")
    const plain = decryptField(blob, keyring.key, aad(auth.clubId).clubId, TABLE, COLUMN, auth.clubId)
    return Response.json({ ok: true, draft: JSON.parse(plain) })
  } catch {
    return Response.json({ error: "Draf tidak dapat dibaca" }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  const supabase = await createClient()
  const auth = await requireCapability(supabase, "playbook.edit")
  if (!auth.ok) return authzResponse(auth)

  const keyring = getActiveKey()
  if (!keyring) {
    return Response.json({ error: "Kunci enkripsi belum terpasang" }, { status: 503 })
  }

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
  const json = JSON.stringify(parsed.data.draft)
  if (json.length > 20_000) {
    return Response.json({ error: "Draf terlalu besar" }, { status: 413 })
  }

  const blob = encryptField(json, keyring.key, keyring.keyId, auth.clubId, TABLE, COLUMN, auth.clubId)
  const { error } = await supabase
    .from(TABLE)
    .update({ [COLUMN]: `\\x${blob.toString("hex")}` })
    .eq("id", auth.clubId)

  if (error) return Response.json({ error: "Gagal menyimpan draf" }, { status: 500 })
  return Response.json({ ok: true })
}
