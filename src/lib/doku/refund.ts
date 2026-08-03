/**
 * DOKU Refund Service API client
 * 
 * Two modes:
 * - Direct: Submit customer bank details → instant refund
 * - Non-Direct: Generate secure link → customer fills details → refund
 * 
 * Coverage: 120+ banks, OVO, DOKU e-Wallet
 * Limits: IDR 10,000 - IDR 25,000,000 per transaction
 */

const DOKU_API_BASE = "https://api.doku.com"

export interface DokuRefundResult {
  refund_id: string
  status: "PROCESSING" | "SUCCESS" | "FAILED"
  refund_url?: string  // For non-direct refunds
}

export interface DokuRefundInput {
  originalInvoiceNumber: string
  amount: number
  reason: string
  customerName: string
  customerEmail: string
  // Direct refund — if you have customer bank details
  bankCode?: string
  bankAccountNumber?: string
  bankAccountName?: string
  // Non-Direct refund — no bank details needed
  // DOKU sends link to customer
  deliveryChannel?: "EMAIL" | "WHATSAPP" | "BOTH"
  customerPhone?: string
  expiryHours?: number  // default 168 (7 days)
}

export async function createDokuRefund(input: DokuRefundInput): Promise<DokuRefundResult> {
  const clientId = process.env.DOKU_CLIENT_ID!
  const secretKey = process.env.DOKU_SECRET_KEY!
  const requestId = crypto.randomUUID()
  const timestamp = new Date().toISOString().replace(/\.\d{3}/, "")

  const hasBankDetails = input.bankCode && input.bankAccountNumber && input.bankAccountName

  const body = JSON.stringify({
    order: {
      invoice_number: input.originalInvoiceNumber,
      amount: { value: input.amount, currency: "IDR" },
    },
    ...(hasBankDetails ? {
      direct_refund: {
        destination_type: "BANK",
        bank_code: input.bankCode,
        account_number: input.bankAccountNumber,
        account_name: input.bankAccountName,
      },
    } : {
      non_direct_refund: {
        customer: {
          name: input.customerName,
          email: input.customerEmail,
          ...(input.customerPhone ? { phone: input.customerPhone } : {}),
        },
        delivery: {
          channel: input.deliveryChannel || "EMAIL",
        },
        link_expiry: {
          value: input.expiryHours || 168,
          unit: "HOURS",
        },
      },
    }),
    additional_info: {
      reason: input.reason,
    },
  })

  const bodyDigest = btoa(String.fromCharCode(...new Uint8Array(
    await crypto.subtle.digest("SHA-256", new TextEncoder().encode(body))
  )))

  const canonical = [
    `Client-Id:${clientId}`,
    `Request-Id:${requestId}`,
    `Request-Timestamp:${timestamp}`,
    `Request-Target:/payouts/v1/refund`,
    `Digest:${bodyDigest}`,
  ].join("\n")

  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secretKey),
    { name: "HMAC", hash: "SHA-256" }, false, ["sign"])
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(canonical))
  const signature = btoa(String.fromCharCode(...new Uint8Array(sig)))

  const response = await fetch(`${DOKU_API_BASE}/payouts/v1/refund`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Client-Id": clientId,
      "Request-Id": requestId,
      "Request-Timestamp": timestamp,
      Signature: `HMACSHA256=${signature}`,
    },
    body,
  })

  if (!response.ok) {
    const err = await response.text()
    throw new Error(`DOKU refund failed: ${err}`)
  }

  const data = await response.json()
  const res = data.response || data

  return {
    refund_id: res.refund_id || res.id || requestId,
    status: res.status || "PROCESSING",
    refund_url: res.refund_url || res.url || undefined,
  }
}

/**
 * Estimated settlement date based on payment method
 * T = transaction date (business day)
 * Returns ISO date string
 */
export function estimateSettlementDate(paymentMethod: string, transactionDate: Date = new Date()): string {
  const addBusinessDays = (date: Date, days: number): Date => {
    const result = new Date(date)
    let added = 0
    while (added < days) {
      result.setDate(result.getDate() + 1)
      if (result.getDay() !== 0 && result.getDay() !== 6) added++
    }
    return result
  }

  const t = new Date(transactionDate)
  // If transaction date is weekend, move to next business day first
  while (t.getDay() === 0 || t.getDay() === 6) t.setDate(t.getDate() + 1)

  switch (paymentMethod) {
    case "qris":      return addBusinessDays(t, 1).toISOString().split("T")[0]
    case "cash":      return t.toISOString().split("T")[0]  // immediate
    case "transfer":  return addBusinessDays(t, 1).toISOString().split("T")[0]
    default:          return addBusinessDays(t, 2).toISOString().split("T")[0]  // VA, debit, etc T+2
  }
}

/**
 * Get settlement status label
 */
export function settlementStatus(settlementDate: string): "settled" | "pending" | "overdue" {
  const today = new Date()
  const sett = new Date(settlementDate)
  if (sett <= today) return "settled"
  // Remove weekends for overdue check
  const diff = Math.ceil((sett.getTime() - today.getTime()) / 86400000)
  if (diff > 5) return "overdue"
  return "pending"
}
