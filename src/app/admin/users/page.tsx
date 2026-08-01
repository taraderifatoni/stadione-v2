"use client"

import { useEffect, useState } from "react"
import { TopBar } from "@/components/shared/TopBar"
import { C } from "@/lib/design"
import { ChevronLeft, Search, Users } from "lucide-react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

export default function AdminUsers() {
  const [users, setUsers] = useState<any[]>([])
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    supabase.from("venue_roles").select("user_id, role, venues(name)").then(({ data: roles }: any) => {
      const map: any = {}
      roles?.forEach((r: any) => {
        if (!map[r.user_id]) map[r.user_id] = []
        map[r.user_id].push(r)
      })
      setUsers(Object.entries(map).map(([id, roles]: any) => ({ id, roles })))
    })
  }, [])

  return (
    <div>
      <TopBar title="Kelola pengguna" left={<ChevronLeft size={20} color={C.text} onClick={() => router.back()} style={{ cursor: "pointer" }} />} />
      <div style={{ padding: "0 16px 16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
          <Users size={18} color={C.accent} />
          <span style={{ fontSize: 13, color: C.textSec }}>{users.length} pengguna dengan role</span>
        </div>
        {users.map((u: any) => (
          <div key={u.id} style={{ background: C.surface, borderRadius: 14, padding: 12, border: `1px solid ${C.border}`, marginBottom: 8 }}>
            <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 4 }}>{u.id.slice(0, 8)}...</div>
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
