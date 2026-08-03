/**
 * DOKU Checkout API client — production
 */

const DOKU_API_BASE = "https://api.doku.com"

export interface DokuPaymentResult {
  payment_url: string
  invoice_number: string
  session_id?: string
}

export async function createDokuPayment(input: {
  amount: number
  invoiceNumber: string
  customerName: string
  customerEmail: string
  customerPhone?: string
  itemName?: string
  callbackUrl?: string
}): Promise<DokuPaymentResult> {
  const clientId = process.env.DOKU_CLIENT_ID!
  const secretKey = process.env.DOKU_SECRET_KEY!
  const requestId = crypto.randomUUID()
  const timestamp = new Date().toISOString().replace(/\.\d{3}/, "")

  const body = JSON.stringify({
    order: {
      amount: input.amount,
      invoice_number: input.invoiceNumber,
      currency: "IDR",
      callback_url: input.callbackUrl || "https://stadione.pro/my-bookings",
      line_items: [
        { name: input.itemName || "Stadione Booking", price: input.amount, quantity: 1 },
      ],
    },
    payment: {
      type: "SALE",
      payment_due_date: 60,
      payment_method_types: [
        "VIRTUAL_ACCOUNT_BCA",
        "VIRTUAL_ACCOUNT_BANK_MANDIRI",
        "VIRTUAL_ACCOUNT_BRI",
        "VIRTUAL_ACCOUNT_BNI",
        "VIRTUAL_ACCOUNT_DOKU",
        "VIRTUAL_ACCOUNT_BANK_PERMATA",
        "QRIS",
        "EMONEY_OVO",
        "EMONEY_DANA",
        "EMONEY_SHOPEE_PAY",
      ],
    },
    customer: {
      name: input.customerName || "Customer",
      email: input.customerEmail || "customer@stadione.pro",
      phone: input.customerPhone || "08123456789",
      country: "ID",
    },
  })

  // Generate body digest
  const bodyDigest = btoa(String.fromCharCode(...new Uint8Array(
    await crypto.subtle.digest("SHA-256", new TextEncoder().encode(body))
  )))

  // Build canonical signature string (V1 format)
  const canonical = [
    `Client-Id:${clientId}`,
    `Request-Id:${requestId}`,
    `Request-Timestamp:${timestamp}`,
    `Request-Target:/checkout/v1/payment`,
    `Digest:${bodyDigest}`,
  ].join("\n")

  // HMAC-SHA256
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secretKey),
    { name: "HMAC", hash: "SHA-256" }, false, ["sign"])
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(canonical))
  const signature = btoa(String.fromCharCode(...new Uint8Array(sig)))

  const response = await fetch(`${DOKU_API_BASE}/checkout/v1/payment`, {
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
    throw new Error(`DOKU checkout failed: ${err}`)
  }

  const data = await response.json()
  const res = data.response || data

  return {
    payment_url: res.payment?.url || res.payment_url || "",
    invoice_number: res.order?.invoice_number || input.invoiceNumber,
    session_id: res.order?.session_id,
  }
}
