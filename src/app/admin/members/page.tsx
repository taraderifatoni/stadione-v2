"use client"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { TopBar } from "@/components/shared/TopBar"
import { C } from "@/lib/design"
import { ChevronLeft, Users, Search } from "lucide-react"
import { useRouter } from "next/navigation"

export default function AdminMembers() {
  const [members, setMembers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    supabase.from("members").select("*, venues(name, slug), membership_plans(name)")
      .order("created_at", { ascending: false }).limit(50)
      .then(({ data }: any) => { setMembers(data || []); setLoading(false) })
  }, [])

  return (
    <div>
      <TopBar title="Semua Member" sub="Platform Admin" left={<ChevronLeft size={20} color={C.text} onClick={() => router.back()} style={{ cursor: "pointer" }} />} />
      <div style={{ padding: "0 16px 16px" }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: C.text, marginBottom: 10 }}>{members.length} member dari semua venue</div>
        {members.length === 0 && !loading && <div style={{ textAlign: "center", padding: 40, color: C.textMuted, fontSize: 13 }}>Belum ada member</div>}
        {members.map((m: any) => (
          <div key={m.id} style={{ background: C.surface, borderRadius: 14, padding: 12, border: `1px solid ${C.border}`, marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 500, color: C.text }}>{m.membership_plans?.name || "Member"}</div>
              <div style={{ fontSize: 11, color: C.textMuted }}>{m.venues?.name} · Exp {new Date(m.end_date).toLocaleDateString("id-ID")}</div>
            </div>
            <span style={{ fontSize: 11, fontWeight: 600, padding: "4px 10px", borderRadius: 6, background: m.status === "active" ? "#1B3A1D" : "#3A1515", color: m.status === "active" ? "#4CAF50" : "#C62828" }}>{m.status}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
