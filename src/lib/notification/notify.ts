import type { NotificationPayload, UserNotificationPreferences } from "@/types"
import { sendInAppNotification } from "./channels/in_app"
import { sendPushNotification } from "./channels/push"
import { sendEmailNotification } from "./channels/email"
import { getUserPreferences } from "./preferences"

export async function sendNotification(payload: NotificationPayload) {
  const channels = payload.channels ?? ["in_app"]
  const prefs = await getUserPreferences(payload.userId)
  const channelsUsed: string[] = []

  const shouldSend = (channel: "push" | "email"): boolean => {
    if (!channels.includes(channel)) return false
    const key = `${payload.type.split(".")[0]}_${channel}` as keyof UserNotificationPreferences
    return prefs?.[key] !== false
  }

  if (channels.includes("in_app")) {
    await sendInAppNotification(payload)
    channelsUsed.push("in_app")
  }

  if (shouldSend("push")) {
    await sendPushNotification(payload)
    channelsUsed.push("push")
  }

  if (shouldSend("email")) {
    await sendEmailNotification(payload)
    channelsUsed.push("email")
  }

  return channelsUsed
}
