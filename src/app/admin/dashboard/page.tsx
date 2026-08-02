"use client"

import { useEffect, useState } from "react"
import { TopBar } from "@/components/shared/TopBar"
import { C } from "@/lib/design"
import { Calendar, DollarSign, Users, GraduationCap, BarChart3, Building2 } from "lucide-react"
import Link from "next/link"

export default function AdminDashboard() {
  const [stats, setStats] = useState({ venues: 0, bookings: 0, members: 0, students: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const headers = {"apikey":"eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc4NTI1MjYwMCwiZXhwIjo0OTQwOTI2MjAwLCJyb2xlIjoiYW5vbiJ9.WoeLAuy5jLAlVVQfKJKIIrb870Bt3ZwKtmyBvvksLBY"}
    Promise.all([
      fetch("https://api.stadione.pro/rest/v1/venues?select=id", {headers}).then(r => r.json()),
      fetch("https://api.stadione.pro/rest/v1/bookings?select=id", {headers}).then(r => r.json()),
      fetch("https://api.stadione.pro/rest/v1/members?select=id", {headers}).then(r => r.json()),
      fetch("https://api.stadione.pro/rest/v1/students?select=id", {headers}).then(r => r.json()),
    ]).then(([v,b,m,s]) => setStats({venues:v.length,bookings:b.length,members:m.length,students:s.length})).finally(() => setLoading(false))
  }, [])

  const cards = [
    { icon: Building2, label: "Total venue", value: stats.venues },
    { icon: Calendar, label: "Total booking", value: stats.bookings },
    { icon: Users, label: "Total member", value: stats.members },
    { icon: GraduationCap, label: "Total murid", value: stats.students },
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
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          {[{ icon: Calendar, label: "Booking", href: "/admin/w/iron-gym-jakarta/bookings" }, { icon: Users, label: "Member", href: "/admin/w/iron-gym-jakarta/members" }, { icon: Building2, label: "Kelola Venue", href: "/admin/venues" }, { icon: BarChart3, label: "Laporan", href: "/admin/reports" }].map((a, i) => (
            <Link key={i} href={a.href} style={{ textDecoration: "none" }}>
              <div style={{ background: C.surface, borderRadius: 14, padding: 14, border: `1px solid ${C.border}`, textAlign: "center" }}>
                <a.icon size={20} color={C.primaryLight} style={{ margin: "0 auto 6px", display: "block" }} />
                <div style={{ fontSize: 12, fontWeight: 500, color: C.text }}>{a.label}</div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
