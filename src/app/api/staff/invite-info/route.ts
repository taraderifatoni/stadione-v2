import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token")
  if (!token) return NextResponse.json({ error: "token required" }, { status: 400 })

  const supabase = createAdminClient()
  const { data: invite } = await supabase.from("staff_invites")
    .select("*, venues(name, slug)")
    .eq("token", token)
    .eq("status", "pending")
    .single()

  if (!invite) return NextResponse.json({ error: "Invalid or expired token" }, { status: 404 })

  return NextResponse.json({ invite })
}
