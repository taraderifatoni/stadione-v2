"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useState } from "react"
import {
  ChevronLeft,
  ChevronRight,
  Compass,
  LayoutDashboard,
  LibraryBig,
  LogOut,
  Search,
  ShieldCheck,
} from "lucide-react"
import { useJuaraSession } from "./SessionProvider"
import { createClient } from "@/lib/supabase/client"
import type { ReactNode } from "react"

const NAV = [
  { href: "/juara", label: "Ruang Direksi", icon: LayoutDashboard },
  { href: "/juara/vision", label: "Owner Vision", icon: Compass },
  { href: "/juara/playbooks", label: "Playbook", icon: LibraryBig },
]

const TITLES: Record<string, { title: string; sub: string }> = {
  "/juara": { title: "Ruang Direksi", sub: "Keputusan yang perlu perhatian klub" },
  "/juara/vision": { title: "Owner Vision", sub: "Susun arah klub dan generate playbook" },
  "/juara/playbooks": { title: "Playbook", sub: "Arsip keputusan klub Anda" },
}

export default function WorkspaceShell({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { user } = useJuaraSession()
  const [collapsed, setCollapsed] = useState(false)
  const [query, setQuery] = useState("")
  const meta = TITLES[pathname] ?? { title: "JUARA", sub: "Ruang kerja klub" }

  async function logout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/juara/login")
    router.refresh()
  }

  const initial = (user?.email ?? "?").slice(0, 1).toUpperCase()

  return (
    <div className="ju-shell">
      <aside className="ju-sidebar" data-collapsed={collapsed}>
        <div className="ju-sidebar-top">
          <div className="ju-brandmark"><span>J</span> {!collapsed && "JUARA"}</div>
          <button type="button" className="ju-rail-toggle" onClick={() => setCollapsed((v) => !v)}
            aria-label={collapsed ? "Perluas sidebar" : "Padatkan sidebar"}>
            {collapsed ? <ChevronRight size={15} aria-hidden="true" /> : <ChevronLeft size={15} aria-hidden="true" />}
          </button>
        </div>
        <nav className="ju-nav" aria-label="Navigasi utama">
          {!collapsed && <div className="ju-nav-label">Workspace</div>}
          {NAV.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href} className="ju-navitem" title={collapsed ? label : undefined}
              data-active={pathname === href}
              aria-current={pathname === href ? "page" : undefined}>
              <Icon aria-hidden="true" />
              {!collapsed && label}
            </Link>
          ))}
        </nav>
        {!collapsed && (
          <div className="ju-sidebar-foot">
            <ShieldCheck size={14} aria-hidden="true" /> Data terlindungi RLS
            <br />Bagian dari Stadione
          </div>
        )}
      </aside>

      <div className="ju-main">
        <header className="ju-topbar">
          <div>
            <h1>{meta.title}</h1>
            <div className="ju-topbar-sub">{meta.sub}</div>
          </div>
          <div className="ju-user">
            <label className="ju-search">
              <Search size={14} aria-hidden="true" />
              <span className="ju-sr">Cari di workspace</span>
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Cari..." />
            </label>
            <span className="ju-badge">Draf</span>
            <span className="ju-avatar" aria-hidden="true">{initial}</span>
            <span>{user?.email ?? "Tidak masuk"}</span>
            <button type="button" className="ju-btn" onClick={logout} aria-label="Keluar">
              <LogOut size={14} aria-hidden="true" /> Keluar
            </button>
          </div>
        </header>
        <div className="ju-context-tabs" role="navigation" aria-label="Tab konteks">
          {NAV.map(({ href, label }) => (
            <Link key={href} href={href} data-active={pathname === href}>{label}</Link>
          ))}
        </div>
        <main className="ju-content">{children}</main>
      </div>
    </div>
  )
}
