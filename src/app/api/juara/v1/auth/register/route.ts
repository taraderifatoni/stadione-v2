import { z } from "zod"
import { createAdminClient } from "@/lib/supabase/admin"

const schema = z.object({
  name: z.string().trim().min(3, "Nama klub minimal 3 karakter").max(150),
  email: z.string().email(),
  password: z.string().min(8, "Kata sandi minimal 8 karakter").max(128),
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
    return Response.json(
      { error: parsed.error.issues[0]?.message ?? "Data tidak valid" },
      { status: 400 }
    )
  }

  const admin = createAdminClient()
  const { data: created, error: userError } = await admin.auth.admin.createUser({
    email: parsed.data.email,
    password: parsed.data.password,
    email_confirm: true,
    user_metadata: { club_name: parsed.data.name },
  })

  if (userError) {
    const code = userError.message.toLowerCase().includes("registered")
      ? "EMAIL_EXISTS"
      : "CREATE_FAILED"
    return Response.json({ error: "Gagal membuat akun", code }, { status: 409 })
  }

  const userId = created.user?.id
  if (!userId) {
    return Response.json({ error: "Gagal membuat akun" }, { status: 500 })
  }

  const { data: clubId, error: clubError } = await admin.rpc("juara_create_owner_club", {
    p_user_id: userId,
    p_name: parsed.data.name,
    p_tier: parsed.data.leagueTier,
  })

  if (clubError || !clubId) {
    await admin.auth.admin.deleteUser(userId)
    return Response.json({ error: "Gagal membuat klub" }, { status: 500 })
  }

  return Response.json({ ok: true, clubId }, { status: 201 })
}
