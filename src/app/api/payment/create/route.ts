import { NextRequest, NextResponse } from "next/server"
import { createDokuCheckout } from "@/lib/doku/client"
import { createAdminClient } from "@/lib/supabase/admin"

export async function POST(request: NextRequest) {
  const { bookingId, amount, userName, userEmail } = await request.json()

  const supabase = createAdminClient()
  const { data: booking } = await supabase.from("bookings").select("*").eq("id", bookingId).single()
  if (!booking) return NextResponse.json({ error: "Booking not found" }, { status: 404 })

  try {
    const result = await createDokuCheckout({
      order: { invoice_number: `INV-${Date.now()}`, amount },
      payment: { payment_due_date: Math.floor(Date.now() / 1000) + 3600 },
      customer: { name: userName || "Customer", email: userEmail || "user@stadione.pro" },
    })

    // Update booking with DOKU info
    await supabase.from("bookings").update({ status: "paid" }).eq("id", bookingId)
    await supabase.from("payment_records").insert({
      user_id: booking.user_id, venue_id: booking.venue_id,
      reference_type: "booking", reference_id: bookingId, amount, status: "paid", doku_invoice_id: result.invoice_number,
    })

    return NextResponse.json({ success: true, payment_url: result.payment_url, invoice: result.invoice_number })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
