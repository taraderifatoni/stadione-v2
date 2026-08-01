/**
 * DOKU Checkout API client
 * Uses HMAC-SHA256 signing pattern
 */

const DOKU_ENV = process.env.DOKU_ENVIRONMENT || "sandbox"
export const DOKU_API_BASE =
  DOKU_ENV === "production"
    ? "https://api.doku.com"
    : "https://api-sandbox.doku.com"

export interface DokuCheckoutPayload {
  order: {
    invoice_number: string
    amount: number
    currency?: string
  }
  payment: {
    payment_due_date: number // Unix timestamp (minutes from now)
  }
  customer: {
    name: string
    email: string
  }
}

export interface DokuCheckoutResponse {
  payment_url: string
  invoice_number: string
  transaction_id?: string
  order_id?: string
}

async function generateSignature(
  clientId: string,
  secretKey: string,
  requestId: string,
  timestamp: string,
  body: string
): Promise<string> {
  const data = `${clientId}|${requestId}|${timestamp}|${body}`
  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secretKey),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  )
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(data))
  return btoa(String.fromCharCode(...new Uint8Array(sig)))
}

export async function createDokuCheckout(
  payload: DokuCheckoutPayload
): Promise<DokuCheckoutResponse> {
  const clientId = process.env.DOKU_CLIENT_ID!
  const secretKey = process.env.DOKU_SECRET_KEY!
  const requestId = crypto.randomUUID()
  const timestamp = new Date().toISOString()
  const body = JSON.stringify({
    order: {
      invoice_number: payload.order.invoice_number,
      amount: payload.order.amount,
      currency: payload.order.currency || "IDR",
    },
    payment: {
      payment_due_date: payload.payment.payment_due_date,
    },
    customer: {
      name: payload.customer.name,
      email: payload.customer.email,
    },
  })

  const signature = await generateSignature(clientId, secretKey, requestId, timestamp, body)

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
  return {
    payment_url: data.payment_url || data.response?.payment_url,
    invoice_number: data.invoice_number || data.response?.invoice_number,
    transaction_id: data.transaction_id,
    order_id: data.order_id,
  }
}

export async function verifyDokuSignature(
  body: string,
  signature: string,
  clientId: string,
  secretKey: string
): Promise<boolean> {
  try {
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(secretKey),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"]
    )
    const sigBytes = Uint8Array.from(atob(signature), (c) => c.charCodeAt(0))
    return await crypto.subtle.verify("HMAC", key, sigBytes, new TextEncoder().encode(body))
  } catch {
    return false
  }
}
