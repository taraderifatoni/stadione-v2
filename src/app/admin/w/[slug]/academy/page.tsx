"use client"
import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { C } from "@/lib/design"
import { GraduationCap } from "lucide-react"

export default function WorkspaceAcademy() {
  const { slug } = useParams<{ slug: string }>()
  const [students, setStudents] = useState<any[]>([])
  const supabase = createClient()
  useEffect(() => {
    supabase.from("venues").select("id").eq("slug", slug).single().then(({ data: v }: any) => {
      if (!v) return
      supabase.from("academies").select("id").eq("venue_id", v.id).single().then(({ data: a }: any) => {
        if (!a) return
        supabase.from("students").select("*").eq("academy_id", a.id).limit(20).then(({ data }: any) => setStudents(data || []))
      })
    })
  }, [slug])
  return (
    <div style={{ padding: 16 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 16 }}>
        {[{ l: "Program", v: "-" }, { l: "Coach", v: "-" }, { l: "Murid", v: students.length }].map((s, i) => (
          <div key={i} style={{ background: C.surface, borderRadius: 14, padding: 10, border: `1px solid ${C.border}`, textAlign: "center" }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: C.accent }}>{s.v}</div><div style={{ fontSize: 11, color: C.textMuted }}>{s.l}</div>
          </div>
        ))}
      </div>
      <div style={{ fontSize: 14, fontWeight: 600, color: C.text, marginBottom: 10 }}>Murid terdaftar</div>
      {students.length === 0 ? <div style={{ textAlign: "center", padding: 40, color: C.textMuted }}>Belum ada murid</div> :
        students.map((s: any) => (
          <div key={s.id} style={{ background: C.surface, borderRadius: 14, padding: 12, border: `1px solid ${C.border}`, marginBottom: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div><div style={{ fontSize: 13, fontWeight: 500, color: C.text }}>{s.name}</div><div style={{ fontSize: 11, color: C.textMuted }}>{s.age_group || "Semua umur"}</div></div>
              <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 8px", borderRadius: 6, background: s.status === "active" ? "#1B3A1D" : "#3A1515", color: s.status === "active" ? "#4CAF50" : "#C62828" }}>{s.status}</span>
            </div>
          </div>
        ))}
    </div>
  )
}
