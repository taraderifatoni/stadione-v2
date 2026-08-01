"use client"
import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { C } from "@/lib/design"
import { UserPlus } from "lucide-react"

export default function WorkspaceStaff() {
  const { slug } = useParams<{ slug: string }>()
  const [staff, setStaff] = useState<any[]>([])
  const supabase = createClient()

  useEffect(() => {
    supabase.from("venues").select("id").eq("slug", slug).single().then(({ data: v }: any) => {
      if (!v) return
      supabase.from("venue_roles").select("user_id, role").eq("venue_id", v.id).then(({ data }: any) => setStaff(data || []))
    })
  }, [slug])

  return (
    <div style={{ padding: 16 }}>
      <div style={{ fontSize: 14, fontWeight: 600, color: C.text, marginBottom: 10 }}>{staff.length} staff</div>
      {staff.length === 0 ? <div style={{ textAlign: "center", padding: 40, color: C.textMuted }}>Belum ada staff</div> :
        staff.map((s: any, i: number) => (
          <div key={i} style={{ background: C.surface, borderRadius: 14, padding: 12, border: `1px solid ${C.border}`, marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div><div style={{ fontSize: 13, fontWeight: 500, color: C.text }}>{s.user_id?.slice(0, 8)}...</div></div>
            <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 8px", borderRadius: 6, background: C.primary + "22", color: C.primaryLight }}>{s.role}</span>
          </div>
        ))}
      <button style={{ width: "100%", padding: "12px 20px", borderRadius: 10, border: "none", background: C.primary, color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 12 }}><UserPlus size={16} />Undang staff baru</button>
    </div>
  )
}
