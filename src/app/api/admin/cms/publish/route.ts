import { NextRequest, NextResponse } from "next/server"
import { requirePlatformAdmin } from "@/lib/cms/auth"
import { publishInstagramContent } from "@/lib/cms/publish-instagram"

export const runtime = "nodejs"

export async function POST(request: NextRequest) {
  const auth = await requirePlatformAdmin()
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })
  const { id } = await request.json().catch(() => ({}))
  if (typeof id !== "string" || !/^[a-f0-9-]{36}$/i.test(id)) return NextResponse.json({ error: "ID konten tidak valid." }, { status: 400 })
  return publishInstagramContent(id, auth.actor.id)
}
