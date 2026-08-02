"use client"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { C } from "@/lib/design"
import Link from "next/link"
import { LayoutDashboard, Building2, Users, DollarSign, Ticket, Settings, LogOut } from "lucide-react"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()

  // Render immediately — workspace guard handles venue-level auth
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
      <main className="flex-1 p-4" style={{ backgroundColor: C.bg }}>{children}</main>
    </div>
  )
}
