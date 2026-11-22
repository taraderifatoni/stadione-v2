import test from "node:test"
import assert from "node:assert/strict"
import { resolveJuaraPath } from "../../src/lib/juara/routing.ts"

test("host juara.stadione.pro di-rewrite ke /juara", () => {
  assert.equal(resolveJuaraPath("juara.stadione.pro", "/"), "/juara/")
  assert.equal(resolveJuaraPath("juara.stadione.pro", "/vision"), "/juara/vision")
})

test("path /juara pada host publik tidak di-rewrite ulang", () => {
  assert.equal(resolveJuaraPath("stadione.pro", "/juara"), "/juara")
  assert.equal(resolveJuaraPath("juara.stadione.pro", "/juara/vision"), "/juara/vision")
})

test("host admin dan pos tidak disentuh routing juara", () => {
  assert.equal(resolveJuaraPath("admin.stadione.pro", "/"), null)
  assert.equal(resolveJuaraPath("pos.stadione.pro", "/"), null)
})
