import { playbookGenerateSchema } from "../../../../../../lib/juara/validation.ts"
import { generatePlaybookSummary } from "../../../../../../lib/juara/playbook.ts"
import { buildBoardroomPdf } from "../../../../../../lib/juara/pdf.ts"

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
  const meta = (payload as { meta?: { downloader: string; role: string; timestamp: string } }).meta ?? {
    downloader: "Owner",
    role: "OWNER",
    timestamp: new Date().toISOString(),
  }
  const summary = generatePlaybookSummary(parsed.data)
  const bytes = await buildBoardroomPdf(summary, meta)
  return new Response(bytes as unknown as BodyInit, {
    status: 200,
    headers: { "Content-Type": "application/pdf" },
  })
}
