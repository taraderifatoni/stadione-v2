import { createClient } from "@/lib/supabase/client"

export interface Promo {
  id: string
  venue_id: string
  code: string
  discount_type: "percentage" | "fixed"
  discount_value: number
  min_booking_hours: number
  valid_from: string
  valid_until: string
  max_usage: number | null
  current_usage: number
  is_active: boolean
}

export async function validatePromo(venueId: string, code: string, totalHours: number) {
  const supabase = createClient()

  const { data } = await supabase
    .from("promos")
    .select("*")
    .eq("venue_id", venueId)
    .eq("code", code.toUpperCase())
    .eq("is_active", true)
    .lte("valid_from", new Date().toISOString())
    .gte("valid_until", new Date().toISOString())
    .single()

  if (!data) return { valid: false, error: "Kode promo tidak ditemukan atau sudah kadaluarsa" }

  const promo = data as Promo

  if (promo.max_usage && promo.current_usage >= promo.max_usage) {
    return { valid: false, error: "Kuota promo sudah habis" }
  }

  if (totalHours < promo.min_booking_hours) {
    return { valid: false, error: `Minimal booking ${promo.min_booking_hours} jam untuk promo ini` }
  }

  return { valid: true, promo }
}

export function applyPromo(basePrice: number, promo: Promo): { discount: number; finalPrice: number } {
  let discount = 0
  if (promo.discount_type === "percentage") {
    discount = basePrice * (promo.discount_value / 100)
  } else {
    discount = promo.discount_value
  }
  return {
    discount: Math.min(discount, basePrice),
    finalPrice: Math.max(0, basePrice - discount),
  }
}
