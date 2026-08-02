"use client"

import { useEffect, useState } from "react"
import dynamic from "next/dynamic"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { TopBar } from "@/components/shared/TopBar"
import { C } from "@/lib/design"
import { makeBookingCode } from "@/lib/constants"
import { validatePromo, applyPromo } from "@/lib/booking/promo"
import { joinWaitlist } from "@/lib/booking/waitlist"
import { createRecurringBooking } from "@/lib/booking/recurring"
import { Repeat, Ticket, UserPlus } from "lucide-react"

const FullCalendar = dynamic(() => import("@fullcalendar/react"), { ssr: false })

export default function BookingPage() {
  const [venues, setVenues] = useState<any[]>([])
  const [selectedVenue, setSelectedVenue] = useState<any>(null)
  const [courts, setCourts] = useState<any[]>([])
  const [selectedCourt, setSelectedCourt] = useState<any>(null)
  const [events, setEvents] = useState<any[]>([])
  const [step, setStep] = useState<"select" | "book">("select")
  const [selectedInfo, setSelectedInfo] = useState<any>(null)
  const [price, setPrice] = useState(0)
  const [basePrice, setBasePrice] = useState(0)
  const [bookingCode, setBookingCode] = useState("")
  const [msg, setMsg] = useState("")
  const [plugins, setPlugins] = useState<any[]>([])
  const [isRecurring, setIsRecurring] = useState(false)
  const [promoCode, setPromoCode] = useState("")
  const [promoDiscount, setPromoDiscount] = useState(0)
  const [promoError, setPromoError] = useState("")
  const [isFull, setIsFull] = useState(false)
  const [isMember, setIsMember] = useState(false)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user && selectedVenue) {
        supabase.from("members").select("id").eq("user_id", user.id).eq("venue_id", selectedVenue.id).eq("status", "active").single().then(({ data }: any) => setIsMember(!!data))
      }
    })
  }, [selectedVenue])

  useEffect(() => {
    Promise.all([
      import("@fullcalendar/timegrid"),
      import("@fullcalendar/interaction"),
      import("@fullcalendar/daygrid"),
    ]).then(([t, i, d]) => setPlugins([t.default, i.default, d.default]))
  }, [])

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
      if (c?.length) { setSelectedCourt(c[0]); loadBookings(selectedVenue.id, c) }
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
    setIsFull(evts.length > 3) // Simplified — in production check against total slot capacity
  }

  function handleSelect(info: any) {
    const start = info.start; const end = info.end
    const totalHours = (end.getTime() - start.getTime()) / 3600000
    if (selectedCourt) {
      const day = start.getDay()
      const dayType = (day === 0 || day === 6) ? "weekend" : "weekday"
      supabase.from("pricing_rules").select("base_price, member_discount_pct").eq("court_id", selectedCourt.id).eq("is_active", true).eq("day_type", dayType).order("priority", { ascending: false }).limit(1).then(({ data: p }: any) => {
        const rate = p?.[0]?.base_price || 100000
        const discPct = p?.[0]?.member_discount_pct || 0
        const rawPrice = rate * totalHours
        const memberDisc = isMember ? rawPrice * (discPct / 100) : 0
        setBasePrice(rawPrice)
        setPrice(rawPrice - memberDisc)
        setPromoDiscount(0)
        setSelectedInfo({ start: start.toTimeString().slice(0, 5), end: end.toTimeString().slice(0, 5), date: start.toISOString().split("T")[0], hours: totalHours })
        setStep("book")
      })
    }
  }

  async function handleApplyPromo() {
    if (!selectedVenue || !promoCode || !selectedInfo) return
    const result = await validatePromo(selectedVenue.id, promoCode, selectedInfo.hours)
    if (!result.valid) { setPromoError(result.error || "Invalid promo"); return }
    const applied = applyPromo(basePrice, result.promo!)
    setPromoDiscount(applied.discount)
    setPrice(applied.finalPrice)
    setPromoError("")
  }

  async function handleWaitlist() {
    if (!selectedCourt || !selectedInfo) return
    await joinWaitlist({ courtId: selectedCourt.id, bookingDate: selectedInfo.date, startTime: selectedInfo.start, endTime: selectedInfo.end })
    setMsg("Anda masuk antrian. Akan dinotifikasi jika ada slot kosong.")
    setTimeout(() => { setStep("select"); setMsg("") }, 3000)
  }

  async function handleConfirm() {
    if (!selectedVenue || !selectedCourt || !selectedInfo) return
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push("/login"); return }

    const { data: slots } = await supabase.from("court_slots").select("id").eq("court_id", selectedCourt.id).limit(1)
    const slot = slots?.[0]
    if (!slot) return

    if (isRecurring) {
      await createRecurringBooking({ venue_id: selectedVenue.id, court_slot_id: slot.id, day_of_week: new Date(selectedInfo.date).getDay(), start_time: selectedInfo.start, end_time: selectedInfo.end, frequency: "weekly", max_occurrences: 4, base_price: basePrice, final_price: price, total_hours: selectedInfo.hours })
      setMsg("Booking berulang dibuat (4x)!")
      setTimeout(() => { setStep("select"); setMsg("") }, 3000)
      return
    }

    const { data: seq } = await supabase.rpc("next_counter", { p_venue_id: selectedVenue.id, p_kind: "booking" })
    const code = makeBookingCode(seq || 1)

    await supabase.from("bookings").insert({
      venue_id: selectedVenue.id, court_slot_id: slot.id, user_id: user.id,
      booking_date: selectedInfo.date, start_time: selectedInfo.start, end_time: selectedInfo.end,
      total_hours: selectedInfo.hours, base_price: basePrice, discount_amount: promoDiscount, final_price: price, status: "pending",
    }).select().single().then(async ({ data: newBooking }: any) => {
      if (newBooking) {
        // Call DOKU payment
        try {
          const res = await fetch("/api/payment/create", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              bookingId: newBooking.id, amount: price,
              userName: user.user_metadata?.name || "User", userEmail: user.email,
            }),
          })
          const doku = await res.json()
          if (doku.payment_url) window.open(doku.payment_url, "_blank")
        } catch {}

        setBookingCode(code)
        setMsg(`Booking dibuat! Kode: ${code}. Lanjutkan pembayaran di tab baru.`)
        setTimeout(() => { setStep("select"); setMsg("") }, 5000)
      }
    })
  }

  return (
    <div>
      <TopBar title="Booking lapangan" />
      <div style={{ padding: "0 8px 8px" }}>
        <div style={{ display: "flex", gap: 4, overflowX: "auto", padding: "8px 4px" }}>
          {venues.map((v: any) => (
            <button key={v.id} onClick={() => setSelectedVenue(v)} style={{ padding: "6px 12px", borderRadius: 20, border: selectedVenue?.id === v.id ? "none" : `1px solid ${C.border}`, background: selectedVenue?.id === v.id ? C.primary : C.surface, color: selectedVenue?.id === v.id ? "#fff" : C.textSec, fontSize: 12, whiteSpace: "nowrap", cursor: "pointer" }}>{v.name}</button>
          ))}
        </div>

        {/* Court selector */}
        <div style={{ display: "flex", gap: 4, overflowX: "auto", padding: "0 4px 8px" }}>
          {courts.map((c: any) => (
            <button key={c.id} onClick={() => setSelectedCourt(c)} style={{ padding: "5px 10px", borderRadius: 14, border: selectedCourt?.id === c.id ? "none" : `1px solid ${C.border}`, background: selectedCourt?.id === c.id ? C.primary + "22" : "transparent", color: selectedCourt?.id === c.id ? C.primaryLight : C.textMuted, fontSize: 11, whiteSpace: "nowrap", cursor: "pointer" }}>{c.name}{c.is_splittable ? ` (split ${c.split_count})` : ""}</button>
          ))}
        </div>

        {msg && <div style={{ background: C.successBg, color: "#4CAF50", padding: 10, borderRadius: 10, fontSize: 13, textAlign: "center", margin: "8px 4px" }}>{msg}</div>}

        {step === "select" && (
          <>
            <div style={{ background: C.surface, borderRadius: 14, border: `1px solid ${C.border}` }}>
              <FullCalendar
                plugins={plugins as any}
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
            {isFull && (
              <button onClick={handleWaitlist} style={{ width: "100%", padding: 12, borderRadius: 10, border: `1px solid ${C.border}`, background: "transparent", color: C.text, fontSize: 14, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 12 }}>
                <UserPlus size={16} />Gabung antrian (waitlist)
              </button>
            )}
          </>
        )}

        {step === "book" && selectedInfo && (
          <div style={{ padding: "8px 8px" }}>
            <div style={{ background: C.surface, borderRadius: 14, padding: 16, border: `1px solid ${C.border}`, marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}><span style={{ color: C.textMuted }}>Venue</span><span style={{ color: C.text }}>{selectedVenue?.name} · {selectedCourt?.name}</span></div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}><span style={{ color: C.textMuted }}>Tanggal</span><span style={{ color: C.text }}>{selectedInfo.date}</span></div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}><span style={{ color: C.textMuted }}>Jam</span><span style={{ color: C.text }}>{selectedInfo.start} - {selectedInfo.end} ({selectedInfo.hours}j)</span></div>
              {promoDiscount > 0 && <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}><span style={{ color: "#4CAF50" }}>Diskon promo</span><span style={{ color: "#4CAF50" }}>-Rp {promoDiscount.toLocaleString("id-ID")}</span></div>}
              {selectedCourt?.is_splittable && <div style={{ fontSize: 11, color: C.accent, marginBottom: 4 }}>Split court: {selectedCourt.split_count} slot per lapangan</div>}
              <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 8, borderTop: `1px solid ${C.border}` }}><span style={{ fontWeight: 600, color: C.text }}>Total</span><span style={{ fontSize: 18, fontWeight: 700, color: C.accent }}>Rp {price.toLocaleString("id-ID")}</span></div>
            </div>

            {/* Promo code */}
            <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
              <input placeholder="Kode promo" value={promoCode} onChange={e => setPromoCode(e.target.value.toUpperCase())} style={{ flex: 1, padding: "10px 12px", background: C.elevated, border: `1px solid ${C.border}`, borderRadius: 10, color: C.text, fontSize: 14, outline: "none", boxSizing: "border-box" }} />
              <button onClick={handleApplyPromo} style={{ padding: "10px 14px", borderRadius: 10, border: `1px solid ${C.border}`, background: "transparent", color: C.text, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}><Ticket size={14} />Pakai</button>
            </div>
            {promoError && <div style={{ fontSize: 12, color: C.danger, marginBottom: 8 }}>{promoError}</div>}

            {/* Recurring toggle */}
            <button onClick={() => setIsRecurring(!isRecurring)} style={{ width: "100%", padding: "10px", borderRadius: 10, border: isRecurring ? "none" : `1px solid ${C.border}`, background: isRecurring ? C.primary + "22" : "transparent", color: isRecurring ? C.primaryLight : C.text, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginBottom: 12 }}>
              <Repeat size={14} />{isRecurring ? "Booking berulang (4x mingguan)" : "Booking sekali"}
            </button>

            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => setStep("select")} style={{ flex: 1, padding: 14, borderRadius: 10, border: `1px solid ${C.border}`, background: "transparent", color: C.text, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>Kembali</button>
              <button onClick={handleConfirm} style={{ flex: 1, padding: 14, borderRadius: 10, border: "none", background: C.primary, color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>Konfirmasi</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
