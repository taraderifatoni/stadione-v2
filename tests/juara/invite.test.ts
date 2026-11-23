import test from "node:test"
import assert from "node:assert/strict"
import { POST } from "../../src/app/api/juara/v1/members/invite/route.ts"

test("invite: payload valid → ok", async () => {
  const req = new Request("http://localhost/api/juara/v1/members/invite", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "a@b.com", role: "OWNER", clubId: "c1" }),
  })
  const res = await POST(req)
  assert.equal(res.status, 200)
  const body = await res.json()
  assert.equal(body.ok, true)
})

test("invite: role invalid → 400", async () => {
  const req = new Request("http://localhost/api/juara/v1/members/invite", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "a@b.com", role: "SUPERADMIN", clubId: "c1" }),
  })
  const res = await POST(req)
  assert.equal(res.status, 400)
})
