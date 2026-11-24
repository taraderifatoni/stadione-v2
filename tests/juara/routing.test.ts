import test from "node:test"
import assert from "node:assert/strict"
import { isJuaraProtected, resolveJuaraPath } from "../../src/lib/juara/routing.ts"

test("host juara.stadione.pro di-rewrite ke /juara", () => {
  assert.equal(resolveJuaraPath("juara.stadione.pro", "/"), "/juara/")
  assert.equal(resolveJuaraPath("juara.stadione.pro", "/vision"), "/juara/vision")
})

test("path /juara pada host publik tidak di-rewrite ulang", () => {
  assert.equal(resolveJuaraPath("stadione.pro", "/juara"), "/juara")
  assert.equal(resolveJuaraPath("juara.stadione.pro", "/juara/vision"), "/juara/vision")
})

test("halaman publik juara tidak kena auth guard", () => {
  assert.equal(isJuaraProtected("/juara/login"), false)
  assert.equal(isJuaraProtected("/juara/signup"), false)
  assert.equal(isJuaraProtected("/juara/auth/callback"), false)
  assert.equal(isJuaraProtected("/juara/vision"), true)
  assert.equal(isJuaraProtected("/juara/playbooks"), true)
})

test("host admin dan pos tidak disentuh routing juara", () => {
  assert.equal(resolveJuaraPath("admin.stadione.pro", "/"), null)
  assert.equal(resolveJuaraPath("pos.stadione.pro", "/"), null)
})
