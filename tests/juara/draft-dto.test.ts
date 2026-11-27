import test from "node:test"
import assert from "node:assert/strict"
import {
  draftForRole,
  mergeRestrictedDraft,
  splitDraftForStorage,
  mergeFinanceIntoDraft,
  draftVersion,
} from "../../src/lib/juara/draft-dto.ts"

const draft = {
  leagueTier: "LIGA_2",
  horizonYears: 1,
  philosophy: { star: 15, competitive: 45, academy: 40 },
  guardrails: { equity: 15_000_000_000, scrMax: 65, secretNote: "jangan tampil" },
  injected: "jangan tampil",
}

test("draft DTO: SD tidak melihat equity mahupun field tambahan", () => {
  const out = draftForRole(draft, "SPORTING_DIRECTOR")
  assert.equal((out.guardrails as { scrMax: number }).scrMax, 65)
  assert.ok(!("equity" in (out.guardrails as Record<string, unknown>)))
  assert.ok(!("secretNote" in (out.guardrails as Record<string, unknown>)))
  assert.ok(!("injected" in out))
  assert.deepEqual(out.philosophy, { star: 15, competitive: 45, academy: 40 })
})

test("draft DTO: Owner melihat equity", () => {
  const out = draftForRole(draft, "OWNER")
  assert.equal((out.guardrails as { equity: number }).equity, 15_000_000_000)
})

test("draft merge: SD tidak bisa menimpa equity lama", () => {
  const existing = { guardrails: { equity: 15_000_000_000, scrMax: 65 } }
  const incoming = { guardrails: { equity: 1, scrMax: 62 } }
  const merged = mergeRestrictedDraft(incoming, existing, "SPORTING_DIRECTOR")
  assert.equal((merged.guardrails as { equity: number }).equity, 15_000_000_000)
  assert.equal((merged.guardrails as { scrMax: number }).scrMax, 62)
})

test("draft merge: SD tidak menyisipkan equity saat draft lama kosong", () => {
  const merged = mergeRestrictedDraft(
    { guardrails: { equity: 99, scrMax: 62 } },
    {},
    "SPORTING_DIRECTOR"
  )
  assert.ok(!("equity" in (merged.guardrails as Record<string, unknown>)))
  assert.equal((merged.guardrails as { scrMax: number }).scrMax, 62)
})

test("draft storage: SD tidak menghasilkan finance blob", () => {
  const split = splitDraftForStorage({ guardrails: { equity: 15_000_000_000, scrMax: 65 } }, "SPORTING_DIRECTOR")
  assert.equal(split.finance, null)
  assert.ok(!("equity" in (split.publicDraft.guardrails as Record<string, unknown>)))
  const owner = splitDraftForStorage({ guardrails: { equity: 15_000_000_000, scrMax: 65 } }, "OWNER")
  assert.equal((owner.finance as { equity: number }).equity, 15_000_000_000)
})

test("draft finance: gabung hanya untuk peran berhak", () => {
  const sd = mergeFinanceIntoDraft({ guardrails: { scrMax: 65 } }, { equity: 15_000_000_000 }, "SPORTING_DIRECTOR")
  assert.ok(!("equity" in (sd.guardrails as Record<string, unknown>)))
  const owner = mergeFinanceIntoDraft({ guardrails: { scrMax: 65 } }, { equity: 15_000_000_000 }, "OWNER")
  assert.equal((owner.guardrails as { equity: number }).equity, 15_000_000_000)
})

test("draft version: deterministik dan berubah saat isi berubah", () => {
  assert.equal(draftVersion("abc"), draftVersion("abc"))
  assert.notEqual(draftVersion("abc"), draftVersion("abd"))
  assert.equal(draftVersion(null), "0")
})

test("draft merge: Owner boleh mengubah equity", () => {
  const existing = { guardrails: { equity: 15_000_000_000 } }
  const incoming = { guardrails: { equity: 20_000_000_000 } }
  const merged = mergeRestrictedDraft(incoming, existing, "OWNER")
  assert.equal((merged.guardrails as { equity: number }).equity, 20_000_000_000)
})
