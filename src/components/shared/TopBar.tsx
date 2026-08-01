"use client"

import { useState, useEffect, type ReactNode } from "react"
import { useRouter, usePathname } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Bell, Menu, ChevronLeft, Search, User } from "lucide-react"
import { C } from "@/lib/design"
import { SideDrawer } from "./SideDrawer"
import type { User as SupaUser } from "@supabase/supabase-js"

export function TopBar({ title, sub, left, right, backHref }: {
  title?: string; sub?: string; left?: ReactNode; right?: ReactNode; backHref?: string;
}) {
  const [user, setUser] = useState<SupaUser | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const supabase = createClient()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => { supabase.auth.getUser().then(({ data }) => setUser(data.user)) }, [])

  const defaultRight = (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div onClick={() => router.push("/notifications")} style={{ position: "relative", cursor: "pointer" }}>
        <Bell size={20} color={C.textSec} />
        <span style={{ position: "absolute", top: -2, right: -2, width: 8, height: 8, borderRadius: 4, background: C.primaryLight }} />
      </div>
      <div
        onClick={() => router.push("/profile")}
        style={{ width: 30, height: 30, borderRadius: 12, background: C.accentMuted + "44", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
      >
        <User size={14} color={C.accent} />
      </div>
    </div>
  )

  return (
    <>
      <div style={{ padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", background: C.bg }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {left || (
            <Menu size={20} color={C.text} onClick={() => setDrawerOpen(true)} style={{ cursor: "pointer" }} />
          )}
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: C.text, letterSpacing: -0.3 }}>{title || "Stadione"}</div>
            {sub && <div style={{ fontSize: 11, color: C.textMuted }}>{sub}</div>}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>{right || defaultRight}</div>
      </div>
      <SideDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} user={user} pathname={pathname} />
    </>
  )
}
