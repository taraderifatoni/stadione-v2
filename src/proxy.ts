import { NextResponse, type NextRequest } from "next/server"

const SKIP_PREFIXES = ["/_next/", "/api/", "/favicon", "/manifest", "/sw.js", "/.well-known"]

function shouldSkip(pathname: string) {
  return SKIP_PREFIXES.some(p => pathname === p || pathname.startsWith(p))
}

export function proxy(request: NextRequest) {
  const hostname = request.headers.get("host") || ""
  const url = request.nextUrl.clone()
  const isPublic = !hostname.startsWith("pos.") && !hostname.startsWith("admin.")

  if (shouldSkip(url.pathname)) return NextResponse.next()

  // Block public host from accessing admin/pos paths
  if (isPublic && (url.pathname.startsWith("/admin") || url.pathname.startsWith("/pos"))) {
    return NextResponse.rewrite(new URL("/404", request.url))
  }

  // Rewrite subdomain paths
  if (hostname.startsWith("pos.") && !url.pathname.startsWith("/pos")) {
    url.pathname = "/pos" + url.pathname
    return NextResponse.rewrite(url)
  }
  if (hostname.startsWith("admin.") && !url.pathname.startsWith("/admin")) {
    url.pathname = "/admin" + url.pathname
    return NextResponse.rewrite(url)
  }

  return NextResponse.next()
}
