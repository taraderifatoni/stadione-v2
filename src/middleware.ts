import { NextResponse, type NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  const url = request.nextUrl.clone()
  const hostname = request.headers.get("host") || ""

  if (hostname.startsWith("pos.")) {
    url.pathname = `/pos${url.pathname}`
    return NextResponse.rewrite(url)
  }
  if (hostname.startsWith("admin.")) {
    url.pathname = `/admin${url.pathname}`
    return NextResponse.rewrite(url)
  }
  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next|favicon.ico|.*\\..*).*)"],
}
