import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function POST(request: NextRequest) {
  const { memberId, venueId, type, visitPackageId } = await request.json()
  const supabase = createAdminClient()

  await supabase.from("check_ins").insert({
    member_id: memberId, venue_id: venueId,
    check_in_type: type || "membership",
    member_visit_package_id: visitPackageId || null,
  })

  return NextResponse.json({ success: true })
}
