"use client"

import { useEffect, useState } from "react"
import { TopBar } from "@/components/shared/TopBar"
import { C } from "@/lib/design"
import { ChevronLeft, Users } from "lucide-react"
import { useRouter } from "next/navigation"

export default function AdminUsers() {
  const [roles, setRoles] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const H = {"apikey":"eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc4NTI1MjYwMCwiZXhwIjo0OTQwOTI2MjAwLCJyb2xlIjoiYW5vbiJ9.WoeLAuy5jLAlVVQfKJKIIrb870Bt3ZwKtmyBvvksLBY"}

  useEffect(() => {
    fetch("https://api.stadione.pro/rest/v1/venue_roles?select=user_id,role,venues(name)", {headers:H})
      .then(r => r.json()).then((data: any) => {
        const map: any = {}
        data?.forEach((r: any) => {
          if (!map[r.user_id]) map[r.user_id] = {id: r.user_id, roles: []}
          map[r.user_id].roles.push(r)
        })
        setRoles(Object.values(map))
      }).finally(() => setLoading(false))
  }, [])

  return (
    <div>
      <TopBar title="Kelola pengguna" left={<ChevronLeft size={20} color={C.text} onClick={() => router.back()} style={{ cursor: "pointer" }} />} />
      <div style={{ padding: "0 16px 16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
          <Users size={18} color={C.accent} />
          <span style={{ fontSize: 13, color: C.textSec }}>{loading ? "..." : roles.length} pengguna dengan role</span>
        </div>
        {roles.map((u: any) => (
          <div key={u.id} style={{ background: C.surface, borderRadius: 14, padding: 12, border: `1px solid ${C.border}`, marginBottom: 8 }}>
            <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 4 }}>{u.id?.slice(0, 8)}...</div>
            <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
              {u.roles.map((r: any, i: number) => (
                <span key={i} style={{ fontSize: 10, fontWeight: 600, padding: "2px 6px", borderRadius: 4, background: C.primary + "22", color: C.primaryLight }}>{r.role} {r.venues ? `@ ${r.venues.name}` : ""}</span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
