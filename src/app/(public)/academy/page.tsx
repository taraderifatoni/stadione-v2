"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ChevronLeft, Users } from "lucide-react"
import { C } from "@/lib/design"
import { TopBar } from "@/components/shared/TopBar"

const Badge = ({ children, color, bg }: any) => (
  <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 8px", borderRadius: 6, background: bg || (color || C.primary) + "22", color: color || C.primaryLight, letterSpacing: 0.3 }}>{children}</span>
)

const Card = ({ children, style, onClick }: { children: React.ReactNode; style?: React.CSSProperties; onClick?: () => void }) => (
  <div onClick={onClick} style={{ background: C.surface, borderRadius: 14, padding: 16, border: `1px solid ${C.border}`, cursor: onClick ? "pointer" : "default", ...style }}>{children}</div>
)

const TabBar = ({ tabs, active, onChange }: { tabs: string[]; active: string; onChange: (t: string) => void }) => (
  <div style={{ display: "flex", gap: 0, borderBottom: `1px solid ${C.border}`, marginBottom: 16 }}>
    {tabs.map(t => (
      <button key={t} onClick={() => onChange(t)} style={{ flex: 1, padding: "10px 0", fontSize: 13, fontWeight: active === t ? 600 : 400, color: active === t ? C.text : C.textMuted, background: "none", border: "none", borderBottom: active === t ? `2px solid ${C.primaryLight}` : "2px solid transparent", cursor: "pointer" }}>{t}</button>
    ))}
  </div>
)

const programs = [
  { name: "U-10 Development", sport: "Sepakbola", coach: "Coach Andi", students: 15, price: "350" },
  { name: "U-14 Elite", sport: "Sepakbola", coach: "Coach Budi", students: 12, price: "500" },
  { name: "Junior Tennis", sport: "Tenis", coach: "Coach Maya", students: 8, price: "450" },
]

const scheduleDays = [
  { day: "Senin", program: "U-10 Development", coach: "Coach Andi", time: "15:00-17:00", venue: "Lap. Futsal A" },
  { day: "Selasa", program: "U-12 Development", coach: "Coach Budi", time: "16:00-18:00", venue: "Lap. Futsal A" },
  { day: "Rabu", program: "U-14 Elite", coach: "Coach Maya", time: "17:00-19:00", venue: "Lap. Futsal A" },
  { day: "Kamis", program: "U-10 Development", coach: "Coach Andi", time: "15:00-17:00", venue: "Lap. Futsal A" },
  { day: "Jumat", program: "U-14 Elite", coach: "Coach Budi", time: "16:00-18:00", venue: "Lap. Futsal A" },
]

const reports = [
  { period: "Juli 2026", name: "Ahmad — U-14 Elite", score: 3.8, status: "Published", statusColor: "#4CAF50", statusBg: C.successBg },
  { period: "Juni 2026", name: "Ahmad — U-14 Elite", score: 3.5, status: "Draft", statusColor: C.textMuted, statusBg: C.elevated },
  { period: "Mei 2026", name: "Ahmad — U-14 Elite", score: 3.2, status: "Draft", statusColor: C.textMuted, statusBg: C.elevated },
]

export default function AcademyPage() {
  const router = useRouter()
  const [tab, setTab] = useState("Program")

  return (
    <div>
      <TopBar
        title="Akademi"
        left={<ChevronLeft size={20} color={C.text} onClick={() => router.push("/")} style={{ cursor: "pointer" }} />}
      />
      <div style={{ padding: "0 16px 16px" }}>
        <TabBar tabs={["Program", "Jadwal", "Raport"]} active={tab} onChange={setTab} />

        {tab === "Program" && <>
          {programs.map((p, i) => (
            <Card key={i} style={{ marginBottom: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: 8 }}>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: C.text }}>{p.name}</div>
                  <div style={{ fontSize: 12, color: C.textMuted, marginTop: 2 }}>{p.sport} · {p.coach}</div>
                </div>
                <Badge>{p.sport}</Badge>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}><Users size={13} color={C.textMuted} /><span style={{ fontSize: 12, color: C.textMuted }}>{p.students} murid</span></div>
                <span style={{ fontSize: 14, fontWeight: 600, color: C.accent }}>Rp {p.price}rb/bln</span>
              </div>
            </Card>
          ))}
        </>}

        {tab === "Jadwal" && <>
          {scheduleDays.map((d, i) => (
            <div key={i} style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: C.textMuted, marginBottom: 6 }}>{d.day}</div>
              <Card style={{ padding: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500, color: C.text }}>{d.program}</div>
                    <div style={{ fontSize: 11, color: C.textMuted }}>{d.coach}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 13, color: C.accent }}>{d.time}</div>
                    <div style={{ fontSize: 11, color: C.textMuted }}>{d.venue}</div>
                  </div>
                </div>
              </Card>
            </div>
          ))}
        </>}

        {tab === "Raport" && <>
          <div style={{ fontSize: 13, color: C.textMuted, marginBottom: 12 }}>Raport anak Anda</div>
          {reports.map((p, i) => (
            <Card key={i} onClick={() => router.push("/academy/report")} style={{ marginBottom: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 500, color: C.text }}>Raport {p.period}</div>
                  <div style={{ fontSize: 12, color: C.textMuted, marginTop: 2 }}>{p.name}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 18, fontWeight: 700, color: p.score.toFixed(1) === "3.8" ? "#4CAF50" : C.accent }}>{p.score.toFixed(1)}</div>
                  <Badge color={p.statusColor} bg={p.statusBg}>{p.status}</Badge>
                </div>
              </div>
            </Card>
          ))}
        </>}
      </div>
    </div>
  )
}
