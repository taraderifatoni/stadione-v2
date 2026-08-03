/**
 * DOKU Checkout API client — production
 * Covers: Payment, Check Status, Signature (POST & GET)
 */

const DOKU_API_BASE = "https://api.doku.com"

// --- Helpers ---

async function sha256Base64(input: string): Promise<string> {
  return btoa(String.fromCharCode(...new Uint8Array(
    await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input))
  )))
}

async function hmacSign(payload: string): Promise<string> {
  const secretKey = process.env.DOKU_SECRET_KEY!
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secretKey),
    { name: "HMAC", hash: "SHA-256" }, false, ["sign"])
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload))
  return btoa(String.fromCharCode(...new Uint8Array(sig)))
}

function utcTimestamp(): string {
  return new Date().toISOString().replace(/\.\d{3}/, "")
}

/** Generate signature for POST (with Digest) or GET (no Digest) */
async function generateSignature(method: "POST" | "GET", path: string, body?: string): Promise<{ signature: string; requestId: string; timestamp: string; digest?: string }> {
  const clientId = process.env.DOKU_CLIENT_ID!
  const requestId = crypto.randomUUID()
  const timestamp = utcTimestamp()

  let digest: string | undefined
  if (method === "POST" && body) {
    digest = await sha256Base64(body)
  }

  const components = [
    `Client-Id:${clientId}`,
    `Request-Id:${requestId}`,
    `Request-Timestamp:${timestamp}`,
    `Request-Target:${path}`,
  ]
  if (digest) components.push(`Digest:${digest}`)

  const canonical = components.join("\n")
  const signed = await hmacSign(canonical)

  return { signature: `HMACSHA256=${signed}`, requestId, timestamp, digest }
}

function authHeaders(sig: { signature: string; requestId: string; timestamp: string }): Record<string, string> {
  return {
    "Client-Id": process.env.DOKU_CLIENT_ID!,
    "Request-Id": sig.requestId,
    "Request-Timestamp": sig.timestamp,
    Signature: sig.signature,
  }
}

// --- Types ---

export interface DokuPaymentResult {
  payment_url: string
  invoice_number: string
  session_id?: string
  expired_date?: string
}

export interface DokuStatusResult {
  status: "SUCCESS" | "PENDING" | "FAILED" | "EXPIRED" | "REFUNDED" | "TIMEOUT" | "REDIRECT"
  orderStatus?: "ORDER_GENERATED" | "ORDER_EXPIRED" | "ORDER_RECOVERED"
  isFinal: boolean
  invoiceNumber: string
  amount: number
  channel: string
  acquirer: string
  paymentDate?: string
  virtualAccountNumber?: string
  raw: any
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
  const body = JSON.stringify({
    order: {
      amount: input.amount,
      invoice_number: input.invoiceNumber,
      currency: "IDR",
      callback_url: input.callbackUrl || "https://stadione.pro/my-bookings",
      callback_url_result: input.callbackUrl || "https://stadione.pro/my-bookings",
      language: "ID",
      auto_redirect: false,
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
    collect_customer: {
      name: true,
      email: true,
      phone: true,
    },
  })

  const response = await fetchWithRetry("POST", "/checkout/v1/payment", body)

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
    expired_date: res.payment?.expired_date,
  }
}

/**
 * Check transaction status via DOKU Check Status API
 * GET /orders/v1/status/{invoice_number}
 */
export async function checkDokuStatus(invoiceNumber: string): Promise<DokuStatusResult> {
  const path = `/orders/v1/status/${invoiceNumber}`

  const response = await fetchWithRetry("GET", path)

  if (!response.ok) {
    const err = await response.text()
    throw new Error(`DOKU check status failed: ${err}`)
  }

  const data = await response.json()
  const status = data.transaction?.status || "PENDING"

  const finalStatuses = ["SUCCESS", "EXPIRED", "REFUNDED"]
  const isFinal = finalStatuses.includes(status)

  return {
    status,
    orderStatus: data.order?.status as DokuStatusResult["orderStatus"],
    isFinal,
    invoiceNumber: data.order?.invoice_number || invoiceNumber,
    amount: Number(data.order?.amount) || 0,
    channel: data.channel?.id || "",
    acquirer: data.acquirer?.id || "",
    paymentDate: data.transaction?.date,
    virtualAccountNumber: data.virtual_account_info?.virtual_account_number,
    raw: data,
  }
}

/**
 * Retry DOKU request with idempotency (same Request-Id on retry)
 * DOKU uses Request-Id as idempotency key — duplicate requests return 409
 */
async function fetchWithRetry(
  method: "POST" | "GET",
  path: string,
  body?: string,
  maxRetries = 2
): Promise<Response> {
  const sig = await generateSignature(method, path, body)
  let lastError: Error | null = null

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(`${DOKU_API_BASE}${path}`, {
        method,
        headers: {
          ...(method === "POST" ? { "Content-Type": "application/json" } : {}),
          ...authHeaders(sig),
        },
        body,
      })

      // 409 Conflict = idempotent retry, DOKU returns original response
      if (response.status === 409) {
        const cached = await response.json()
        // Wrap cached response to return as normal response
        return new Response(JSON.stringify(cached), { status: 200, headers: { "Content-Type": "application/json" } })
      }

      return response
    } catch (e: any) {
      lastError = e
      if (attempt < maxRetries) {
        await new Promise(r => setTimeout(r, 1000 * (attempt + 1))) // backoff: 1s, 2s
      }
    }
  }

  throw lastError || new Error("DOKU request failed after retries")
}

/**
 * Validate DOKU notification signature (for webhook callbacks)
 * Merchants should validate incoming notifications to prevent spoofing
 */
export async function validateDokuNotification(headers: Record<string, string>, body: string): Promise<boolean> {
  try {
    const clientId = headers["client-id"] || ""
    const requestId = headers["request-id"] || ""
    const timestamp = headers["request-timestamp"] || ""
    const expectedSig = headers["signature"] || ""

    const digest = await sha256Base64(body)
    const notificationPath = "/payments/notifications" // default; can be customized

    const components = [
      `Client-Id:${clientId}`,
      `Request-Id:${requestId}`,
      `Request-Timestamp:${timestamp}`,
      `Request-Target:${notificationPath}`,
      `Digest:${digest}`,
    ].join("\n")

    const computedSig = `HMACSHA256=${await hmacSign(components)}`
    return computedSig === expectedSig
  } catch {
    return false
  }
}
