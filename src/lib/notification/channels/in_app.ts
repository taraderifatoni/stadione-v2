import type { NotificationPayload } from "@/types"
import { createAdminClient } from "@/lib/supabase/admin"

export async function sendInAppNotification(payload: NotificationPayload) {
  const supabase = createAdminClient()

  await supabase.from("notifications").insert({
    user_id: payload.userId,
    type: payload.type,
    title: payload.title,
    body: payload.body,
    link: payload.link ?? null,
    channels_used: ["in_app"],
    metadata: payload.metadata ?? {},
  })
}
