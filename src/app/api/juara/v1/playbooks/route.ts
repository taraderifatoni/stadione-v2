import { z } from "zod"
import { playbookGenerateSchema } from "../../../../../lib/juara/validation.ts"

export async function POST(request: Request) {
  let payload: unknown
  try {
    payload = await request.json()
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 })
  }
  const parsed = playbookGenerateSchema.safeParse(payload)
  if (!parsed.success) {
    return Response.json({ error: "Invalid payload", issues: parsed.error.issues }, { status: 400 })
  }
  // RENCANA: simpan ke juara_playbooks setelah apply migrasi (izin Owner).
  return Response.json({ ok: true, note: "RENCANA — butuh apply migrasi M-00..M-06" })
}
