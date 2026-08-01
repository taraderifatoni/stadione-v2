import { createClient } from "@/lib/supabase/client"

export async function getActiveShift(venueId: string) {
  const supabase = createClient()
  const { data } = await supabase.from("shifts").select("*").eq("venue_id", venueId).eq("status", "open").single()
  return data
}

export async function openShift(venueId: string, openingBalance: number) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: new Error("Not authenticated") }
  const { data, error } = await supabase.from("shifts").insert({
    venue_id: venueId, staff_id: user.id, opening_balance: openingBalance, status: "open",
  }).select().single()
  return { data, error }
}

export async function closeShift(shiftId: string, closingBalance: number, notes?: string) {
  const supabase = createClient()
  const { data: txns } = await supabase.from("pos_transactions").select("amount, payment_method").eq("shift_id", shiftId)
  const totalCashIn = txns?.filter((t: any) => t.payment_method === "cash").reduce((s: number, t: any) => s + t.amount, 0) || 0
  const expected = (await supabase.from("shifts").select("opening_balance").eq("id", shiftId).single()).data?.opening_balance || 0
  const discrepancy = closingBalance - (expected + totalCashIn)

  await supabase.from("shifts").update({
    status: "closed", closing_balance: closingBalance, total_cash_in: totalCashIn,
    discrepancy, closed_at: new Date().toISOString(), notes,
  }).eq("id", shiftId)
  return { discrepancy, totalCashIn }
}

export async function createPosTransaction(input: {
  shift_id: string; booking_id?: string; reference_type: string;
  reference_id: string; amount: number; payment_method: string; payment_details?: any
}) {
  const supabase = createClient()
  const { data, error } = await supabase.from("pos_transactions").insert(input).select().single()
  return { data, error }
}

export function generateInvoiceNumber(): string {
  const now = new Date()
  const date = now.toISOString().split("T")[0].replace(/-/g, "")
  const seq = Math.floor(Math.random() * 1000).toString().padStart(3, "0")
  return `INV-${date}-${seq}`
}

export async function createInvoice(input: { venue_id: string; pos_transaction_id: string; total_amount: number }) {
  const supabase = createClient()
  const invoiceNumber = generateInvoiceNumber()
  const { data, error } = await supabase.from("invoices").insert({ ...input, invoice_number: invoiceNumber }).select().single()
  return { data, error, invoiceNumber }
}

export async function requestRefund(input: { pos_transaction_id: string; amount: number; reason: string }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: new Error("Not authenticated") }
  const { error } = await supabase.from("refunds").insert({ ...input, requested_by: user.id })
  return { error }
}

export async function resolveRefund(refundId: string, status: "approved" | "rejected") {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: new Error("Not authenticated") }
  await supabase.from("refunds").update({
    status, approved_by: user.id, resolved_at: new Date().toISOString(),
  }).eq("id", refundId)
  if (status === "approved") {
    const { data: refund } = await supabase.from("refunds").select("pos_transaction_id").eq("id", refundId).single()
    if (refund) {
      await supabase.from("pos_transactions").update({ status: "refunded" }).eq("id", refund.pos_transaction_id)
    }
  }
  return { error: null }
}

export async function getTodayTransactions(shiftId: string) {
  const supabase = createClient()
  const { data } = await supabase.from("pos_transactions").select("*, bookings(booking_date, start_time, end_time)").eq("shift_id", shiftId).order("created_at", { ascending: false })
  return data || []
}

export async function getPendingRefunds(venueId: string) {
  const supabase = createClient()
  const { data: shifts } = await supabase.from("shifts").select("id").eq("venue_id", venueId)
  if (!shifts?.length) return []
  const shiftIds = shifts.map((s: any) => s.id)
  const { data } = await supabase.from("refunds").select("*, pos_transactions(amount, reference_type)").in("pos_transaction_id", (await supabase.from("pos_transactions").select("id").in("shift_id", shiftIds)).data?.map((t: any) => t.id) || []).eq("status", "pending").order("requested_at", { ascending: true })
  return data || []
}
