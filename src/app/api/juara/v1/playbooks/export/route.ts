import { playbookGenerateSchema } from "../../../../../../lib/juara/validation.ts"
import { generatePlaybookSummary } from "../../../../../../lib/juara/playbook.ts"
import { buildBoardroomPdf } from "../../../../../../lib/juara/pdf.ts"
import { createClient } from "../../../../../../lib/supabase/server.ts"
import { authzResponse, requireCapability } from "../../../../../../lib/juara/server/authz.ts"

export async function POST(request: Request) {
  const supabase = await createClient()
  const auth = await requireCapability(supabase, "export.standard")
  if (!auth.ok) return authzResponse(auth)

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

  const { data: userData } = await supabase.auth.getUser()
  const meta = {
    downloader: userData.user?.email ?? auth.userId,
    role: auth.role,
    timestamp: new Date().toLocaleString("id-ID"),
  }

  const summary = generatePlaybookSummary(parsed.data)
  const bytes = await buildBoardroomPdf(summary, meta)
  return new Response(bytes as unknown as BodyInit, {
    status: 200,
    headers: { "Content-Type": "application/pdf.ts" },
  })
}
