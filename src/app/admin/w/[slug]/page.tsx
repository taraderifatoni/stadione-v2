"use client"

import { useEffect, useState } from "react"
import { useVenue } from "./layout"
import { C } from "@/lib/design"
import { Calendar, DollarSign, Users, GraduationCap, BarChart3 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import Link from "next/link"

export default function WorkspaceDashboard() {
  const ctx = useVenue()
  const supabase = createClient()
  const [stats, setStats] = useState({ bookings: 0, members: 0, students: 0, revenue: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!ctx) return
    const vid = ctx.venue.id
    const today = new Date().toISOString().split("T")[0]
    Promise.all([
      supabase.from("bookings").select("id", { count: "exact", head: true }).eq("venue_id", vid).gte("booking_date", today),
      supabase.from("members").select("id", { count: "exact", head: true }).eq("venue_id", vid).eq("status", "active"),
      supabase.from("shifts").select("id").eq("venue_id", vid).order("created_at", { ascending: false }).limit(1),
    ]).then(async ([b, m, shifts]) => {
      const shiftId = shifts.data?.[0]?.id
      let revenue = 0
      if (shiftId) {
        const { data: pt } = await supabase.from("pos_transactions").select("amount").eq("shift_id", shiftId).eq("status", "completed")
        revenue = pt?.reduce((sum: number, t: any) => sum + Number(t.amount), 0) || 0
      }
      // Count students via academies for this venue
      const { data: acad } = await supabase.from("academies").select("id").eq("venue_id", vid).single()
      let studentCount = 0
      if (acad) {
        const { count } = await supabase.from("students").select("id", { count: "exact", head: true }).eq("academy_id", acad.id)
        studentCount = count || 0
      }
      setStats({ bookings: b.count || 0, members: m.count || 0, students: studentCount, revenue })
      setLoading(false)
    })
  }, [ctx])

  const items = [
    { icon: Calendar, label: "Booking hari ini", value: loading ? "..." : String(stats.bookings), color: C.primaryLight },
    { icon: DollarSign, label: "Revenue shift", value: loading ? "..." : `Rp ${(stats.revenue / 1000).toFixed(0)}rb`, color: "#4CAF50" },
    { icon: Users, label: "Member aktif", value: loading ? "..." : String(stats.members), color: C.accent },
    { icon: GraduationCap, label: "Murid", value: loading ? "..." : String(stats.students), color: "#FFB300" },
  ]

  const actions = [
    { icon: Calendar, label: "Booking", href: "bookings" },
    { icon: Users, label: "Member", href: "members" },
    { icon: GraduationCap, label: "Akademi", href: "academy" },
    { icon: BarChart3, label: "Laporan", href: "reports" },
  ]

  return (
    <div style={{ padding: 16 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
        {items.map((s, i) => (
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
