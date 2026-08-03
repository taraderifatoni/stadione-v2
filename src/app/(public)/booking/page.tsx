"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { TopBar } from "@/components/shared/TopBar"
import { C } from "@/lib/design"
import { makeBookingCode } from "@/lib/constants"
import { validatePromo, applyPromo } from "@/lib/booking/promo"
import { Ticket, Repeat } from "lucide-react"

export default function BookingPage() {
  const [venues, setVenues] = useState<any[]>([])
  const [selectedVenue, setSelectedVenue] = useState<any>(null)
  const [courts, setCourts] = useState<any[]>([])
  const [selectedCourt, setSelectedCourt] = useState<any>(null)
  const [slots, setSlots] = useState<any[]>([])
  const [bookedSlotIds, setBookedSlotIds] = useState<Set<string>>(new Set())
  const [selectedSlot, setSelectedSlot] = useState<any>(null)
  const [bookingDate, setBookingDate] = useState(new Date().toISOString().split("T")[0])
  const [step, setStep] = useState<"select" | "book">("select")
  const [price, setPrice] = useState(0)
  const [basePrice, setBasePrice] = useState(0)
  const [hours, setHours] = useState(1)
  const [msg, setMsg] = useState("")
  const [isRecurring, setIsRecurring] = useState(false)
  const [promoCode, setPromoCode] = useState("")
  const [promoDiscount, setPromoDiscount] = useState(0)
  const [promoError, setPromoError] = useState("")
  const [isMember, setIsMember] = useState(false)
  const [user, setUser] = useState<any>(null)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => { if (data.user) setUser(data.user) })
    supabase.from("venues").select("*").eq("status", "active").limit(20).then(({ data }: any) => {
      setVenues(data || [])
      if (data?.length) setSelectedVenue(data[0])
    })
  }, [])

  useEffect(() => {
    if (!selectedVenue) return
    supabase.from("courts").select("*").eq("venue_id", selectedVenue.id).eq("is_active", true).then(({ data: c }: any) => {
      setCourts(c || [])
      if (c?.length) setSelectedCourt(c[0])
    })
    if (user) {
      supabase.from("members").select("id").eq("user_id", user.id).eq("venue_id", selectedVenue.id).eq("status", "active").single().then(({ data }: any) => setIsMember(!!data))
    }
  }, [selectedVenue, user])

  useEffect(() => {
    if (!selectedCourt || !bookingDate) return
    loadSlots()
  }, [selectedCourt, bookingDate])

  async function loadSlots() {
    setSlots([]); setBookedSlotIds(new Set()); setSelectedSlot(null)
    const day = new Date(bookingDate).getDay()
    const dayType = (day === 0 || day === 6) ? "weekend" : "weekday"

    const { data: allSlots } = await supabase.from("court_slots").select("id, start_time, end_time").eq("court_id", selectedCourt.id).order("start_time")
    if (!allSlots) return

    const { data: bookings } = await supabase.from("bookings").select("court_slot_id").eq("booking_date", bookingDate).in("status", ["confirmed", "ongoing", "paid"])
    const booked = new Set((bookings || []).map((b: any) => b.court_slot_id))

    const { data: pricing } = await supabase.from("pricing_rules").select("base_price, member_discount_pct").eq("court_id", selectedCourt.id).eq("is_active", true).eq("day_type", dayType).order("priority", { ascending: false }).limit(1)
    const rate = pricing?.[0]?.base_price ?? null
    const memberDiscPct = pricing?.[0]?.member_discount_pct || 0

    setSlots(allSlots.map((s: any) => ({ ...s, price: rate ? Number(rate) : null, memberDiscPct })))
    setBookedSlotIds(booked)
  }

  function selectSlot(s: any) {
    if (!s || !s.price) return
    const rawPrice = s.price * hours
    const memberDisc = isMember ? rawPrice * (s.memberDiscPct / 100) : 0
    setBasePrice(rawPrice)
    setPrice(rawPrice - memberDisc)
    setPromoDiscount(0)
    setStep("book")
  }

  async function handleApplyPromo() {
    if (!selectedVenue || !promoCode || !selectedSlot) return
    const result = await validatePromo(selectedVenue.id, promoCode, hours)
    if (!result.valid) { setPromoError(result.error || "Invalid promo"); return }
    const applied = applyPromo(basePrice, result.promo!)
    setPromoDiscount(applied.discount)
    setPrice(applied.finalPrice)
    setPromoError("")
  }

  async function handleConfirm() {
    if (!selectedVenue || !selectedCourt || !selectedSlot) return
    if (!user) { router.push("/login"); return }

    const slot = slots.find((s: any) => s.id === selectedSlot.id)
    if (!slot) return

    // Get booking code
    const { data: seq } = await supabase.rpc("next_counter", { p_venue_id: selectedVenue.id, p_kind: "booking" })
    const code = makeBookingCode(seq || 1)

    const { data: booking, error: be } = await supabase.from("bookings").insert({
      venue_id: selectedVenue.id, court_slot_id: slot.id, user_id: user.id,
      booking_date: bookingDate, start_time: slot.start_time, end_time: slot.end_time,
      total_hours: hours, base_price: basePrice, discount_amount: promoDiscount, final_price: price, status: "pending",
    }).select().single()

    if (be || !booking) { setMsg("Gagal membuat booking"); return }

    // DOKU payment
    try {
      const res = await fetch("/api/payment/create", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId: booking.id, amount: price, itemName: `${selectedCourt?.name} - ${formatTime(slot.start_time)}`, userName: user.user_metadata?.name || user.email, userEmail: user.email }),
      })
      const doku = await res.json()
      if (doku.payment_url) window.open(doku.payment_url, "_blank")
      setMsg(`Booking dibuat! Kode: ${code}. Lanjutkan pembayaran di tab baru.`)
    } catch {
      setMsg(`Booking dibuat! Kode: ${code}.`)
    }

    setTimeout(() => { setStep("select"); setMsg(""); loadSlots() }, 5000)
  }

  const formatTime = (t: string) => t?.substring(0, 5) || ""

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

        {/* Court selector */}
        <div style={{ display: "flex", gap: 4, overflowX: "auto", padding: "0 4px 8px" }}>
          {courts.map((c: any) => (
            <button key={c.id} onClick={() => setSelectedCourt(c)} style={{ padding: "5px 10px", borderRadius: 14, border: selectedCourt?.id === c.id ? "none" : `1px solid ${C.border}`, background: selectedCourt?.id === c.id ? C.primary + "22" : "transparent", color: selectedCourt?.id === c.id ? C.primaryLight : C.textMuted, fontSize: 11, whiteSpace: "nowrap", cursor: "pointer" }}>{c.name}</button>
          ))}
        </div>

        {/* Date selector */}
        <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 12, padding: "0 4px" }}>
          <input type="date" value={bookingDate} onChange={e => setBookingDate(e.target.value)} style={{ flex: 1, padding: "8px 12px", background: C.elevated, border: `1px solid ${C.border}`, borderRadius: 10, color: C.text, fontSize: 13, outline: "none" }} />
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <span style={{ color: C.textMuted, fontSize: 12 }}>Jam:</span>
            <select value={hours} onChange={e => setHours(Number(e.target.value))} style={{ padding: "6px 8px", background: C.elevated, border: `1px solid ${C.border}`, borderRadius: 8, color: C.text, fontSize: 12, outline: "none" }}>
              {[1,2,3,4,5,6].map(h => <option key={h} value={h}>{h}j</option>)}
            </select>
          </div>
        </div>

        {msg && <div style={{ background: C.successBg, color: "#4CAF50", padding: 10, borderRadius: 10, fontSize: 13, textAlign: "center", margin: "8px 4px" }}>{msg}</div>}

        {/* Slot Grid */}
        {step === "select" && selectedCourt && (
          <div style={{ background: C.surface, borderRadius: 14, border: `1px solid ${C.border}`, padding: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10, color: C.text }}>Pilih Slot</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(90px, 1fr))", gap: 8 }}>
              {slots.map((s: any) => {
                const isBooked = bookedSlotIds.has(s.id)
                const priceDisplay = s.price ? s.price * hours : null
                if (isBooked) return <div key={s.id} style={{ padding: "10px 6px", borderRadius: 8, border: "1px solid #C6282844", background: "#C6282811", color: "#C62828", fontSize: 11, textAlign: "center", textDecoration: "line-through", cursor: "not-allowed" }}>{formatTime(s.start_time)}<br/>{formatTime(s.end_time)}</div>
                return (
                  <button key={s.id} onClick={() => { setSelectedSlot(s); selectSlot(s) }} style={{ padding: "10px 6px", borderRadius: 8, border: selectedSlot?.id === s.id ? `2px solid ${C.primary}` : `1px solid ${C.border}`, background: selectedSlot?.id === s.id ? C.primary + "22" : C.elevated, color: selectedSlot?.id === s.id ? C.text : C.textMuted, fontSize: 11, cursor: "pointer", textAlign: "center" }}>
                    <div>{formatTime(s.start_time)}</div>
                    <div style={{ marginTop: 2 }}>{formatTime(s.end_time)}</div>
                    {priceDisplay && <div style={{ fontSize: 9, marginTop: 2, color: C.accent }}>Rp {priceDisplay.toLocaleString("id-ID")}</div>}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Booking Confirmation */}
        {step === "book" && selectedSlot && (
          <div style={{ padding: "8px 4px" }}>
            <div style={{ background: C.surface, borderRadius: 14, padding: 16, border: `1px solid ${C.border}`, marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}><span style={{ color: C.textMuted }}>Venue</span><span style={{ color: C.text }}>{selectedVenue?.name} · {selectedCourt?.name}</span></div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}><span style={{ color: C.textMuted }}>Tanggal</span><span style={{ color: C.text }}>{bookingDate}</span></div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}><span style={{ color: C.textMuted }}>Jam</span><span style={{ color: C.text }}>{formatTime(selectedSlot.start_time)} - {formatTime(selectedSlot.end_time)} ({hours}j)</span></div>
              {isMember && <div style={{ fontSize: 11, color: C.success, marginBottom: 4 }}>Diskon member: {selectedSlot.memberDiscPct}%</div>}
              {promoDiscount > 0 && <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}><span style={{ color: "#4CAF50" }}>Diskon promo</span><span style={{ color: "#4CAF50" }}>-Rp {promoDiscount.toLocaleString("id-ID")}</span></div>}
              <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 8, borderTop: `1px solid ${C.border}` }}><span style={{ fontWeight: 600, color: C.text }}>Total</span><span style={{ fontSize: 18, fontWeight: 700, color: C.accent }}>Rp {price.toLocaleString("id-ID")}</span></div>
            </div>

            {/* Promo */}
            <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
              <input placeholder="Kode promo" value={promoCode} onChange={e => setPromoCode(e.target.value.toUpperCase())} style={{ flex: 1, padding: "10px 12px", background: C.elevated, border: `1px solid ${C.border}`, borderRadius: 10, color: C.text, fontSize: 14, outline: "none", boxSizing: "border-box" }} />
              <button onClick={handleApplyPromo} style={{ padding: "10px 14px", borderRadius: 10, border: `1px solid ${C.border}`, background: "transparent", color: C.text, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}><Ticket size={14} />Pakai</button>
            </div>
            {promoError && <div style={{ fontSize: 12, color: C.danger, marginBottom: 8 }}>{promoError}</div>}

            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => setStep("select")} style={{ flex: 1, padding: 14, borderRadius: 10, border: `1px solid ${C.border}`, background: "transparent", color: C.text, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>Kembali</button>
              <button onClick={handleConfirm} style={{ flex: 1, padding: 14, borderRadius: 10, border: "none", background: C.primary, color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>Konfirmasi</button>
            </div>
          </div>
        )}

        {!selectedCourt && <div style={{ textAlign: "center", padding: 40, color: C.textMuted }}>Pilih venue dan lapangan</div>}
      </div>
    </div>
  )
}
