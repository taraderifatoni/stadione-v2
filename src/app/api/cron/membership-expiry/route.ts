import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { sendNotification } from "@/lib/notification/notify"

export async function GET() {
  const supabase = createAdminClient()
  const days = [7, 3, 1]
  let reminded = 0

  for (const d of days) {
    const target = new Date(Date.now() + d * 86400000).toISOString().split("T")[0]
    const { data: members } = await supabase.from("members").select("user_id, end_date").eq("status", "active").eq("end_date", target)

    if (members) {
      for (const m of members) {
        sendNotification({ userId: m.user_id, type: "membership.expired", title: "Membership Akan Berakhir", body: `Membership Anda akan berakhir dalam ${d} hari.`, channels: ["in_app", "push", "email"] })
        reminded++
      }
    }
  }
  return NextResponse.json({ reminded })
}
