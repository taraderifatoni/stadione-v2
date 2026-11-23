import { z } from "zod"
import { createClient } from "@/lib/supabase/server"

const schema = z.object({
  name: z.string().trim().min(3).max(150),
  leagueTier: z.enum(["LIGA_1", "LIGA_2", "LIGA_3", "ACADEMY_PRO"]),
})

export async function POST(request: Request) {
  let payload: unknown
  try {
    payload = await request.json()
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 })
  }
  const parsed = schema.safeParse(payload)
  if (!parsed.success) {
    return Response.json({ error: "Invalid payload", issues: parsed.error.issues }, { status: 400 })
  }

  const supabase = await createClient()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) {
    return Response.json({ error: "Butuh sesi login", code: "UNAUTHENTICATED" }, { status: 401 })
  }

  const { data, error } = await supabase.rpc("juara_bootstrap_club", {
    p_name: parsed.data.name,
    p_tier: parsed.data.leagueTier,
  })

  if (error) {
    return Response.json({ error: "Gagal membuat klub" }, { status: 500 })
  }

  return Response.json({ ok: true, clubId: data }, { status: 201 })
}
