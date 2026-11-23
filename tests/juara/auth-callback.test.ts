import test from "node:test"
import assert from "node:assert/strict"
import { handleAuthCallback } from "../../src/lib/juara/auth-callback.ts"

test("auth callback: tanpa code → redirect ke login", async () => {
  const r = await handleAuthCallback(null, async () => ({ error: null }))
  assert.equal(r, "/juara/login?error=missing_code")
})

test("auth callback: code valid → redirect ke /juara", async () => {
  const r = await handleAuthCallback("abc", async () => ({ error: null }))
  assert.equal(r, "/juara")
})

test("auth callback: exchange gagal → redirect ke login dengan error", async () => {
  const r = await handleAuthCallback("abc", async () => ({ error: "invalid" }))
  assert.match(r, /^\/juara\/login\?error=/)
})
