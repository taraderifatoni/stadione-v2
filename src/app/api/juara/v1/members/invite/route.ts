import { z } from "zod"

const inviteSchema = z.object({
  email: z.string().email(),
  role: z.enum(["OWNER", "CEO", "SPORTING_DIRECTOR", "HEAD_COACH", "FINANCE_CONTROLLER", "CLUB_SECRETARY"]),
  clubId: z.string().min(1),
})

export async function POST(request: Request) {
  let payload: unknown
  try {
    payload = await request.json()
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 })
  }
  const parsed = inviteSchema.safeParse(payload)
  if (!parsed.success) {
    return Response.json({ error: "Invalid payload", issues: parsed.error.issues }, { status: 400 })
  }
  // RENCANA: simpan ke juara_club_members setelah apply migrasi + auth invite nyata.
  return Response.json({ ok: true, note: "RENCANA — butuh apply migrasi & auth invite" })
}
