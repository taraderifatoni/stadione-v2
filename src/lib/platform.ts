import { createAdminClient } from "@/lib/supabase/admin"

export async function getPlatformStats() {
  const supabase = createAdminClient()

  const [venues, bookings, revenue] = await Promise.all([
    supabase.from("venues").select("*", { count: "exact", head: true }),
    supabase.from("bookings").select("*", { count: "exact", head: true }).eq("status", "confirmed"),
    supabase.from("payment_records").select("amount, platform_fee").eq("status", "paid"),
  ])

  const totalRevenue = revenue.data?.reduce((sum: number, p: any) =>
    sum + (p.platform_fee || p.amount * 0.05), 0) || 0

  return {
    totalVenues: venues.count || 0,
    totalBookings: bookings.count || 0,
    totalRevenue,
  }
}

export async function getVenueList() {
  const supabase = createAdminClient()
  const { data } = await supabase.from("venues").select("*, venue_onboarding(status)").order("created_at", { ascending: false })
  return data || []
}

export async function getUserList() {
  const supabase = createAdminClient()
  const { data: roles } = await supabase.from("venue_roles").select("user_id, role, venues(name)")
  const { data: users } = await supabase.auth.admin.listUsers()
  return { users: users?.users || [], roles: roles || [] }
}

export async function getPlatformFee(venueId?: string) {
  const supabase = createAdminClient()
  const query = supabase.from("platform_fee_config").select("*").eq("is_active", true)
  if (venueId) query.eq("venue_id", venueId)
  else query.is("venue_id", null)
  const { data } = await query.limit(10)
  return data || []
}

export async function savePlatformFee(input: { venue_id?: string | null; fee_pct: number; min_fee_amount?: number }) {
  const supabase = createAdminClient()
  const { error } = await supabase.from("platform_fee_config").upsert({
    venue_id: input.venue_id || null,
    fee_pct: input.fee_pct,
    min_fee_amount: input.min_fee_amount || 0,
    is_active: true,
  })
  return { error }
}

export async function getPlatformDiscounts() {
  const supabase = createAdminClient()
  const { data } = await supabase.from("platform_discounts").select("*").order("created_at", { ascending: false })
  return data || []
}

export async function createPlatformDiscount(input: any) {
  const supabase = createAdminClient()
  const { error } = await supabase.from("platform_discounts").insert(input)
  return { error }
}

export async function getAnnouncements() {
  const supabase = createAdminClient()
  const { data } = await supabase.from("platform_announcements").select("*").eq("is_active", true).order("created_at", { ascending: false })
  return data || []
}

export async function createAnnouncement(input: any) {
  const supabase = createAdminClient()
  const { error } = await supabase.from("platform_announcements").insert(input)
  return { error }
}

export async function getOnboardingQueue() {
  const supabase = createAdminClient()
  const { data } = await supabase.from("venue_onboarding").select("*, venues(name, slug), owner:owner_user_id(email)").order("submitted_at", { ascending: false })
  return data || []
}

export async function approveOnboarding(id: string, reviewerId: string) {
  const supabase = createAdminClient()
  await supabase.from("venue_onboarding").update({ status: "approved", reviewer_id: reviewerId, reviewed_at: new Date().toISOString() }).eq("id", id)
  await supabase.from("venues").update({ status: "active" }).eq("id", id)
}

export async function rejectOnboarding(id: string, reviewerId: string, notes: string) {
  const supabase = createAdminClient()
  await supabase.from("venue_onboarding").update({ status: "rejected", reviewer_id: reviewerId, review_notes: notes, reviewed_at: new Date().toISOString() }).eq("id", id)
}
