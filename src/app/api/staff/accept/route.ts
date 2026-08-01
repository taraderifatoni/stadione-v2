import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token")
  if (!token) return NextResponse.json({ error: "token required" }, { status: 400 })

  const supabase = createAdminClient()
  const { data: invite } = await supabase.from("staff_invites").select("*").eq("token", token).eq("status", "pending").single()
  if (!invite) return NextResponse.json({ error: "Invalid or expired token" }, { status: 404 })

  // Accept the invite
  await supabase.from("staff_invites").update({ status: "accepted", accepted_at: new Date().toISOString() }).eq("id", invite.id)

  // Assign role
  await supabase.from("venue_roles").upsert({
    user_id: invite.invited_by, venue_id: invite.venue_id, role: invite.role,
  }, { onConflict: "user_id,venue_id" })

  return NextResponse.redirect("https://stadione.pro/login")
}
