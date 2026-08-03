"use client"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { TopBar } from "@/components/shared/TopBar"
import { C } from "@/lib/design"
import { ChevronLeft, Building2, Users, Calendar, DollarSign, Shield } from "lucide-react"
import { useRouter } from "next/navigation"
import Link from "next/link"

export default function PlatformAdminPage() {
  const [stats, setStats] = useState({ venues: 0, users: 0, bookings: 0, revenue: 0 })
  const [venueList, setVenueList] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    Promise.all([
      supabase.from("venues").select("id, name, slug, city, status").eq("status", "active").limit(20),
      supabase.from("bookings").select("id,final_price", { count: "exact" }),
      supabase.from("venue_roles").select("user_id", { count: "exact", head: true }),
      supabase.from("bookings").select("final_price"),
    ]).then(([v, b, vr, bp]) => {
      const totalRev = bp.data?.reduce((s: number, x: any) => s + Number(x.final_price || 0), 0) || 0
      setStats({ venues: v.data?.length || 0, users: vr.count || 0, bookings: b.count || 0, revenue: totalRev })
      setVenueList(v.data || [])
      setLoading(false)
    })
  }, [])

  return (
    <div>
      <TopBar title="Platform Admin" sub="Super Admin" left={<ChevronLeft size={20} color={C.text} onClick={() => router.back()} style={{ cursor: "pointer" }} />} />
      <div style={{ padding: "0 16px 16px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
          {[
            { icon: Building2, label: "Venue Aktif", value: stats.venues, color: C.primaryLight },
            { icon: Users, label: "User", value: stats.users, color: "#4CAF50" },
            { icon: Calendar, label: "Booking", value: stats.bookings, color: C.accent },
            { icon: DollarSign, label: "Revenue", value: `Rp ${(stats.revenue / 1000).toFixed(0)}rb`, color: "#FFB300" },
          ].map((s, i) => (
            <div key={i} style={{ background: C.surface, borderRadius: 14, padding: 14, border: `1px solid ${C.border}` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: s.color + "18", display: "flex", alignItems: "center", justifyContent: "center" }}><s.icon size={14} color={s.color} /></div>
                <span style={{ fontSize: 11, color: C.textMuted }}>{s.label}</span>
              </div>
              <div style={{ fontSize: 20, fontWeight: 700, color: C.text }}>{loading ? "-" : s.value}</div>
            </div>
          ))}
        </div>

        <div style={{ fontSize: 14, fontWeight: 600, color: C.text, marginBottom: 10 }}>Semua Venue</div>
        {venueList.map((v: any) => (
          <Link key={v.id} href={`/admin/w/${v.slug}`} style={{ textDecoration: "none" }}>
            <div style={{ background: C.surface, borderRadius: 14, padding: 12, border: `1px solid ${C.border}`, marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <Building2 size={16} color={C.primaryLight} />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: C.text }}>{v.name}</div>
                  <div style={{ fontSize: 11, color: C.textMuted }}>{v.city || "-"}</div>
                </div>
              </div>
              <Shield size={14} color={C.accent} />
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
