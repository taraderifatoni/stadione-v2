import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function POST(request: NextRequest) {
  const { venueId, userId } = await request.json()
  if (!venueId || !userId) return NextResponse.json({ error: "venueId and userId required" }, { status: 400 })

  const supabase = createAdminClient()
  const { data: roles } = await supabase.from("venue_roles")
    .select("role").eq("user_id", userId).eq("venue_id", venueId)

  // Also check platform_admin
  const { data: paCheck } = await supabase.from("venue_roles")
    .select("role").eq("user_id", userId).eq("role", "platform_admin").single()

  const role = roles?.[0]?.role || null
  const isPlatformAdmin = !!paCheck

  return NextResponse.json({ role, isPlatformAdmin, hasAccess: !!role || isPlatformAdmin })
}
