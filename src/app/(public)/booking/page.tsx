"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { TopBar } from "@/components/shared/TopBar"
import { C } from "@/lib/design"
import { makeBookingCode } from "@/lib/constants"
import { notifyBookingConfirmed } from "@/lib/notification/triggers"
import { validatePromo, applyPromo } from "@/lib/booking/promo"
import { Search, Calendar, MapPin, ChevronRight, Ticket, ArrowLeft } from "lucide-react"

export default function BookingPage() {
  const [step, setStep] = useState<"venues" | "courts" | "book">("venues")
  const [venues, setVenues] = useState<any[]>([])
  const [filteredVenues, setFilteredVenues] = useState<any[]>([])
  const [search, setSearch] = useState("")
  const [selectedVenue, setSelectedVenue] = useState<any>(null)
  const [courts, setCourts] = useState<any[]>([])
  const [selectedCourt, setSelectedCourt] = useState<any>(null)
  const [slots, setSlots] = useState<any[]>([])
  const [bookedSlotIds, setBookedSlotIds] = useState<Set<string>>(new Set())
  const [selectedSlot, setSelectedSlot] = useState<any>(null)
  const [bookingDate, setBookingDate] = useState(new Date().toISOString().split("T")[0])
  const [price, setPrice] = useState(0)
  const [hours, setHours] = useState(1)
  const [msg, setMsg] = useState("")
  const [promoCode, setPromoCode] = useState("")
  const [promoDiscount, setPromoDiscount] = useState(0)
  const [promoError, setPromoError] = useState("")
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => { if (data.user) setUser(data.user) })
    supabase.from("venues").select("id, name, slug, city").eq("status", "active").limit(30).then(({ data }: any) => {
      setVenues(data || [])
      setFilteredVenues(data || [])
      setLoading(false)
    })
    const v = new URLSearchParams(window.location.search).get("venue")
    if (v) supabase.from("venues").select("*").eq("slug", v).single().then(({ data }: any) => {
      if (data) { setSelectedVenue(data); loadCourts(data.id); setStep("courts") }
    })
  }, [])

  useEffect(() => {
    const q = search.toLowerCase().trim()
    if (!q) { setFilteredVenues(venues); return }
    setFilteredVenues(venues.filter((v: any) =>
      v.name.toLowerCase().includes(q) || (v.city || "").toLowerCase().includes(q)
    ))
  }, [search, venues])

  function loadCourts(vid: string) {
    supabase.from("courts").select("*").eq("venue_id", vid).eq("is_active", true).then(({ data: c }: any) => {
      setCourts(c || [])
    })
  }

  function selectVenue(v: any) {
    setSelectedVenue(v)
    loadCourts(v.id)
    setStep("courts")
    setSelectedCourt(null)
    setSlots([])
  }

  function selectCourt(c: any) {
    setSelectedCourt(c)
    loadSlots(c.id)
    setStep("book")
  }

  async function loadSlots(courtId: string) {
    setSlots([]); setBookedSlotIds(new Set()); setSelectedSlot(null)
    const day = new Date(bookingDate).getDay()
    const dayType = (day === 0 || day === 6) ? "weekend" : "weekday"

    const { data: allSlots } = await supabase.from("court_slots").select("id, start_time, end_time").eq("court_id", courtId).order("start_time")
    if (!allSlots) return

    const { data: bookings } = await supabase.from("bookings").select("court_slot_id").eq("booking_date", bookingDate).in("status", ["confirmed", "ongoing", "paid"])
    const booked = new Set((bookings || []).map((b: any) => b.court_slot_id))

    const { data: pricing } = await supabase.from("pricing_rules").select("base_price, member_discount_pct").eq("court_id", courtId).eq("is_active", true).eq("day_type", dayType).order("priority", { ascending: false }).limit(1)
    const rate = pricing?.[0]?.base_price ?? null

    setSlots(allSlots.map((s: any) => ({ ...s, price: rate ? Number(rate) : null })))
    setBookedSlotIds(booked)
  }

  function selectSlot(s: any) {
    if (!s || !s.price) return
    setSelectedSlot(s)
    setPrice(s.price * hours)
  }

  async function handleConfirm() {
    if (!selectedVenue || !selectedCourt || !selectedSlot) return
    if (!user) { router.push("/login?redirect=/booking"); return }

    const slot = slots.find((s: any) => s.id === selectedSlot.id)
    if (!slot) return

    const { data: seq } = await supabase.rpc("next_counter", { p_venue_id: selectedVenue.id, p_kind: "booking" })
    const code = makeBookingCode(seq || 1)

    const { data: booking, error: be } = await supabase.from("bookings").insert({
      venue_id: selectedVenue.id, court_slot_id: slot.id, user_id: user.id,
      booking_date: bookingDate, start_time: slot.start_time, end_time: slot.end_time,
      total_hours: hours, base_price: price / hours, discount_amount: promoDiscount, final_price: price, status: "pending",
    }).select().single()

    if (be || !booking) { setMsg("Gagal membuat booking"); return }

    // DOKU payment
    try {
      const res = await fetch("/api/payment/create", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId: booking.id, amount: price, itemName: `${selectedCourt.name} - ${slot.start_time?.substring(0, 5)}`, userName: user.user_metadata?.name || user.email, userEmail: user.email }),
      })
      const doku = await res.json()
      if (doku.payment_url) window.open(doku.payment_url, "_blank")
      setMsg(`Booking dibuat! Kode: ${code}. Lanjutkan pembayaran di tab baru.`)
      notifyBookingConfirmed(user.id, selectedCourt.name, bookingDate, `${slot.start_time?.substring(0, 5)}-${slot.end_time?.substring(0, 5)}`)
    } catch {
      setMsg(`Booking dibuat! Kode: ${code}.`)
    }
  }

  const formatTime = (t: string) => t?.substring(0, 5) || ""

  return (
    <div>
      <TopBar title="Booking" />
      <div style={{ padding: "0 16px 16px" }}>
        {msg && <div style={{ background: C.successBg, color: "#4CAF50", padding: 10, borderRadius: 10, fontSize: 13, textAlign: "center", marginBottom: 12 }}>{msg}</div>}

        {/* === STEP 1: SEARCH VENUES === */}
        {step === "venues" && (
          <>
            <div style={{ position: "relative", marginBottom: 16 }}>
              <Search size={16} color={C.textMuted} style={{ position: "absolute", left: 14, top: 13 }} />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari venue atau kota..." style={{ width: "100%", padding: "12px 14px 12px 40px", background: C.elevated, border: `1px solid ${C.border}`, borderRadius: 12, color: C.text, fontSize: 14, outline: "none", boxSizing: "border-box" }} />
            </div>

            {loading && <div style={{ textAlign: "center", padding: 40, color: C.textMuted }}>Memuat venue...</div>}

            <div style={{ fontSize: 13, fontWeight: 600, color: C.textSec, marginBottom: 10 }}>{filteredVenues.length} venue ditemukan</div>
            {filteredVenues.map((v: any) => (
              <div key={v.id} onClick={() => selectVenue(v)} style={{ background: C.surface, borderRadius: 14, padding: 16, border: `1px solid ${C.border}`, marginBottom: 10, cursor: "pointer", display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 48, height: 48, borderRadius: 12, background: C.primary + "14", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Calendar size={20} color={C.primaryLight} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{v.name}</div>
                  <div style={{ fontSize: 12, color: C.textMuted, display: "flex", alignItems: "center", gap: 4, marginTop: 2 }}>
                    <MapPin size={11} />{v.city || "Indonesia"}
                  </div>
                </div>
                <ChevronRight size={16} color={C.textMuted} />
              </div>
            ))}
          </>
        )}

        {/* === STEP 2: SELECT COURT === */}
        {step === "courts" && selectedVenue && (
          <>
            <button onClick={() => setStep("venues")} style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", color: C.textSec, fontSize: 13, cursor: "pointer", marginBottom: 12, padding: 0 }}>
              <ArrowLeft size={14} />Kembali
            </button>
            <div style={{ background: C.surface, borderRadius: 14, padding: 16, border: `1px solid ${C.border}`, marginBottom: 16 }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: C.text, marginBottom: 4 }}>{selectedVenue.name}</div>
              <div style={{ fontSize: 12, color: C.textMuted, display: "flex", alignItems: "center", gap: 4 }}>
                <MapPin size={11} />{selectedVenue.city || "Indonesia"}
              </div>
            </div>
            <div style={{ fontSize: 13, fontWeight: 600, color: C.textSec, marginBottom: 10 }}>Pilih Lapangan</div>
            {courts.length === 0 && <div style={{ textAlign: "center", padding: 30, color: C.textMuted, fontSize: 13 }}>Tidak ada lapangan tersedia</div>}
            {courts.map((c: any) => (
              <div key={c.id} onClick={() => selectCourt(c)} style={{ background: C.surface, borderRadius: 14, padding: 16, border: `1px solid ${C.border}`, marginBottom: 10, cursor: "pointer" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{c.name}</div>
                    <div style={{ fontSize: 12, color: C.textMuted, marginTop: 2 }}>{c.court_type === "futsal" ? "Futsal" : c.court_type === "basketball" ? "Basket" : c.court_type === "badminton" ? "Badminton" : c.court_type}</div>
                  </div>
                  <ChevronRight size={16} color={C.textMuted} />
                </div>
              </div>
            ))}
          </>
        )}

        {/* === STEP 3: SELECT SLOT + BOOK === */}
        {step === "book" && selectedCourt && selectedVenue && (
          <>
            <button onClick={() => setStep("courts")} style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", color: C.textSec, fontSize: 13, cursor: "pointer", marginBottom: 12, padding: 0 }}>
              <ArrowLeft size={14} />{selectedCourt.name}
            </button>

            <div style={{ background: C.surface, borderRadius: 14, padding: 16, border: `1px solid ${C.border}`, marginBottom: 12 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: C.textSec, marginBottom: 8 }}>Tanggal</div>
              <input type="date" value={bookingDate} onChange={e => { setBookingDate(e.target.value); loadSlots(selectedCourt.id) }} style={{ width: "100%", padding: "10px 12px", background: C.elevated, border: `1px solid ${C.border}`, borderRadius: 10, color: C.text, fontSize: 14, outline: "none", boxSizing: "border-box", marginBottom: 10 }} />
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 12, color: C.textMuted }}>Durasi: {hours} jam</span>
                <input type="range" min={1} max={4} value={hours} onChange={e => { setHours(Number(e.target.value)); if (selectedSlot) setPrice((selectedSlot.price || 0) * Number(e.target.value)) }} style={{ flex: 1 }} />
              </div>
            </div>

            <div style={{ background: C.surface, borderRadius: 14, padding: 14, border: `1px solid ${C.border}`, marginBottom: 12 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: C.textSec, marginBottom: 10 }}>Slot Tersedia</div>
              {slots.length === 0 && <div style={{ fontSize: 12, color: C.textMuted, padding: 10 }}>Memuat slot...</div>}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(90px, 1fr))", gap: 8 }}>
                {slots.map((s: any) => {
                  const isBooked = bookedSlotIds.has(s.id)
                  const priceDisplay = s.price ? s.price * hours : null
                  if (isBooked) return <div key={s.id} style={{ padding: "10px 6px", borderRadius: 8, border: "1px solid #C6282844", background: "#C6282811", color: "#C62828", fontSize: 11, textAlign: "center", textDecoration: "line-through" }}>{formatTime(s.start_time)}</div>
                  return (
                    <button key={s.id} onClick={() => selectSlot(s)} style={{ padding: "10px 6px", borderRadius: 8, border: selectedSlot?.id === s.id ? `2px solid ${C.primary}` : `1px solid ${C.border}`, background: selectedSlot?.id === s.id ? C.primary + "22" : C.elevated, color: selectedSlot?.id === s.id ? C.text : C.textMuted, fontSize: 11, cursor: "pointer", textAlign: "center" }}>
                      <div>{formatTime(s.start_time)}</div>
                      {priceDisplay && <div style={{ fontSize: 9, marginTop: 2, color: C.accent }}>Rp {priceDisplay.toLocaleString("id-ID")}</div>}
                    </button>
                  )
                })}
              </div>
            </div>

            {selectedSlot && (
              <div style={{ background: C.surface, borderRadius: 14, padding: 16, border: `1px solid ${C.border}`, marginBottom: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <span style={{ color: C.textMuted, fontSize: 12 }}>Venue · Lapangan</span>
                  <span style={{ color: C.text, fontSize: 12 }}>{selectedVenue.name} · {selectedCourt.name}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <span style={{ color: C.textMuted, fontSize: 12 }}>Tanggal · Jam</span>
                  <span style={{ color: C.text, fontSize: 12 }}>{bookingDate} · {formatTime(selectedSlot.start_time)}-{formatTime(selectedSlot.end_time)} ({hours}j)</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 8, borderTop: `1px solid ${C.border}` }}>
                  <span style={{ fontWeight: 600, color: C.text }}>Total</span>
                  <span style={{ fontSize: 18, fontWeight: 700, color: C.accent }}>Rp {price.toLocaleString("id-ID")}</span>
                </div>
              </div>
            )}

            {selectedSlot && (
              <>
                <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                  <input placeholder="Kode promo" value={promoCode} onChange={e => setPromoCode(e.target.value.toUpperCase())} style={{ flex: 1, padding: "10px 12px", background: C.elevated, border: `1px solid ${C.border}`, borderRadius: 10, color: C.text, fontSize: 14, outline: "none", boxSizing: "border-box" }} />
                  <button onClick={async () => {
                    if (!selectedVenue || !promoCode) return
                    const result = await validatePromo(selectedVenue.id, promoCode, hours)
                    if (!result.valid) { setPromoError(result.error || "Invalid promo"); return }
                    const applied = applyPromo(price, result.promo!)
                    setPromoDiscount(applied.discount)
                    setPrice(applied.finalPrice)
                    setPromoError("")
                  }} style={{ padding: "10px 14px", borderRadius: 10, border: `1px solid ${C.border}`, background: "transparent", color: C.text, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}><Ticket size={14} />Pakai</button>
                </div>
                {promoError && <div style={{ fontSize: 12, color: C.danger, marginBottom: 8 }}>{promoError}</div>}

                <button onClick={handleConfirm} style={{ width: "100%", padding: 14, borderRadius: 12, border: "none", background: C.primary, color: "#fff", fontSize: 15, fontWeight: 600, cursor: "pointer", marginTop: 4 }}>
                  Konfirmasi & Bayar — Rp {price.toLocaleString("id-ID")}
                </button>
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}
