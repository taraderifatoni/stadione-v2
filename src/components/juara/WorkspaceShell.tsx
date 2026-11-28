"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useState, type ReactNode } from "react"
import {
  LayoutDashboard, Inbox, Users, Grid3X3, Search, LineChart, Lock, ListChecks, Plane, ShieldCheck, LogOut,
} from "lucide-react"
import { useJuaraSession } from "./SessionProvider"
import { createClient } from "@/lib/supabase/client"

type NavItem = { href: string; label: string; icon: typeof LayoutDashboard; implemented: boolean }

const RAIL: NavItem[] = [
  { href: "/juara", label: "Direksi", icon: LayoutDashboard, implemented: true },
  { href: "/juara/inbox", label: "Inbox", icon: Inbox, implemented: false },
  { href: "/juara/squad", label: "Skuad", icon: Users, implemented: false },
  { href: "/juara/tactics", label: "Taktik", icon: Grid3X3, implemented: false },
  { href: "/juara/academy", label: "Akademi", icon: Users, implemented: false },
  { href: "/juara/scouting", label: "Scouting", icon: Search, implemented: false },
  { href: "/juara/finances", label: "Finance", icon: LineChart, implemented: false },
  { href: "/juara/commercial", label: "Komersial", icon: LineChart, implemented: false },
  { href: "/juara/vault", label: "Vault", icon: Lock, implemented: false },
]

const EXEC_TABS = [
  { href: "/juara", label: "Ruang Direksi" },
  { href: "/juara/playbooks", label: "Playbook" },
  { href: "/juara/vision", label: "Visi Owner" },
]

function isActive(pathname: string, href: string) {
  if (href === "/juara") return pathname === "/juara" || pathname === "/juara/playbooks" || pathname === "/juara/vision"
  return pathname === href || pathname.startsWith(href + "/")
}

export default function WorkspaceShell({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { user } = useJuaraSession()
  const [inspectorOpen, setInspectorOpen] = useState(false)

  async function logout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/juara/login")
    router.refresh()
  }

  const inExec = EXEC_TABS.some((t) => t.href === pathname)
  const metrics = ["Kas bebas", "Runway", "SCR", "Nilai skuad", "Laga berikutnya", "Perlu tindakan"]

  return (
    <div className="shell">
      <nav className="rail" aria-label="Modul klub">
        <Link href="/juara" className="brand" aria-label="JUARA">J</Link>
        {RAIL.map(({ href, label, icon: Icon, implemented }) => {
          const active = isActive(pathname, href)
          const Tag: any = implemented ? Link : "button"
          const props = implemented
            ? { href, "aria-current": active ? "page" : undefined }
            : { type: "button", title: `${label} — belum tersedia`, "aria-disabled": true, onClick: () => setInspectorOpen(true) }
          return (
            <Tag key={href} {...props} className={active ? "active" : ""}>
              <Icon aria-hidden="true" />
              <span className="rail-label">{label}</span>
            </Tag>
          )
        })}
      </nav>

      <div className="workspace">
        <header className="top">
          <div className="head">
            <div>
              <span className="identity">juara lab</span> <small>- bangun tim juara</small><br />
              <small>stadione - satu platform untuk semua olahraga</small>
            </div>
            <div className="row">
              <span className="tag">DATA CONTOH · Simulasi</span>
              <span className="muted" style={{ fontSize: 12 }}>{user?.email ?? "Tidak masuk"}</span>
              <button type="button" onClick={logout} aria-label="Keluar">
                <LogOut size={16} aria-hidden="true" /> <span className="muted" style={{ fontSize: 12 }}>Keluar</span>
              </button>
            </div>
          </div>
          <div className="ribbon" aria-label="Indikator kunci">
            {metrics.map((m) => (
              <div key={m} className="metric"><small>{m}</small><b>Belum tersedia</b></div>
            ))}
          </div>
        </header>

        <nav className="tabs" aria-label="Tampilan modul">
          {inExec ? EXEC_TABS.map((t) => (
            <Link key={t.href} href={t.href} className={pathname === t.href ? "active" : ""} aria-current={pathname === t.href ? "page" : undefined}>{t.label}</Link>
          )) : <span className="muted" style={{ padding: "8px 0" }}>Modul belum tersedia — backend/data belum terhubung.</span>}
        </nav>

        <div className="canvas">
          <main className="master" id="main" tabIndex={-1}>{children}</main>
          <aside className="inspector" aria-label="Inspector" hidden={!inspectorOpen}>
            <div className="head"><small>INSPECTOR</small><button type="button" onClick={() => setInspectorOpen(false)}>Tutup</button></div>
            <h2>Modul belum tersedia</h2>
            <p className="muted">Modul ini ada di desain v0.2.1, tetapi route/data backend belum diimplementasikan pada checkpoint ini. Jangan campur desain lama; implementasi menyusul per checkpoint.</p>
          </aside>
        </div>
      </div>

      <nav className="mobile-nav" aria-label="Navigasi mobile">
        <Link href="/juara" className={isActive(pathname, "/juara") ? "active" : ""}>Direksi</Link>
        <button type="button" onClick={() => setInspectorOpen(true)}>Modul</button>
        <button type="button" onClick={logout}>Keluar</button>
      </nav>
    </div>
  )
}
