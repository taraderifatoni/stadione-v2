import type { NotificationPayload } from "@/types"

const RESEND_API_KEY = process.env.RESEND_API_KEY

export async function sendEmailNotification(payload: NotificationPayload) {
  if (!RESEND_API_KEY) return

  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: "Stadione <info@stadione.pro>",
      to: [payload.userId],
      subject: payload.title,
      text: payload.body,
    }),
  })
}
