"use client"

import { useRouter } from "next/navigation"
import { TopBar } from "@/components/shared/TopBar"
import { C } from "@/lib/design"
import { Menu, Calendar, DollarSign, Users, GraduationCap, BarChart3, ArrowUpRight, ArrowDownRight } from "lucide-react"

const Card = ({ children, style, onClick }: any) => <div onClick={onClick} style={{ background: C.surface, borderRadius: 14, padding: 16, border: `1px solid ${C.border}`, cursor: onClick ? "pointer" : "default", ...style }}>{children}</div>
const Badge = ({ children, color, bg }: any) => <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 8px", borderRadius: 6, background: bg || (color || C.primary) + "22", color: color || C.primaryLight, letterSpacing: 0.3 }}>{children}</span>
const StatCard = ({ icon: Icon, label, value, trend, color }: any) => (
  <div style={{ flex: 1, minWidth: 0, background: C.surface, borderRadius: 14, padding: 14, border: `1px solid ${C.border}` }}>
    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}><div style={{ width: 28, height: 28, borderRadius: 8, background: (color || C.primary) + "18", display: "flex", alignItems: "center", justifyContent: "center" }}><Icon size={14} color={color || C.primaryLight} /></div><span style={{ fontSize: 11, color: C.textMuted, letterSpacing: 0.3 }}>{label}</span></div>
    <div style={{ fontSize: 20, fontWeight: 700, color: C.text }}>{value}</div>
    {trend != null && <div style={{ fontSize: 11, color: trend > 0 ? "#4CAF50" : C.danger, marginTop: 4, display: "flex", alignItems: "center", gap: 2 }}>{trend > 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />} {Math.abs(trend)}%</div>}
  </div>
)

export default function AdminDashboard() {
  const router = useRouter()
  return <div>
    <TopBar title="Dashboard" sub="Kenari Football Area" left={<Menu size={20} color={C.text} />} />
    <div style={{ padding: "0 16px 16px" }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
        <StatCard icon={Calendar} label="Booking hari ini" value="18" trend={12} />
        <StatCard icon={DollarSign} label="Revenue" value="2.1jt" trend={8} color="#4CAF50" />
        <StatCard icon={Users} label="Member aktif" value="142" trend={5} color={C.accent} />
        <StatCard icon={GraduationCap} label="Murid" value="45" trend={-2} color="#FFB300" />
      </div>
      <div style={{ fontSize: 14, fontWeight: 600, color: C.text, marginBottom: 10 }}>Aksi cepat</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 16 }}>
        {[{ icon: Calendar, label: "Booking", to: "/admin/bookings" }, { icon: Users, label: "Member", to: "/admin/members" }, { icon: GraduationCap, label: "Akademi", to: "/admin/academy" }, { icon: BarChart3, label: "Laporan", to: "/admin/reports" }].map((a, i) => (
          <Card key={i} onClick={() => router.push(a.to)} style={{ textAlign: "center", padding: 14 }}>
            <a.icon size={20} color={C.primaryLight} style={{ margin: "0 auto 6px", display: "block" }} />
            <div style={{ fontSize: 12, fontWeight: 500, color: C.text }}>{a.label}</div>
          </Card>
        ))}
      </div>
      <div style={{ fontSize: 14, fontWeight: 600, color: C.text, marginBottom: 10 }}>Booking terbaru</div>
      {[{ name: "Andi Setiawan", court: "Futsal A", time: "15:00-16:00", status: "confirmed" }, { name: "Budi Hartono", court: "Basket", time: "17:00-19:00", status: "pending" }].map((b, i) => (
        <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: `1px solid ${C.border}11` }}>
          <div><div style={{ fontSize: 13, fontWeight: 500, color: C.text }}>{b.name}</div><div style={{ fontSize: 11, color: C.textMuted }}>{b.court} · {b.time}</div></div>
          <Badge color={b.status === "confirmed" ? "#4CAF50" : "#FFB300"} bg={b.status === "confirmed" ? C.successBg : C.warningBg}>{b.status}</Badge>
        </div>
      ))}
    </div>
  </div>
}
