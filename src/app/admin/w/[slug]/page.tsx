"use client"

import { useVenue } from "./layout"
import { C } from "@/lib/design"
import { Calendar, DollarSign, Users, GraduationCap, BarChart3 } from "lucide-react"
import Link from "next/link"

export default function WorkspaceDashboard() {
  const ctx = useVenue()
  if (!ctx) return null

  const actions = [
    { icon: Calendar, label: "Booking", href: "bookings" },
    { icon: Users, label: "Member", href: "members" },
    { icon: GraduationCap, label: "Akademi", href: "academy" },
    { icon: BarChart3, label: "Laporan", href: "reports" },
  ]

  return (
    <div style={{ padding: 16 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
        {[{ icon: Calendar, label: "Booking hari ini", value: "18", color: C.primaryLight },
          { icon: DollarSign, label: "Revenue", value: "2.1jt", color: "#4CAF50" },
          { icon: Users, label: "Member aktif", value: "142", color: C.accent },
          { icon: GraduationCap, label: "Murid", value: "45", color: "#FFB300" }].map((s, i) => (
          <div key={i} style={{ background: C.surface, borderRadius: 14, padding: 14, border: `1px solid ${C.border}` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}><div style={{ width: 28, height: 28, borderRadius: 8, background: s.color + "18", display: "flex", alignItems: "center", justifyContent: "center" }}><s.icon size={14} color={s.color} /></div><span style={{ fontSize: 11, color: C.textMuted }}>{s.label}</span></div>
            <div style={{ fontSize: 20, fontWeight: 700, color: C.text }}>{s.value}</div>
          </div>
        ))}
      </div>
      <div style={{ fontSize: 14, fontWeight: 600, color: C.text, marginBottom: 10 }}>Aksi cepat</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        {actions.map((a, i) => (
          <Link key={i} href={a.href} style={{ textDecoration: "none" }}>
            <div style={{ background: C.surface, borderRadius: 14, padding: 14, border: `1px solid ${C.border}`, textAlign: "center" }}>
              <a.icon size={20} color={C.primaryLight} style={{ margin: "0 auto 6px", display: "block" }} />
              <div style={{ fontSize: 12, fontWeight: 500, color: C.text }}>{a.label}</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
