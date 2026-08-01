import { createClient } from "@/lib/supabase/client"

export interface RecurringTemplate {
  id: string
  user_id: string
  court_slot_id: string
  day_of_week: number
  start_time: string
  end_time: string
  frequency: "weekly" | "biweekly"
  max_occurrences: number | null
  end_date: string | null
  is_active: boolean
  created_at: string
}

export async function createRecurringBooking(input: {
  venue_id: string
  court_slot_id: string
  day_of_week: number
  start_time: string
  end_time: string
  frequency: "weekly" | "biweekly"
  max_occurrences: number
  base_price: number
  final_price: number
  total_hours: number
}) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: new Error("Not authenticated") }

  const { data: template, error } = await supabase
    .from("recurring_templates")
    .insert({
      user_id: user.id,
      court_slot_id: input.court_slot_id,
      day_of_week: input.day_of_week,
      start_time: input.start_time,
      end_time: input.end_time,
      frequency: input.frequency,
      max_occurrences: input.max_occurrences,
    })
    .select()
    .single()

  if (error || !template) return { error }

  const groupId = template.id
  const bookings = []
  const startDate = new Date()

  for (let i = 0; i < input.max_occurrences; i++) {
    const date = new Date(startDate)
    const daysUntil = (input.day_of_week - date.getDay() + 7) % 7
    date.setDate(date.getDate() + daysUntil + (i * (input.frequency === "weekly" ? 7 : 14)))

    const { data: booking } = await supabase.from("bookings").insert({
      venue_id: input.venue_id,
      court_slot_id: input.court_slot_id,
      user_id: user.id,
      booking_date: date.toISOString().split("T")[0],
      start_time: input.start_time,
      end_time: input.end_time,
      total_hours: input.total_hours,
      base_price: input.base_price,
      final_price: input.final_price,
      status: "confirmed",
      is_recurring_parent: i === 0,
      recurring_group_id: groupId,
    }).select().single()

    if (booking) bookings.push(booking)
  }

  return { data: bookings, error: null }
}

export async function getUserRecurringTemplates() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data } = await supabase
    .from("recurring_templates")
    .select("*, court_slots(court_id, courts(name))")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .order("created_at", { ascending: false })

  return data || []
}

export async function cancelRecurringTemplate(templateId: string) {
  const supabase = createClient()
  await supabase.from("recurring_templates").update({ is_active: false }).eq("id", templateId)
  await supabase.from("bookings").update({ status: "cancelled" }).eq("recurring_group_id", templateId)
}
