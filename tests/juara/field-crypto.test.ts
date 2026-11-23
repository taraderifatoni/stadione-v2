import test from "node:test"
import assert from "node:assert/strict"
import { randomBytes } from "node:crypto"
import { encryptField, decryptField } from "../../src/lib/juara/field-crypto.ts"

const KEY = randomBytes(32)

test("field-crypto: roundtrip dengan AAD club/table/column/row", () => {
  const buf = encryptField("480000000", KEY, "k1", "club-1", "juara_contracts_vault", "base_salary_monthly_enc", "row-1")
  assert.ok(buf instanceof Buffer)
  const pt = decryptField(buf, KEY, "club-1", "juara_contracts_vault", "base_salary_monthly_enc", "row-1")
  assert.equal(pt, "480000000")
})

test("field-crypto: AAD salah → throw", () => {
  const buf = encryptField("x", KEY, "k1", "club-1", "t", "c", "r")
  assert.throws(() => decryptField(buf, KEY, "club-2", "t", "c", "r"), /decrypt|auth|tag/i)
})
