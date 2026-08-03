"use client"

import { useEffect, useState } from "react"
import { TopBar } from "@/components/shared/TopBar"
import { C } from "@/lib/design"
import { Calendar, DollarSign, Users, GraduationCap, BarChart3, Building2 } from "lucide-react"
import Link from "next/link"

export default function AdminDashboard() {
  const [stats, setStats] = useState({ venues: 0, bookings: 0, members: 0, students: 0, venueList: [] as any[] })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/admin/dashboard").then(r => r.json()).then(setStats).finally(() => setLoading(false))
  }, [])

  const cards = [
    { icon: Building2, label: "Total venue", value: stats.venues },
    { icon: Calendar, label: "Total booking", value: stats.bookings },
    { icon: Users, label: "Total member", value: stats.members },
    { icon: GraduationCap, label: "Total murid", value: stats.students },
  ]

  const actions = [
    { icon: Building2, label: "Kelola Venue", href: "/admin/venues" },
    { icon: BarChart3, label: "Laporan", href: "/admin/reports" },
  ]

  return (
    <div>
      <TopBar title="Dashboard" sub="Platform Admin" />
      <div style={{ padding: "0 16px 16px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
          {cards.map((c, i) => (
            <div key={i} style={{ background: C.surface, borderRadius: 14, padding: 14, border: `1px solid ${C.border}` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}><div style={{ width: 28, height: 28, borderRadius: 8, background: C.primary + "18", display: "flex", alignItems: "center", justifyContent: "center" }}><c.icon size={14} color={C.primaryLight} /></div><span style={{ fontSize: 11, color: C.textMuted }}>{c.label}</span></div>
              <div style={{ fontSize: 20, fontWeight: 700, color: C.text }}>{loading ? "-" : c.value}</div>
            </div>
          ))}
        </div>

        <div style={{ fontSize: 13, fontWeight: 600, color: C.textSec, marginBottom: 8 }}>Quick Access</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 16 }}>
          {actions.map((a, i) => (
            <Link key={i} href={a.href} style={{ textDecoration: "none" }}>
              <div style={{ background: C.surface, borderRadius: 14, padding: 14, border: `1px solid ${C.border}`, textAlign: "center" }}>
                <a.icon size={20} color={C.primaryLight} style={{ margin: "0 auto 6px", display: "block" }} />
                <div style={{ fontSize: 12, fontWeight: 500, color: C.text }}>{a.label}</div>
              </div>
            </Link>
          ))}
        </div>

        {stats.venueList.length > 0 && (
          <>
            <div style={{ fontSize: 13, fontWeight: 600, color: C.textSec, marginBottom: 8 }}>Venue</div>
            {stats.venueList.map((v: any) => (
              <Link key={v.id} href={`/admin/w/${v.slug}`} style={{ textDecoration: "none" }}>
                <div style={{ background: C.surface, borderRadius: 14, padding: 12, border: `1px solid ${C.border}`, marginBottom: 8, display: "flex", alignItems: "center", gap: 10 }}>
                  <Building2 size={16} color={C.primaryLight} />
                  <span style={{ fontSize: 13, color: C.text }}>{v.name}</span>
                </div>
              </Link>
            ))}
          </>
        )}
      </div>
    </div>
  )
}
