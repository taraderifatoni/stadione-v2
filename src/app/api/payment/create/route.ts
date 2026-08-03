import { NextRequest, NextResponse } from "next/server"
import { createDokuPayment } from "@/lib/doku/client"
import { createAdminClient } from "@/lib/supabase/admin"

export async function POST(request: NextRequest) {
  const { bookingId, referenceType, referenceId, amount, userName, userEmail, itemName } = await request.json()
  const supabase = createAdminClient()

  let userId = ""
  let venueId = ""

  try {
    if (referenceType === "membership") {
      const { data: member } = await supabase.from("members").select("user_id, venue_id").eq("id", referenceId).single()
      if (member) { userId = member.user_id; venueId = member.venue_id }
    } else if (bookingId) {
      const { data: booking } = await supabase.from("bookings").select("user_id, venue_id").eq("id", bookingId).single()
      if (booking) { userId = booking.user_id; venueId = booking.venue_id }
    }

    const refId = referenceId || bookingId || crypto.randomUUID()
    const invoiceNumber = `INV-${refId.slice(0, 8)}-${Date.now().toString(36).toUpperCase()}`

    const result = await createDokuPayment({
      amount,
      invoiceNumber,
      itemName: itemName || "Stadione Booking",
      customerName: userName || "Customer",
      customerEmail: userEmail || "customer@stadione.pro",
      callbackUrl: "https://stadione.pro/my-bookings",
    })

    if (userId && venueId) {
      await supabase.from("payment_records").insert({
        user_id: userId, venue_id: venueId,
        reference_type: referenceType || "booking", reference_id: refId,
        amount, status: "paid", doku_invoice_id: invoiceNumber,
      })
    }

    return NextResponse.json({ success: true, payment_url: result.payment_url, invoice: invoiceNumber })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
