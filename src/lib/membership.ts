import { createClient } from "@/lib/supabase/client"

export async function getMembershipPlans(venueId: string) {
  const supabase = createClient()
  const { data } = await supabase.from("membership_plans").select("*").eq("venue_id", venueId).eq("is_active", true).order("tier_level")
  return data || []
}

export async function createPlan(input: any) { const supabase = createClient(); return supabase.from("membership_plans").insert(input) }
export async function updatePlan(id: string, input: any) { const supabase = createClient(); return supabase.from("membership_plans").update(input).eq("id", id) }

export async function getVisitPackages(venueId: string) {
  const supabase = createClient()
  const { data } = await supabase.from("visit_packages").select("*").eq("venue_id", venueId).eq("is_active", true)
  return data || []
}

export async function createVisitPackage(input: any) { const supabase = createClient(); return supabase.from("visit_packages").insert(input) }

export async function getMember(venueId: string) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase.from("members").select("*, plans:plan_id(name, tier_level, benefits)").eq("user_id", user.id).eq("venue_id", venueId).eq("status", "active").single()
  return data
}

export async function enrollMember(input: { venue_id: string; plan_id: string; start_date: string }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: new Error("Not authenticated") }

  const { data: plan } = await supabase.from("membership_plans").select("billing_cycle").eq("id", input.plan_id).single()
  const endDate = new Date(input.start_date)
  if (plan?.billing_cycle === "monthly") endDate.setMonth(endDate.getMonth() + 1)
  else if (plan?.billing_cycle === "quarterly") endDate.setMonth(endDate.getMonth() + 3)
  else endDate.setFullYear(endDate.getFullYear() + 1)

  const { data, error } = await supabase.from("members").insert({
    user_id: user.id, venue_id: input.venue_id, plan_id: input.plan_id,
    start_date: input.start_date, end_date: endDate.toISOString().split("T")[0],
  }).select().single()
  return { data, error }
}

export async function freezeMember(memberId: string) {
  const supabase = createClient()
  const frozen = new Date(); frozen.setMonth(frozen.getMonth() + 2)
  await supabase.from("members").update({ status: "frozen", frozen_until: frozen.toISOString().split("T")[0] }).eq("id", memberId)
}

export async function cancelMember(memberId: string) {
  const supabase = createClient()
  await supabase.from("members").update({ status: "cancelled" }).eq("id", memberId)
}

export async function checkIn(memberId: string, venueId: string, type: "membership" | "visit_package", visitPackageId?: string) {
  const supabase = createClient()
  const { data, error } = await supabase.from("check_ins").insert({
    member_id: memberId, venue_id: venueId, check_in_type: type, member_visit_package_id: visitPackageId || null,
  })
  if (type === "visit_package" && visitPackageId) {
    await supabase.rpc("decrement_visit_package", { pkg_id: visitPackageId })
  }
  return { data, error }
}

export async function getMemberCheckIns(memberId: string) {
  const supabase = createClient()
  const { data } = await supabase.from("check_ins").select("*").eq("member_id", memberId).order("checked_in_at", { ascending: false }).limit(30)
  return data || []
}

export async function earnPoints(memberId: string, points: number, source: string) {
  const supabase = createClient()
  await supabase.from("reward_points").insert({ member_id: memberId, points, source })
}

export async function getRewardBalance(memberId: string) {
  const supabase = createClient()
  const { data } = await supabase.from("reward_points").select("points").eq("member_id", memberId)
  return data?.reduce((sum: number, r: any) => sum + r.points, 0) || 0
}

export async function getVenueMembers(venueId: string) {
  const supabase = createClient()
  const { data } = await supabase.from("members").select("*, plans:plan_id(name, tier_level), users:user_id(email)").eq("venue_id", venueId).order("created_at", { ascending: false })
  return data || []
}
