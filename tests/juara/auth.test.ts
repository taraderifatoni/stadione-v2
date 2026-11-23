import test from "node:test"
import assert from "node:assert/strict"
import { parseClubIdFromJwt, buildSession } from "../../src/lib/juara/auth.ts"

test("club_id diambil dari JWT claim (R11), bukan GUC", () => {
  assert.equal(parseClubIdFromJwt({ club_id: "club-1" }), "club-1")
  assert.equal(parseClubIdFromJwt({}), null)
  assert.equal(parseClubIdFromJwt({ club_id: 42 }), null)
})

test("buildSession null jika membership null", () => {
  assert.equal(buildSession("u1", { club_id: "c1" }, null), null)
  const s = buildSession("u1", { club_id: "c1" }, { clubId: "c1", role: "OWNER" })
  assert.deepEqual(s, { userId: "u1", clubId: "c1", role: "OWNER" })
})
