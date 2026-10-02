import { timingSafeEqual } from "node:crypto"
import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { publishInstagramContent } from "@/lib/cms/publish-instagram"

export const runtime = "nodejs"
export const maxDuration = 180

export async function POST(request: NextRequest) {
  const expected = process.env.CMS_WORKER_SECRET
  const actual = request.headers.get("authorization")?.replace(/^Bearer /, "") || ""
  if (!expected || actual.length !== expected.length || !timingSafeEqual(Buffer.from(actual), Buffer.from(expected))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  if (process.env.CMS_SCHEDULER_ENABLED !== "true") return NextResponse.json({ error: "Scheduler disabled" }, { status: 503 })
  const admin = createAdminClient()
  const { data, error } = await admin.from("stadione_content_items")
    .select("id").eq("kind", "SOCIAL").eq("status", "SCHEDULED")
    .contains("platforms", ["INSTAGRAM"]).is("publish_error", null)
    .lte("scheduled_at", new Date().toISOString()).order("scheduled_at").limit(3)
  if (error) return NextResponse.json({ error: "Unable to load scheduled content" }, { status: 500 })
  const results = []
  for (const item of data || []) {
    const response = await publishInstagramContent(item.id, null)
    const result = await response.json()
    // Failed/uncertain work requires an editor; do not repeatedly spend requests.
    if (response.status >= 400 && response.status !== 409) {
      await admin.from("stadione_content_items").update({ publish_error: result.error || "Publication failed" }).eq("id", item.id)
    }
    results.push({ id: item.id, status: response.status, state: result.state || null })
  }
  return NextResponse.json({ checked_at: new Date().toISOString(), results })
}
