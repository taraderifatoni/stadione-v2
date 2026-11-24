import { z } from "zod"
import { createClient } from "../../../../../../lib/supabase/server.ts"
import { authzResponse, requireCapability } from "../../../../../../lib/juara/server/authz.ts"
import { getActiveKey } from "../../../../../../lib/juara/keyring.ts"
import { encryptField, decryptField } from "../../../../../../lib/juara/field-crypto.ts"
import {
  draftForRole,
  mergeRestrictedDraft,
  splitDraftForStorage,
  mergeFinanceIntoDraft,
  draftVersion,
  readExistingDraft,
} from "../../../../../../lib/juara/draft-dto.ts"

const putSchema = z.object({ draft: z.unknown(), expectedHash: z.string().optional() })
const TABLE = "juara_clubs"
const COLUMN = "vision_draft_enc"
const FINANCE_COLUMN = "vision_finance_enc"

function isMissingFunction(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false
  return error.code === "PGRST202" || /could not find the function/i.test(error.message ?? "")
}

function decrypt(blob: unknown, keyring: { key: Buffer; keyId: string }, clubId: string, column: string): Record<string, unknown> {
  if (typeof blob !== "string" || !blob) return {}
  const raw = Buffer.from(blob.slice(2), "hex")
  return readExistingDraft(decryptField(raw, keyring.key, clubId, TABLE, column, clubId))
}

export async function GET() {
  const supabase = await createClient()
  const auth = await requireCapability(supabase, "playbook.edit")
  if (!auth.ok) return authzResponse(auth)

  const keyring = getActiveKey()
  if (!keyring) return Response.json({ error: "Kunci enkripsi belum terpasang" }, { status: 503 })

  const { data, error } = await supabase
    .from(TABLE)
    .select(`${COLUMN}, ${FINANCE_COLUMN}`)
    .eq("id", auth.clubId)
    .maybeSingle()
  if (error) return Response.json({ error: "Gagal membaca draf" }, { status: 500 })

  const raw = typeof data?.[COLUMN] === "string" ? data[COLUMN] as string : null
  if (!raw) return Response.json({ ok: true, draft: null, version: "0" })

  try {
    const publicDraft = decrypt(raw, keyring, auth.clubId, COLUMN)
    const finance = decrypt(data?.[FINANCE_COLUMN], keyring, auth.clubId, FINANCE_COLUMN)
    const legacyEquity = (publicDraft.guardrails as Record<string, unknown> | undefined)?.equity
    const merged = mergeFinanceIntoDraft(publicDraft, Object.keys(finance).length ? finance : null, auth.role, legacyEquity)
    return Response.json({ ok: true, draft: draftForRole(merged, auth.role), version: draftVersion(raw) })
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

  // Fail closed: kegagalan membaca draft lama membatalkan penulisan.
  const { data: existingRow, error: existingError } = await supabase
    .from(TABLE)
    .select(`${COLUMN}, ${FINANCE_COLUMN}`)
    .eq("id", auth.clubId)
    .maybeSingle()
  if (existingError) return Response.json({ error: "Gagal memverifikasi draf lama" }, { status: 500 })

  const existingRaw = typeof existingRow?.[COLUMN] === "string" ? existingRow[COLUMN] as string : null
  const currentVersion = draftVersion(existingRaw)
  if (parsed.data.expectedHash && parsed.data.expectedHash !== currentVersion) {
    return Response.json({ error: "Draf berubah di sesi lain", code: "VERSION_CONFLICT", version: currentVersion }, { status: 409 })
  }

  let existingPublic: Record<string, unknown> = {}
  try {
    existingPublic = decrypt(existingRaw, keyring, auth.clubId, COLUMN)
  } catch {
    return Response.json({ error: "Draf lama tidak dapat dibaca" }, { status: 500 })
  }

  const merged = mergeRestrictedDraft(parsed.data.draft as Record<string, unknown>, existingPublic, auth.role)
  const split = splitDraftForStorage(merged, auth.role)
  const publicJson = JSON.stringify(split.publicDraft)
  if (publicJson.length > 20_000) return Response.json({ error: "Draf terlalu besar" }, { status: 413 })

  const publicBlob = encryptField(publicJson, keyring.key, keyring.keyId, auth.clubId, TABLE, COLUMN, auth.clubId)
  const publicHex = `\\x${publicBlob.toString("hex")}`
  const financeHex = split.finance
    ? `\\x${encryptField(JSON.stringify(split.finance), keyring.key, keyring.keyId, auth.clubId, TABLE, FINANCE_COLUMN, auth.clubId).toString("hex")}`
    : null

  // RPC scoped peran; fallback hanya untuk schema sebelum M-15.
  const rpc = await supabase.rpc("juara_set_vision_draft", {
    p_club_id: auth.clubId,
    p_blob: publicHex,
    p_finance_blob: financeHex,
  })
  if (rpc.error && !isMissingFunction(rpc.error)) {
    return Response.json({ error: "Gagal menyimpan draf" }, { status: 500 })
  }
  if (rpc.error && isMissingFunction(rpc.error)) {
    const { error } = await supabase.from(TABLE).update({ [COLUMN]: publicHex }).eq("id", auth.clubId)
    if (error) return Response.json({ error: "Gagal menyimpan draf" }, { status: 500 })
    if (financeHex && (auth.role === "OWNER" || auth.role === "CEO")) {
      const { error: finError } = await supabase.from(TABLE).update({ [FINANCE_COLUMN]: financeHex }).eq("id", auth.clubId)
      if (finError) return Response.json({ error: "Gagal menyimpan draf keuangan" }, { status: 500 })
    }
  }

  const after = await supabase.from(TABLE).select(COLUMN).eq("id", auth.clubId).maybeSingle()
  if (after.error) return Response.json({ error: "Gagal memverifikasi draf" }, { status: 500 })
  const afterRaw = typeof after.data?.[COLUMN] === "string" ? after.data[COLUMN] as string : null
  return Response.json({ ok: true, version: draftVersion(afterRaw) })
}
