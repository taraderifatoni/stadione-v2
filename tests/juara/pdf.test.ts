import test from "node:test"
import assert from "node:assert/strict"
import { generatePlaybookSummary } from "../../src/lib/juara/playbook.ts"
import { buildBoardroomPdf } from "../../src/lib/juara/pdf.ts"

const summary = generatePlaybookSummary({
  leagueTier: "LIGA_2",
  horizonYears: 1,
  targetOutcome: "CHAMPION",
  tacticalDna: "HIGH_PRESSING",
    formationMode: "AUTO" as const,
  baseFormation: "4-3-3",
  philosophy: { star: 25, competitive: 45, academy: 30 },
  guardrails: { equity: 15_000_000_000, scrMax: 65 },
})

test("PDF boardroom: menghasilkan bytes dengan header %PDF-", async () => {
  const bytes = await buildBoardroomPdf(summary, {
    downloader: "Budi Owner",
    role: "OWNER",
    timestamp: "23 Nov 2026 07:00 WIB",
  })
  assert.ok(bytes instanceof Uint8Array)
  assert.ok(bytes.length > 100)
  const head = new TextDecoder().decode(bytes.slice(0, 5))
  assert.equal(head, "%PDF-")
})

test("PDF boardroom: watermark dinamis mengandung nama dan peran", async () => {
  const bytes = await buildBoardroomPdf(summary, {
    downloader: "Budi Owner",
    role: "OWNER",
    timestamp: "23 Nov 2026 07:00 WIB",
  })
  const text = new TextDecoder("latin1").decode(bytes)
  assert.ok(text.includes("RAHASIA"))
  assert.ok(text.includes("Budi Owner"))
})
