import test from "node:test"
import assert from "node:assert/strict"
import { inviteSchema } from "../../src/lib/juara/invite.ts"

test("invite: payload valid lolos validasi", () => {
  const parsed = inviteSchema.safeParse({ email: "a@b.com", role: "OWNER", clubId: "c1" })
  assert.equal(parsed.success, true)
})

test("invite: role invalid ditolak", () => {
  const parsed = inviteSchema.safeParse({ email: "a@b.com", role: "SUPERADMIN", clubId: "c1" })
  assert.equal(parsed.success, false)
})

test("invite: email invalid ditolak", () => {
  const parsed = inviteSchema.safeParse({ email: "bukan-email", role: "CEO", clubId: "c1" })
  assert.equal(parsed.success, false)
})
