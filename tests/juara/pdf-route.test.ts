import test from "node:test"
import assert from "node:assert/strict"
import { playbookGenerateSchema } from "../../src/lib/juara/validation.ts"
import { generatePlaybookSummary } from "../../src/lib/juara/playbook.ts"
import { buildBoardroomPdf } from "../../src/lib/juara/pdf.ts"

const validPayload = {
  leagueTier: "LIGA_2",
  horizonYears: 1,
  targetOutcome: "CHAMPION",
  tacticalDna: "HIGH_PRESSING",
  baseFormation: "4-3-3",
  philosophy: { star: 25, competitive: 45, academy: 30 },
  guardrails: { equity: 15_000_000_000, scrMax: 65 },
}

const meta = { downloader: "Budi Owner", role: "OWNER", timestamp: "23 Nov 2026 07:00 WIB" }

test("PDF export: payload valid → PDF dengan watermark server", async () => {
  const input = playbookGenerateSchema.parse(validPayload)
  const summary = generatePlaybookSummary(input)
  const bytes = await buildBoardroomPdf(summary, meta)
  assert.equal(new TextDecoder().decode(bytes.slice(0, 5)), "%PDF-")
  assert.ok(bytes.length > 500)
})
