import test from "node:test"
import assert from "node:assert/strict"
import { randomBytes } from "node:crypto"
import {
  encrypt,
  decrypt,
  pack,
  unpack,
  type EncryptedBlob,
} from "../../src/lib/juara/crypto.ts"

const KEY = randomBytes(32)

test("AES-256-GCM: roundtrip dan format blob", () => {
  const blob = encrypt("gaji pokok 480.000.000", KEY, "k1")
  assert.equal(blob.nonce.length, 12)
  assert.equal(blob.ciphertext.length, Buffer.from("gaji pokok 480.000.000").length + 16)
  assert.equal(decrypt(blob, KEY), "gaji pokok 480.000.000")
})

test("AES-256-GCM: AAD salah → gagal dekripsi", () => {
  const blob = encrypt("rahasia", KEY, "k1", Buffer.from("clubA"))
  assert.throws(() => decrypt(blob, KEY, Buffer.from("clubB")), /decrypt|auth|tag/i)
})

test("AES-256-GCM: pack/unpack roundtrip", () => {
  const blob = encrypt("x", KEY, "k2")
  const buf = pack(blob)
  const back = unpack(buf)
  assert.deepEqual(back.nonce, blob.nonce)
  assert.deepEqual(back.ciphertext, blob.ciphertext)
  assert.equal(back.keyId, "k2")
  assert.equal(back.version, 1)
})

test("AES-256-GCM: key bukan 32 byte ditolak", () => {
  assert.throws(() => encrypt("x", randomBytes(16), "k1"), /32|key/i)
})
