"use client"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { TopBar } from "@/components/shared/TopBar"
import { C } from "@/lib/design"
import { ChevronLeft, GraduationCap } from "lucide-react"
import { useRouter } from "next/navigation"

export default function AdminAcademy() {
  const [academies, setAcademies] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    supabase.from("academies").select("*, venues(name, slug), students:students(id)")
      .limit(20).then(({ data }: any) => { setAcademies(data || []); setLoading(false) })
  }, [])

  return (
    <div>
      <TopBar title="Semua Akademi" sub="Platform Admin" left={<ChevronLeft size={20} color={C.text} onClick={() => router.back()} style={{ cursor: "pointer" }} />} />
      <div style={{ padding: "0 16px 16px" }}>
        {academies.length === 0 && !loading && <div style={{ textAlign: "center", padding: 40, color: C.textMuted, fontSize: 13 }}>Belum ada akademi</div>}
        {academies.map((a: any) => (
          <div key={a.id} onClick={() => a.venues?.slug && router.push(`/admin/w/${a.venues.slug}/academy`)} style={{ background: C.surface, borderRadius: 14, padding: 14, border: `1px solid ${C.border}`, marginBottom: 10, cursor: a.venues?.slug ? "pointer" : "default" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <GraduationCap size={16} color={C.primaryLight} />
              <span style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{a.venues?.name} Academy</span>
            </div>
            <div style={{ fontSize: 12, color: C.textMuted }}>{a.name} · {a.students?.length || 0} murid</div>
          </div>
        ))}
      </div>
    </div>
  )
}
