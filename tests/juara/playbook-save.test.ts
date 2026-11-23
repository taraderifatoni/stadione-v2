import test from "node:test"
import assert from "node:assert/strict"
import { POST } from "../../src/app/api/juara/v1/playbooks/route.ts"

test("playbook save: payload valid → ok", async () => {
  const req = new Request("http://localhost/api/juara/v1/playbooks", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      leagueTier: "LIGA_2", horizonYears: 1, targetOutcome: "CHAMPION",
      tacticalDna: "HIGH_PRESSING", baseFormation: "4-3-3",
      philosophy: { star: 25, competitive: 45, academy: 30 },
      guardrails: { equity: 15_000_000_000, scrMax: 65 },
    }),
  })
  const res = await POST(req)
  assert.equal(res.status, 200)
  const body = await res.json()
  assert.equal(body.ok, true)
})

test("playbook save: philosophy sum 99 → 400", async () => {
  const req = new Request("http://localhost/api/juara/v1/playbooks", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      leagueTier: "LIGA_2", horizonYears: 1, targetOutcome: "CHAMPION",
      tacticalDna: "HIGH_PRESSING", baseFormation: "4-3-3",
      philosophy: { star: 25, competitive: 45, academy: 29 },
      guardrails: { equity: 15_000_000_000, scrMax: 65 },
    }),
  })
  const res = await POST(req)
  assert.equal(res.status, 400)
})
