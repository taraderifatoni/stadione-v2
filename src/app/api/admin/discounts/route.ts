import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function GET() {
  const supabase = createAdminClient()
  const { data, error } = await supabase.from("platform_discounts").select("*").order("created_at", { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data || [])
}

export async function POST(request: NextRequest) {
  const { code, discount_value, valid_until, max_usage } = await request.json()
  const supabase = createAdminClient()
  const { data, error } = await supabase.from("platform_discounts").insert({
    name: code, code: code.toUpperCase(), discount_type: "percentage",
    discount_value: Number(discount_value), platform_share_pct: 100,
    valid_until, is_active: true, max_total_usage: max_usage || null,
  }).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
