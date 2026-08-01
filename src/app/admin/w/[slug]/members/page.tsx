"use client"
import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { C } from "@/lib/design"

export default function WorkspaceMembers() {
  const { slug } = useParams<{ slug: string }>()
  const [members, setMembers] = useState<any[]>([])
  const supabase = createClient()
  useEffect(() => {
    supabase.from("venues").select("id").eq("slug", slug).single().then(({ data: v }: any) => {
      if (!v) return
      supabase.from("members").select("*, plans:plan_id(name, tier_level)").eq("venue_id", v.id).order("created_at", { ascending: false }).limit(20).then(({ data }: any) => setMembers(data || []))
    })
  }, [slug])
  return (
    <div style={{ padding: 16 }}>
      <div style={{ fontSize: 14, fontWeight: 600, color: C.text, marginBottom: 10 }}>{members.length} member</div>
      {members.length === 0 ? <div style={{ textAlign: "center", padding: 40, color: C.textMuted }}>Belum ada member</div> :
        members.map((m: any) => (
          <div key={m.id} style={{ background: C.surface, borderRadius: 14, padding: 12, border: `1px solid ${C.border}`, marginBottom: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 500, color: C.text }}>{m.plans?.name || "Member"}</div>
                <div style={{ fontSize: 11, color: C.textMuted }}>Tier {m.plans?.tier_level} · Exp {new Date(m.end_date).toLocaleDateString("id-ID")}</div>
              </div>
              <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 8px", borderRadius: 6, background: m.status === "active" ? "#1B3A1D" : "#3A1515", color: m.status === "active" ? "#4CAF50" : "#C62828" }}>{m.status}</span>
            </div>
          </div>
        ))}
    </div>
  )
}
