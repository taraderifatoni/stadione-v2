"use client"

import { usePathname, useRouter } from "next/navigation"
import { Home, Calendar, Dumbbell, GraduationCap, User } from "lucide-react"
import { C } from "@/lib/design"

const items = [
  { id: "home", icon: Home, label: "Beranda", href: "/" },
  { id: "booking", icon: Calendar, label: "Booking", href: "/booking" },
  { id: "fitness", icon: Dumbbell, label: "Fitness", href: "/fitness" },
  { id: "academy", icon: GraduationCap, label: "Akademi", href: "/academy" },
  { id: "profile", icon: User, label: "Profil", href: "/profile" },
]

export function BottomNav() {
  const pathname = usePathname()
  const router = useRouter()

  return (
    <nav style={{ display: "flex", background: C.surface, borderTop: `1px solid ${C.border}`, padding: "6px 0 10px", position: "sticky", bottom: 0, zIndex: 50 }}>
      {items.map((it) => {
        const isActive = pathname === it.href || (it.href !== "/" && pathname.startsWith(it.href))
        return (
          <button
            key={it.id}
            onClick={() => router.push(it.href)}
            style={{
              flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
              background: "none", border: "none", cursor: "pointer", padding: 4,
            }}
          >
            <it.icon
              size={20}
              color={isActive ? C.primaryLight : C.textMuted}
              strokeWidth={isActive ? 2.5 : 1.5}
            />
            <span style={{ fontSize: 10, fontWeight: isActive ? 600 : 400, color: isActive ? C.primaryLight : C.textMuted }}>
              {it.label}
            </span>
          </button>
        )
      })}
    </nav>
  )
}
