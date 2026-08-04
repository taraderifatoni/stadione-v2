"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { useParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { C } from "@/lib/design"
import Link from "next/link"
import { TopBar } from "@/components/shared/TopBar"
import { Menu, Calendar, Users, GraduationCap, BarChart3, Settings, Building2, LogOut, ChevronLeft } from "lucide-react"

interface VenueContext {
  venue: any
  role: string
}
const Ctx = createContext<VenueContext | null>(null)
export const useVenue = () => useContext(Ctx)

export default function WorkspaceLayout({ children }: { children: ReactNode }) {
  const { slug } = useParams<{ slug: string }>()
  const [venue, setVenue] = useState<any>(null)
  const [role, setRole] = useState("")
  const [loading, setLoading] = useState(true)
  const [platformAdmin, setPlatformAdmin] = useState(false)
  const supabase = createClient()

  // Also create supabase client for logout in sidebar
  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = "/login"
  }

  useEffect(() => {
    ;(async () => {
      const { data: v } = await supabase.from("venues").select("*").eq("slug", slug).single()
      if (!v) { setLoading(false); return }
      setVenue(v)

      // Check auth via server API (works cross-subdomain because cookies sent on fetch)
      try {
        const sessionRes = await fetch("/api/auth/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "get" }),
          credentials: "include",
        })
        if (sessionRes.ok) {
          const { user } = await sessionRes.json()
          if (user?.id) {
            const res = await fetch("/api/admin/check-role", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ venueId: v.id, userId: user.id }),
            })
            const { role: r, isPlatformAdmin: pa } = await res.json()
            if (r) setRole(r)
            if (pa) setPlatformAdmin(true)
          }
        }
      } catch(e) {
        // Fallback to client-side auth
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const res = await fetch("/api/admin/check-role", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ venueId: v.id, userId: user.id }),
          })
          const { role: r, isPlatformAdmin: pa } = await res.json()
          if (r) setRole(r)
          if (pa) setPlatformAdmin(true)
        }
      }
      setLoading(false)
    })()
  }, [slug])

  if (loading) return <div style={{ background: C.bg, minHeight: "100vh" }} />
  if (!venue) return <div style={{ padding: 40, textAlign: "center", color: C.textMuted, background: C.bg }}>Venue tidak ditemukan</div>
  if (!role && !platformAdmin) return (
    <div style={{ background: C.bg, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center", padding: 40 }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>🔒</div>
        <div style={{ fontSize: 18, fontWeight: 700, color: C.text }}>Akses ditolak</div>
        <div style={{ fontSize: 13, color: C.textMuted, marginTop: 6 }}>Anda tidak memiliki akses ke venue ini</div>
        <Link href="/admin/venues" style={{ display: "inline-block", marginTop: 16, padding: "10px 20px", borderRadius: 10, background: C.primary, color: "#fff", fontSize: 13, fontWeight: 600, textDecoration: "none" }}>Kembali ke daftar venue</Link>
      </div>
    </div>
  )

  const nav = [
    { icon: BarChart3, label: "Dashboard", href: `/admin/w/${slug}` },
    { icon: Calendar, label: "Booking", href: `/admin/w/${slug}/bookings` },
    { icon: Users, label: "Member", href: `/admin/w/${slug}/members` },
    { icon: Users, label: "Staff", href: `/admin/w/${slug}/staff` },
    { icon: GraduationCap, label: "Akademi", href: `/admin/w/${slug}/academy` },
    { icon: BarChart3, label: "Laporan", href: `/admin/w/${slug}/reports` },
    { icon: Settings, label: "Pengaturan", href: `/admin/w/${slug}/settings` },
    { icon: LogOut, label: "Keluar", action: handleLogout },
  ]

  return (
    <Ctx.Provider value={{ venue, role }}>
      <div style={{ background: C.bg, minHeight: "100vh" }}>
        <TopBar title={venue.name} sub={role} left={<Link href="/admin/venues"><ChevronLeft size={20} color={C.text} /></Link>} right={<LogOut size={18} color={C.textMuted} onClick={handleLogout} style={{ cursor: "pointer" }} />} />
        <div className="flex">
          <aside className="w-48 hidden md:block" style={{ borderRight: `1px solid ${C.border}`, background: C.surface, minHeight: "calc(100vh - 56px)" }}>
            <nav className="py-2">
              {nav.map(item => item.href ? (
                <Link key={item.href} href={item.href} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 16px", fontSize: 13, color: C.textSec, textDecoration: "none" }}>
                  <item.icon size={16} />{item.label}
                </Link>
              ) : (
                <div key={item.label} onClick={(item as any).action} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 16px", fontSize: 13, color: C.danger, cursor: "pointer" }}>
                  <item.icon size={16} />{item.label}
                </div>
              ))}
            </nav>
          </aside>
          <main className="flex-1">{children}</main>
        </div>
      </div>
    </Ctx.Provider>
  )
}
