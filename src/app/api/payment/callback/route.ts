import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { validateDokuNotification } from "@/lib/doku/client"

export async function POST(request: NextRequest) {
  const body = await request.text()
  let payload: any
  try { payload = JSON.parse(body) } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const supabase = createAdminClient()

  // DOKU notification format:
  // { order: { invoice_number, amount }, transaction: { status, date, original_request_id }, channel: { id }, ... }
  const invoiceNumber = payload.order?.invoice_number
  const status = payload.transaction?.status || ""  // "SUCCESS", "PENDING", "FAILED", "EXPIRED"
  const channel = payload.channel?.id || ""
  const acquirer = payload.acquirer?.id || ""
  const paymentDate = payload.transaction?.date
  const virtualAccountNumber = payload.virtual_account_info?.virtual_account_number
  const originalRequestId = payload.transaction?.original_request_id

  if (!invoiceNumber) return NextResponse.json({ error: "Missing invoice" }, { status: 400 })

  console.log(`[DOKU Webhook] ${invoiceNumber} => ${status} (${channel})`)

  // Find payment record by invoice number
  const { data: payment } = await supabase.from("payment_records")
    .select("*").eq("doku_invoice_id", invoiceNumber).single()

  // Map DOKU status to our status
  const dokusToStatus: Record<string, string> = {
    SUCCESS: "paid",
    PENDING: "pending",
    FAILED: "failed",
    EXPIRED: "expired",
    REFUNDED: "refunded",
    TIMEOUT: "failed",
    REDIRECT: "pending",
  }
  const ourStatus = dokusToStatus[status] || "pending"

  // Update payment record
  if (payment) {
    await supabase.from("payment_records").update({
      status: ourStatus,
      doku_callback_raw: payload,
      paid_at: status === "SUCCESS" ? paymentDate || new Date().toISOString() : payment.paid_at,
    }).eq("id", payment.id)
  }

  // Update booking if payment is for a booking
  if (payment?.reference_type === "booking" && status === "SUCCESS") {
    await supabase.from("bookings").update({
      status: "confirmed",
      updated_at: new Date().toISOString(),
    }).eq("id", payment.reference_id)
  }

  // Update pos_transaction if DOKU was used in POS
  if (status === "SUCCESS" || status === "FAILED" || status === "EXPIRED") {
    const { data: posTxns } = await supabase.from("pos_transactions")
      .select("id").eq("payment_method", "doku").eq("status", "pending")
      .filter("payment_details->doku_url", "not.is", null)

    if (posTxns?.length) {
      for (const txn of posTxns) {
        await supabase.from("pos_transactions").update({
          status: status === "SUCCESS" ? "completed" : "failed",
          payment_details: {
            doku_status: status,
            doku_channel: channel,
            doku_va: virtualAccountNumber,
            doku_paid_at: paymentDate,
          },
        }).eq("id", txn.id)
      }
    }
  }

  // Create notification if success
  if (status === "SUCCESS" && payment?.user_id) {
    await supabase.from("notifications").insert({
      user_id: payment.user_id,
      type: "payment",
      title: "Pembayaran Berhasil",
      body: `Pembayaran Rp ${Number(payload.order?.amount || 0).toLocaleString("id-ID")} via ${channel} berhasil.`,
      is_read: false,
    })
  }

  return NextResponse.json({ success: true, invoice: invoiceNumber, status })
}
