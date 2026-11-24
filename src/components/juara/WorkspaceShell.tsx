"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  Compass,
  LayoutDashboard,
  LibraryBig,
  LogOut,
  ShieldCheck,
} from "lucide-react"
import { useJuaraSession } from "./SessionProvider"
import { createClient } from "@/lib/supabase/client"
import type { ReactNode } from "react"

const NAV = [
  { href: "/juara", label: "Ringkasan", icon: LayoutDashboard },
  { href: "/juara/vision", label: "Owner Vision", icon: Compass },
  { href: "/juara/playbooks", label: "Playbook", icon: LibraryBig },
]

const TITLES: Record<string, { title: string; sub: string }> = {
  "/juara": { title: "Ringkasan", sub: "Kondisi klub sekilas" },
  "/juara/vision": { title: "Owner Vision", sub: "Susun arah klub dan generate playbook" },
  "/juara/playbooks": { title: "Playbook", sub: "Arsip keputusan klub Anda" },
}

export default function WorkspaceShell({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { user } = useJuaraSession()
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
      <aside className="ju-sidebar">
        <div className="ju-brandmark"><span>J</span> JUARA</div>
        <nav className="ju-nav" aria-label="Navigasi utama">
          <div className="ju-nav-label">Workspace</div>
          {NAV.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="ju-navitem"
              data-active={pathname === href}
              aria-current={pathname === href ? "page" : undefined}
            >
              <Icon aria-hidden="true" />
              {label}
            </Link>
          ))}
        </nav>
        <div className="ju-sidebar-foot">
          <ShieldCheck size={14} aria-hidden="true" /> Data terlindungi RLS
          <br />Bagian dari Stadione
        </div>
      </aside>

      <div className="ju-main">
        <header className="ju-topbar">
          <div>
            <h1>{meta.title}</h1>
            <div className="ju-topbar-sub">{meta.sub}</div>
          </div>
          <div className="ju-user">
            <span className="ju-avatar" aria-hidden="true">{initial}</span>
            <span>{user?.email ?? "Tidak masuk"}</span>
            <button type="button" className="ju-btn" onClick={logout} aria-label="Keluar">
              <LogOut size={14} aria-hidden="true" /> Keluar
            </button>
          </div>
        </header>
        <main className="ju-content">{children}</main>
      </div>
    </div>
  )
}
