"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { TopBar } from "@/components/shared/TopBar"
import { C } from "@/lib/design"
import { notifyBookingCancelled } from "@/lib/notification/triggers"
import { XCircle, RotateCw } from "lucide-react"

export default function MyBookingsPage() {
  const [bookings, setBookings] = useState<any[]>([])
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) { router.push("/login"); return }
      setUser(data.user)
      loadBookings(data.user.id)
    })
  }, [])

  async function loadBookings(uid: string) {
    setLoading(true)
    const { data } = await supabase.from("bookings")
      .select("*, courts(name), venues(name, slug)")
      .eq("user_id", uid)
      .order("booking_date", { ascending: false })
      .order("start_time", { ascending: false })
      .limit(50)
    setBookings(data || [])
    setLoading(false)
  }

  async function cancelBooking(b: any) {
    await supabase.from("bookings").update({ status: "cancelled" }).eq("id", b.id)
    notifyBookingCancelled(user.id, b.courts?.name || "Lapangan")
    loadBookings(user.id)
  }

  function statusColor(s: string) {
    switch (s) {
      case "confirmed": return C.success
      case "pending": return C.warning
      case "cancelled": return C.danger
      case "completed": return C.accent
      default: return C.textMuted
    }
  }

  function statusLabel(s: string) {
    switch (s) {
      case "confirmed": return "Dikonfirmasi"
      case "pending": return "Menunggu Bayar"
      case "cancelled": return "Dibatalkan"
      case "completed": return "Selesai"
      default: return s
    }
  }

  if (loading) return <div><TopBar title="Booking Saya" /><div style={{ textAlign: "center", padding: 60, color: C.textMuted }}>Loading...</div></div>

  return (
    <div>
      <TopBar title="Booking Saya" />
      <div style={{ padding: "0 16px 16px" }}>
        {bookings.length === 0 && (
          <div style={{ textAlign: "center", padding: 60, color: C.textMuted }}>
            <div style={{ fontSize: 40, marginBottom: 8 }}>📅</div>
            <div style={{ fontSize: 14 }}>Belum ada booking</div>
            <button onClick={() => router.push("/booking")} style={{ marginTop: 16, padding: "10px 24px", borderRadius: 10, border: "none", background: C.primary, color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>Booking Sekarang</button>
          </div>
        )}
        {bookings.map((b: any) => (
          <div key={b.id} style={{ background: C.surface, borderRadius: 14, padding: 16, border: `1px solid ${C.border}`, marginBottom: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: 8 }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{b.venues?.name}</div>
                <div style={{ fontSize: 12, color: C.textMuted }}>{b.courts?.name}</div>
              </div>
              <span style={{ padding: "4px 10px", borderRadius: 6, fontSize: 11, fontWeight: 700, background: statusColor(b.status) + "22", color: statusColor(b.status) }}>{statusLabel(b.status)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
              <span style={{ color: C.textMuted }}>{new Date(b.booking_date).toLocaleDateString("id-ID", { weekday: "short", day: "numeric", month: "short" })}</span>
              <span style={{ color: C.textMuted }}>{b.start_time?.substring(0, 5)} - {b.end_time?.substring(0, 5)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, paddingTop: 10, borderTop: `1px solid ${C.border}11` }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: C.accent }}>Rp {Number(b.final_price).toLocaleString("id-ID")}</span>
              <div style={{ display: "flex", gap: 8 }}>
                {b.payment_method !== "doku" ? null : <div />}
                {(b.status === "pending" || b.status === "confirmed") && (
                  <button onClick={() => cancelBooking(b)} style={{ padding: "6px 12px", borderRadius: 8, border: `1px solid ${C.danger}44`, background: "transparent", color: C.danger, fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}><XCircle size={12} />Batal</button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
