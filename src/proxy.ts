import { NextResponse, type NextRequest } from "next/server"

export function proxy(request: NextRequest) {
  const hostname = request.headers.get("host") || ""
  const url = request.nextUrl.clone()

  // Block public host from accessing admin/pos paths
  const isPublic = !hostname.startsWith("pos.") && !hostname.startsWith("admin.")
  if (isPublic && (url.pathname.startsWith("/admin") || url.pathname.startsWith("/pos"))) {
    return NextResponse.rewrite(new URL("/404", request.url))
  }

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
