"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { TopBar } from "@/components/shared/TopBar"
import { C } from "@/lib/design"
import { makeBookingCode } from "@/lib/constants"
import FullCalendar from "@fullcalendar/react"
import timeGridPlugin from "@fullcalendar/timegrid"
import interactionPlugin from "@fullcalendar/interaction"
import dayGridPlugin from "@fullcalendar/daygrid"

const SPORT_LABEL: Record<string, string> = { futsal: "Futsal", basketball: "Basket", badminton: "Badminton", tennis: "Tenis", volleyball: "Voli", pingpong: "Pingpong", squash: "Squash", pickleball: "Pickleball" }

export default function BookingPage() {
  const [venues, setVenues] = useState<any[]>([])
  const [selectedVenue, setSelectedVenue] = useState<any>(null)
  const [courts, setCourts] = useState<any[]>([])
  const [events, setEvents] = useState<any[]>([])
  const [step, setStep] = useState<"select" | "book">("select")
  const [selectedInfo, setSelectedInfo] = useState<any>(null)
  const [price, setPrice] = useState(0)
  const [bookingCode, setBookingCode] = useState("")
  const [msg, setMsg] = useState("")
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    supabase.from("venues").select("*").eq("status", "active").limit(20).then(({ data }: any) => {
      setVenues(data || [])
      if (data?.length) setSelectedVenue(data[0])
    })
  }, [])

  useEffect(() => {
    if (!selectedVenue) return
    supabase.from("courts").select("*").eq("venue_id", selectedVenue.id).eq("is_active", true).then(({ data: c }: any) => {
      setCourts(c || [])
      loadBookings(selectedVenue.id, c || [])
    })
  }, [selectedVenue])

  async function loadBookings(venueId: string, courtList: any[]) {
    const evts: any[] = []
    for (const court of courtList) {
      const { data: slots } = await supabase.from("court_slots").select("id").eq("court_id", court.id)
      if (slots?.length) {
        const slotIds = slots.map((s: any) => s.id)
        const today = new Date().toISOString().split("T")[0]
        const end = new Date(Date.now() + 14 * 86400000).toISOString().split("T")[0]
        const { data: bookings } = await supabase.from("bookings").select("*").in("court_slot_id", slotIds).gte("booking_date", today).lte("booking_date", end).in("status", ["confirmed", "paid"])
        bookings?.forEach((b: any) => evts.push({ title: court.name, start: `${b.booking_date}T${b.start_time}`, end: `${b.booking_date}T${b.end_time}`, backgroundColor: "#84102D", borderColor: "#A51A3A" }))
      }
    }
    setEvents(evts)
  }

  function handleSelect(info: any) {
    const start = info.start; const end = info.end
    const totalHours = (end.getTime() - start.getTime()) / 3600000

    // Find pricing
    if (courts.length > 0) {
      supabase.from("pricing_rules").select("base_price").eq("court_id", courts[0].id).eq("is_active", true).limit(1).then(({ data: p }: any) => {
        const rate = p?.[0]?.base_price || 100000
        setPrice(rate * totalHours)
        setSelectedInfo({ start: start.toTimeString().slice(0, 5), end: end.toTimeString().slice(0, 5), date: start.toISOString().split("T")[0], hours: totalHours })
        setStep("book")
      })
    }
  }

  async function handleConfirm() {
    if (!selectedVenue || !courts[0] || !selectedInfo) return
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push("/login"); return }

    const { data: slots } = await supabase.from("court_slots").select("id").eq("court_id", courts[0].id).limit(1)
    const slot = slots?.[0]
    if (!slot) return

    const { data: seq } = await supabase.rpc("next_counter", { p_venue_id: selectedVenue.id, p_kind: "booking" })
    const code = makeBookingCode(seq || 1)

    const { data: booking } = await supabase.from("bookings").insert({
      venue_id: selectedVenue.id, court_slot_id: slot.id, user_id: user.id,
      booking_date: selectedInfo.date, start_time: selectedInfo.start, end_time: selectedInfo.end,
      total_hours: selectedInfo.hours, base_price: price, final_price: price, status: "confirmed",
    }).select().single()

    if (booking) {
      setBookingCode(code)
      setMsg(`Booking berhasil! Kode: ${code}`)
      setTimeout(() => { setStep("select"); setMsg("") }, 5000)
    }
  }

  return (
    <div>
      <TopBar title="Booking lapangan" />
      <div style={{ padding: "0 8px 8px" }}>
        {/* Venue selector */}
        <div style={{ display: "flex", gap: 4, overflowX: "auto", padding: "8px 4px" }}>
          {venues.map((v: any) => (
            <button key={v.id} onClick={() => setSelectedVenue(v)} style={{ padding: "6px 12px", borderRadius: 20, border: selectedVenue?.id === v.id ? "none" : `1px solid ${C.border}`, background: selectedVenue?.id === v.id ? C.primary : C.surface, color: selectedVenue?.id === v.id ? "#fff" : C.textSec, fontSize: 12, whiteSpace: "nowrap", cursor: "pointer" }}>{v.name}</button>
          ))}
        </div>

        {msg && <div style={{ background: C.successBg, color: "#4CAF50", padding: 10, borderRadius: 10, fontSize: 13, textAlign: "center", margin: "8px 4px" }}>{msg}</div>}

        {step === "select" && (
          <div style={{ background: C.surface, borderRadius: 14, border: `1px solid ${C.border}` }}>
            <FullCalendar
              plugins={[timeGridPlugin as any, interactionPlugin as any, dayGridPlugin as any]}
              initialView="timeGridWeek"
              headerToolbar={{ left: "prev,next today", center: "title", right: "timeGridWeek,timeGridDay" }}
              height="auto"
              slotMinTime="08:00:00"
              slotMaxTime="23:00:00"
              slotDuration="01:00:00"
              allDaySlot={false}
              selectable={true}
              selectMirror={true}
              select={handleSelect}
              events={events}
              locale="id"
              selectOverlap={false}
            />
          </div>
        )}

        {step === "book" && selectedInfo && (
          <div style={{ padding: 16 }}>
            <div style={{ background: C.surface, borderRadius: 14, padding: 16, border: `1px solid ${C.border}`, marginBottom: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}><span style={{ color: C.textMuted }}>Venue</span><span style={{ color: C.text }}>{selectedVenue?.name}</span></div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}><span style={{ color: C.textMuted }}>Tanggal</span><span style={{ color: C.text }}>{selectedInfo.date}</span></div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}><span style={{ color: C.textMuted }}>Jam</span><span style={{ color: C.text }}>{selectedInfo.start} - {selectedInfo.end} ({selectedInfo.hours}j)</span></div>
              <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 8, borderTop: `1px solid ${C.border}` }}><span style={{ fontWeight: 600, color: C.text }}>Total</span><span style={{ fontSize: 18, fontWeight: 700, color: C.accent }}>Rp {price.toLocaleString("id-ID")}</span></div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => setStep("select")} style={{ flex: 1, padding: 14, borderRadius: 10, border: `1px solid ${C.border}`, background: "transparent", color: C.text, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>Kembali</button>
              <button onClick={handleConfirm} style={{ flex: 1, padding: 14, borderRadius: 10, border: "none", background: C.primary, color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>Konfirmasi Booking</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
