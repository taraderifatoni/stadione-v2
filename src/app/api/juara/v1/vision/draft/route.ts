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
  readExistingDraft,
} from "../../../../../../lib/juara/draft-dto.ts"

const putSchema = z.object({ draft: z.unknown(), expectedRevision: z.number().int().nonnegative() })
const TABLE = "juara_clubs"
const COLUMN = "vision_draft_enc"
const FINANCE_COLUMN = "vision_finance_enc"
const SELECT_FIELDS = `${COLUMN}, ${FINANCE_COLUMN}, vision_revision, vision_legacy_migrated`

type Keyring = ReturnType<typeof getActiveKey>
type DbError = { code?: string; message?: string } | null

function isConflict(error: DbError): boolean {
  if (!error) return false
  return error.code === "40001" || /REVISION_CONFLICT/i.test(error.message ?? "")
}
function isLegacy(error: DbError): boolean {
  return !!error && /LEGACY_NOT_MIGRATED/i.test(error.message ?? "")
}
function decrypt(blob: unknown, keyring: NonNullable<Keyring>, clubId: string, column: string): Record<string, unknown> {
  if (typeof blob !== "string" || !blob) return {}
  return readExistingDraft(decryptField(Buffer.from(blob.slice(2), "hex"), keyring.key, clubId, TABLE, column, clubId))
}

export async function GET() {
  const supabase = await createClient()
  const auth = await requireCapability(supabase, "playbook.edit")
  if (!auth.ok) return authzResponse(auth)

  const keyring = getActiveKey()
  if (!keyring) return Response.json({ error: "Kunci enkripsi belum terpasang" }, { status: 503 })

  const { data, error } = await supabase.from(TABLE).select(SELECT_FIELDS).eq("id", auth.clubId).maybeSingle()
  if (error) return Response.json({ error: "Gagal membaca draf" }, { status: 500 })

  const raw = typeof data?.[COLUMN] === "string" ? data[COLUMN] as string : null
  if (!raw) {
    return Response.json({ ok: true, draft: null, revision: data?.vision_revision ?? 0, legacyMigrated: data?.vision_legacy_migrated ?? false })
  }

  try {
    const publicDraft = decrypt(raw, keyring, auth.clubId, COLUMN)
    const finance = decrypt(data?.[FINANCE_COLUMN], keyring, auth.clubId, FINANCE_COLUMN)
    const legacyEquity = (publicDraft.guardrails as Record<string, unknown> | undefined)?.equity
    const merged = mergeFinanceIntoDraft(publicDraft, Object.keys(finance).length ? finance : null, auth.role, legacyEquity)
    return Response.json({
      ok: true,
      draft: draftForRole(merged, auth.role),
      revision: data?.vision_revision ?? 0,
      legacyMigrated: data?.vision_legacy_migrated ?? false,
    })
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
    return Response.json({ error: "expectedRevision wajib dan draft harus objek" }, { status: 400 })
  }

  const { data: existingRow, error: existingError } = await supabase.from(TABLE).select(SELECT_FIELDS).eq("id", auth.clubId).maybeSingle()
  if (existingError) return Response.json({ error: "Gagal memverifikasi draf lama" }, { status: 500 })

  let existingPublic: Record<string, unknown> = {}
  try {
    existingPublic = decrypt(existingRow?.[COLUMN], keyring, auth.clubId, COLUMN)
  } catch {
    return Response.json({ error: "Draf lama tidak dapat dibaca" }, { status: 500 })
  }

  const merged = mergeRestrictedDraft(parsed.data.draft as Record<string, unknown>, existingPublic, auth.role)
  const split = splitDraftForStorage(merged, auth.role)
  const publicJson = JSON.stringify(split.publicDraft)
  if (publicJson.length > 20_000) return Response.json({ error: "Draf terlalu besar" }, { status: 413 })

  const publicHex = `\\x${encryptField(publicJson, keyring.key, keyring.keyId, auth.clubId, TABLE, COLUMN, auth.clubId).toString("hex")}`
  const financeHex = split.finance
    ? `\\x${encryptField(JSON.stringify(split.finance), keyring.key, keyring.keyId, auth.clubId, TABLE, FINANCE_COLUMN, auth.clubId).toString("hex")}`
    : null

  // Satu transaksi atomik di database. Tidak ada fallback raw UPDATE.
  const rpc = await supabase.rpc("juara_set_vision_draft", {
    p_club_id: auth.clubId,
    p_blob: publicHex,
    p_finance_blob: financeHex,
    p_expected_revision: parsed.data.expectedRevision,
  })

  if (rpc.error && isConflict(rpc.error)) {
    const { data: current } = await supabase.from(TABLE).select("vision_revision").eq("id", auth.clubId).maybeSingle()
    return Response.json(
      { error: "Draf berubah di sesi lain", code: "VERSION_CONFLICT", revision: current?.vision_revision ?? null },
      { status: 409 }
    )
  }
  if (rpc.error && isLegacy(rpc.error)) {
    return Response.json({ error: "Migrasi draf lama belum selesai; Owner/CEO harus menyimpan sekali", code: "LEGACY_NOT_MIGRATED" }, { status: 409 })
  }
  if (rpc.error) return Response.json({ error: "Gagal menyimpan draf" }, { status: 500 })

  return Response.json({ ok: true, revision: rpc.data as number })
}
