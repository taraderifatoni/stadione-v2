import type { UserNotificationPreferences } from "@/types"
import { createAdminClient } from "@/lib/supabase/admin"

const defaults: UserNotificationPreferences = {
  user_id: "",
  booking_confirmed_push: true,
  booking_reminder_push: true,
  membership_expired_email: true,
  raport_published_push: true,
  raport_published_email: true,
  payment_push: true,
  payment_email: true,
  promo_push: false,
}

export async function getUserPreferences(userId: string): Promise<UserNotificationPreferences> {
  const supabase = createAdminClient()

  const { data } = await supabase
    .from("user_notification_preferences")
    .select("*")
    .eq("user_id", userId)
    .single()

  return data ?? { ...defaults, user_id: userId }
}

export async function updatePreferences(
  userId: string,
  updates: Partial<Omit<UserNotificationPreferences, "user_id">>
) {
  const supabase = createAdminClient()

  await supabase.from("user_notification_preferences").upsert({
    user_id: userId,
    ...updates,
  })
}
