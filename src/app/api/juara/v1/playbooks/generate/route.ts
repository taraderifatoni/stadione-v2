import { playbookGenerateSchema } from "@/lib/juara/validation"
import { generatePlaybookSummary } from "@/lib/juara/playbook"

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
  return Response.json(generatePlaybookSummary(parsed.data))
}
