import { NextResponse, type NextRequest } from "next/server"
import { createServerClient } from "@supabase/ssr"

export async function proxy(request: NextRequest) {
  const hostname = request.headers.get("host") || ""
  const url = request.nextUrl.clone()
  const isPublic = !hostname.startsWith("pos.") && !hostname.startsWith("admin.")

  // Block public host from accessing admin/pos paths
  if (isPublic && (url.pathname.startsWith("/admin") || url.pathname.startsWith("/pos"))) {
    return NextResponse.rewrite(new URL("/404", request.url))
  }

  // Rewrite subdomain paths
  if (hostname.startsWith("pos.") && !url.pathname.startsWith("/pos")) {
    url.pathname = "/pos" + url.pathname
  }
  if (hostname.startsWith("admin.") && !url.pathname.startsWith("/admin")) {
    url.pathname = "/admin" + url.pathname
  }

  // Public host: no auth required
  if (isPublic) {
    return NextResponse.rewrite(url)
  }

  // Admin/POS: check auth
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: { getAll: () => request.cookies.getAll(), setAll: () => {} },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  // No user: redirect to login
  if (!user) {
    if (url.pathname.startsWith("/login") || url.pathname.startsWith("/register") || url.pathname.startsWith("/api/")) {
      return NextResponse.rewrite(url)
    }
    const loginUrl = new URL("/login", request.url)
    loginUrl.searchParams.set("redirect", url.pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Admin — check any role
  if (hostname.startsWith("admin.")) {
    const { data: roles } = await supabase.from("venue_roles").select("role").eq("user_id", user.id)
    if (!roles || roles.length === 0) {
      return NextResponse.redirect(new URL("/", request.url))
    }
  }

  // POS — check staff role
  if (hostname.startsWith("pos.")) {
    const { data: roles } = await supabase.from("venue_roles").select("role").eq("user_id", user.id).in("role", ["owner", "manager", "staff"])
    if (!roles || roles.length === 0) {
      return NextResponse.redirect(new URL("/", request.url))
    }
  }

  return NextResponse.rewrite(url)
}
