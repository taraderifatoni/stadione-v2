"use client"

import { useEffect, useState } from "react"
import { useVenue } from "../layout"
import { C } from "@/lib/design"
import { createClient } from "@/lib/supabase/client"
import { Calendar, DollarSign } from "lucide-react"

export default function WorkspaceReports() {
  const ctx = useVenue()
  const supabase = createClient()
  const [bookings, setBookings] = useState<any[]>([])
  const [shifts, setShifts] = useState<any[]>([])

  useEffect(() => {
    if (!ctx) return
    const vid = ctx.venue.id
    Promise.all([
      supabase.from("bookings").select("*, courts(name)").eq("venue_id", vid).order("booking_date", { ascending: false }).limit(30),
      supabase.from("shifts").select("*").eq("venue_id", vid).order("created_at", { ascending: false }).limit(10),
    ]).then(([b, s]) => {
      setBookings(b.data || [])
      setShifts(s.data || [])
    })
  }, [ctx])

  const totalBooking = bookings.reduce((s, b) => s + Number(b.final_price || 0), 0)
  const confirmedBookings = bookings.filter(b => b.status === "confirmed").length

  return (
    <div style={{ padding: 16 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
        <div style={{ background: C.surface, borderRadius: 14, padding: 14, border: `1px solid ${C.border}` }}>
          <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 4 }}>Total Booking</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: C.text }}>{bookings.length}</div>
        </div>
        <div style={{ background: C.surface, borderRadius: 14, padding: 14, border: `1px solid ${C.border}` }}>
          <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 4 }}>Revenue Booking</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: C.accent }}>Rp {totalBooking.toLocaleString("id-ID")}</div>
        </div>
      </div>

      <div style={{ fontSize: 14, fontWeight: 600, color: C.text, marginBottom: 10 }}>Booking Terbaru</div>
      {bookings.length === 0 ? <div style={{ fontSize: 12, color: C.textMuted, padding: 20, textAlign: "center" }}>Belum ada booking</div> :
        bookings.slice(0, 10).map((b: any) => (
          <div key={b.id} style={{ background: C.surface, borderRadius: 14, padding: 12, border: `1px solid ${C.border}`, marginBottom: 8, display: "flex", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 500, color: C.text }}>{b.courts?.name || "Lapangan"}</div>
              <div style={{ fontSize: 11, color: C.textMuted }}>{b.booking_date} · {b.start_time?.substring(0,5)}-{b.end_time?.substring(0,5)}</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: C.accent }}>Rp {Number(b.final_price || 0).toLocaleString("id-ID")}</div>
              <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 8px", borderRadius: 6, background: b.status === "confirmed" ? "#1B3A1D" : "#3A1515", color: b.status === "confirmed" ? "#4CAF50" : "#C62828" }}>{b.status}</span>
            </div>
          </div>
        ))}
    </div>
  )
}
