"use client"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { C } from "@/lib/design"
import { Home, Calendar, Dumbbell, GraduationCap, User, Settings, LogOut, Building2 } from "lucide-react"
import type { User as SupaUser } from "@supabase/supabase-js"

interface SideDrawerProps { open: boolean; onClose: () => void; user: SupaUser | null; pathname: string }

export function SideDrawer({ open, onClose, user, pathname }: SideDrawerProps) {
  const router = useRouter()
  const supabase = createClient()
  const [venues, setVenues] = useState<any[]>([])

  useEffect(() => {
    if (!open || !user) return
    supabase.from("venue_roles").select("role, venues(id, name, slug)").eq("user_id", user.id).then(({ data }: any) => {
      setVenues(data?.map((r: any) => ({ ...r.venues, role: r.role })) || [])
    })
  }, [open, user])

  const menuItems = [
    { icon: Home, label: "Beranda", href: "/" },
    { icon: Calendar, label: "Booking", href: "/booking" },
    { icon: Dumbbell, label: "Fitness", href: "/fitness" },
    { icon: GraduationCap, label: "Akademi", href: "/academy" },
    { icon: User, label: "Profil", href: "/profile" },
  ]

  async function handleSignOut() {
    await supabase.auth.signOut(); onClose(); router.push("/login"); router.refresh()
  }

  if (!open) return null

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 100 }} />
      <div style={{ position: "fixed", left: 0, top: 0, bottom: 0, width: 280, background: C.surface, zIndex: 101, display: "flex", flexDirection: "column", borderRight: `1px solid ${C.border}` }}>
        <div style={{ padding: "16px", borderBottom: `1px solid ${C.border}` }}>
          <span style={{ fontSize: 18, fontWeight: 800, color: C.primary, letterSpacing: 2 }}>STADIONE</span>
        </div>

        {user && (
          <div style={{ padding: "12px 16px", borderBottom: `1px solid ${C.border}44` }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: C.text }}>{user.user_metadata?.name || user.email}</div>
            <div style={{ fontSize: 11, color: C.textMuted }}>{user.email}</div>
          </div>
        )}

        <div style={{ flex: 1, overflowY: "auto", padding: "8px 0" }}>
          {menuItems.map(item => (
            <div key={item.href} onClick={() => { onClose(); router.push(item.href) }}
              style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 16px", fontSize: 14, color: pathname === item.href ? C.primaryLight : C.textSec, cursor: "pointer", fontWeight: pathname === item.href ? 600 : 400 }}>
              <item.icon size={18} color={pathname === item.href ? C.primaryLight : C.textMuted} />
              {item.label}
            </div>
          ))}

          {/* Venue switcher - admin venues */}
          {venues.length > 0 && (
            <div style={{ marginTop: 8, borderTop: `1px solid ${C.border}44`, paddingTop: 8 }}>
              <div style={{ padding: "4px 16px 8px", fontSize: 11, color: C.textMuted, fontWeight: 600, letterSpacing: 0.5 }}>VENUE SAYA</div>
              {venues.map((v: any) => (
                <div key={v.id} onClick={() => { onClose(); router.push(`/admin/w/${v.slug}`) }}
                  style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 16px", fontSize: 13, color: C.text, cursor: "pointer" }}>
                  <Building2 size={16} color={C.primaryLight} />
                  <div style={{ flex: 1 }}>{v.name}</div>
                  <span style={{ fontSize: 10, color: C.textMuted }}>{v.role}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {user && (
          <div onClick={handleSignOut} style={{ padding: "14px 16px", borderTop: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 10, color: C.danger, fontSize: 14, cursor: "pointer" }}>
            <LogOut size={16} />Keluar
          </div>
        )}
      </div>
    </>
  )
}
