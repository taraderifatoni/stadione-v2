import test from "node:test"
import assert from "node:assert/strict"
import { canViewSalary, canViewPnl, canApprovePlaybook } from "../../src/lib/juara/rbac.ts"
import { validateScrThreshold } from "../../src/lib/juara/validation.ts"

test("RBAC: gaji hanya untuk Owner/CEO/Finance", () => {
  assert.equal(canViewSalary("OWNER"), true)
  assert.equal(canViewSalary("CEO"), true)
  assert.equal(canViewSalary("FINANCE_CONTROLLER"), true)
  assert.equal(canViewSalary("SPORTING_DIRECTOR"), false)
  assert.equal(canViewSalary("HEAD_COACH"), false)
  assert.equal(canViewSalary("CLUB_SECRETARY"), false)
})

test("RBAC: laba-rugi tidak untuk Sporting Director dan Head Coach", () => {
  assert.equal(canViewPnl("SPORTING_DIRECTOR"), false)
  assert.equal(canViewPnl("HEAD_COACH"), false)
  assert.equal(canViewPnl("OWNER"), true)
  assert.equal(canApprovePlaybook("OWNER"), true)
  assert.equal(canApprovePlaybook("HEAD_COACH"), false)
})

test("R15: threshold SCR di bawah 58 di-clamp dengan peringatan", () => {
  const low = validateScrThreshold(57)
  assert.equal(low.ok, false)
  assert.equal(low.normalized, 58)
  assert.ok(low.warning)
  const ok = validateScrThreshold(62)
  assert.equal(ok.ok, true)
  assert.equal(ok.normalized, 62)
})
