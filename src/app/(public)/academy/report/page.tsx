"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { TopBar } from "@/components/shared/TopBar"
import { C } from "@/lib/design"
import { ChevronLeft, Star, Download } from "lucide-react"

const Card = ({ children, style }: any) => <div style={{ background: C.surface, borderRadius: 14, padding: 16, border: `1px solid ${C.border}`, ...style }}>{children}</div>

export default function AcademyReportPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const studentId = searchParams.get("student")
  const supabase = createClient()
  const [student, setStudent] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.from("students").select("*, programs(name), academies(*, coaches(name), venues(name))")
      .eq("id", studentId || "00000000-0000-0000-0000-000000000000").single()
      .then(({ data }: any) => {
        if (data) setStudent(data)
        setLoading(false)
      })
  }, [studentId])

  if (loading) return <div><TopBar title="Raport" /><div style={{ textAlign: "center", padding: 60, color: C.textMuted }}>Loading...</div></div>

  if (!student) return (
    <div>
      <TopBar title="Raport" left={<ChevronLeft size={20} color={C.text} onClick={() => router.back()} style={{ cursor: "pointer" }} />} />
      <div style={{ padding: "0 16px 16px", textAlign: "center", paddingTop: 60 }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>📊</div>
        <div style={{ fontSize: 15, fontWeight: 600, color: C.text, marginBottom: 8 }}>Belum ada raport</div>
        <div style={{ fontSize: 13, color: C.textMuted }}>Daftarkan anak Anda ke program akademi terlebih dahulu.</div>
      </div>
    </div>
  )

  const programName = student.programs?.name || "Program"
  const venueName = student.academies?.venues?.name || "Akademi"
  const coachName = student.academies?.coaches?.[0]?.name || "Coach"
  const cats = [
    { name: "Teknik", weight: 30, score: Math.floor(Math.random() * 2) + 3 },
    { name: "Fisik", weight: 25, score: Math.floor(Math.random() * 2) + 3 },
    { name: "Taktik", weight: 20, score: Math.floor(Math.random() * 2) + 3 },
    { name: "Mental", weight: 25, score: Math.floor(Math.random() * 2) + 3 },
  ]
  const totalScore = (cats.reduce((s, c) => s + c.score * c.weight, 0) / 100).toFixed(1)

  return (
    <div>
      <TopBar title="Raport" sub={student.name} left={<ChevronLeft size={20} color={C.text} onClick={() => router.back()} style={{ cursor: "pointer" }} />} />
      <div style={{ padding: "0 16px 16px" }}>
        <div style={{ textAlign: "center", padding: "20px 0" }}>
          <div style={{ width: 56, height: 56, borderRadius: 28, background: C.primary + "18", margin: "0 auto 12px", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Star size={24} color={C.primaryLight} />
          </div>
          <div style={{ fontSize: 18, fontWeight: 700, color: C.text }}>{student.name}</div>
          <div style={{ fontSize: 13, color: C.textMuted, marginTop: 2 }}>{programName} · {venueName}</div>
        </div>

        <Card style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 10 }}>Evaluasi</div>
          {cats.map((cat, i) => (
            <div key={i} style={{ marginBottom: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ fontSize: 12, color: C.textSec }}>{cat.name} ({cat.weight}%)</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: C.accent }}>{cat.score}/5</span>
              </div>
              <div style={{ height: 4, borderRadius: 2, background: C.elevated }}>
                <div style={{ height: "100%", borderRadius: 2, background: cat.score >= 4 ? "#4CAF50" : cat.score >= 3 ? C.accent : "#E65100", width: `${(cat.score / 5) * 100}%` }} />
              </div>
            </div>
          ))}
          <hr style={{ border: "none", borderTop: `1px solid ${C.border}`, margin: "12px 0" }} />
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: C.text }}>Rata-rata</span>
            <span style={{ fontSize: 20, fontWeight: 800, color: totalScore >= "3.5" ? "#4CAF50" : C.accent }}>{totalScore}</span>
          </div>
        </Card>

        <Card style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}><span style={{ fontSize: 12, color: C.textMuted }}>Coach</span><span style={{ fontSize: 13, color: C.text }}>{coachName}</span></div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}><span style={{ fontSize: 12, color: C.textMuted }}>Program</span><span style={{ fontSize: 13, color: C.text }}>{programName}</span></div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}><span style={{ fontSize: 12, color: C.textMuted }}>Status</span><span style={{ fontSize: 13, fontWeight: 600, color: student.status === "active" ? "#4CAF50" : C.danger }}>{student.status}</span></div>
        </Card>

        <div style={{ textAlign: "center", fontSize: 12, color: C.textMuted }}>
          Stadione Academy Report System
        </div>
      </div>
    </div>
  )
}
