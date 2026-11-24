import test from "node:test"
import assert from "node:assert/strict"
import { chooseServerDraft, chooseLocalDraft, cloneDraft } from "../../src/lib/juara/draft-recovery.ts"

const local = {
  leagueTier: "LIGA_2",
  philosophy: { star: 17, competitive: 45, academy: 38 },
  guardrails: { equity: 100, scrMax: 65 },
}
const server = {
  leagueTier: "LIGA_2",
  philosophy: { star: 25, competitive: 45, academy: 30 },
  guardrails: { equity: 100, scrMax: 61 },
}

test("recovery: memuat server menunjukkan dua field yang berbeda, bukan snapshot lama", () => {
  const backup = cloneDraft(local)
  const choice = chooseServerDraft(server, backup)
  assert.equal(choice.draft.philosophy.star, 25)
  assert.equal(choice.draft.guardrails.scrMax, 61)
  assert.equal(choice.localBackup.philosophy.star, 17)
  assert.equal(choice.restoredLocal, false)
  // Backup tidak diubah oleh draft server.
  assert.equal(backup.philosophy.star, 17)
})

test("recovery: restore lokal eksplisit, bukan otomatis saat save biasa", () => {
  const first = chooseServerDraft(server, cloneDraft(local))
  assert.equal(first.draft.guardrails.scrMax, 61)

  const restored = chooseLocalDraft(first.localBackup!, server)
  assert.equal(restored.draft.philosophy.star, 17)
  assert.equal(restored.restoredLocal, true)
  assert.match(restored.status, /menimpa perubahan server/)
})

test("recovery: tanpa backup tidak ada restore", () => {
  const choice = chooseServerDraft(server, null)
  assert.equal(choice.localBackup, null)
  assert.equal(choice.restoredLocal, false)
})
