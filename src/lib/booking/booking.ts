import { createClient } from "@/lib/supabase/client"

export interface Booking {
  id: string
  venue_id: string
  court_slot_id: string
  user_id: string
  booking_date: string
  start_time: string
  end_time: string
  total_hours: number
  base_price: number
  discount_amount: number
  promo_id: string | null
  final_price: number
  status: "pending" | "paid" | "confirmed" | "ongoing" | "completed" | "cancelled" | "refunded"
  is_recurring_parent: boolean
  created_at: string
}

export interface CreateBookingInput {
  venue_id: string
  court_slot_id: string
  booking_date: string
  start_time: string
  end_time: string
  total_hours: number
  base_price: number
  discount_amount: number
  promo_id?: string | null
  final_price: number
}

export async function getBookings(date: string, courtSlotIds: string[]) {
  const supabase = createClient()
  const { data } = await supabase
    .from("bookings")
    .select("*")
    .eq("booking_date", date)
    .in("court_slot_id", courtSlotIds)
    .in("status", ["paid", "confirmed", "ongoing"])
  return (data as Booking[]) || []
}

export async function getUserBookings(userId: string) {
  const supabase = createClient()
  const { data } = await supabase
    .from("bookings")
    .select("*, courts:court_slots(court_id, courts(name, court_type)), venues(name, slug)")
    .eq("user_id", userId)
    .order("booking_date", { ascending: false })
  return data || []
}

export async function createBooking(input: CreateBookingInput) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: new Error("Not authenticated") }

  const { data, error } = await supabase.from("bookings").insert({
    ...input,
    user_id: user.id,
  }).select().single()

  return { data: data as Booking | null, error }
}

export async function cancelBooking(bookingId: string) {
  const supabase = createClient()
  const { error } = await supabase
    .from("bookings")
    .update({ status: "cancelled", updated_at: new Date().toISOString() })
    .eq("id", bookingId)
  return { error }
}

export async function getCourtSlots(courtId: string) {
  const supabase = createClient()
  const { data } = await supabase
    .from("court_slots")
    .select("*")
    .eq("court_id", courtId)
  return data || []
}

export async function ensureCourtSlots(courtId: string, count: number) {
  const supabase = createClient()
  const existing = await getCourtSlots(courtId)
  
  if (existing.length < count) {
    const toCreate = count - existing.length
    const slots = Array.from({ length: toCreate }, (_, i) => ({
      court_id: courtId,
      split_index: existing.length + i,
    }))
    await supabase.from("court_slots").insert(slots)
  }
}
