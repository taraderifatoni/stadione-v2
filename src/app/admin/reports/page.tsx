"use client"

import { useEffect, useState } from "react"
import { TopBar } from "@/components/shared/TopBar"
import { C } from "@/lib/design"
import { DollarSign, Calendar, Users, Activity, TrendingUp } from "lucide-react"

export default function AdminReports() {
  const [stats, setStats] = useState({ revenue: 0, bookings: 0, members: 0, checkins: 0, topVenues: [] as any[] })
  const [loading, setLoading] = useState(true)
  const H = {"apikey":"eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc4NTI1MjYwMCwiZXhwIjo0OTQwOTI2MjAwLCJyb2xlIjoiYW5vbiJ9.WoeLAuy5jLAlVVQfKJKIIrb870Bt3ZwKtmyBvvksLBY"}

  useEffect(() => {
    Promise.all([
      fetch("https://api.stadione.pro/rest/v1/payment_records?select=amount&status=eq.paid", {headers:H}).then(r => r.json()),
      fetch("https://api.stadione.pro/rest/v1/bookings?select=id", {headers:H}).then(r => r.json()),
      fetch("https://api.stadione.pro/rest/v1/members?select=id", {headers:H}).then(r => r.json()),
      fetch("https://api.stadione.pro/rest/v1/venues?select=name&order=created_at.desc&limit=10", {headers:H}).then(r => r.json()),
    ]).then(([pay, bk, mb, vn]) => {
      setStats({
        revenue: pay.reduce((s: number, p: any) => s + (p.amount || 0), 0),
        bookings: bk.length, members: mb.length, checkins: 0,
        topVenues: vn || [],
      })
    }).finally(() => setLoading(false))
  }, [])

  return (
    <div>
      <TopBar title="Analitik" />
      <div style={{ padding: "0 16px 16px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
          {[{ icon: DollarSign, label: "Revenue", value: `Rp ${(stats.revenue/1000).toFixed(0)}rb`, color: "#4CAF50" },
            { icon: Calendar, label: "Booking", value: stats.bookings },
            { icon: Users, label: "Member", value: stats.members, color: C.accent },
            { icon: TrendingUp, label: "Pertumbuhan", value: "+12%", color: C.primaryLight }].map((s, i) => (
            <div key={i} style={{ background: C.surface, borderRadius: 14, padding: 14, border: `1px solid ${C.border}` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}><div style={{ width: 28, height: 28, borderRadius: 8, background: (s.color||C.primary)+"18", display: "flex", alignItems: "center", justifyContent: "center" }}><s.icon size={14} color={s.color||C.primaryLight} /></div><span style={{ fontSize: 11, color: C.textMuted }}>{s.label}</span></div>
              <div style={{ fontSize: 20, fontWeight: 700, color: C.text }}>{s.value}</div>
            </div>
          ))}
        </div>
        <div style={{ fontSize: 14, fontWeight: 600, color: C.text, marginBottom: 8 }}>Top venue</div>
        {stats.topVenues.map((v: any, i: number) => (
          <div key={i} style={{ padding: "10px 0", borderBottom: `1px solid ${C.border}44`, display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontSize: 13, color: C.text }}>{v.name}</span>
            <span style={{ fontSize: 12, color: C.textMuted }}>#{i + 1}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
