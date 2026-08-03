import { NextResponse, type NextRequest } from "next/server"

const SKIP = ["/_next/", "/api/", "/favicon", "/manifest", "/sw.js", "/.well-known", "/404"]

function shouldSkip(pathname: string) {
  return SKIP.some(p => pathname === p || pathname.startsWith(p))
}

export function middleware(request: NextRequest) {
  const hostname = request.headers.get("host") || ""
  const url = request.nextUrl.clone()

  if (shouldSkip(url.pathname)) return NextResponse.next()

  const isPos = hostname.startsWith("pos.")
  const isAdmin = hostname.startsWith("admin.")
  const isPublic = !isPos && !isAdmin

  // Public host trying to access admin/pos → redirect to correct subdomain
  if (isPublic && url.pathname.startsWith("/admin")) {
    const redirect = new URL(url.pathname + url.search, `https://admin.stadione.pro`)
    return NextResponse.redirect(redirect)
  }
  if (isPublic && url.pathname.startsWith("/pos")) {
    const redirect = new URL(url.pathname + url.search, `https://pos.stadione.pro`)
    return NextResponse.redirect(redirect)
  }

  // Subdomain rewrite — so admin.stadione.pro shows /admin routes, etc.
  if (isPos && !url.pathname.startsWith("/pos")) {
    url.pathname = "/pos" + url.pathname
    return NextResponse.rewrite(url)
  }
  if (isAdmin && !url.pathname.startsWith("/admin")) {
    url.pathname = "/admin" + url.pathname
    return NextResponse.rewrite(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
