import test from "node:test"
import assert from "node:assert/strict"
import { playbookGenerateSchema } from "../../src/lib/juara/validation.ts"
import { generatePlaybookSummary } from "../../src/lib/juara/playbook.ts"

const validInput = {
  leagueTier: "LIGA_2",
  horizonYears: 1,
  targetOutcome: "CHAMPION",
  tacticalDna: "HIGH_PRESSING",
  baseFormation: "4-3-3",
  philosophy: { star: 25, competitive: 45, academy: 30 },
  guardrails: { equity: 15_000_000_000, scrMax: 65 },
}

test("wizard: rasio filosofi harus berjumlah 100%", () => {
  const bad = playbookGenerateSchema.safeParse({
    ...validInput,
    philosophy: { star: 25, competitive: 45, academy: 29 },
  })
  assert.equal(bad.success, false)
  assert.equal(playbookGenerateSchema.safeParse(validInput).success, true)
})

test("generate: 27 slot, kuota Grade, dan status SCR dari rumus", () => {
  const input = playbookGenerateSchema.parse(validInput)
  const summary = generatePlaybookSummary(input)
  assert.equal(summary.totalSlots, 27)
  assert.equal(summary.ageMatrix.reduce((s, x) => s + x.slots, 0), 27)
  assert.deepEqual(summary.gradeQuota.A, [6, 8])
  assert.equal(summary.scrStatus, "MENUNGGU_ENGINE")
  assert.equal(summary.scrThresholdPct, 65)
})
