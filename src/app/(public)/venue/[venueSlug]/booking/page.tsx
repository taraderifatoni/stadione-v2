"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { C } from "@/lib/design"
import { TopBar } from "@/components/shared/TopBar"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { makeBookingCode } from "@/lib/constants"

const SPORT_LABEL: Record<string, string> = {
  futsal: "Futsal", basketball: "Basket", badminton: "Badminton",
  tennis: "Tenis", volleyball: "Voli", pingpong: "Pingpong", squash: "Squash", pickleball: "Pickleball",
}

export default function VenueBookingPage() {
  const { venueSlug } = useParams<{ venueSlug: string }>()
  const [courts, setCourts] = useState<any[]>([])
  const [venue, setVenue] = useState<any>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    supabase.from("venues").select("id").eq("slug", venueSlug).single().then(({ data: v }: any) => {
      if (!v) return; setVenue(v)
      supabase.from("courts").select("*").eq("venue_id", v.id).eq("is_active", true).then(({ data: c }: any) => setCourts(c || []))
    })
  }, [venueSlug])

  async function handleBooking(court: any) {
    if (!venue) return

    // Get pricing for this court
    const { data: pricing } = await supabase.from("pricing_rules").select("*").eq("court_id", court.id).eq("is_active", true).order("priority", { ascending: false }).limit(1)
    const price = pricing?.[0]?.base_price || 100000

    // Create booking
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push("/login"); return }

    const slots = await supabase.from("court_slots").select("*").eq("court_id", court.id).limit(1)
    const slot = slots.data?.[0]

    if (slot) {
      // Get counter for booking code
      const { data: seq } = await supabase.rpc("next_counter", { p_venue_id: venue.id, p_kind: "booking" })
      const code = makeBookingCode(seq || 1)

      const now = new Date()
      const startH = now.getHours()
      const startTime = `${String(startH).padStart(2, "0")}:00`
      const endTime = `${String(startH + 1).padStart(2, "0")}:00`

      const { data: booking } = await supabase.from("bookings").insert({
        venue_id: venue.id,
        court_slot_id: slot.id,
        user_id: user.id,
        booking_date: now.toISOString().split("T")[0],
        start_time: startTime,
        end_time: endTime,
        total_hours: 1,
        base_price: price,
        final_price: price,
        status: "confirmed",
      }).select().single()

      if (booking) {
        router.push("/my-bookings")
        return
      }
    }
    router.push("/booking")
  }

  return (
    <div>
      <TopBar title="Booking lapangan" left={<ChevronLeft size={20} color={C.text} onClick={() => router.push(`/venue/${venueSlug}`)} style={{ cursor: "pointer" }} />} />
      <div style={{ padding: "0 16px 16px" }}>
        <div style={{ fontSize: 13, color: C.textMuted, marginBottom: 12 }}>Pilih lapangan</div>
        {courts.length === 0 ? (
          <div style={{ textAlign: "center", padding: 40, color: C.textMuted }}>Belum ada lapangan tersedia</div>
        ) : courts.map((c) => (
          <div key={c.id} onClick={() => handleBooking(c)} style={{ background: C.surface, borderRadius: 14, padding: 16, border: `1px solid ${C.border}`, marginBottom: 10, cursor: "pointer" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{c.name}</div>
                <div style={{ fontSize: 12, color: C.textMuted, marginTop: 2 }}>{SPORT_LABEL[c.court_type] || c.court_type}{c.is_splittable ? ` · Split ${c.split_count}` : ""}</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: C.accent, marginTop: 6 }}>Rp {Math.floor(c.base_price || 100000).toLocaleString("id-ID")}<span style={{ fontWeight: 400, color: C.textMuted }}>/jam</span></div>
              </div>
              <ChevronRight size={18} color={C.textMuted} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
