import test from "node:test"
import assert from "node:assert/strict"
import { requireCapability } from "../../src/lib/juara/server/authz.ts"

function fakeClient(membership: { club_id: string; role: string } | null, authError = false) {
  const chain = {
    select: () => chain,
    eq: () => chain,
    limit: () => chain,
    maybeSingle: async () => ({ data: membership, error: null }),
  }
  return {
    auth: {
      getUser: async () => ({ data: { user: authError ? null : { id: "user-1" } }, error: null }),
    },
    from: () => chain,
  }
}

test("authz: tanpa sesi ditolak 401", async () => {
  const res = await requireCapability(fakeClient(null, true) as never, "playbook.read")
  assert.equal(res.ok, false)
  if (!res.ok) assert.equal(res.code, "UNAUTHENTICATED")
})

test("authz: tanpa klub ditolak 403 NO_CLUB", async () => {
  const res = await requireCapability(fakeClient(null) as never, "playbook.read")
  assert.equal(res.ok, false)
  if (!res.ok) assert.equal(res.code, "NO_CLUB")
})

test("authz: Head Coach tidak bisa mengaktifkan playbook", async () => {
  const res = await requireCapability(
    fakeClient({ club_id: "club-1", role: "HEAD_COACH" }) as never,
    "playbook.activate"
  )
  assert.equal(res.ok, false)
  if (!res.ok) assert.equal(res.code, "FORBIDDEN")
})

test("authz: Owner lolos dan club_id berasal dari membership", async () => {
  const res = await requireCapability(
    fakeClient({ club_id: "club-9", role: "OWNER" }) as never,
    "playbook.activate"
  )
  assert.equal(res.ok, true)
  if (res.ok) {
    assert.equal(res.clubId, "club-9")
    assert.equal(res.role, "OWNER")
  }
})

test("authz: role tidak dikenal ditolak", async () => {
  const res = await requireCapability(
    fakeClient({ club_id: "club-1", role: "SUPERADMIN" }) as never,
    "playbook.read"
  )
  assert.equal(res.ok, false)
})
