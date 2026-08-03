import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { createDokuRefund } from "@/lib/doku/refund"

export async function POST(request: NextRequest) {
  const supabase = createAdminClient()

  try {
    const { transactionId, reason, customerBankCode, customerBankAccount, customerBankName } = await request.json()

    // Find the POS transaction
    const { data: txn } = await supabase.from("pos_transactions").select("*, bookings(user_id, booking_date, start_time, end_time)").eq("id", transactionId).single()
    if (!txn) return NextResponse.json({ error: "Transaction not found" }, { status: 404 })

    // Find customer email
    let customerEmail = ""
    let customerName = ""
    if (txn.bookings?.user_id) {
      const { data: u } = await supabase.from("auth.users").select("email").eq("id", txn.bookings.user_id).single()
      customerEmail = u?.email || ""
      customerName = u?.email?.split("@")[0] || "Customer"
    }

    // Try DOKU refund if this was a DOKU/card/online payment
    let refundResult: any = null
    const needsDokuRefund = ["qris", "transfer", "debit", "doku"].includes(txn.payment_method) && txn.payment_details?.doku_url
    const hasBankDetails = customerBankCode && customerBankAccount && customerBankName

    if (needsDokuRefund) {
      try {
        if (hasBankDetails) {
          refundResult = await createDokuRefund({
            originalInvoiceNumber: `INV-${transactionId.slice(0, 8)}`,
            amount: Number(txn.amount),
            reason: reason || "Refund from POS",
            customerName,
            customerEmail,
            bankCode: customerBankCode,
            bankAccountNumber: customerBankAccount,
            bankAccountName: customerBankName,
          })
        } else {
          refundResult = await createDokuRefund({
            originalInvoiceNumber: `INV-${transactionId.slice(0, 8)}`,
            amount: Number(txn.amount),
            reason: reason || "Refund from POS",
            customerName,
            customerEmail,
            deliveryChannel: "EMAIL",
          })
        }
      } catch (e: any) {
        console.error("DOKU refund failed:", e.message)
        // Continue with local refund even if DOKU fails
      }
    }

    // Mark transaction as refunded
    await supabase.from("pos_transactions").update({
      status: "refunded",
      payment_details: {
        ...(txn.payment_details || {}),
        refund_reason: reason,
        refund_at: new Date().toISOString(),
        refund_id: refundResult?.refund_id || null,
        refund_url: refundResult?.refund_url || null,
      },
    }).eq("id", transactionId)

    // If booking, cancel it
    if (txn.booking_id) {
      await supabase.from("bookings").update({ status: "cancelled" }).eq("id", txn.booking_id)
    }

    // Create refund record
    await supabase.from("refunds").insert({
      pos_transaction_id: transactionId,
      requested_by: (await supabase.from("shifts").select("staff_id").eq("id", txn.shift_id).single()).data?.staff_id,
      reason: reason || "Refund from POS",
      amount: Number(txn.amount),
      status: "approved",
      resolved_at: new Date().toISOString(),
    })

    return NextResponse.json({
      success: true,
      refund_id: refundResult?.refund_id || null,
      refund_url: refundResult?.refund_url || null,
      note: hasBankDetails ? "Refund diproses ke rekening customer" : refundResult?.refund_url ? "Link refund dikirim ke customer" : "Refund lokal — perlu diproses manual",
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
