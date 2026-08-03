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
  const inviteUrl = `https://stadione.pro/invite?token=${token}`

  // Send email via local Postfix sendmail
  const message = [
    `From: Stadione <info@stadione.pro>`,
    `To: ${email}`,
    `Subject: Undangan Staff Stadione`,
    `Content-Type: text/plain; charset=UTF-8`,
    ``,
    `Anda diundang sebagai ${role} di Stadione.`,
    ``,
    `Klik tautan ini untuk menerima undangan:`,
    inviteUrl,
    ``,
    `Salam,`,
    `Tim Stadione`,
  ].join("\n")

  try {
    const { spawn } = await import("child_process")
    const proc = spawn("sendmail", ["-t", "-oi", "-f", "info@stadione.pro"], { stdio: ["pipe", "ignore", "pipe"] })
    proc.stdin.write(message)
    proc.stdin.end()
  } catch {}

  return NextResponse.json({ success: true, token })
}
