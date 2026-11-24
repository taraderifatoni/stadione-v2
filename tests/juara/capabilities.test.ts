import test from "node:test"
import assert from "node:assert/strict"
import { can, redactForRole } from "../../src/lib/juara/capabilities.ts"
import type { JuaraRole } from "../../src/lib/juara/rbac.ts"

const roles: JuaraRole[] = [
  "OWNER", "CEO", "SPORTING_DIRECTOR", "HEAD_COACH", "FINANCE_CONTROLLER", "CLUB_SECRETARY",
]

test("capability: hanya Owner mengaktifkan playbook dan mengubah role", () => {
  for (const role of roles) {
    assert.equal(can("playbook.activate", role), role === "OWNER")
    assert.equal(can("member.roleChange", role), role === "OWNER")
  }
})

test("capability: Finance hanya clearance, bukan aktivasi", () => {
  assert.equal(can("finance.clearance", "FINANCE_CONTROLLER"), true)
  assert.equal(can("playbook.activate", "FINANCE_CONTROLLER"), false)
  assert.equal(can("playbook.create", "FINANCE_CONTROLLER"), false)
})

test("capability: Head Coach tidak melihat gaji/P&L", () => {
  assert.equal(can("squad.read", "HEAD_COACH"), true)
  assert.equal(can("squad.edit", "HEAD_COACH"), true)
  assert.equal(can("salary.read", "HEAD_COACH"), false)
  assert.equal(can("pnl.read", "HEAD_COACH"), false)
})

test("capability: Secretary hanya administrasi baca", () => {
  assert.equal(can("squad.read", "CLUB_SECRETARY"), true)
  assert.equal(can("squad.edit", "CLUB_SECRETARY"), false)
  assert.equal(can("member.invite", "CLUB_SECRETARY"), false)
})

test("capability: redaksi DTO menghapus field sensitif", () => {
  const dto = {
    id: "pb-1",
    targetOutcome: "PROMOTION",
    baseSalaryMonthly: 15_000_000,
    pnl: 2_000_000,
    contractValue: 99_000_000,
  }
  const redacted = redactForRole(dto, "HEAD_COACH")
  assert.equal(redacted.id, "pb-1")
  assert.equal(redacted.targetOutcome, "PROMOTION")
  assert.ok(!("baseSalaryMonthly" in redacted))
  assert.ok(!("pnl" in redacted))
  assert.ok(!("contractValue" in redacted))

  const owner = redactForRole(dto, "OWNER")
  assert.equal(owner.baseSalaryMonthly, 15_000_000)
  assert.equal(owner.pnl, 2_000_000)
})
