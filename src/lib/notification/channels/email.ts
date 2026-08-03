import type { NotificationPayload } from "@/types"
import { createAdminClient } from "@/lib/supabase/admin"

const RESEND_API_KEY = process.env.RESEND_API_KEY

export async function sendEmailNotification(payload: NotificationPayload) {
  if (!RESEND_API_KEY) return

  // Lookup user email from auth.users
  let email = ""
  try {
    const supabase = createAdminClient()
    const { data } = await supabase.from("auth.users").select("email").eq("id", payload.userId).single()
    email = data?.email || ""
  } catch { /* silently skip if no email found */ }

  if (!email) return

  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: "Stadione <info@stadione.pro>",
      to: [email],
      subject: payload.title,
      text: payload.body,
    }),
  })
}
