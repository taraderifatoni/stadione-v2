import { createClient } from "@/lib/supabase/client"
import { getCourt } from "./court"

export interface PricingRule {
  id: string
  court_id: string
  name: string
  day_type: "weekday" | "weekend" | "holiday"
  time_start: string | null
  time_end: string | null
  base_price: number
  member_discount_pct: number
  is_active: boolean
  priority: number
  created_at: string
}

export async function getPricingRules(courtId: string) {
  const supabase = createClient()
  const { data } = await supabase
    .from("pricing_rules")
    .select("*")
    .eq("court_id", courtId)
    .eq("is_active", true)
    .order("priority", { ascending: false })
  return (data as PricingRule[]) || []
}

export async function createPricingRule(rule: Omit<PricingRule, "id" | "created_at">) {
  const supabase = createClient()
  const { data, error } = await supabase.from("pricing_rules").insert(rule).select().single()
  return { data: data as PricingRule | null, error }
}

export async function updatePricingRule(id: string, updates: Partial<PricingRule>) {
  const supabase = createClient()
  const { error } = await supabase.from("pricing_rules").update(updates).eq("id", id)
  return { error }
}

export async function deletePricingRule(id: string) {
  const supabase = createClient()
  const { error } = await supabase.from("pricing_rules").delete().eq("id", id)
  return { error }
}

export function getDayType(date: Date): "weekday" | "weekend" | "holiday" {
  const day = date.getDay()
  if (day === 0 || day === 6) return "weekend"
  return "weekday"
}

export async function calculatePrice(
  courtId: string,
  date: string,
  startTime: string,
  endTime: string,
  userId: string,
  isMember: boolean
): Promise<{ basePrice: number; discount: number; finalPrice: number; breakdown: string }> {
  const rules = await getPricingRules(courtId)
  const dayType = getDayType(new Date(date))
  
  const startH = parseInt(startTime.split(":")[0])
  const totalHours = (parseInt(endTime.split(":")[0]) + parseInt(endTime.split(":")[1]) / 60) -
    (startH + parseInt(startTime.split(":")[1]) / 60)

  let bestRule: PricingRule | null = null

  for (const rule of rules) {
    if (rule.day_type !== dayType) continue
    if (rule.time_start && startTime < rule.time_start) continue
    if (rule.time_end && endTime > rule.time_end) continue
    if (!bestRule || rule.priority > bestRule.priority) {
      bestRule = rule
    }
  }

  const basePricePerHour = bestRule?.base_price ?? 0
  const basePrice = basePricePerHour * totalHours
  
  let discount = 0
  if (isMember && bestRule) {
    discount = basePrice * (bestRule.member_discount_pct / 100)
  }

  const finalPrice = basePrice - discount

  return {
    basePrice,
    discount,
    finalPrice,
    breakdown: `${totalHours} jam × Rp ${basePricePerHour.toLocaleString("id-ID")}/jam`,
  }
}
