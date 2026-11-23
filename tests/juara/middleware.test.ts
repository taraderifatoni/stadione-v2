import test from "node:test"
import assert from "node:assert/strict"
import { isJuaraProtected } from "../../src/lib/juara/routing.ts"

test("isJuaraProtected: hanya /juara/* kecuali /juara/login", () => {
  assert.equal(isJuaraProtected("/juara"), true)
  assert.equal(isJuaraProtected("/juara/login"), false)
  assert.equal(isJuaraProtected("/juara/vision"), true)
  assert.equal(isJuaraProtected("/"), false)
  assert.equal(isJuaraProtected("/admin"), false)
})
