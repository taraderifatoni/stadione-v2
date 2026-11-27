import test from "node:test"
import assert from "node:assert/strict"
import { buildPlaybookInsertRow } from "../../src/lib/juara/playbook-save.ts"
import { decryptField } from "../../src/lib/juara/field-crypto.ts"

const keyring = { keyId: "v1", key: Buffer.alloc(32, 9) }

const input = {
  leagueTier: "LIGA_2" as const,
  horizonYears: 3 as const,
  targetOutcome: "PROMOTION" as const,
  tacticalDna: "HIGH_PRESSING" as const,
  formationMode: "AUTO" as const,
  baseFormation: "4-3-3",
  philosophy: { star: 25, competitive: 45, academy: 30 },
  guardrails: { equity: 15_000_000_000, scrMax: 62 },
}

test("playbook-save: memetakan input ke kolom juara_playbooks", () => {
  const row = buildPlaybookInsertRow(input, "club-1", "row-1", keyring)
  assert.equal(row.club_id, "club-1")
  assert.equal(row.id, "row-1")
  assert.equal(row.horizon_years, 3)
  assert.equal(row.target_sporting_outcome, "PROMOTION")
  assert.equal(row.tactical_dna_type, "HIGH_PRESSING")
  assert.equal(row.philosophy_star_pct, 25)
  assert.equal(row.philosophy_prime_pct, 45)
  assert.equal(row.philosophy_academy_pct, 30)
  assert.equal(row.scr_max_threshold_pct, 62)
  assert.equal(row.status, "DRAFT")
})

test("playbook-save: equity dienkripsi dan bisa didekripsi dengan AAD benar", () => {
  const row = buildPlaybookInsertRow(input, "club-1", "row-1", keyring)
  assert.match(row.owner_equity_injection_enc, /^\\x[0-9a-f]+$/)
  const blob = Buffer.from(row.owner_equity_injection_enc.slice(2), "hex")
  const plain = decryptField(blob, keyring.key, "club-1", "juara_playbooks", "owner_equity_injection_enc", "row-1")
  assert.equal(plain, "15000000000")
})

test("playbook-save: ciphertext terikat ke rowId (AAD salah gagal)", () => {
  const row = buildPlaybookInsertRow(input, "club-1", "row-1", keyring)
  const blob = Buffer.from(row.owner_equity_injection_enc.slice(2), "hex")
  assert.throws(
    () => decryptField(blob, keyring.key, "club-1", "juara_playbooks", "owner_equity_injection_enc", "row-2"),
    /authentication tag/
  )
})

test("playbook-save: ciphertext terikat ke clubId (AAD salah gagal)", () => {
  const row = buildPlaybookInsertRow(input, "club-1", "row-1", keyring)
  const blob = Buffer.from(row.owner_equity_injection_enc.slice(2), "hex")
  assert.throws(
    () => decryptField(blob, keyring.key, "club-2", "juara_playbooks", "owner_equity_injection_enc", "row-1"),
    /authentication tag/
  )
})
