"use client"
import { useRouter } from "next/navigation"
import { TopBar } from "@/components/shared/TopBar"
import { C } from "@/lib/design"
import { ChevronLeft, Plus, Search, Users, AlertCircle } from "lucide-react"

const Card = ({ children, style }: any) => <div style={{ background: C.surface, borderRadius: 14, padding: 16, border: `1px solid ${C.border}`, ...style }}>{children}</div>
const Badge = ({ children, color, bg }: any) => <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 8px", borderRadius: 6, background: bg || (color || C.primary) + "22", color: color || C.primaryLight }}>{children}</span>
const Input = ({ placeholder, icon: Icon }: any) => <div style={{ position: "relative", marginBottom: 14 }}>{Icon && <Icon size={16} color={C.textMuted} style={{ position: "absolute", left: 12, top: 12 }} />}<input placeholder={placeholder} style={{ width: "100%", padding: Icon ? "10px 12px 10px 36px" : "10px 12px", background: C.elevated, border: `1px solid ${C.border}`, borderRadius: 10, color: C.text, fontSize: 14, outline: "none", boxSizing: "border-box" }} /></div>

export default function AdminMembers() {
  const router = useRouter()
  const members = [{ name: "Sari Dewi", plan: "Gold", visits: 18, exp: "15 Agu", status: "active" }, { name: "Bambang S.", plan: "Silver", visits: 12, exp: "22 Jul", status: "expired" }, { name: "Citra L.", plan: "Platinum", visits: 25, exp: "30 Sep", status: "active" }]
  return <div>
    <TopBar title="Kelola member" left={<ChevronLeft size={20} color={C.text} onClick={() => router.back()} style={{ cursor: "pointer" }} />} right={<Plus size={20} color={C.primaryLight} />} />
    <div style={{ padding: "0 16px 16px" }}>
      <Input placeholder="Cari member..." icon={Search} />
      <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
        <div style={{ flex: 1, background: C.surface, borderRadius: 14, padding: 14, border: `1px solid ${C.border}` }}><div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}><Users size={14} color="#4CAF50" /><span style={{ fontSize: 11, color: C.textMuted }}>Total aktif</span></div><div style={{ fontSize: 20, fontWeight: 700, color: C.text }}>142</div></div>
        <div style={{ flex: 1, background: C.surface, borderRadius: 14, padding: 14, border: `1px solid ${C.border}` }}><div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}><AlertCircle size={14} color={C.danger} /><span style={{ fontSize: 11, color: C.textMuted }}>Expired</span></div><div style={{ fontSize: 20, fontWeight: 700, color: C.text }}>8</div></div>
      </div>
      {members.map((m, i) => (
        <Card key={i} style={{ marginBottom: 8, padding: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}><div style={{ width: 36, height: 36, borderRadius: 12, background: C.primary + "22", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 600, color: C.primaryLight }}>{m.name[0]}</div><div><div style={{ fontSize: 13, fontWeight: 500, color: C.text }}>{m.name}</div><div style={{ fontSize: 11, color: C.textMuted }}>{m.plan} · {m.visits} visit · exp {m.exp}</div></div></div>
            <Badge color={m.status === "active" ? "#4CAF50" : m.status === "expired" ? C.danger : "#FFB300"} bg={m.status === "active" ? C.successBg : m.status === "expired" ? C.dangerBg : C.warningBg}>{m.status}</Badge>
          </div>
        </Card>
      ))}
    </div>
  </div>
}
