import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  const { action, email, password } = await request.json()
  const supabase = createClient()

  if (action === "signin") {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }

    const response = NextResponse.json({ success: true, user: data.user })

    // Set session cookie with wildcard domain for cross-subdomain access
    if (data.session) {
      response.cookies.set("sb-access-token", data.session.access_token, {
        domain: ".stadione.pro",
        path: "/",
        httpOnly: false,
        secure: true,
        sameSite: "lax",
        maxAge: data.session.expires_in,
      })
      response.cookies.set("sb-refresh-token", data.session.refresh_token, {
        domain: ".stadione.pro",
        path: "/",
        httpOnly: true,
        secure: true,
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 30,
      })
    }

    return response
  }

  if (action === "get") {
    const { data } = await supabase.auth.getUser()
    return NextResponse.json({ user: data.user || null })
  }

  if (action === "signout") {
    const response = NextResponse.json({ success: true })
    response.cookies.set("sb-access-token", "", { domain: ".stadione.pro", path: "/", maxAge: 0 })
    response.cookies.set("sb-refresh-token", "", { domain: ".stadione.pro", path: "/", maxAge: 0 })
    await supabase.auth.signOut()
    return response
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 })
}
