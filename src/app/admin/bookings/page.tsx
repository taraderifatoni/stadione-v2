"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { TopBar } from "@/components/shared/TopBar"
import { C } from "@/lib/design"
import { ChevronLeft, Filter, Calendar, Clock } from "lucide-react"

const Card = ({ children, style }: any) => <div style={{ background: C.surface, borderRadius: 14, padding: 16, border: `1px solid ${C.border}`, ...style }}>{children}</div>
const Badge = ({ children, color, bg }: any) => <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 8px", borderRadius: 6, background: bg || (color || C.primary) + "22", color: color || C.primaryLight }}>{children}</span>

export default function AdminBookings() {
  const [view, setView] = useState("list")
  const router = useRouter()
  const bookings = [{ id: "BK-3107-001", name: "Andi Setiawan", court: "Futsal A", date: "31 Jul", time: "15:00-16:00", amount: "120rb", status: "confirmed" }, { id: "BK-3107-002", name: "Lisa Permata", court: "Basket", date: "31 Jul", time: "17:00-19:00", amount: "300rb", status: "paid" }, { id: "BK-3107-003", name: "Walk-in", court: "Futsal B", date: "31 Jul", time: "20:00-21:00", amount: "120rb", status: "pending" }]
  return <div>
    <TopBar title="Kelola booking" left={<ChevronLeft size={20} color={C.text} onClick={() => router.back()} style={{ cursor: "pointer" }} />} right={<Filter size={18} color={C.textSec} />} />
    <div style={{ padding: "0 16px 16px" }}>
      <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>{["list", "calendar"].map(v => <button key={v} onClick={() => setView(v)} style={{ padding: "6px 14px", borderRadius: 8, border: `1px solid ${view === v ? C.primaryLight : C.border}`, background: view === v ? C.primary + "22" : "transparent", color: view === v ? C.primaryLight : C.textMuted, fontSize: 12, cursor: "pointer" }}>{v === "list" ? "Daftar" : "Kalender"}</button>)}</div>
      <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
        <div style={{ flex: 1, background: C.surface, borderRadius: 14, padding: 14, border: `1px solid ${C.border}` }}><div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}><Calendar size={14} color={C.primaryLight} /><span style={{ fontSize: 11, color: C.textMuted }}>Hari ini</span></div><div style={{ fontSize: 20, fontWeight: 700, color: C.text }}>18</div></div>
        <div style={{ flex: 1, background: C.surface, borderRadius: 14, padding: 14, border: `1px solid ${C.border}` }}><div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}><Clock size={14} color="#FFB300" /><span style={{ fontSize: 11, color: C.textMuted }}>Pending</span></div><div style={{ fontSize: 20, fontWeight: 700, color: C.text }}>3</div></div>
      </div>
      {bookings.map((b, i) => (
        <Card key={i} style={{ marginBottom: 8, padding: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: 6 }}><div><div style={{ fontSize: 13, fontWeight: 500, color: C.text }}>{b.name}</div><div style={{ fontSize: 11, color: C.textMuted }}>{b.id}</div></div><Badge color={b.status === "confirmed" ? "#4CAF50" : b.status === "paid" ? C.accent : "#FFB300"} bg={b.status === "confirmed" ? C.successBg : C.warningBg}>{b.status}</Badge></div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: C.textMuted }}><span>{b.court} · {b.date} · {b.time}</span><span style={{ color: C.accent, fontWeight: 600 }}>Rp {b.amount}</span></div>
        </Card>
      ))}
    </div>
  </div>
}
