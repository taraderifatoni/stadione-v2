import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function GET() {
  const supabase = createAdminClient()
  const { data, error } = await supabase.from("platform_announcements").select("*").order("created_at", { ascending: false }).limit(20)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data || [])
}

export async function POST(request: NextRequest) {
  const { title, body, type } = await request.json()
  if (!title) return NextResponse.json({ error: "Title required" }, { status: 400 })
  const supabase = createAdminClient()
  const { data, error } = await supabase.from("platform_announcements").insert({ title, body, type: type || "info", is_active: true }).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
