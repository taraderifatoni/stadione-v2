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

  useEffect(() => {
    ;(async () => {
      const { data: v } = await supabase.from("venues").select("*").eq("slug", slug).single()
      if (!v) { setLoading(false); return }
      setVenue(v)

      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: r } = await supabase.from("venue_roles").select("role").eq("user_id", user.id).eq("venue_id", v.id).single()
        if (r) setRole(r.role)
        const { data: paCheck } = await supabase.from("venue_roles").select("role").eq("user_id", user.id).eq("role", "platform_admin").single()
        if (paCheck) setPlatformAdmin(true)
      }
      setLoading(false)
    })()
  }, [slug])

  if (loading) return <div style={{ background: C.bg, minHeight: "100vh" }} />
  if (!venue) return <div style={{ padding: 40, textAlign: "center", color: C.textMuted, background: C.bg }}>Venue tidak ditemukan</div>
  if (!role && !platformAdmin) return (

  const nav = [
    { icon: Calendar, label: "Booking", href: `/admin/w/${slug}/bookings` },
    { icon: Users, label: "Member", href: `/admin/w/${slug}/members` },
    { icon: GraduationCap, label: "Akademi", href: `/admin/w/${slug}/academy` },
    { icon: BarChart3, label: "Laporan", href: `/admin/w/${slug}/reports` },
    { icon: Settings, label: "Pengaturan", href: `/admin/w/${slug}/settings` },
  ]

  return (
    <Ctx.Provider value={{ venue, role }}>
      <div style={{ background: C.bg, minHeight: "100vh" }}>
        <TopBar title={venue.name} sub={role} left={<Link href="/admin/venues"><ChevronLeft size={20} color={C.text} /></Link>} />
        <div className="flex">
          <aside className="w-48 hidden md:block" style={{ borderRight: `1px solid ${C.border}`, background: C.surface, minHeight: "calc(100vh - 56px)" }}>
            <nav className="py-2">
              {nav.map(item => (
                <Link key={item.href} href={item.href} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 16px", fontSize: 13, color: C.textSec, textDecoration: "none" }}>
                  <item.icon size={16} />{item.label}
                </Link>
              ))}
            </nav>
          </aside>
          <main className="flex-1">{children}</main>
        </div>
      </div>
    </Ctx.Provider>
  )
}
