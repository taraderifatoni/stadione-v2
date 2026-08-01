import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const hostname = request.headers.get("host") || ""
  const url = request.nextUrl.clone()

  const isAdmin = hostname.startsWith("admin.")
  const isPos = hostname.startsWith("pos.")
  const isPublic = !isAdmin && !isPos

  // Public routes: no guard needed
  if (
    isPublic &&
    url.pathname !== "/my-bookings" &&
    url.pathname !== "/parent" &&
    !url.pathname.startsWith("/parent/")
  ) {
    return supabaseResponse
  }

  // No user → redirect to login
  if (!user) {
    // Allow login/register/auth pages on any host
    if (url.pathname.startsWith("/login") || url.pathname.startsWith("/register") || url.pathname.startsWith("/auth") || url.pathname.startsWith("/api/")) {
      return supabaseResponse
    }

    const loginUrl = new URL("/login", request.url)
    loginUrl.searchParams.set("redirect", url.pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Admin subdomain: check platform_admin role
  if (isAdmin) {
    const { data } = await supabase
      .from("venue_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "platform_admin")
      .single()

    if (!data) {
      return NextResponse.redirect(new URL("/", request.url))
    }
    return supabaseResponse
  }

  // POS subdomain: check staff/manager/owner role
  if (isPos) {
    const { data } = await supabase
      .from("venue_roles")
      .select("role")
      .eq("user_id", user.id)
      .in("role", ["owner", "manager", "staff"])

    if (!data || data.length === 0) {
      return NextResponse.redirect(new URL("/", request.url))
    }
    return supabaseResponse
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
    "/",
    "/venue/:path*",
    "/my-bookings",
    "/parent/:path*",
  ],
}
