import { getJuaraMembership } from "@/lib/juara/server-auth"

export async function GET() {
  const res = await getJuaraMembership()
  if (!res.ok) {
    if (res.status === 403 && res.code === "NO_CLUB") {
      return Response.json({ ok: true, membership: null })
    }
    return Response.json({ error: res.error, code: res.code }, { status: res.status })
  }
  return Response.json({ ok: true, membership: res.membership })
}
