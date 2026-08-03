import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function POST(request: NextRequest) {
  const { token, userId } = await request.json()
  if (!token || !userId) return NextResponse.json({ error: "token and userId required" }, { status: 400 })

  const supabase = createAdminClient()
  const { data: invite } = await supabase.from("staff_invites").select("*").eq("token", token).eq("status", "pending").single()
  if (!invite) return NextResponse.json({ error: "Invalid or expired token" }, { status: 404 })

  // Accept the invite
  await supabase.from("staff_invites").update({ status: "accepted", accepted_at: new Date().toISOString() }).eq("id", invite.id)

  // Assign role — use the logged-in user's ID, not the inviter
  await supabase.from("venue_roles").upsert({
    user_id: userId, venue_id: invite.venue_id, role: invite.role,
  }, { onConflict: "user_id,venue_id" })

  return NextResponse.json({ success: true, venue_id: invite.venue_id })
}
