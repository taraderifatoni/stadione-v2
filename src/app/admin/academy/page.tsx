"use client"
import { useRouter } from "next/navigation"
import { TopBar } from "@/components/shared/TopBar"
import { C } from "@/lib/design"
import { ChevronLeft, Plus } from "lucide-react"

const Card = ({ children, style }: any) => <div style={{ background: C.surface, borderRadius: 14, padding: 16, border: `1px solid ${C.border}`, ...style }}>{children}</div>

export default function AdminAcademy() {
  const router = useRouter()
  const students = [{ name: "Ahmad R.", program: "U-14 Elite", att: "92%", score: "3.8" }, { name: "Bintang S.", program: "U-10 Dev", att: "88%", score: "3.5" }, { name: "Cinta A.", program: "Junior Tennis", att: "95%", score: "4.1" }]
  return <div>
    <TopBar title="Kelola akademi" left={<ChevronLeft size={20} color={C.text} onClick={() => router.back()} style={{ cursor: "pointer" }} />} right={<Plus size={20} color={C.primaryLight} />} />
    <div style={{ padding: "0 16px 16px" }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 16 }}>
        {[{ l: "Program", v: "3" }, { l: "Coach", v: "4" }, { l: "Murid", v: "45" }].map((s, i) => <Card key={i} style={{ textAlign: "center", padding: 10 }}><div style={{ fontSize: 18, fontWeight: 700, color: C.accent }}>{s.v}</div><div style={{ fontSize: 11, color: C.textMuted }}>{s.l}</div></Card>)}
      </div>
      <div style={{ fontSize: 14, fontWeight: 600, color: C.text, marginBottom: 10 }}>Murid terdaftar</div>
      {students.map((s, i) => (
        <Card key={i} style={{ marginBottom: 8, padding: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div><div style={{ fontSize: 13, fontWeight: 500, color: C.text }}>{s.name}</div><div style={{ fontSize: 11, color: C.textMuted }}>{s.program} · Kehadiran {s.att}</div></div>
            <div style={{ textAlign: "right" }}><div style={{ fontSize: 16, fontWeight: 700, color: C.accent }}>{s.score}</div><div style={{ fontSize: 10, color: C.textMuted }}>Nilai</div></div>
          </div>
        </Card>
      ))}
    </div>
  </div>
}
