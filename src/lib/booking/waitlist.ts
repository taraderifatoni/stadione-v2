import { createClient } from "@/lib/supabase/client"
import { getCourtSlots } from "./booking"

export async function joinWaitlist(input: {
  courtId: string
  bookingDate: string
  startTime: string
  endTime: string
}) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: new Error("Not authenticated") }

  const slots = await getCourtSlots(input.courtId)
  const slot = slots[0]
  if (!slot) return { error: new Error("No slots available") }

  const { error } = await supabase.from("waitlist").insert({
    court_slot_id: slot.id,
    user_id: user.id,
    booking_date: input.bookingDate,
    start_time: input.startTime,
    end_time: input.endTime,
  })

  return { error }
}

export async function getWaitlistPosition(courtId: string, date: string) {
  const supabase = createClient()
  const slots = await getCourtSlots(courtId)
  const slotIds = slots.map(s => s.id)

  const { data } = await supabase
    .from("waitlist")
    .select("*, users:user_id(email)")
    .in("court_slot_id", slotIds)
    .eq("booking_date", date)
    .eq("status", "waiting")
    .order("created_at", { ascending: true })

  return data || []
}

export async function getUserWaitlist() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data } = await supabase
    .from("waitlist")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  return data || []
}

export async function leaveWaitlist(waitlistId: string) {
  const supabase = createClient()
  await supabase.from("waitlist").update({ status: "cancelled" }).eq("id", waitlistId)
}
