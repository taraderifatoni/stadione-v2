import type { NotificationPayload } from "@/types"
import { createAdminClient } from "@/lib/supabase/admin"

const isServer = typeof window === "undefined"

export async function sendEmailNotification(payload: NotificationPayload) {
  if (!isServer) return // Email only works server-side

  let email = ""
  try {
    const supabase = createAdminClient()
    const { data } = await supabase.from("auth.users").select("email").eq("id", payload.userId).single()
    email = data?.email || ""
  } catch { return }

  if (!email) return

  const message = [
    `From: Stadione <info@stadione.pro>`,
    `To: ${email}`,
    `Subject: ${payload.title}`,
    `Content-Type: text/plain; charset=UTF-8`,
    ``,
    payload.body,
  ].join("\n")

  const { spawn } = await import("child_process")
  return new Promise<void>((resolve, reject) => {
    const proc = spawn("sendmail", ["-t", "-oi", "-f", "info@stadione.pro"], { stdio: ["pipe", "ignore", "pipe"] })
    proc.stdin.write(message)
    proc.stdin.end()
    proc.on("close", code => code === 0 ? resolve() : reject(new Error(`sendmail exited ${code}`)))
    proc.on("error", reject)
  })
}
