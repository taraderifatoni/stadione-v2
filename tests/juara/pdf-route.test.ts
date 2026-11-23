import test from "node:test"
import assert from "node:assert/strict"
import { POST } from "../../src/app/api/juara/v1/playbooks/export/route.ts"

const validPayload = {
  leagueTier: "LIGA_2",
  horizonYears: 1,
  targetOutcome: "CHAMPION",
  tacticalDna: "HIGH_PRESSING",
  baseFormation: "4-3-3",
  philosophy: { star: 25, competitive: 45, academy: 30 },
  guardrails: { equity: 15_000_000_000, scrMax: 65 },
  meta: { downloader: "Budi Owner", role: "OWNER", timestamp: "23 Nov 2026 07:00 WIB" },
}

test("PDF export route: payload valid → 200 application/pdf", async () => {
  const req = new Request("http://localhost/api/juara/v1/playbooks/export", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(validPayload),
  })
  const res = await POST(req)
  assert.equal(res.status, 200)
  assert.match(res.headers.get("content-type") ?? "", /application\/pdf/)
  const buf = new Uint8Array(await res.arrayBuffer())
  assert.equal(new TextDecoder().decode(buf.slice(0, 5)), "%PDF-")
})
