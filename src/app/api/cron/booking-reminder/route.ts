import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { sendNotification } from "@/lib/notification/notify"

export async function GET() {
  const supabase = createAdminClient()
  const { data: bookings } = await supabase.from("bookings").select("user_id, booking_date, start_time, end_time").eq("status", "confirmed").eq("booking_date", new Date(Date.now() + 86400000).toISOString().split("T")[0])

  if (bookings) {
    for (const b of bookings) {
      sendNotification({ userId: b.user_id, type: "booking.reminder", title: "Reminder Booking Besok", body: `Booking Anda besok pukul ${b.start_time} - ${b.end_time}`, channels: ["in_app", "push"] })
    }
  }
  return NextResponse.json({ reminded: bookings?.length || 0 })
}
