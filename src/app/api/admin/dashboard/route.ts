import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function GET() {
  const supabase = createAdminClient()
  const [v, b, m, s, ve] = await Promise.all([
    supabase.from("venues").select("id", { count: "exact", head: true }),
    supabase.from("bookings").select("id", { count: "exact", head: true }),
    supabase.from("members").select("id", { count: "exact", head: true }),
    supabase.from("students").select("id", { count: "exact", head: true }),
    supabase.from("venues").select("id, name, slug").eq("status", "active").limit(10),
  ])
  return NextResponse.json({
    venues: v.count || 0,
    bookings: b.count || 0,
    members: m.count || 0,
    students: s.count || 0,
    venueList: ve.data || [],
  })
}
