"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/hooks/useAuth"

const S = {
  page: { minHeight: "100vh", background: "#0D0D0D", color: "#F5F0E8" } as React.CSSProperties,
  header: { background: "#84102D", padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" } as React.CSSProperties,
  headerTitle: { fontSize: 16, fontWeight: 800, color: "#fff", letterSpacing: 2 } as React.CSSProperties,
  container: { maxWidth: 520, margin: "0 auto", padding: "16px" } as React.CSSProperties,
  card: { background: "#1A1816", border: "1px solid #2E2C28", borderRadius: 12, padding: 16, marginBottom: 12 } as React.CSSProperties,
  input: { width: "100%", padding: "10px 12px", background: "#242220", border: "1px solid #2E2C28", borderRadius: 10, color: "#F5F0E8", fontSize: 14, outline: "none", boxSizing: "border-box" as any, marginBottom: 8 } as React.CSSProperties,
  select: { width: "100%", padding: "10px 12px", background: "#242220", border: "1px solid #2E2C28", borderRadius: 10, color: "#F5F0E8", fontSize: 14, outline: "none", boxSizing: "border-box" as any } as React.CSSProperties,
  btn: { width: "100%", padding: "12px", borderRadius: 10, border: "none", background: "#84102D", color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer" } as React.CSSProperties,
  btnSm: { padding: "8px 16px", borderRadius: 8, border: "none", background: "#84102D", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" } as React.CSSProperties,
  btnOutline: { padding: "6px 14px", borderRadius: 8, border: "1px solid #2E2C28", background: "transparent", color: "#B5AC8A", fontSize: 13, cursor: "pointer" } as React.CSSProperties,
  btnDanger: { padding: "8px 16px", borderRadius: 8, border: "1px solid #C6282844", background: "transparent", color: "#C62828", fontSize: 13, cursor: "pointer" } as React.CSSProperties,
  label: { fontSize: 13, fontWeight: 600, color: "#B5AC8A", marginBottom: 6, display: "block" } as React.CSSProperties,
  value: { fontSize: 14, color: "#F5F0E8" } as React.CSSProperties,
  muted: { fontSize: 12, color: "#6B6558" } as React.CSSProperties,
  tag: (bg: string) => ({ padding: "3px 8px", borderRadius: 5, fontSize: 11, fontWeight: 700, background: bg, color: "#fff", display: "inline-block" } as React.CSSProperties),
  flexRow: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 } as React.CSSProperties,
  flexCenter: { display: "flex", alignItems: "center", gap: 8 } as React.CSSProperties,
  error: { fontSize: 12, color: "#C62828", marginBottom: 8, textAlign: "center" as any } as React.CSSProperties,
  success: { fontSize: 14, color: "#4CAF50", textAlign: "center" as any, padding: 8 } as React.CSSProperties,
  tabRow: { display: "flex", gap: 4, marginBottom: 16, background: "#141210", borderRadius: 10, padding: 4 } as React.CSSProperties,
  tab: (active: boolean) => ({ flex: 1, padding: "10px 8px", borderRadius: 8, border: "none", background: active ? "#84102D" : "transparent", color: active ? "#fff" : "#6B6558", fontSize: 13, fontWeight: 700, cursor: "pointer", textAlign: "center" as any }) as React.CSSProperties,
  slotGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))", gap: 8 } as React.CSSProperties,
  slot: (active: boolean) => ({ padding: "10px 8px", borderRadius: 8, border: active ? "2px solid #84102D" : "1px solid #2E2C28", background: active ? "#84102D22" : "#242220", color: active ? "#F5F0E8" : "#6B6558", fontSize: 12, cursor: "pointer", textAlign: "center" as any }) as React.CSSProperties,
  slotBooked: { padding: "10px 8px", borderRadius: 8, border: "1px solid #C6282844", background: "#C6282811", color: "#C62828", fontSize: 12, cursor: "not-allowed", textAlign: "center" as any, textDecoration: "line-through" } as React.CSSProperties,
  paymentBtn: (active: boolean) => ({ padding: "6px 12px", borderRadius: 8, border: active ? "1px solid #84102D" : "1px solid #2E2C28", background: active ? "#84102D" : "transparent", color: active ? "#fff" : "#B5AC8A", fontSize: 12, cursor: "pointer" }) as React.CSSProperties,
  invoice: { background: "#fff", color: "#111", borderRadius: 8, padding: 20, fontSize: 13, lineHeight: 1.6 } as React.CSSProperties,
  divider: { border: "none", borderTop: "1px solid #2E2C28", margin: "12px 0" } as React.CSSProperties,
  modalOverlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 16 } as React.CSSProperties,
  modalBox: { background: "#1A1816", border: "1px solid #2E2C28", borderRadius: 16, padding: 24, maxWidth: 400, width: "100%", maxHeight: "80vh", overflow: "auto" } as React.CSSProperties,
}

const PAYMENT_METHODS = ["cash", "qris", "transfer", "debit", "doku", "split"]
const SPLIT_METHODS = ["cash", "qris", "transfer", "debit"]

type Tab = "booking" | "walkin" | "report"
type SplitRow = { method: string; amount: string }
type SlotsMap = Record<string, any[]>

function emptySplit(): SplitRow[] { return [{ method: "cash", amount: "" }] }

function PaymentSection({ total, paymentMethod, splitPayments, referenceNo, onChangeRef, loading, onChangeMethod, onChangeSplit, onSubmit, submitLabel }: {
  total: number
  paymentMethod: string
  splitPayments: SplitRow[]
  referenceNo: string
  onChangeRef: (v: string) => void
  loading: boolean
  onChangeMethod: (m: string) => void
  onChangeSplit: (rows: SplitRow[]) => void
  onSubmit: () => void
  submitLabel: string
}) {
  const splitSum = splitPayments.reduce((s, r) => s + Number(r.amount), 0)
  const splitValid = Math.abs(splitSum - total) < 0.5
  const isSplit = paymentMethod === "split"

  function updateSplitRow(i: number, field: keyof SplitRow, value: string) {
    const next = [...splitPayments]
    next[i] = { ...next[i], [field]: value }
    onChangeSplit(next)
  }

  return (
    <>
      <hr style={S.divider} />
      {total > 0 && (
        <div style={{ ...S.flexRow, marginBottom: 8 }}>
          <span style={S.value}>Total</span>
          <span style={{ fontSize: 16, fontWeight: 700, color: "#B5AC8A" }}>Rp {total.toLocaleString("id-ID")}</span>
        </div>
      )}
      <div style={{ ...S.flexCenter, marginBottom: 10, flexWrap: "wrap" }}>
        <span style={S.muted}>Metode:</span>
        {PAYMENT_METHODS.map(m => (
          <button key={m} onClick={() => onChangeMethod(m)} style={S.paymentBtn(paymentMethod === m)}>{m.toUpperCase()}</button>
        ))}
      </div>

      {paymentMethod === "doku" && !isSplit && (
        <div style={{ fontSize: 12, color: "#B5AC8A", marginBottom: 8, padding: "8px 12px", background: "#1565C022", borderRadius: 8 }}>
          Payment link DOKU akan digenerate. Customer bisa bayar via QRIS, VA, atau kartu.
        </div>
      )}

      {(paymentMethod === "qris" || paymentMethod === "transfer") && !isSplit && (
        <input type="text" value={referenceNo} onChange={e => onChangeRef(e.target.value)} placeholder="No. Referensi / Bukti Transfer" style={{ ...S.input, marginBottom: 10, fontSize: 13 }} />
      )}

      {isSplit && (
        <div style={{ marginBottom: 12, padding: "10px 12px", background: "#141210", borderRadius: 10 }}>
          {splitPayments.map((row, i) => (
            <div key={i} style={{ ...S.flexCenter, marginBottom: 6 }}>
              <select value={row.method} onChange={e => updateSplitRow(i, "method", e.target.value)} style={{ ...S.select, flex: 1, marginBottom: 0, padding: "6px 8px", fontSize: 12 }}>
                {SPLIT_METHODS.map(m => <option key={m} value={m}>{m.toUpperCase()}</option>)}
              </select>
              <input type="number" value={row.amount} onChange={e => updateSplitRow(i, "amount", e.target.value)} placeholder="Nominal" style={{ ...S.input, flex: 2, marginBottom: 0, padding: "6px 8px", fontSize: 12 }} />
              {splitPayments.length > 1 && (
                <button onClick={() => onChangeSplit(splitPayments.filter((_, j) => j !== i))} style={{ ...S.btnDanger, padding: "4px 8px", fontSize: 10, color: "#C62828" }}>✕</button>
              )}
            </div>
          ))}
          <button onClick={() => onChangeSplit([...splitPayments, { method: "cash", amount: "" }])} style={{ ...S.btnOutline, padding: "4px 12px", fontSize: 11, width: "100%" }}>+ Tambah Metode</button>
          {!splitValid && splitPayments.some(r => Number(r.amount) > 0) && (
            <div style={{ ...S.error, marginTop: 6, marginBottom: 0 }}>
              Split: Rp {splitSum.toLocaleString("id-ID")} ≠ Tagihan: Rp {total.toLocaleString("id-ID")}
            </div>
          )}
        </div>
      )}

      <button onClick={onSubmit} disabled={loading || (isSplit && !splitValid && splitPayments.some(r => Number(r.amount) > 0))} style={S.btn}>
        {loading ? "Memproses..." : submitLabel}
      </button>
    </>
  )
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
  const [tab, setTab] = useState<Tab>("booking")
  const [courts, setCourts] = useState<any[]>([])
  const [selectedCourt, setSelectedCourt] = useState<any>(null)
  const [slots, setSlots] = useState<any[]>([])
  const [bookedSlotIds, setBookedSlotIds] = useState<Set<string>>(new Set())
  const [selectedSlot, setSelectedSlot] = useState<any>(null)
  const [bookingDate, setBookingDate] = useState(new Date().toISOString().split("T")[0])
  const [paymentMethod, setPaymentMethod] = useState("cash")
  const [splitPayments, setSplitPayments] = useState<SplitRow[]>(emptySplit())
  const [referenceNo, setReferenceNo] = useState("")
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState("")
  const [msgType, setMsgType] = useState<"success" | "error">("success")
  const [walkinAmount, setWalkinAmount] = useState("")
  const [walkinNote, setWalkinNote] = useState("")
  const [memberSearch, setMemberSearch] = useState("")
  const [foundMember, setFoundMember] = useState<any>(null)
  const [transactions, setTransactions] = useState<any[]>([])
  const [invoice, setInvoice] = useState<any>(null)
  const { supabase, signOut } = useAuth()

  useEffect(() => { supabase.auth.getUser().then(({ data }) => { if (data.user) setUser(data.user) }) }, [])

  useEffect(() => { if (user) loadVenues() }, [user])

  useEffect(() => {
    if (!selectedVenue) return
    loadShift()
    supabase.from("courts").select("*").eq("venue_id", selectedVenue.id).eq("is_active", true).then(({ data }) => setCourts(data || []))
  }, [selectedVenue])

  useEffect(() => {
    if (!selectedCourt || !bookingDate) return
    loadSlots(selectedCourt.id, bookingDate)
  }, [selectedCourt, bookingDate])

  useEffect(() => { if (shift) loadTransactions() }, [shift, tab])

  async function loadVenues() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return
    const r = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/venue_roles?select=venue_id,venues(id,name,slug)`, {
      headers: { apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, Authorization: `Bearer ${session.access_token}` }
    })
    const roles = await r.json()
    if (Array.isArray(roles)) {
      const vs = roles.map((r: any) => r.venues).filter(Boolean)
      const unique = [...new Map(vs.map((v: any) => [v.id, v])).values()]
      setVenues(unique)
      if (unique.length === 1) setSelectedVenue(unique[0])
    }
  }

  async function loadShift() {
    if (!selectedVenue) return
    const { data } = await supabase.from("shifts").select("*").eq("venue_id", selectedVenue.id).eq("status", "open").single()
    setShift(data || null)
  }

  async function loadSlots(courtId: string, date: string) {
    setSlots([]); setBookedSlotIds(new Set()); setSelectedSlot(null)
    const day = new Date(date).getDay()
    const dayType = (day === 0 || day === 6) ? "weekend" : "weekday"

    const { data: allSlots } = await supabase.from("court_slots").select("id, start_time, end_time").eq("court_id", courtId).order("start_time")
    if (!allSlots) return

    const { data: bookings } = await supabase.from("bookings").select("court_slot_id").eq("booking_date", date).in("status", ["confirmed", "ongoing"])
    const booked = new Set((bookings || []).map((b: any) => b.court_slot_id))

    const { data: pricing } = await supabase.from("pricing_rules").select("base_price").eq("court_id", courtId).eq("is_active", true).eq("day_type", dayType).order("priority", { ascending: false }).limit(1)
    const basePrice = pricing?.[0]?.base_price ?? null

    setSlots(allSlots.map((s: any) => ({ ...s, price: basePrice })))
    setBookedSlotIds(booked)
  }

  async function loadTransactions() {
    if (!shift) return
    const { data } = await supabase.from("pos_transactions").select("*, bookings(booking_date, start_time, end_time)").eq("shift_id", shift.id).order("created_at", { ascending: false })
    setTransactions(data || [])
  }

  async function openShift() {
    setLoading(true); setMsg("")
    const { error } = await supabase.from("shifts").insert({ venue_id: selectedVenue.id, staff_id: user.id, opening_balance: Number(openingBalance) || 0, status: "open" }).select().single()
    setLoading(false)
    if (error) { setMsg(error.message); setMsgType("error") }
    else loadShift()
  }

  async function closeShift() {
    if (!shift) return
    setLoading(true); setMsg("")
    const bal = Number(closingBalance)
    if (isNaN(bal)) { setMsg("Masukkan closing balance"); setMsgType("error"); setLoading(false); return }
    const { data: txns } = await supabase.from("pos_transactions").select("amount, payment_method").eq("shift_id", shift.id)
    const totalCashIn = txns?.filter((t: any) => t.payment_method === "cash").reduce((s: number, t: any) => s + Number(t.amount), 0) || 0
    const expected = (Number(shift.opening_balance) || 0) + totalCashIn
    const discrepancy = bal - expected
    await supabase.from("shifts").update({ status: "closed", closing_balance: bal, total_cash_in: totalCashIn, discrepancy, closed_at: new Date().toISOString() }).eq("id", shift.id)
    setShiftResult({ totalCashIn, discrepancy, closingBalance: bal, transactions: txns || [] })
    setShift(null)
    setLoading(false)
  }

  function validateSplit(total: number): boolean {
    if (paymentMethod !== "split") return true
    const rows = splitPayments.filter(r => Number(r.amount) > 0)
    if (rows.length === 0) { setMsg("Minimal 1 metode split"); setMsgType("error"); return false }
    const sum = rows.reduce((s, r) => s + Number(r.amount), 0)
    if (Math.abs(sum - total) > 0.5) { setMsg(`Total split (${sum.toLocaleString("id-ID")}) tidak sama dengan tagihan (${total.toLocaleString("id-ID")})`); setMsgType("error"); return false }
    return true
  }

  async function createSplitTxns(bookingId: string | null, refType: string, refId: string) {
    const rows = splitPayments.filter(r => Number(r.amount) > 0)
    const txnDetails = rows.map(r => `${r.method}:${Number(r.amount).toLocaleString("id-ID")}`).join("; ")
    for (const r of rows) {
      await supabase.from("pos_transactions").insert({
        shift_id: shift.id, booking_id: bookingId || undefined, reference_type: refType,
        reference_id: refId, amount: Number(r.amount), payment_method: r.method, status: "completed",
        payment_details: { split_group: refId, split_methods: txnDetails },
      })
    }
  }

  async function bookSlot() {
    if (!shift || !selectedSlot || !selectedCourt) { setMsg("Pilih slot"); setMsgType("error"); return }
    const price = selectedSlot.price || 0
    if (!validateSplit(price)) return
    setLoading(true); setMsg("")

    const txnStatus = paymentMethod === "doku" ? "pending" : "completed"

    const { data: booking, error: be } = await supabase.from("bookings").insert({
      court_slot_id: selectedSlot.id, venue_id: selectedVenue.id, user_id: user.id,
      booking_date: bookingDate, start_time: selectedSlot.start_time, end_time: selectedSlot.end_time,
      total_hours: 1, base_price: price, final_price: price,
      status: paymentMethod === "doku" ? "pending" : "confirmed",
    }).select().single()

    if (be || !booking) { setMsg(be?.message || "Gagal booking"); setMsgType("error"); setLoading(false); return }

    let dokuUrl = ""
    if (paymentMethod === "doku") {
      try {
        const dokuRes = await fetch("/api/payment/create", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ bookingId: booking.id, amount: price, itemName: `${selectedCourt?.name} - ${selectedSlot?.start_time?.substring(0, 5)}`, userName: user.email, userEmail: user.email }),
        })
        const dokuData = await dokuRes.json()
        dokuUrl = dokuData.payment_url || ""
      } catch { /* fallthrough — show invoice without link */ }
    }

    if (paymentMethod === "split") {
      await createSplitTxns(booking.id, "booking", booking.id)
    } else {
      const details: any = {}
      if (referenceNo.trim()) details.reference_no = referenceNo.trim()
      if ((paymentMethod === "qris" || paymentMethod === "transfer") && referenceNo.trim()) details.manual_verified = false
      if (dokuUrl) details.doku_url = dokuUrl
      await supabase.from("pos_transactions").insert({
        shift_id: shift.id, booking_id: booking.id, reference_type: "booking",
        reference_id: booking.id, amount: price, payment_method: paymentMethod, status: txnStatus,
        payment_details: Object.keys(details).length > 0 ? details : undefined,
      })
    }

    const methodLabel = paymentMethod === "split"
      ? splitPayments.filter(r => Number(r.amount) > 0).map(r => r.method.toUpperCase()).join(" + ")
      : paymentMethod.toUpperCase()

    setInvoice({
      number: `INV-${new Date().toISOString().split("T")[0].replace(/-/g, "")}-${String(Math.floor(Math.random() * 1000)).padStart(3, "0")}`,
      venue: selectedVenue.name, court: selectedCourt.name, date: bookingDate,
      time: `${selectedSlot.start_time}-${selectedSlot.end_time}`, price, method: methodLabel,
      dokuUrl,
      split: paymentMethod === "split" ? splitPayments.filter(r => Number(r.amount) > 0) : null,
    })
    setMsgType("success")
    setSelectedSlot(null); setSplitPayments(emptySplit()); setPaymentMethod("cash"); setReferenceNo("")
    loadSlots(selectedCourt.id, bookingDate)
    loadTransactions()
    setLoading(false)
  }

  async function walkinPay() {
    if (!shift) { setMsg("Shift belum dibuka"); setMsgType("error"); return }
    const amount = Number(walkinAmount)
    if (!amount || amount <= 0) { setMsg("Masukkan nominal"); setMsgType("error"); return }
    if (!validateSplit(amount)) return
    setLoading(true); setMsg("")

    const refId = crypto.randomUUID()
    const txnStatus = paymentMethod === "doku" ? "pending" : "completed"
    let dokuUrl = ""

    if (paymentMethod === "split") {
      await createSplitTxns(null, "walkin", refId)
    } else {
      const details: any = { note: walkinNote || "Walk-in payment" }
      if (referenceNo.trim()) details.reference_no = referenceNo.trim()
      if ((paymentMethod === "qris" || paymentMethod === "transfer") && referenceNo.trim()) details.manual_verified = false
      if (dokuUrl) details.doku_url = dokuUrl
      await supabase.from("pos_transactions").insert({
        shift_id: shift.id, reference_type: "walkin", reference_id: refId,
        amount, payment_method: paymentMethod, status: txnStatus,
        payment_details: details,
      })
    }

    const methodLabel = paymentMethod === "split"
      ? splitPayments.filter(r => Number(r.amount) > 0).map(r => r.method.toUpperCase()).join(" + ")
      : paymentMethod.toUpperCase()

    setInvoice({
      number: `INV-${new Date().toISOString().split("T")[0].replace(/-/g, "")}-${String(Math.floor(Math.random() * 1000)).padStart(3, "0")}`,
      venue: selectedVenue.name, type: "Walk-in", note: walkinNote, amount, method: methodLabel,
      dokuUrl,
      split: paymentMethod === "split" ? splitPayments.filter(r => Number(r.amount) > 0) : null,
    })
    setMsgType("success")
    setWalkinAmount(""); setWalkinNote(""); setSplitPayments(emptySplit()); setPaymentMethod("cash"); setReferenceNo("")
    loadTransactions()
    setLoading(false)
  }

  async function searchMember() {
    if (!memberSearch.trim() || !selectedVenue) return
    const { data } = await supabase.from("members").select("*, membership_plans(name), users!members_user_id_fkey(email)").eq("venue_id", selectedVenue.id).eq("status", "active").filter("users.email", "ilike", `%${memberSearch.trim()}%`).single()
    setFoundMember(data || null)
  }

  async function memberCheckIn() {
    if (!foundMember || !shift) return
    setLoading(true)
    await supabase.from("check_ins").insert({ member_id: foundMember.id, venue_id: selectedVenue.id, check_in_type: "membership" })
    await supabase.from("pos_transactions").insert({
      shift_id: shift.id, reference_type: "checkin", reference_id: foundMember.id,
      amount: 0, payment_method: "member", status: "completed",
      payment_details: { member_email: foundMember.users?.email || "", plan: foundMember.membership_plans?.name || "" },
    })
    loadTransactions()
    setFoundMember(null); setMemberSearch("")
    setMsg("Member check-in sukses!"); setMsgType("success")
    setLoading(false)
  }

  async function voidTransaction(txnId: string) {
    const txn = transactions.find((t: any) => t.id === txnId)
    if (!txn) return
    setLoading(true)
    await supabase.from("pos_transactions").update({ status: "refunded" }).eq("id", txnId)
    if (txn.booking_id) {
      await supabase.from("bookings").update({ status: "cancelled" }).eq("id", txn.booking_id)
    }
    loadTransactions()
    setMsg("Transaksi dibatalkan"); setMsgType("success")
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
          <input type="email" placeholder="Email" name="email" id="pos-email" value={email} onChange={e => setEmail(e.target.value)} required style={S.input} />
          <input type="password" placeholder="Kata sandi" name="password" id="pos-password" value={password} onChange={e => setPassword(e.target.value)} required style={S.input} />
          {loginError && <div style={S.error}>{loginError}</div>}
          <button type="submit" style={S.btn}>Masuk</button>
        </form>
      </div>
    </div>
  )

  const shiftTotal = transactions.reduce((s: number, t: any) => s + Number(t.amount), 0)
  const cashTotal = transactions.filter((t: any) => t.payment_method === "cash").reduce((s: number, t: any) => s + Number(t.amount), 0)
  const qrisTotal = transactions.filter((t: any) => t.payment_method === "qris").reduce((s: number, t: any) => s + Number(t.amount), 0)
  const transferTotal = transactions.filter((t: any) => t.payment_method === "transfer").reduce((s: number, t: any) => s + Number(t.amount), 0)
  const debitTotal = transactions.filter((t: any) => t.payment_method === "debit").reduce((s: number, t: any) => s + Number(t.amount), 0)
  const dokuTotal = transactions.filter((t: any) => t.payment_method === "doku").reduce((s: number, t: any) => s + Number(t.amount), 0)
  const dokuPending = transactions.filter((t: any) => t.payment_method === "doku" && t.status === "pending").length
  const bookingCount = transactions.filter((t: any) => t.reference_type === "booking").length
  const walkinCount = transactions.filter((t: any) => t.reference_type === "walkin").length
  const METHOD_BREAKDOWN = [
    ["Cash", cashTotal, "#2E7D32"],
    ["QRIS", qrisTotal, "#1565C0"],
    ["Transfer", transferTotal, "#B5AC8A"],
    ["Debit", debitTotal, "#B5AC8A"],
    ["DOKU", dokuTotal, "#6A1B9A"],
  ].filter(([, v]) => (v as number) > 0) as [string, number, string][]

  return (
    <div style={S.page}>
      <div style={S.header}>
        <span style={S.headerTitle}>STADIONE POS</span>
        <button onClick={async () => { await signOut(); setUser(null) }} style={S.btnDanger}>Keluar</button>
      </div>
      <div style={S.container}>

        {/* Venue + Shift Bar */}
        <div style={{ ...S.card, padding: "12px 16px" }}>
          <div style={{ ...S.flexRow, marginBottom: selectedVenue ? 8 : 0 }}>
            <select value={selectedVenue?.id || ""} onChange={e => { const v = venues.find(x => x.id === e.target.value); setSelectedVenue(v || null); setSelectedCourt(null); setSlots([]) }} style={{ ...S.select, flex: 1, marginBottom: 0 }}>
              <option value="">Pilih venue</option>
              {venues.map((v: any) => <option key={v.id} value={v.id}>{v.name}</option>)}
            </select>
            {!shift && selectedVenue && <span style={S.tag("#C62828")}>✕</span>}
            {shift && <span style={S.tag("#1B5E20")}>● OPEN</span>}
          </div>
        </div>

        {/* Open Shift */}
        {selectedVenue && !shift && (
          <div style={S.card}>
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>Buka Shift</div>
            <div style={S.label}>Saldo Awal</div>
            <input type="number" value={openingBalance} onChange={e => setOpeningBalance(e.target.value)} style={S.input} />
            <button onClick={openShift} disabled={loading} style={S.btn}>{loading ? "Membuka..." : "Buka Shift"}</button>
            {msg && <div style={msgType === "error" ? S.error : S.success}>{msg}</div>}
          </div>
        )}

        {/* Shift Closed Result */}
        {shiftResult && (
          <div style={S.card}>
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>Shift Ditutup</div>
            <div style={S.flexRow}><span style={S.muted}>Total Cash In</span><span style={S.value}>Rp {shiftResult.totalCashIn.toLocaleString("id-ID")}</span></div>
            <div style={S.flexRow}><span style={S.muted}>Discrepancy</span><span style={{ ...S.value, color: shiftResult.discrepancy !== 0 ? "#C62828" : "#4CAF50" }}>Rp {shiftResult.discrepancy.toLocaleString("id-ID")}</span></div>
            <button onClick={() => setShiftResult(null)} style={{ ...S.btn, marginTop: 12 }}>OK</button>
          </div>
        )}

        {!shift && !shiftResult && <div style={{ textAlign: "center", padding: 40, color: "#6B6558", fontSize: 14 }}>Buka shift untuk memulai</div>}

        {/* TABS */}
        {shift && (
          <>
            <div style={S.tabRow}>
              {(["booking", "walkin", "report"] as Tab[]).map(t => (
                <button key={t} onClick={() => setTab(t)} style={S.tab(tab === t)}>
                  {t === "booking" ? "Booking" : t === "walkin" ? "Walk-in" : "Report"}
                </button>
              ))}
            </div>

            {/* TAB: BOOKING */}
            {tab === "booking" && (
              <div>
                <div style={S.card}>
                  <div style={S.label}>Tanggal</div>
                  <input type="date" value={bookingDate} onChange={e => { setBookingDate(e.target.value); setSelectedSlot(null) }} style={S.input} />
                  <div style={S.label}>Lapangan</div>
                  <select value={selectedCourt?.id || ""} onChange={e => { const c = courts.find(x => x.id === e.target.value); setSelectedCourt(c || null) }} style={S.select}>
                    <option value="">Pilih lapangan</option>
                    {courts.map((c: any) => <option key={c.id} value={c.id}>{c.name} ({c.court_type})</option>)}
                  </select>
                </div>

                {selectedCourt && slots.length > 0 && (
                  <div style={S.card}>
                    <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 10 }}>Slot Tersedia</div>
                    <div style={S.slotGrid}>
                      {slots.map((s: any) => {
                        const isBooked = bookedSlotIds.has(s.id)
                        const isSelected = selectedSlot?.id === s.id
                        if (isBooked) return <div key={s.id} style={S.slotBooked}>{s.start_time?.substring(0, 5)}-{s.end_time?.substring(0, 5)}</div>
                        return (
                          <button key={s.id} onClick={() => setSelectedSlot(isSelected ? null : s)} style={S.slot(isSelected)}>
                            <div style={{ fontSize: 11 }}>{s.start_time?.substring(0, 5)}</div>
                            <div style={{ fontSize: 11, marginTop: 2 }}>{s.end_time?.substring(0, 5)}</div>
                            {s.price !== null && <div style={{ fontSize: 10, marginTop: 2, color: "#B5AC8A" }}>Rp {Number(s.price).toLocaleString("id-ID")}</div>}
                          </button>
                        )
                      })}
                    </div>

                    {selectedSlot && <PaymentSection
                      total={Number(selectedSlot.price || 0)}
                      paymentMethod={paymentMethod}
                      splitPayments={splitPayments}
                      referenceNo={referenceNo}
                      onChangeRef={setReferenceNo}
                      loading={loading}
                      onChangeMethod={setPaymentMethod}
                      onChangeSplit={(rows) => { setSplitPayments(rows); setPaymentMethod("split") }}
                      onSubmit={bookSlot}
                      submitLabel="Bayar & Konfirmasi"
                    />}
                    {msg && tab === "booking" && <div style={msgType === "error" ? { ...S.error, marginTop: 8 } : { ...S.success, marginTop: 8 }}>{msg}</div>}
                  </div>
                )}
              </div>
            )}

            {/* TAB: WALK-IN */}
            {tab === "walkin" && (
              <div>
                <div style={S.card}>
                  <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Walk-in / Tiket Harian</div>
                  <div style={S.label}>Nominal (Rp)</div>
                  <input type="number" value={walkinAmount} onChange={e => setWalkinAmount(e.target.value)} placeholder="50000" style={S.input} />
                  <div style={S.label}>Catatan</div>
                  <input type="text" value={walkinNote} onChange={e => setWalkinNote(e.target.value)} placeholder="Tiket gym, sewa alat, dll..." style={S.input} />
                  <PaymentSection
                    total={Number(walkinAmount) || 0}
                    paymentMethod={paymentMethod}
                    splitPayments={splitPayments}
                    referenceNo={referenceNo}
                    onChangeRef={setReferenceNo}
                    loading={loading}
                    onChangeMethod={setPaymentMethod}
                    onChangeSplit={(rows) => { setSplitPayments(rows); setPaymentMethod("split") }}
                    onSubmit={walkinPay}
                    submitLabel="Bayar Walk-in"
                  />
                  {msg && tab === "walkin" && <div style={msgType === "error" ? { ...S.error, marginTop: 8 } : { ...S.success, marginTop: 8 }}>{msg}</div>}
                </div>

                <div style={S.card}>
                  <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Member Check-in</div>
                  <div style={{ ...S.flexCenter, marginBottom: 8 }}>
                    <input type="text" value={memberSearch} onChange={e => { setMemberSearch(e.target.value); setFoundMember(null) }} placeholder="Cari email member..." style={{ ...S.input, flex: 1, marginBottom: 0 }} />
                    <button onClick={searchMember} style={{ ...S.btnSm, padding: "10px 16px" }}>Cari</button>
                  </div>
                  {foundMember && (
                    <div style={{ padding: "10px 12px", background: "#1B5E2011", borderRadius: 8, marginBottom: 8 }}>
                      <div style={{ fontSize: 13, color: "#F5F0E8", fontWeight: 600 }}>{foundMember.users?.email}</div>
                      <div style={{ fontSize: 11, color: "#6B6558" }}>{foundMember.membership_plans?.name || "Member"} · Aktif</div>
                      <button onClick={memberCheckIn} disabled={loading} style={{ ...S.btn, marginTop: 8 }}>Check-in Member</button>
                    </div>
                  )}
                  {foundMember === null && memberSearch.trim() && msg && tab === "walkin" && msg.includes("Member check-in") && <div style={S.success}>{msg}</div>}
                </div>
              </div>
            )}

            {/* TAB: REPORT */}
            {tab === "report" && (
              <div>
                <div style={S.card}>
                  <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Shift Report</div>
                  <div style={{ ...S.flexRow, marginBottom: 4 }}><span style={S.muted}>Dibuka</span><span style={S.value}>{new Date(shift.opened_at).toLocaleTimeString("id-ID")}</span></div>
                  <div style={{ ...S.flexRow, marginBottom: 4 }}><span style={S.muted}>Saldo Awal</span><span style={S.value}>Rp {Number(shift.opening_balance || 0).toLocaleString("id-ID")}</span></div>
                  <div style={{ ...S.flexRow, marginBottom: 4 }}>
                    <span style={S.muted}>Transaksi</span>
                    <span style={S.value}>{transactions.length} ({bookingCount} BK, {walkinCount} WL)</span>
                  </div>
                  {dokuPending > 0 && <div style={{ fontSize: 12, color: "#E65100", marginBottom: 4 }}>{dokuPending} DOKU pending</div>}
                  <hr style={S.divider} />
                  {METHOD_BREAKDOWN.map(([label, val, color]) => (
                    <div key={label} style={S.flexRow}>
                      <span style={{ fontSize: 13, color }}>{label}</span>
                      <span style={S.value}>Rp {val.toLocaleString("id-ID")}</span>
                    </div>
                  ))}
                  <hr style={S.divider} />
                  <div style={{ ...S.flexRow, marginBottom: 12 }}><span style={{ fontSize: 15, fontWeight: 700 }}>TOTAL</span><span style={{ fontSize: 18, fontWeight: 700, color: "#B5AC8A" }}>Rp {shiftTotal.toLocaleString("id-ID")}</span></div>

                  <div style={S.label}>Saldo Akhir</div>
                  <input type="number" value={closingBalance} onChange={e => setClosingBalance(e.target.value)} placeholder="Hitung uang di laci..." style={S.input} />
                  <button onClick={closeShift} disabled={loading} style={S.btn}>{loading ? "..." : "Tutup Shift"}</button>
                  {msg && tab === "report" && <div style={msgType === "error" ? { ...S.error, marginTop: 8 } : { ...S.success, marginTop: 8 }}>{msg}</div>}
                </div>

                {transactions.length > 0 && (
                  <div style={S.card}>
                    <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>Transaksi Hari Ini</div>
                    {transactions.map((t: any) => (
                      <div key={t.id} style={{ ...S.flexRow, padding: "6px 0", borderBottom: "1px solid #2E2C2822" }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 12, color: "#F5F0E8" }}>
                            {t.reference_type === "booking" ? "BK Slot" : t.reference_type === "checkin" ? "Check-in" : "Walk-in"}
                            {t.payment_method === "doku" && t.status === "pending" && <span style={{ color: "#E65100", fontSize: 10, marginLeft: 6 }}>PENDING</span>}
                          </div>
                          <div style={{ fontSize: 10, color: "#6B6558" }}>{new Date(t.created_at).toLocaleTimeString("id-ID")}</div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: t.status === "refunded" ? "#C62828" : t.payment_method === "doku" && t.status === "pending" ? "#E65100" : "#F5F0E8" }}>
                            {t.status === "refunded" && "VOID "}Rp {Number(t.amount).toLocaleString("id-ID")}
                          </div>
                          <div style={S.flexCenter}>
                            <div style={{ ...S.tag(t.status === "refunded" ? "#C62828" : t.payment_method === "cash" ? "#2E7D32" : t.payment_method === "qris" ? "#1565C0" : t.payment_method === "doku" ? t.status === "pending" ? "#E65100" : "#6A1B9A" : "#8D6E63") }}>{t.payment_method.toUpperCase()}</div>
                            {t.status === "completed" && <button onClick={() => voidTransaction(t.id)} disabled={loading} style={{ ...S.btnDanger, padding: "2px 8px", fontSize: 9, background: "#C6282822" }}>VOID</button>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}

        <div style={{ textAlign: "center", padding: "12px 0 20px" }}><div style={S.muted}>{user.email}</div></div>
      </div>

      {/* INVOICE MODAL */}
      {invoice && (
        <div style={S.modalOverlay} onClick={() => setInvoice(null)}>
          <div style={S.modalBox} onClick={e => e.stopPropagation()}>
            <div style={{ ...S.flexRow, marginBottom: 16 }}>
              <span style={{ fontSize: 16, fontWeight: 800 }}>INVOICE</span>
              <span style={S.muted}>{invoice.number}</span>
            </div>
            <div style={S.invoice}>
              <div style={{ textAlign: "center", marginBottom: 12 }}>
                <div style={{ fontSize: 16, fontWeight: 800 }}>{invoice.venue}</div>
              </div>
              <table style={{ width: "100%", fontSize: 12 }}>
                <tbody>
                  {invoice.type === "Walk-in" ? (
                    <>
                      <tr><td style={{ color: "#666" }}>Jenis</td><td style={{ textAlign: "right" }}>{invoice.type}</td></tr>
                      <tr><td style={{ color: "#666" }}>Catatan</td><td style={{ textAlign: "right" }}>{invoice.note}</td></tr>
                    </>
                  ) : (
                    <>
                      <tr><td style={{ color: "#666" }}>Lapangan</td><td style={{ textAlign: "right" }}>{invoice.court}</td></tr>
                      <tr><td style={{ color: "#666" }}>Tanggal</td><td style={{ textAlign: "right" }}>{invoice.date}</td></tr>
                      <tr><td style={{ color: "#666" }}>Jam</td><td style={{ textAlign: "right" }}>{invoice.time}</td></tr>
                    </>
                  )}
                  <tr><td colSpan={2}><hr /></td></tr>
                  <tr style={{ fontSize: 14, fontWeight: 700 }}>
                    <td>Total</td>
                    <td style={{ textAlign: "right" }}>Rp {Number(invoice.amount).toLocaleString("id-ID")}</td>
                  </tr>
                  {invoice.split ? (
                    invoice.split.map((r: any, i: number) => (
                      <tr key={i}><td style={{ color: "#666" }}>{r.method.toUpperCase()}</td><td style={{ textAlign: "right" }}>Rp {Number(r.amount).toLocaleString("id-ID")}</td></tr>
                    ))
                  ) : (
                    <tr><td style={{ color: "#666" }}>Metode</td><td style={{ textAlign: "right" }}>{invoice.method}</td></tr>
                  )}
                  {invoice.dokuUrl && (
                    <tr><td colSpan={2} style={{ padding: "8px 0 0", textAlign: "center" }}>
                      <div style={{ fontSize: 10, color: "#666", marginBottom: 4 }}>Payment Link:</div>
                      <a href={invoice.dokuUrl} target="_blank" rel="noopener" style={{ fontSize: 9, color: "#1565C0", wordBreak: "break-all" }}>{invoice.dokuUrl}</a>
                      <div style={{ fontSize: 10, color: "#E65100", marginTop: 4 }}>Status: Menunggu Pembayaran</div>
                    </td></tr>
                  )}
                  <tr><td colSpan={2} style={{ textAlign: "center", padding: "12px 0 0", fontSize: 11, color: "#666" }}>Terima kasih telah menggunakan Stadione</td></tr>
                </tbody>
              </table>
            </div>
            <div style={{ ...S.flexRow, marginTop: 12, gap: 8 }}>
              <button onClick={() => { window.print(); setInvoice(null) }} style={{ ...S.btnOutline, flex: 1 }}>Cetak</button>
              <button onClick={() => setInvoice(null)} style={{ ...S.btn, flex: 1 }}>Tutup</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
