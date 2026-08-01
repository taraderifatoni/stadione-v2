"use client"
import { useRouter } from "next/navigation"
import { TopBar } from "@/components/shared/TopBar"
import { C } from "@/lib/design"
import { ChevronLeft, UserPlus } from "lucide-react"

const Card = ({ children, style }: any) => <div style={{ background: C.surface, borderRadius: 14, padding: 16, border: `1px solid ${C.border}`, ...style }}>{children}</div>
const Badge = ({ children, color }: any) => <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 8px", borderRadius: 6, background: (color || C.primary) + "22", color: color || C.primaryLight }}>{children}</span>

export default function AdminStaff() {
  const router = useRouter()
  const staff = [{ name: "Budi Santoso", role: "Manager", email: "budi@email.com" }, { name: "Siti Aminah", role: "Staff", email: "siti@email.com" }, { name: "Coach Andi", role: "Coach", email: "andi@email.com" }]
  return <div>
    <TopBar title="Kelola staff" left={<ChevronLeft size={20} color={C.text} onClick={() => router.back()} style={{ cursor: "pointer" }} />} right={<UserPlus size={18} color={C.primaryLight} />} />
    <div style={{ padding: "0 16px 16px" }}>
      {staff.map((s, i) => (
        <Card key={i} style={{ marginBottom: 8, padding: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <div style={{ width: 36, height: 36, borderRadius: 12, background: C.accentMuted + "33", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 600, color: C.accent }}>{s.name[0]}</div>
              <div><div style={{ fontSize: 13, fontWeight: 500, color: C.text }}>{s.name}</div><div style={{ fontSize: 11, color: C.textMuted }}>{s.email}</div></div>
            </div>
            <Badge color={s.role === "Manager" ? C.accent : s.role === "Coach" ? "#4CAF50" : C.textMuted}>{s.role}</Badge>
          </div>
        </Card>
      ))}
      <button style={{ width: "100%", padding: "12px 20px", borderRadius: 10, border: "none", background: C.primary, color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 12 }}><UserPlus size={16} />Undang staff baru</button>
    </div>
  </div>
}
