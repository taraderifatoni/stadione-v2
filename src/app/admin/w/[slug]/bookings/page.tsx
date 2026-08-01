"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { C } from "@/lib/design"
import { Calendar, Clock } from "lucide-react"
import { StatusBadge } from "@/components/shared/SharedComponents"

export default function WorkspaceBookings() {
  const { slug } = useParams<{ slug: string }>()
  const [venue, setVenue] = useState<any>(null)
  const [bookings, setBookings] = useState<any[]>([])
  const supabase = createClient()

  useEffect(() => {
    supabase.from("venues").select("id").eq("slug", slug).single().then(({ data }: any) => {
      if (!data) return; setVenue(data)
      supabase.from("bookings").select("*").eq("venue_id", data.id).order("booking_date", { ascending: false }).limit(20).then(({ data: b }: any) => setBookings(b || []))
    })
  }, [slug])

  return (
    <div style={{ padding: 16 }}>
      <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
        <div style={{ flex: 1, background: C.surface, borderRadius: 14, padding: 14, border: `1px solid ${C.border}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}><div style={{ width: 28, height: 28, borderRadius: 8, background: C.primary + "18", display: "flex", alignItems: "center", justifyContent: "center" }}><Calendar size={14} color={C.primaryLight} /></div><span style={{ fontSize: 11, color: C.textMuted }}>Booking hari ini</span></div>
          <div style={{ fontSize: 20, fontWeight: 700, color: C.text }}>{bookings.filter(b => b.booking_date === new Date().toISOString().split("T")[0]).length}</div>
        </div>
        <div style={{ flex: 1, background: C.surface, borderRadius: 14, padding: 14, border: `1px solid ${C.border}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}><div style={{ width: 28, height: 28, borderRadius: 8, background: "#FFB30018", display: "flex", alignItems: "center", justifyContent: "center" }}><Clock size={14} color="#FFB300" /></div><span style={{ fontSize: 11, color: C.textMuted }}>Pending</span></div>
          <div style={{ fontSize: 20, fontWeight: 700, color: C.text }}>{bookings.filter(b => b.status === "pending").length}</div>
        </div>
      </div>
      <div style={{ fontSize: 14, fontWeight: 600, color: C.text, marginBottom: 10 }}>Booking terbaru</div>
      {bookings.length === 0 ? (
        <div style={{ textAlign: "center", padding: 40, color: C.textMuted }}>Belum ada booking</div>
      ) : bookings.map((b: any) => (
        <div key={b.id} style={{ background: C.surface, borderRadius: 14, padding: 12, border: `1px solid ${C.border}`, marginBottom: 8 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: 6 }}>
            <div><div style={{ fontSize: 13, fontWeight: 500, color: C.text }}>{b.booking_date}</div><div style={{ fontSize: 11, color: C.textMuted }}>{b.start_time} - {b.end_time} ({b.total_hours} jam)</div></div>
            <StatusBadge status={b.status} />
          </div>
          <div style={{ fontSize: 12, color: C.textMuted }}>Rp {b.final_price?.toLocaleString?.("id-ID") || "0"}</div>
        </div>
      ))}
    </div>
  )
}
