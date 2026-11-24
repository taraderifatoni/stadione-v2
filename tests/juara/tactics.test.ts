import test from "node:test"
import assert from "node:assert/strict"
import {
  TACTICAL_DNA_OPTIONS,
  FORMATION_TEMPLATES,
  buildTacticalProfile,
  resolveFormation,
} from "../../src/lib/juara/tactics.ts"
import { buildPlaybookInsertRow } from "../../src/lib/juara/playbook-save.ts"
import { decryptField } from "../../src/lib/juara/field-crypto.ts"

const base = {
  formationMode: "AUTO" as const,
  baseFormation: "",
  tacticalDna: "HIGH_PRESSING",
  targetOutcome: "CHAMPION",
  mentality: "POSITIVE" as const,
  tempo: "HIGH" as const,
  pressing: "VERY_HIGH" as const,
  defensiveLine: "HIGH" as const,
  width: "WIDE" as const,
  passingStyle: "DIRECT" as const,
}

test("taktik: 10 gaya bermain dan 10 template formasi tersedia", () => {
  assert.equal(TACTICAL_DNA_OPTIONS.length, 10)
  assert.equal(FORMATION_TEMPLATES.length, 10)
})

test("taktik: auto memilih formasi dari preset DNA", () => {
  assert.equal(resolveFormation(base).formation, "4-2-3-1")
  assert.equal(resolveFormation(base).source, "AUTO")
})

test("taktik: mode manual memakai formasi yang diketik user", () => {
  const r = resolveFormation({ ...base, formationMode: "MANUAL", baseFormation: "3-4-1-2" })
  assert.equal(r.formation, "3-4-1-2")
  assert.equal(r.source, "MANUAL")
})

test("taktik: target stabil meredam formasi agresif", () => {
  const r = resolveFormation({ ...base, tacticalDna: "DIRECT_PHYSICAL", targetOutcome: "MID_TABLE_SUSTAINABLE" })
  assert.equal(r.formation, "4-2-3-1")
})

test("taktik: profil memakai label manusia, bukan kode internal", () => {
  const p = buildTacticalProfile(base)
  assert.equal(p.dnaLabel, "Gegenpress")
  assert.equal(p.tempo, "HIGH")
  assert.ok(p.dnaDescription.length > 10)
})

test("playbook-save: profil taktik tersimpan terenkripsi", () => {
  const keyring = { keyId: "v1", key: Buffer.alloc(32, 3) }
  const input = {
    leagueTier: "LIGA_2" as const,
    horizonYears: 1 as const,
    targetOutcome: "CHAMPION" as const,
    ...base,
    philosophy: { star: 25, competitive: 45, academy: 30 },
    guardrails: { equity: 15_000_000_000, scrMax: 65 },
  }
  const row = buildPlaybookInsertRow(input, "club-1", "row-1", keyring)
  assert.match(row.tactical_profile_enc, /^\\x[0-9a-f]+$/)
  const blob = Buffer.from(row.tactical_profile_enc.slice(2), "hex")
  const plain = decryptField(blob, keyring.key, "club-1", "juara_playbooks", "tactical_profile_enc", "row-1")
  const profile = JSON.parse(plain)
  assert.equal(profile.formation, "4-2-3-1")
  assert.equal(profile.dnaLabel, "Gegenpress")
  assert.equal(row.base_formation, "4-2-3-1")
})
