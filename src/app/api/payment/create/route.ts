import { NextRequest, NextResponse } from "next/server"
import { createDokuPayment } from "@/lib/doku/client"
import { createAdminClient } from "@/lib/supabase/admin"

export async function POST(request: NextRequest) {
  const { bookingId, amount, userName, userEmail } = await request.json()
  const supabase = createAdminClient()

  const { data: booking } = await supabase.from("bookings").select("*").eq("id", bookingId).single()
  if (!booking) return NextResponse.json({ error: "Booking not found" }, { status: 404 })

  try {
    const invoiceNumber = `INV-${bookingId.slice(0, 8)}-${Date.now().toString(36).toUpperCase()}`

    const result = await createDokuPayment({
      amount,
      invoiceNumber,
      customerName: userName || "Customer",
      customerEmail: userEmail || "customer@stadione.pro",
      callbackUrl: "https://stadione.pro/my-bookings",
    })

    await supabase.from("payment_records").insert({
      user_id: booking.user_id, venue_id: booking.venue_id,
      reference_type: "booking", reference_id: bookingId,
      amount, status: "paid", doku_invoice_id: invoiceNumber,
    })

    return NextResponse.json({ success: true, payment_url: result.payment_url, invoice: invoiceNumber })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
