"use client"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { C } from "@/lib/design"
import Link from "next/link"
import { LayoutDashboard, Building2, Users, DollarSign, Ticket, Settings, LogOut } from "lucide-react"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null)
  const [hasAccess, setHasAccess] = useState(false)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()

  useEffect(() => {
    async function check() {
      const { data: { user: u } } = await supabase.auth.getUser()
      if (!u) {
        router.push("/login?redirect=" + pathname)
        setLoading(false)
        return
      }
      setUser(u)

      const { data: roles } = await supabase.from("venue_roles").select("role").eq("user_id", u.id)
      if (roles && roles.length > 0) setHasAccess(true)

      setLoading(false)
    }
    check()
  }, [pathname])

  if (loading) return (
    <div style={{ background: C.bg, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ width: 40, height: 40, borderRadius: 20, border: `3px solid ${C.border}`, borderTopColor: C.primary, animation: "spin 1s linear infinite", margin: "0 auto 16px" }} />
        <div style={{ fontSize: 14, color: C.textMuted }}>Memuat...</div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
  if (!user) return null // Will redirect
  if (!hasAccess) return (
    <div style={{ background: C.bg, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center", padding: 40 }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>🔒</div>
        <div style={{ fontSize: 18, fontWeight: 700, color: C.text }}>Akses ditolak</div>
        <div style={{ fontSize: 13, color: C.textMuted, marginTop: 6 }}>Anda tidak memiliki akses admin</div>
        <Link href="/" style={{ display: "inline-block", marginTop: 16, padding: "10px 20px", borderRadius: 10, background: C.primary, color: "#fff", fontSize: 13, fontWeight: 600, textDecoration: "none" }}>Kembali ke beranda</Link>
      </div>
    </div>
  )

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: C.bg }}>
      <aside className="w-56 hidden lg:flex flex-col" style={{ borderRight: `1px solid ${C.border}`, backgroundColor: C.surface }}>
        <div className="p-4" style={{ borderBottom: `1px solid ${C.border}` }}>
          <Link href="/admin/dashboard" style={{ fontSize: 18, fontWeight: 800, color: C.primary, textDecoration: "none", letterSpacing: 2 }}>STADIONE</Link>
          <p style={{ fontSize: 10, color: C.textMuted, marginTop: 4 }}>Platform Admin</p>
        </div>
        <nav className="flex-1 py-2">
          {[
            { icon: LayoutDashboard, label: "Dashboard", href: "/admin/dashboard" },
            { icon: Building2, label: "Venue", href: "/admin/venues" },
            { icon: Users, label: "Pengguna", href: "/admin/users" },
            { icon: DollarSign, label: "Fee", href: "/admin/fees" },
            { icon: Ticket, label: "Diskon", href: "/admin/discounts" },
            { icon: Settings, label: "Pengaturan", href: "/admin/settings" },
          ].map(item => (
            <Link key={item.href} href={item.href} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 16px", fontSize: 13, color: C.textSec, textDecoration: "none", fontWeight: pathname === item.href ? 600 : 400 }}>
              <item.icon size={16} />{item.label}
            </Link>
          ))}
        </nav>
        <div className="p-3" style={{ borderTop: `1px solid ${C.border}` }}>
          <button onClick={async () => { await supabase.auth.signOut(); router.push("/login") }} style={{ width: "100%", padding: "10px", borderRadius: 10, border: `1px solid ${C.danger}44`, background: "transparent", color: C.danger, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 8, justifyContent: "center" }}>
            <LogOut size={14} />Keluar
          </button>
        </div>
      </aside>
      <main className="flex-1" style={{ backgroundColor: C.bg }}>{children}</main>
    </div>
  )
}
