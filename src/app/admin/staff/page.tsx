"use client"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { TopBar } from "@/components/shared/TopBar"
import { C } from "@/lib/design"
import { ChevronLeft, Users } from "lucide-react"
import { useRouter } from "next/navigation"

export default function AdminStaff() {
  const [staff, setStaff] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    supabase.from("venue_roles").select("*, auth_users:user_id(email, raw_user_meta_data), venues(name, slug)")
      .in("role", ["owner", "manager", "staff"])
      .limit(50).then(({ data }: any) => { setStaff(data || []); setLoading(false) })
  }, [])

  return (
    <div>
      <TopBar title="Semua Staff" sub="Platform Admin" left={<ChevronLeft size={20} color={C.text} onClick={() => router.back()} style={{ cursor: "pointer" }} />} />
      <div style={{ padding: "0 16px 16px" }}>
        {staff.length === 0 && !loading && <div style={{ textAlign: "center", padding: 40, color: C.textMuted, fontSize: 13 }}>Belum ada staff</div>}
        {staff.map((s: any) => (
          <div key={s.user_id} style={{ background: C.surface, borderRadius: 14, padding: 12, border: `1px solid ${C.border}`, marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 500, color: C.text }}>{s.auth_users?.raw_user_meta_data?.name || s.auth_users?.email || s.user_id?.substring(0, 8)}</div>
              <div style={{ fontSize: 11, color: C.textMuted }}>{s.venues?.name}</div>
            </div>
            <span style={{ fontSize: 11, fontWeight: 600, padding: "4px 10px", borderRadius: 6, background: s.role === "owner" ? "#3A1515" : s.role === "manager" ? "#1B3A1D" : "#1A1816", color: s.role === "owner" ? "#C62828" : s.role === "manager" ? "#4CAF50" : C.accent }}>{s.role}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
