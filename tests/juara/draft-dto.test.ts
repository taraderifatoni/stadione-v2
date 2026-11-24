import test from "node:test"
import assert from "node:assert/strict"
import { draftForRole, mergeRestrictedDraft } from "../../src/lib/juara/draft-dto.ts"

const draft = {
  leagueTier: "LIGA_2",
  horizonYears: 1,
  philosophy: { star: 15, competitive: 45, academy: 40 },
  guardrails: { equity: 15_000_000_000, scrMax: 65, secretNote: "jangan tampil" },
  injected: "jangan tampil",
}

test("draft DTO: SD tidak melihat equity mahupun field tambahan", () => {
  const out = draftForRole(draft, "SPORTING_DIRECTOR")
  assert.equal(out.guardrails.scrMax, 65)
  assert.ok(!("equity" in out.guardrails))
  assert.ok(!("secretNote" in out.guardrails))
  assert.ok(!("injected" in out))
  assert.deepEqual(out.philosophy, { star: 15, competitive: 45, academy: 40 })
})

test("draft DTO: Owner melihat equity", () => {
  const out = draftForRole(draft, "OWNER")
  assert.equal(out.guardrails.equity, 15_000_000_000)
})

test("draft merge: SD tidak bisa menimpa equity lama", () => {
  const existing = { guardrails: { equity: 15_000_000_000, scrMax: 65 } }
  const incoming = { guardrails: { equity: 1, scrMax: 62 } }
  const merged = mergeRestrictedDraft(incoming, existing, "SPORTING_DIRECTOR")
  assert.equal(merged.guardrails.equity, 15_000_000_000)
  assert.equal(merged.guardrails.scrMax, 62)
})

test("draft merge: Owner boleh mengubah equity", () => {
  const existing = { guardrails: { equity: 15_000_000_000 } }
  const incoming = { guardrails: { equity: 20_000_000_000 } }
  const merged = mergeRestrictedDraft(incoming, existing, "OWNER")
  assert.equal(merged.guardrails.equity, 20_000_000_000)
})
