"use client"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { TopBar } from "@/components/shared/TopBar"
import { C } from "@/lib/design"
import { ChevronLeft, Calendar } from "lucide-react"
import { useRouter } from "next/navigation"

export default function AdminBookings() {
  const [bookings, setBookings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    supabase.from("bookings").select("*, courts(name), venues(name, slug)")
      .order("booking_date", { ascending: false }).limit(50)
      .then(({ data }: any) => { setBookings(data || []); setLoading(false) })
  }, [])

  const total = bookings.reduce((s, b) => s + Number(b.final_price || 0), 0)

  return (
    <div>
      <TopBar title="Semua Booking" sub="Platform Admin" left={<ChevronLeft size={20} color={C.text} onClick={() => router.back()} style={{ cursor: "pointer" }} />} />
      <div style={{ padding: "0 16px 16px" }}>
        <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
          <div style={{ flex: 1, background: C.surface, borderRadius: 14, padding: 12, border: `1px solid ${C.border}` }}>
            <div style={{ fontSize: 11, color: C.textMuted }}>Total Booking</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: C.text }}>{bookings.length}</div>
          </div>
          <div style={{ flex: 1, background: C.surface, borderRadius: 14, padding: 12, border: `1px solid ${C.border}` }}>
            <div style={{ fontSize: 11, color: C.textMuted }}>Revenue</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: C.accent }}>Rp {total.toLocaleString("id-ID")}</div>
          </div>
        </div>
        {bookings.map((b: any) => (
          <div key={b.id} style={{ background: C.surface, borderRadius: 14, padding: 12, border: `1px solid ${C.border}`, marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 500, color: C.text }}>{b.venues?.name} · {b.courts?.name || "Lapangan"}</div>
              <div style={{ fontSize: 11, color: C.textMuted }}>{b.booking_date} · {b.start_time?.substring(0,5)}-{b.end_time?.substring(0,5)}</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: C.accent }}>Rp {Number(b.final_price || 0).toLocaleString("id-ID")}</div>
              <span style={{ fontSize: 10, fontWeight: 600, padding: "3px 8px", borderRadius: 5, background: b.status === "confirmed" ? "#1B3A1D" : b.status === "cancelled" ? "#3A1515" : "#2A2000", color: b.status === "confirmed" ? "#4CAF50" : b.status === "cancelled" ? "#C62828" : "#E65100" }}>{b.status}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
