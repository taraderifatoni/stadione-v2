import test from "node:test"
import assert from "node:assert/strict"
import { prepareDraftWriteFromEncrypted, planDraftWrite } from "../../src/lib/juara/draft-write.ts"
import { encryptField, decryptField } from "../../src/lib/juara/field-crypto.ts"

const keyring = { keyId: "v1", key: Buffer.alloc(32, 11) }
const clubId = "club-1"
const enc = (value: unknown, column: string) =>
  `\\x${encryptField(JSON.stringify(value), keyring.key, keyring.keyId, clubId, "juara_clubs", column, clubId).toString("hex")}`
const dec = (hex: string | null, column: string) => {
  if (!hex) return null
  return JSON.parse(decryptField(Buffer.from(hex.slice(2), "hex"), keyring.key, clubId, "juara_clubs", column, clubId))
}

const run = (
  incoming: Record<string, unknown>,
  existingPublicHex: string | null,
  existingFinanceHex: string | null,
  role: "OWNER" | "CEO" | "SPORTING_DIRECTOR" | "FINANCE_CONTROLLER"
) => prepareDraftWriteFromEncrypted({ incoming, existingPublicHex, existingFinanceHex, role, clubId, keyring })

test("legacy-only: Owner tanpa equity melakukan backfill dari public", () => {
  const publicHex = enc({ guardrails: { equity: 100, scrMax: 65 } }, "vision_draft_enc")
  const out = run({ guardrails: { scrMax: 62 } }, publicHex, null, "OWNER")
  assert.equal(dec(out.financeHex, "vision_finance_enc").equity, 100)
  assert.ok(!("equity" in dec(out.publicHex, "vision_draft_enc").guardrails))
})

test("split-only: finance existing dipertahankan saat public tidak punya equity", () => {
  const financeHex = enc({ equity: 200 }, "vision_finance_enc")
  const out = run({ guardrails: { scrMax: 62 } }, null, financeHex, "OWNER")
  assert.equal(dec(out.financeHex, "vision_finance_enc").equity, 200)
})

test("keduanya berbeda: finance authoritative menang atas legacy public", () => {
  const publicHex = enc({ guardrails: { equity: 100, scrMax: 65 } }, "vision_draft_enc")
  const financeHex = enc({ equity: 200 }, "vision_finance_enc")
  const kept = run({ guardrails: { scrMax: 62 } }, publicHex, financeHex, "OWNER")
  assert.equal(dec(kept.financeHex, "vision_finance_enc").equity, 200)

  const edited = run({ guardrails: { equity: 300, scrMax: 62 } }, publicHex, financeHex, "OWNER")
  assert.equal(dec(edited.financeHex, "vision_finance_enc").equity, 300)
})

test("SD tidak pernah menulis finance blob", () => {
  const financeHex = enc({ equity: 200 }, "vision_finance_enc")
  const out = run({ guardrails: { equity: 999, scrMax: 62 } }, null, financeHex, "SPORTING_DIRECTOR")
  assert.equal(out.financeHex, null)
})

test("malformed finance blob ditolak, bukan dianggap kosong", () => {
  const malformed = `\\x${Buffer.from("bukan-json").toString("hex")}`
  assert.throws(() => run({ guardrails: { scrMax: 65 } }, null, malformed, "OWNER"), /Malformed encrypted blob/)
})

test("plan: finance null berarti jangan ubah kolom finance", () => {
  const plan = planDraftWrite({
    incoming: { guardrails: { scrMax: 65 } },
    existingPublic: { guardrails: { equity: 100 } },
    existingFinance: { equity: 200 },
    role: "OWNER",
  })
  assert.equal(plan.finance.equity, 200)
})
