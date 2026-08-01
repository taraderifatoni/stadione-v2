"use client"
import { useRouter } from "next/navigation"
import { TopBar } from "@/components/shared/TopBar"
import { C } from "@/lib/design"
import { ChevronLeft, DollarSign, Calendar, Users, Activity, ArrowUpRight, ArrowDownRight } from "lucide-react"

const StatCard = ({ icon: Icon, label, value, trend, color }: any) => (
  <div style={{ background: C.surface, borderRadius: 14, padding: 14, border: `1px solid ${C.border}` }}>
    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}><div style={{ width: 28, height: 28, borderRadius: 8, background: (color || C.primary) + "18", display: "flex", alignItems: "center", justifyContent: "center" }}><Icon size={14} color={color || C.primaryLight} /></div><span style={{ fontSize: 11, color: C.textMuted }}>{label}</span></div>
    <div style={{ fontSize: 20, fontWeight: 700, color: C.text }}>{value}</div>
    {trend != null && <div style={{ fontSize: 11, color: trend > 0 ? "#4CAF50" : C.danger, marginTop: 4, display: "flex", alignItems: "center", gap: 2 }}>{trend > 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />} {Math.abs(trend)}%</div>}
  </div>
)

export default function AdminReports() {
  const router = useRouter()
  return <div>
    <TopBar title="Laporan" left={<ChevronLeft size={20} color={C.text} onClick={() => router.back()} style={{ cursor: "pointer" }} />} />
    <div style={{ padding: "0 16px 16px" }}>
      <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>{["Harian", "Mingguan", "Bulanan"].map((t, i) => <button key={t} style={{ flex: 1, padding: "8px 0", borderRadius: 8, border: `1px solid ${i === 0 ? C.primaryLight : C.border}`, background: i === 0 ? C.primary + "22" : "transparent", color: i === 0 ? C.primaryLight : C.textMuted, fontSize: 12, cursor: "pointer" }}>{t}</button>)}</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <StatCard icon={DollarSign} label="Revenue" value="28.5jt" trend={12} color="#4CAF50" />
        <StatCard icon={Calendar} label="Booking" value="342" trend={8} />
        <StatCard icon={Users} label="New member" value="23" trend={15} color={C.accent} />
        <StatCard icon={Activity} label="Check-in" value="1.2rb" trend={-3} color="#FFB300" />
      </div>
    </div>
  </div>
}
