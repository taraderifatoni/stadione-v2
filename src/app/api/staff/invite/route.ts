import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function POST(request: NextRequest) {
  const { email, venueId, role, invitedBy } = await request.json()
  if (!email || !venueId || !role) {
    return NextResponse.json({ error: "email, venueId, role required" }, { status: 400 })
  }

  const supabase = createAdminClient()
  const { data: invite } = await supabase.from("staff_invites").insert({
    venue_id: venueId, email, role, invited_by: invitedBy,
  }).select("token").single()

  const token = invite?.token
  const inviteUrl = `https://stadione.pro/api/staff/accept?token=${token}`

  // Send email via Resend
  const RESEND = process.env.RESEND_API_KEY
  if (RESEND) {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Authorization": `Bearer ${RESEND}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: "Stadione <noreply@stadione.pro>",
        to: [email],
        subject: "Undangan Staff Stadione",
        text: `Anda diundang sebagai ${role}. Klik tautan ini: ${inviteUrl}`,
      }),
    })
  }

  return NextResponse.json({ success: true, token })
}
