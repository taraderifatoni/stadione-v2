import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function GET() {
  const supabase = createAdminClient()
  const { data, error } = await supabase.from("platform_fee_config").select("*").order("created_at", { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data || [])
}

export async function POST(request: NextRequest) {
  const { fee_pct, is_active } = await request.json()
  const supabase = createAdminClient()
  const { data, error } = await supabase.from("platform_fee_config").insert({ fee_pct: Number(fee_pct), is_active: is_active ?? true }).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
