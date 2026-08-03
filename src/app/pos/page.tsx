"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/hooks/useAuth"

const S = {
  page: { minHeight: "100vh", background: "#0D0D0D", color: "#F5F0E8" } as React.CSSProperties,
  header: { background: "#84102D", padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" } as React.CSSProperties,
  headerTitle: { fontSize: 16, fontWeight: 800, color: "#fff", letterSpacing: 2 } as React.CSSProperties,
  container: { maxWidth: 500, margin: "0 auto", padding: "20px 16px 40px" } as React.CSSProperties,
  card: { background: "#1A1816", border: "1px solid #2E2C28", borderRadius: 12, padding: 16, marginBottom: 16 } as React.CSSProperties,
  input: { width: "100%", padding: "10px 12px", background: "#242220", border: "1px solid #2E2C28", borderRadius: 10, color: "#F5F0E8", fontSize: 14, outline: "none", boxSizing: "border-box" as any, marginBottom: 10 } as React.CSSProperties,
  select: { width: "100%", padding: "10px 12px", background: "#242220", border: "1px solid #2E2C28", borderRadius: 10, color: "#F5F0E8", fontSize: 14, outline: "none", boxSizing: "border-box" as any, marginBottom: 10 } as React.CSSProperties,
  btn: { width: "100%", padding: "12px", borderRadius: 10, border: "none", background: "#84102D", color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer" } as React.CSSProperties,
  btnSm: { padding: "8px 16px", borderRadius: 8, border: "none", background: "#84102D", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" } as React.CSSProperties,
  btnOutline: { padding: "8px 16px", borderRadius: 8, border: "1px solid #2E2C28", background: "transparent", color: "#B5AC8A", fontSize: 13, cursor: "pointer" } as React.CSSProperties,
  label: { fontSize: 13, fontWeight: 600, color: "#B5AC8A", marginBottom: 6, display: "block" } as React.CSSProperties,
  value: { fontSize: 14, color: "#F5F0E8" } as React.CSSProperties,
  muted: { fontSize: 12, color: "#6B6558" } as React.CSSProperties,
  tag: (bg: string) => ({ padding: "4px 10px", borderRadius: 6, fontSize: 12, fontWeight: 700, background: bg, color: "#fff", display: "inline-block" } as React.CSSProperties),
  flexRow: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 } as React.CSSProperties,
  error: { fontSize: 12, color: "#C62828", marginBottom: 8, textAlign: "center" } as React.CSSProperties,
}

function calcHours(start: string, end: string): number {
  if (!start || !end) return 0
  const [sh, sm] = start.split(":").map(Number)
  const [eh, em] = end.split(":").map(Number)
  let hours = eh - sh + (em - sm) / 60
  if (hours <= 0) hours += 24
  return Math.round(hours * 10) / 10
}

export default function PosPage() {
  const [user, setUser] = useState<any>(null)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loginError, setLoginError] = useState("")
  const [venues, setVenues] = useState<any[]>([])
  const [selectedVenue, setSelectedVenue] = useState<any>(null)
  const [shift, setShift] = useState<any>(null)
  const [openingBalance, setOpeningBalance] = useState("0")
  const [closingBalance, setClosingBalance] = useState("")
  const [shiftResult, setShiftResult] = useState<any>(null)
  const [courts, setCourts] = useState<any[]>([])
  const [selectedCourt, setSelectedCourt] = useState<any>(null)
  const [bookingDate, setBookingDate] = useState(new Date().toISOString().split("T")[0])
  const [startTime, setStartTime] = useState("")
  const [endTime, setEndTime] = useState("")
  const [price, setPrice] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState("")
  const { supabase, signOut } = useAuth()

  useEffect(() => { supabase.auth.getUser().then(({ data }) => { if (data.user) setUser(data.user) }) }, [])

  useEffect(() => { if (user) loadVenues() }, [user])

  useEffect(() => {
    if (!selectedVenue) return
    loadShift()
    supabase.from("courts").select("*").eq("venue_id", selectedVenue.id).eq("is_active", true).then(({ data }) => setCourts(data || []))
  }, [selectedVenue])

  useEffect(() => {
    if (!selectedCourt || !bookingDate) { setPrice(null); return }
    const day = new Date(bookingDate).getDay()
    const dayType = (day === 0 || day === 6) ? "weekend" : "weekday"
    supabase.from("pricing_rules").select("base_price").eq("court_id", selectedCourt.id).eq("is_active", true).eq("day_type", dayType).order("priority", { ascending: false }).limit(1).then(({ data: p }: any) => setPrice(p?.[0]?.base_price ?? null))
  }, [selectedCourt, bookingDate])

  async function loadVenues() {
    const { data: roles } = await supabase.from("venue_roles").select("venue_id, venues(id, name, slug)").eq("user_id", user.id).in("role", ["owner", "manager", "staff"])
    if (roles) {
      const vs = roles.map((r: any) => r.venues).filter(Boolean)
      setVenues(vs)
      if (vs.length === 1) setSelectedVenue(vs[0])
    }
  }

  async function loadShift() {
    const { data } = await supabase.from("shifts").select("*").eq("venue_id", selectedVenue.id).eq("status", "open").single()
    setShift(data || null)
  }

  async function openShift() {
    setLoading(true); setMsg("")
    const { error } = await supabase.from("shifts").insert({ venue_id: selectedVenue.id, staff_id: user.id, opening_balance: Number(openingBalance) || 0, status: "open" }).select().single()
    setLoading(false)
    if (error) setMsg(error.message)
    else loadShift()
  }

  async function closeShift() {
    if (!shift) return
    setLoading(true); setMsg("")
    const bal = Number(closingBalance)
    if (isNaN(bal)) { setMsg("Masukkan closing balance"); setLoading(false); return }
    const { data: txns } = await supabase.from("pos_transactions").select("amount, payment_method").eq("shift_id", shift.id)
    const totalCashIn = txns?.filter((t: any) => t.payment_method === "cash").reduce((s: number, t: any) => s + Number(t.amount), 0) || 0
    const expected = (Number(shift.opening_balance) || 0) + totalCashIn
    const discrepancy = bal - expected
    await supabase.from("shifts").update({ status: "closed", closing_balance: bal, total_cash_in: totalCashIn, discrepancy, closed_at: new Date().toISOString() }).eq("id", shift.id)
    setShiftResult({ totalCashIn, discrepancy, closingBalance: bal })
    setShift(null)
    setLoading(false)
  }

  async function createBooking() {
    if (!shift || !selectedCourt || !startTime || !endTime || price === null) { setMsg("Lengkapi semua field"); return }
    const hours = calcHours(startTime, endTime)
    if (hours <= 0) { setMsg("Waktu selesai harus setelah mulai"); return }
    setLoading(true); setMsg("")

    const { data: slot, error: se } = await supabase.from("court_slots").insert({ court_id: selectedCourt.id }).select().single()
    if (se || !slot) { setMsg(se?.message || "Gagal membuat slot"); setLoading(false); return }

    const total = price * hours
    const { data: booking, error: be } = await supabase.from("bookings").insert({
      court_slot_id: slot.id, venue_id: selectedVenue.id, user_id: user.id,
      booking_date: bookingDate, start_time: startTime, end_time: endTime,
      total_hours: hours, base_price: price, final_price: total, status: "confirmed",
    }).select().single()

    if (be || !booking) { setMsg(be?.message || "Gagal booking"); setLoading(false); return }

    const { error: te } = await supabase.from("pos_transactions").insert({
      shift_id: shift.id, booking_id: booking.id, reference_type: "booking",
      reference_id: booking.id, amount: total, payment_method: "cash", status: "completed",
    })

    if (te) { setMsg(te.message); setLoading(false); return }

    setMsg(`Booking sukses! Total: Rp ${total.toLocaleString("id-ID")}`)
    setStartTime(""); setEndTime(""); setSelectedCourt(null); setPrice(null)
    setLoading(false)
  }

  if (!user) return (
    <div style={S.page}>
      <div style={S.header}><span style={S.headerTitle}>STADIONE POS</span></div>
      <div style={{ maxWidth: 400, margin: "40px auto", padding: 24 }}>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: "#F5F0E8" }}>Masuk POS</div>
          <div style={S.muted}>Login untuk akses kasir</div>
        </div>
        <form onSubmit={async (e) => {
          e.preventDefault()
          const { error: err } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
          if (err) setLoginError("Email atau kata sandi salah")
          else { const { data } = await supabase.auth.getUser(); if (data.user) setUser(data.user) }
        }}>
          <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required style={S.input} />
          <input type="password" placeholder="Kata sandi" value={password} onChange={e => setPassword(e.target.value)} required style={S.input} />
          {loginError && <div style={S.error}>{loginError}</div>}
          <button type="submit" style={S.btn}>Masuk</button>
        </form>
      </div>
    </div>
  )

  return (
    <div style={S.page}>
      <div style={S.header}>
        <span style={S.headerTitle}>STADIONE POS</span>
        <button onClick={async () => { await signOut(); setUser(null) }} style={{ ...S.btnOutline, color: "#C62828", borderColor: "#C6282844" }}>Keluar</button>
      </div>
      <div style={S.container}>

        <div style={S.card}>
          <div style={S.flexRow}>
            <span style={S.label}>Venue</span>
            <select value={selectedVenue?.id || ""} onChange={e => { const v = venues.find(x => x.id === e.target.value); setSelectedVenue(v || null) }} style={{ ...S.select, width: "auto", minWidth: 200, marginBottom: 0 }}>
              <option value="">Pilih venue</option>
              {venues.map((v: any) => <option key={v.id} value={v.id}>{v.name}</option>)}
            </select>
          </div>
        </div>

        {!selectedVenue && <div style={{ textAlign: "center", padding: 40, color: "#6B6558", fontSize: 14 }}>Pilih venue untuk memulai</div>}

        {selectedVenue && !shift && (
          <div style={S.card}>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#F5F0E8", marginBottom: 12 }}>Buka Shift</div>
            <label style={S.label}>Saldo Awal</label>
            <input type="number" value={openingBalance} onChange={e => setOpeningBalance(e.target.value)} style={S.input} />
            <button onClick={openShift} disabled={loading} style={S.btn}>{loading ? "Membuka..." : "Buka Shift"}</button>
          </div>
        )}

        {shift && (
          <div style={S.card}>
            <div style={{ ...S.flexRow, marginBottom: 10 }}>
              <span style={{ fontSize: 16, fontWeight: 700 }}>Shift Aktif</span>
              <span style={S.tag("#1B5E20")}>OPEN</span>
            </div>
            <div style={{ ...S.flexRow, marginBottom: 4 }}><span style={S.muted}>Dibuka</span><span style={S.value}>{new Date(shift.opened_at).toLocaleTimeString("id-ID")}</span></div>
            <div style={{ ...S.flexRow, marginBottom: 12 }}><span style={S.muted}>Saldo Awal</span><span style={S.value}>Rp {Number(shift.opening_balance || 0).toLocaleString("id-ID")}</span></div>
            <label style={S.label}>Saldo Akhir</label>
            <input type="number" value={closingBalance} onChange={e => setClosingBalance(e.target.value)} placeholder="Hitung uang di laci..." style={S.input} />
            <div style={S.flexRow}>
              <button onClick={closeShift} disabled={loading} style={S.btnSm}>{loading ? "..." : "Tutup Shift"}</button>
            </div>
          </div>
        )}

        {shift && shiftResult && (
          <div style={S.card}>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#F5F0E8", marginBottom: 8 }}>Shift Ditutup</div>
            <div style={S.flexRow}><span style={S.muted}>Total Cash In</span><span style={S.value}>Rp {shiftResult.totalCashIn.toLocaleString("id-ID")}</span></div>
            <div style={S.flexRow}><span style={S.muted}>Discrepancy</span><span style={{ ...S.value, color: shiftResult.discrepancy !== 0 ? "#C62828" : "#4CAF50" }}>Rp {shiftResult.discrepancy.toLocaleString("id-ID")}</span></div>
            <button onClick={() => setShiftResult(null)} style={{ ...S.btn, marginTop: 12 }}>OK</button>
          </div>
        )}

        {shift && (
          <div style={S.card}>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#F5F0E8", marginBottom: 12 }}>Walk-in Booking</div>
            <label style={S.label}>Tanggal</label>
            <input type="date" value={bookingDate} onChange={e => { setBookingDate(e.target.value); setPrice(null) }} style={S.input} />
            <label style={S.label}>Lapangan</label>
            <select value={selectedCourt?.id || ""} onChange={e => { const c = courts.find(x => x.id === e.target.value); setSelectedCourt(c || null) }} style={S.select}>
              <option value="">Pilih lapangan</option>
              {courts.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <div style={S.flexRow}>
              <div style={{ flex: 1 }}><label style={S.label}>Mulai</label><input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} style={S.input} /></div>
              <div style={{ flex: 1 }}><label style={S.label}>Selesai</label><input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} style={S.input} /></div>
            </div>
            {price !== null && startTime && endTime && (
              <div style={{ ...S.flexRow, marginBottom: 12, padding: "10px 12px", background: "#242220", borderRadius: 8 }}>
                <span style={S.muted}>{calcHours(startTime, endTime).toFixed(1)} jam x Rp {price.toLocaleString("id-ID")}</span>
                <span style={{ fontSize: 18, fontWeight: 700, color: "#B5AC8A" }}>Rp {(price * calcHours(startTime, endTime)).toLocaleString("id-ID")}</span>
              </div>
            )}
            <button onClick={createBooking} disabled={loading} style={S.btn}>{loading ? "Memproses..." : "Bayar Tunai & Booking"}</button>
          </div>
        )}

        {msg && <div style={{ ...S.card, textAlign: "center", padding: 12 }}>
          <span style={msg.includes("sukses") ? { color: "#4CAF50", fontSize: 14 } : { color: "#C62828", fontSize: 14 }}>{msg}</span>
        </div>}

        <div style={{ textAlign: "center", padding: "20px 0" }}><div style={S.muted}>{user.email}</div></div>
      </div>
    </div>
  )
}
