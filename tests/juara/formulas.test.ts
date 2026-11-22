import test from "node:test"
import assert from "node:assert/strict"
import {
  computeAmortization,
  classifyScr,
  buildAgeMatrix,
  computeGradeQuota,
  computeAri,
} from "../../src/lib/juara/formulas.ts"

test("IAS 38: amortisasi tahunan dari nilai eksak, bukan tampilan bulanan", () => {
  const r = computeAmortization(1_650_000_000, 36)
  assert.equal(r.monthlyExact, 1_650_000_000 / 36)
  assert.equal(r.monthlyDisplay, 45_833_333.33)
  assert.equal(r.annual, 550_000_000)
  assert.equal(r.netBookValueAfter(12), 1_100_000_000)
})

test("SCR: tiga zona dengan batas inklusif", () => {
  assert.equal(classifyScr(58), "GREEN")
  assert.equal(classifyScr(59.8), "YELLOW_WATCHLIST")
  assert.equal(classifyScr(65), "YELLOW_WATCHLIST")
  assert.equal(classifyScr(65.01), "RED_BREACH")
})

test("Matriks usia 27 slot: 1 tahun dan 3 tahun", () => {
  const one = buildAgeMatrix(27, 1)
  assert.deepEqual(one.map((x) => x.percent), [25, 25, 40, 10])
  assert.deepEqual(one.map((x) => x.slots), [7, 7, 11, 2])
  assert.equal(one.reduce((s, x) => s + x.slots, 0), 27)
  const three = buildAgeMatrix(27, 3)
  assert.deepEqual(three.map((x) => x.percent), [35, 30, 28, 7])
  assert.deepEqual(three.map((x) => x.slots), [9, 8, 8, 2])
})

test("Kuota Grade target juara Liga 2 1 tahun", () => {
  assert.deepEqual(computeGradeQuota("CHAMPION_1Y"), {
    A: [6, 8],
    B: [11, 13],
    C: [6, 8],
  })
})

test("ARI 85 = ELITE_HOMEGROWN_ASSET", () => {
  const r = computeAri({ tactical: 90, physical: 88, technical: 80, psychological: 80 })
  assert.equal(r.score, 85)
  assert.equal(r.band, "ELITE_HOMEGROWN_ASSET")
})
