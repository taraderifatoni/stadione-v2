"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { notifyEnrollmentConfirmed } from "@/lib/notification/triggers"
import { ChevronLeft, Users, BookOpen, GraduationCap } from "lucide-react"
import { C } from "@/lib/design"
import { TopBar } from "@/components/shared/TopBar"

export default function AcademyPage() {
  const router = useRouter()
  const supabase = createClient()
  const [user, setUser] = useState<any>(null)
  const [academies, setAcademies] = useState<any[]>([])
  const [selectedAcademy, setSelectedAcademy] = useState<any>(null)
  const [programs, setPrograms] = useState<any[]>([])
  const [msg, setMsg] = useState("")
  const [tab, setTab] = useState("program")

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user || null))
    supabase.from("academies").select("*, venues(name)").limit(20).then(({ data: a }: any) => {
      setAcademies(a || [])
    })
  }, [])

  useEffect(() => {
    if (!selectedAcademy) return
    supabase.from("programs").select("*").eq("academy_id", selectedAcademy.id).eq("is_active", true).then(({ data: p }: any) => setPrograms(p || []))
  }, [selectedAcademy])

  async function enrollStudent(programId: string) {
    if (!user) { router.push("/login"); return }
    const program = programs.find(p => p.id === programId)
    if (!program) return
    await supabase.from("students").insert({ academy_id: selectedAcademy.id, program_id: programId, name: user.email, age_group: "Dewasa", status: "active" })
    setMsg("Pendaftaran berhasil!")
    notifyEnrollmentConfirmed(user.id, program.name)
    setTimeout(() => setMsg(""), 3000)
  }

  return (
    <div>
      <TopBar title="Akademi" left={<ChevronLeft size={20} color={C.text} onClick={() => router.push("/")} style={{ cursor: "pointer" }} />} />
      <div style={{ padding: "0 16px 16px" }}>
        {msg && <div style={{ background: C.successBg, color: "#4CAF50", padding: 10, borderRadius: 10, fontSize: 13, textAlign: "center", marginBottom: 12 }}>{msg}</div>}
        <div style={{ display: "flex", gap: 4, overflowX: "auto", padding: "0 0 12px" }}>
          {academies.map((a: any) => (
            <button key={a.id} onClick={() => setSelectedAcademy(a)} style={{ padding: "8px 14px", borderRadius: 20, border: selectedAcademy?.id === a.id ? "none" : `1px solid ${C.border}`, background: selectedAcademy?.id === a.id ? C.primary : C.surface, color: selectedAcademy?.id === a.id ? "#fff" : C.textSec, fontSize: 12, whiteSpace: "nowrap", cursor: "pointer" }}>{a.venues?.name} Academy</button>
          ))}
        </div>

        {!selectedAcademy && <div style={{ textAlign: "center", padding: 40, color: C.textMuted, fontSize: 13 }}>Pilih akademi</div>}

        {selectedAcademy && (
          <>
            <div style={{ display: "flex", gap: 4, marginBottom: 16, background: "#141210", borderRadius: 10, padding: 4 }}>
              <button onClick={() => setTab("program")} style={{ flex: 1, padding: "10px 8px", borderRadius: 8, border: "none", background: tab === "program" ? C.primary : "transparent", color: tab === "program" ? "#fff" : C.textMuted, fontSize: 13, fontWeight: 700, cursor: "pointer" }}><BookOpen size={14} style={{ marginRight: 4 }} />Program</button>
            </div>

            {programs.length === 0 ? <div style={{ textAlign: "center", padding: 40, color: C.textMuted, fontSize: 13 }}>Belum ada program</div> :
              programs.map((p: any) => (
                <div key={p.id} onClick={() => enrollStudent(p.id)} style={{ background: C.surface, borderRadius: 14, padding: 16, border: `1px solid ${C.border}`, marginBottom: 10, cursor: "pointer" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: 8 }}>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 600, color: C.text }}>{p.name}</div>
                      <div style={{ fontSize: 12, color: C.textMuted, marginTop: 2 }}>{p.schedule || "Jadwal fleksibel"} · {p.coaches?.name || "Coach"}</div>
                      {p.description && <div style={{ fontSize: 11, color: C.textMuted, marginTop: 4 }}>{p.description}</div>}
                    </div>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 4 }}><GraduationCap size={13} color={C.textMuted} /><span style={{ fontSize: 12, color: C.textMuted }}>{p.max_capacity ? `Kapasitas ${p.max_capacity}` : "Kuota terbuka"}</span></div>
                    <span style={{ fontSize: 14, fontWeight: 600, color: C.accent }}>
                      {p.price > 0 ? `Rp ${Number(p.price).toLocaleString("id-ID")}` : "Gratis"}
                    </span>
                  </div>
                </div>
              ))}
          </>
        )}
      </div>
    </div>
  )
}
