import type { NotificationPayload } from "@/types"

const ONESIGNAL_APP_ID = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID
const ONESIGNAL_API_KEY = process.env.ONESIGNAL_API_KEY

export async function sendPushNotification(payload: NotificationPayload) {
  if (!ONESIGNAL_APP_ID || !ONESIGNAL_API_KEY) return

  await fetch("https://onesignal.com/api/v1/notifications", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${ONESIGNAL_API_KEY}`,
    },
    body: JSON.stringify({
      app_id: ONESIGNAL_APP_ID,
      headings: { en: payload.title },
      contents: { en: payload.body },
      url: payload.link ?? undefined,
      include_external_user_ids: [payload.userId],
      channel_for_external_user_ids: "push",
    }),
  })
}
