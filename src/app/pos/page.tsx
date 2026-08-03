"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { C } from "@/lib/design"
import { makeInvoiceNumber } from "@/lib/constants"
import { Calendar, DollarSign, Wallet, QrCode, ArrowLeftRight, CreditCard, Clock, Printer, Receipt, X } from "lucide-react"

const H = {"apikey":"eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc4NTI1MjYwMCwiZXhwIjo0OTQwOTI2MjAwLCJyb2xlIjoiYW5vbiJ9.WoeLAuy5jLAlVVQfKJKIIrb870Bt3ZwKtmyBvvksLBY"}
const K = "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc4NTI1MjYwMCwiZXhwIjo0OTQwOTI2MjAwLCJyb2xlIjoic2VydmljZV9yb2xlIn0.oUao5PgOUj94c0DzF_5lmw5eudjaaN8dwjTe9GR9-1Q"
const VID = "10109cf7-5dde-4d1c-8829-902b3c447c2e"

export default function PosPage() {
  const router = useRouter()
  const [shift, setShift] = useState<any>(null)
  const [txns, setTxns] = useState<any[]>([])
  const [msg, setMsg] = useState("")
  const [openBal, setOpenBal] = useState("500000")
  const [closeBal, setCloseBal] = useState("")
  const [walkinName, setWalkinName] = useState("")
  const [walkinHours, setWalkinHours] = useState("1")
  const [walkinAmount, setWalkinAmount] = useState("")
  const [walkinMethod, setWalkinMethod] = useState("cash")
  const [splitCash, setSplitCash] = useState("0")
  const [splitQris, setSplitQris] = useState("0")
  const [isSplit, setIsSplit] = useState(false)
  const [showRefund, setShowRefund] = useState(false)
  const [refundTxnId, setRefundTxnId] = useState("")
  const [refundReason, setRefundReason] = useState("")
  const [processing, setProcessing] = useState(false)
  const [authChecked, setAuthChecked] = useState(false)
  const [hasAccess, setHasAccess] = useState(false)

  useEffect(() => {
    setAuthChecked(true)
    // Check if already logged in
    import("@/lib/supabase/client").then(({ createClient }) => {
      createClient().auth.getUser().then(({ data: { user } }) => {
        if (user) { setHasAccess(true); loadShift() }
      })
    })
  }, [])

  async function loadShift() {
    const r = await fetch(`https://api.stadione.pro/rest/v1/shifts?select=*&status=eq.open&venue_id=eq.${VID}&limit=1`, {headers:H}).then(r => r.json())
    const s = r?.[0] || null; setShift(s)
    if (s) {
      const t = await fetch(`https://api.stadione.pro/rest/v1/pos_transactions?select=*&shift_id=eq.${s.id}&order=created_at.desc&limit=20`, {headers:H}).then(r => r.json())
      setTxns(t || [])
    }
  }

  async function openShift() {
    setProcessing(true)
    await fetch("https://api.stadione.pro/rest/v1/shifts", {
      method: "POST", headers: {"apikey":K,"Authorization":"Bearer "+K,"Content-Type":"application/json"},
      body: JSON.stringify({venue_id:VID,staff_id:"b088dfc5-f677-4292-857f-b9b9e07832f9",opening_balance:parseInt(openBal)||0,status:"open"})
    })
    setMsg("Shift dibuka!"); setTimeout(() => setMsg(""), 3000)
    loadShift(); setProcessing(false)
  }

  async function closeShift() {
    if (!shift) return; setProcessing(true)
    const totalCashIn = txns.filter((t:any) => t.payment_method === "cash").reduce((s:number,t:any) => s + (t.amount||0), 0)
    const closingBal = parseInt(closeBal) || (shift.opening_balance + totalCashIn)
    const disc = closingBal - shift.opening_balance - totalCashIn
    await fetch(`https://api.stadione.pro/rest/v1/shifts?id=eq.${shift.id}`, {
      method: "PATCH", headers: {"apikey":K,"Authorization":"Bearer "+K,"Content-Type":"application/json"},
      body: JSON.stringify({status:"closed",closing_balance:closingBal,total_cash_in:totalCashIn,discrepancy:disc,closed_at:new Date().toISOString()})
    })
    setMsg(`Shift ditutup! Selisih: Rp ${disc.toLocaleString("id-ID")}`); setTimeout(() => setMsg(""), 3000)
    setShift(null); setTxns([]); setProcessing(false)
  }

  async function processWalkin() {
    if (!shift || !walkinAmount) return; setProcessing(true)
    const now = new Date()
    const startH = now.getHours(); const endH = startH + parseInt(walkinHours)
    const startTime = `${String(startH).padStart(2,"0")}:00`; const endTime = `${String(endH).padStart(2,"0")}:00`
    const amount = parseInt(walkinAmount)

    // Create booking
    const slots = await fetch(`https://api.stadione.pro/rest/v1/court_slots?select=id&limit=1`, {headers:H}).then(r => r.json())
    const bd = await fetch("https://api.stadione.pro/rest/v1/bookings", {
      method: "POST", headers: {"apikey":K,"Authorization":"Bearer "+K,"Content-Type":"application/json","Prefer":"return=representation"},
      body: JSON.stringify({venue_id:VID,court_slot_id:slots[0]?.id,user_id:"b088dfc5-f677-4292-857f-b9b9e07832f9",booking_date:now.toISOString().split("T")[0],start_time:startTime,end_time:endTime,total_hours:parseInt(walkinHours),base_price:amount,final_price:amount,status:"confirmed"})
    }).then(r => r.json())

    // Create POS transaction
    await fetch("https://api.stadione.pro/rest/v1/pos_transactions", {
      method: "POST", headers: {"apikey":K,"Authorization":"Bearer "+K,"Content-Type":"application/json"},
      body: JSON.stringify({shift_id:shift.id,booking_id:bd[0]?.id,reference_type:"booking",reference_id:bd[0]?.id||"000",amount,payment_method:walkinMethod,payment_details:{customer:walkinName||"Guest"}})
    })

    // Create invoice
    const invNo = makeInvoiceNumber(1)
    const {invoices} = await fetch("https://api.stadione.pro/rest/v1/invoices", {
      method: "POST", headers: {"apikey":K,"Authorization":"Bearer "+K,"Content-Type":"application/json","Prefer":"return=representation"},
      body: JSON.stringify({venue_id:VID,pos_transaction_id:"000",invoice_number:invNo,total_amount:amount})
    }).then(r => r.json() as any)

    setMsg(`Booking walk-in: ${invNo}`); setWalkinName(""); setWalkinAmount("")
    loadShift(); setProcessing(false)
  }

  if (!authChecked) return <div style={{ minHeight: "100vh", background: C.bg }} />
  if (!hasAccess) return (
    <div style={{ minHeight: "100vh", background: C.bg }}>
      <div style={{ background: C.primary, padding: "12px 16px", textAlign: "center" }}>
        <span style={{ fontSize: 16, fontWeight: 800, color: "#fff", letterSpacing: 2 }}>STADIONE POS</span>
      </div>
      <div style={{ maxWidth: 400, margin: "40px auto", padding: 24 }}>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: C.text }}>Masuk POS</div>
          <div style={{ fontSize: 13, color: C.textMuted, marginTop: 4 }}>Login untuk akses kasir</div>
        </div>
        <form onSubmit={async (e) => {
          e.preventDefault()
          const email = (e.target as any).email.value
          const password = (e.target as any).password.value
          const { createClient } = await import("@/lib/supabase/client")
          const supabase = createClient()
          const { error } = await supabase.auth.signInWithPassword({ email, password })
          if (!error) { setHasAccess(true); setAuthChecked(true); loadShift() }
          else setMsg("Email atau kata sandi salah")
        }}>
          <input name="email" type="email" placeholder="Email" required style={{ width: "100%", padding: "10px 12px", background: C.elevated, border: `1px solid ${C.border}`, borderRadius: 10, color: C.text, fontSize: 14, outline: "none", boxSizing: "border-box", marginBottom: 12 }} />
          <input name="password" type="password" placeholder="Kata sandi" required style={{ width: "100%", padding: "10px 12px", background: C.elevated, border: `1px solid ${C.border}`, borderRadius: 10, color: C.text, fontSize: 14, outline: "none", boxSizing: "border-box", marginBottom: 8 }} />
          {msg && <div style={{ fontSize: 12, color: C.danger, marginBottom: 8, textAlign: "center" }}>{msg}</div>}
          <button type="submit" style={{ width: "100%", padding: "12px", borderRadius: 10, border: "none", background: C.primary, color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>Masuk</button>
        </form>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: "100vh", background: C.bg }}>
      <div style={{ background: C.primary, padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: 16, fontWeight: 800, color: "#fff", letterSpacing: 2 }}>STADIONE POS</span>
        <span style={{ fontSize: 11, color: "#fff9" }}>Kasir</span>
      </div>
      <div style={{ padding: 16, maxWidth: 480, margin: "0 auto" }}>
        {msg && <div style={{ background: C.successBg, color: "#4CAF50", padding: 10, borderRadius: 10, fontSize: 13, textAlign: "center", marginBottom: 12 }}>{msg}</div>}

        {!shift ? (
          <div style={{ background: C.surface, borderRadius: 14, padding: 16, border: `1px solid ${C.border}`, marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}><Clock size={18} color={C.primaryLight} /><span style={{ fontSize: 15, fontWeight: 700, color: C.text }}>Buka Shift</span></div>
            <input type="number" placeholder="Kas awal (Rp)" value={openBal} onChange={e => setOpenBal(e.target.value)} style={{ width: "100%", padding: "10px 12px", background: C.elevated, border: `1px solid ${C.border}`, borderRadius: 10, color: C.text, fontSize: 14, outline: "none", boxSizing: "border-box", marginBottom: 8 }} />
            <button onClick={openShift} disabled={processing} style={{ width: "100%", padding: "10px", borderRadius: 10, border: "none", background: C.primary, color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>{processing ? "..." : "Buka Shift"}</button>
          </div>
        ) : (
          <>
            <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
              <div style={{ flex: 1, background: C.surface, borderRadius: 14, padding: 14, border: `1px solid ${C.border}` }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}><div style={{ width: 28, height: 28, borderRadius: 8, background: "#4CAF5018", display: "flex", alignItems: "center", justifyContent: "center" }}><DollarSign size={14} color="#4CAF50" /></div><span style={{ fontSize: 11, color: C.textMuted }}>Kas awal</span></div>
                <div style={{ fontSize: 20, fontWeight: 700, color: C.text }}>Rp {shift.opening_balance?.toLocaleString("id-ID")}</div>
              </div>
              <div style={{ flex: 1, background: C.surface, borderRadius: 14, padding: 14, border: `1px solid ${C.border}` }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}><div style={{ width: 28, height: 28, borderRadius: 8, background: C.primary+"18", display: "flex", alignItems: "center", justifyContent: "center" }}><Calendar size={14} color={C.primaryLight} /></div><span style={{ fontSize: 11, color: C.textMuted }}>Transaksi</span></div>
                <div style={{ fontSize: 20, fontWeight: 700, color: C.text }}>{txns.length}</div>
              </div>
            </div>

            <div style={{ background: C.surface, borderRadius: 14, padding: 16, border: `1px solid ${C.border}`, marginBottom: 16 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: C.text, marginBottom: 12 }}>Walk-in Booking</div>
              <input placeholder="Nama pelanggan" value={walkinName} onChange={e => setWalkinName(e.target.value)} style={{ width: "100%", padding: "10px 12px", background: C.elevated, border: `1px solid ${C.border}`, borderRadius: 10, color: C.text, fontSize: 14, outline: "none", boxSizing: "border-box", marginBottom: 8 }} />
              <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                <input type="number" placeholder="Jam" value={walkinHours} onChange={e => setWalkinHours(e.target.value)} style={{ flex: 1, padding: "10px 12px", background: C.elevated, border: `1px solid ${C.border}`, borderRadius: 10, color: C.text, fontSize: 14, outline: "none", boxSizing: "border-box" }} />
                <input type="number" placeholder="Total (Rp)" value={walkinAmount} onChange={e => setWalkinAmount(e.target.value)} style={{ flex: 2, padding: "10px 12px", background: C.elevated, border: `1px solid ${C.border}`, borderRadius: 10, color: C.text, fontSize: 14, outline: "none", boxSizing: "border-box" }} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 4, marginBottom: 8 }}>
                {[{m:"Cash"},{m:"QRIS"},{m:"Transfer"},{m:"Debit"}].map(p => (
                  <button key={p.m} onClick={() => setWalkinMethod(p.m.toLowerCase())} style={{ padding: "8px", borderRadius: 8, border: walkinMethod===p.m.toLowerCase()?"none":`1px solid ${C.border}`, background: walkinMethod===p.m.toLowerCase()?C.primary:"transparent", color: walkinMethod===p.m.toLowerCase()?"#fff":C.textMuted, fontSize: 12, cursor: "pointer" }}>{p.m}</button>
                ))}
              </div>
              <button onClick={processWalkin} disabled={processing||!walkinAmount} style={{ width: "100%", padding: "10px", borderRadius: 10, border: "none", background: C.primary, color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}><Receipt size={16} />{processing?"Memproses...":"Proses + Buat Invoice"}</button>
            </div>

            <div style={{ fontSize: 14, fontWeight: 600, color: C.text, marginBottom: 8 }}>Transaksi hari ini</div>
            {txns.map((t: any) => (
              <div key={t.id} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: `1px solid ${C.border}44` }}>
                <div><div style={{ fontSize: 13, color: C.text }}>{t.reference_type} · {t.payment_method}</div><div style={{ fontSize: 11, color: C.textMuted }}>{new Date(t.created_at).toLocaleTimeString("id-ID")}</div></div>
                <span style={{ fontSize: 13, fontWeight: 600, color: C.accent }}>Rp {t.amount?.toLocaleString("id-ID")}</span>
              </div>
            ))}

            <div style={{ marginTop: 16, background: C.surface, borderRadius: 14, padding: 16, border: `1px solid ${C.border}`, marginBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}><Clock size={18} color={C.primaryLight} /><span style={{ fontSize: 15, fontWeight: 700, color: C.text }}>Refund</span></div>
              {!showRefund ? (
                <button onClick={() => setShowRefund(true)} style={{ width: "100%", padding: "10px", borderRadius: 10, border: `1px solid ${C.border}`, background: "transparent", color: C.text, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>Ajukan Refund</button>
              ) : (
                <>
                  <input placeholder="ID transaksi" value={refundTxnId} onChange={e => setRefundTxnId(e.target.value)} style={{ width: "100%", padding: "10px 12px", background: C.elevated, border: `1px solid ${C.border}`, borderRadius: 10, color: C.text, fontSize: 14, outline: "none", boxSizing: "border-box", marginBottom: 8 }} />
                  <input placeholder="Alasan refund" value={refundReason} onChange={e => setRefundReason(e.target.value)} style={{ width: "100%", padding: "10px 12px", background: C.elevated, border: `1px solid ${C.border}`, borderRadius: 10, color: C.text, fontSize: 14, outline: "none", boxSizing: "border-box", marginBottom: 8 }} />
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={() => setShowRefund(false)} style={{ flex: 1, padding: "10px", borderRadius: 10, border: `1px solid ${C.border}`, background: "transparent", color: C.text, fontSize: 14, cursor: "pointer" }}>Batal</button>
                    <button onClick={async () => {
                      if(!refundTxnId) return
                      await fetch("https://api.stadione.pro/rest/v1/refunds", {
                        method: "POST", headers: {"apikey":K,"Authorization":"Bearer "+K,"Content-Type":"application/json"},
                        body: JSON.stringify({pos_transaction_id:refundTxnId,reason:refundReason||"Refund",amount:0,requested_by:"b088dfc5-f677-4292-857f-b9b9e07832f9"})
                      })
                      setMsg("Refund diajukan!"); setShowRefund(false); setRefundTxnId(""); setRefundReason("")
                    }} style={{ flex: 1, padding: "10px", borderRadius: 10, border: "none", background: C.primary, color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>Kirim</button>
                  </div>
                </>
              )}
            </div>

            <div style={{ marginTop: 16, background: C.surface, borderRadius: 14, padding: 16, border: `1px solid ${C.border}` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}><Clock size={18} color={C.primaryLight} /><span style={{ fontSize: 15, fontWeight: 700, color: C.text }}>Tutup Shift</span></div>
              <input type="number" placeholder="Kas akhir (Rp)" value={closeBal} onChange={e => setCloseBal(e.target.value)} style={{ width: "100%", padding: "10px 12px", background: C.elevated, border: `1px solid ${C.border}`, borderRadius: 10, color: C.text, fontSize: 14, outline: "none", boxSizing: "border-box", marginBottom: 8 }} />
              <button onClick={closeShift} disabled={processing} style={{ width: "100%", padding: "10px", borderRadius: 10, border: `1px solid ${C.danger}44`, background: "transparent", color: C.danger, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>{processing?"...":"Tutup Shift"}</button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
