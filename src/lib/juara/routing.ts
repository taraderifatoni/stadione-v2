/** Host routing for the B2B executive suite. Leaves admin/pos untouched. */

export function isJuaraProtected(pathname: string): boolean {
  if (!pathname.startsWith("/juara")) return false
  if (pathname === "/juara/login" || pathname.startsWith("/juara/login/")) return false
  return true
}

export function resolveJuaraPath(host: string, pathname: string): string | null {
  const normalizedHost = host.toLowerCase().split(":")[0]
  if (normalizedHost.startsWith("admin.") || normalizedHost.startsWith("pos.")) {
    return null
  }
  if (pathname === "/juara" || pathname.startsWith("/juara/")) {
    return pathname
  }
  if (normalizedHost.startsWith("juara.")) {
    return pathname === "/" ? "/juara/" : `/juara${pathname}`
  }
  return null
}
