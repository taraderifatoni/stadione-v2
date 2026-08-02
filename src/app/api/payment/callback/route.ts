import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function POST(request: NextRequest) {
  const body = await request.text()
  let payload: any
  try { payload = JSON.parse(body) } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const supabase = createAdminClient()
  
  // DOKU sends: transaction.status, order.invoice_number, order.amount
  const invoiceNumber = payload.order?.invoice_number || payload.transaction?.invoice_number
  const status = (payload.transaction?.status || payload.result || "").toLowerCase()
  const isSuccess = ["success", "completed", "settlement", "paid"].some(s => status.includes(s))

  if (invoiceNumber && isSuccess) {
    // Find payment record
    const { data: payment } = await supabase.from("payment_records").select("*").eq("doku_invoice_id", invoiceNumber).single()
    if (payment && payment.reference_type === "booking") {
      await supabase.from("bookings").update({ status: "confirmed", updated_at: new Date().toISOString() }).eq("id", payment.reference_id)
      await supabase.from("payment_records").update({ status: "paid", doku_callback_raw: payload, paid_at: new Date().toISOString() }).eq("id", payment.id)
    }
  }

  return NextResponse.json({ success: true })
}
