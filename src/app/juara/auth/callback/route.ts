import { createClient } from "@/lib/supabase/server"
import { handleAuthCallback } from "@/lib/juara/auth-callback"

export async function GET(request: Request) {
  const url = new URL(request.url)
  const code = url.searchParams.get("code")
  const supabase = await createClient()
  const redirect = await handleAuthCallback(code, (c) => supabase.auth.exchangeCodeForSession(c))
  return Response.redirect(new URL(redirect, request.url), 302)
}
