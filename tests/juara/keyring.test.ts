import test from "node:test"
import assert from "node:assert/strict"
import { parseKeyring } from "../../src/lib/juara/keyring.ts"

const b64 = (n: number) => Buffer.alloc(n, 7).toString("base64")

test("keyring: kunci aktif valid dikembalikan", () => {
  const entry = parseKeyring(JSON.stringify({ v1: b64(32) }), "v1")
  assert.equal(entry.keyId, "v1")
  assert.equal(entry.key.length, 32)
})

test("keyring: key id aktif tidak ada ditolak", () => {
  assert.throws(() => parseKeyring(JSON.stringify({ v1: b64(32) }), "v2"), /tidak ada/)
})

test("keyring: panjang kunci salah ditolak", () => {
  assert.throws(() => parseKeyring(JSON.stringify({ v1: b64(16) }), "v1"), /32 byte/)
})

test("keyring: JSON rusak ditolak", () => {
  assert.throws(() => parseKeyring("bukan-json", "v1"), /bukan JSON/)
})

test("keyring: env kosong ditolak jujur", () => {
  assert.throws(() => parseKeyring(undefined, "v1"), /belum di-set/)
})
