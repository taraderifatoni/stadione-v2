"use client"

import { useRouter } from "next/navigation"
import { TopBar } from "@/components/shared/TopBar"
import { C } from "@/lib/design"
import { ChevronLeft, Plus, Search, Filter, Calendar, Clock, ArrowUpRight, ArrowDownRight } from "lucide-react"

const Card = ({ children, style }: any) => <div style={{ background: C.surface, borderRadius: 14, padding: 16, border: `1px solid ${C.border}`, ...style }}>{children}</div>
const Badge = ({ children, color, bg }: any) => <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 8px", borderRadius: 6, background: bg || (color || C.primary) + "22", color: color || C.primaryLight, letterSpacing: 0.3 }}>{children}</span>
const StatCard = ({ icon: Icon, label, value, trend, color }: any) => (
  <div style={{ flex: 1, background: C.surface, borderRadius: 14, padding: 14, border: `1px solid ${C.border}` }}>
    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}><div style={{ width: 28, height: 28, borderRadius: 8, background: (color || C.primary) + "18", display: "flex", alignItems: "center", justifyContent: "center" }}><Icon size={14} color={color || C.primaryLight} /></div><span style={{ fontSize: 11, color: C.textMuted }}>{label}</span></div>
    <div style={{ fontSize: 20, fontWeight: 700, color: C.text }}>{value}</div>
  </div>
)
const StatusDot = ({ color }: any) => <span style={{ width: 8, height: 8, borderRadius: 4, background: color, display: "inline-block" }} />
const Input = ({ placeholder, icon: Icon }: any) => (
  <div style={{ position: "relative", marginBottom: 14 }}>{Icon && <Icon size={16} color={C.textMuted} style={{ position: "absolute", left: 12, top: 12 }} />}<input placeholder={placeholder} style={{ width: "100%", padding: Icon ? "10px 12px 10px 36px" : "10px 12px", background: C.elevated, border: `1px solid ${C.border}`, borderRadius: 10, color: C.text, fontSize: 14, outline: "none", boxSizing: "border-box" }} /></div>
)

export default function AdminVenues() {
  const router = useRouter()
  return <div>
    <TopBar title="Kelola venue" left={<ChevronLeft size={20} color={C.text} onClick={() => router.back()} style={{ cursor: "pointer" }} />} right={<Plus size={20} color={C.primaryLight} />} />
    <div style={{ padding: "0 16px 16px" }}>
      <Input placeholder="Cari venue..." icon={Search} />
      {[{ name: "Kenari Football Area", city: "Yogyakarta", status: "active", domains: ["Booking", "Membership"] }, { name: "Iron Gym Sleman", city: "Sleman", status: "active", domains: ["Membership"] }, { name: "Champion Arena", city: "Sleman", status: "pending", domains: ["Booking", "Akademi"] }].map((v, i) => (
        <Card key={i} style={{ marginBottom: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: 8 }}>
            <div><div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{v.name}</div><div style={{ fontSize: 12, color: C.textMuted, marginTop: 2 }}>{v.city}</div></div>
            <StatusDot color={v.status === "active" ? "#4CAF50" : "#FFB300"} />
          </div>
          <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>{v.domains.map((d: string) => <Badge key={d}>{d}</Badge>)}</div>
        </Card>
      ))}
    </div>
  </div>
}
