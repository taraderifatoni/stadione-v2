"use client"
import { useEffect, useState } from "react"
import { TopBar } from "@/components/shared/TopBar"
import { C } from "@/lib/design"
import { ChevronLeft, Ticket, Plus } from "lucide-react"
import { useRouter } from "next/navigation"

export default function AdminDiscounts() {
  const [discounts, setDiscounts] = useState<any[]>([])
  const [showForm, setShowForm] = useState(false)
  const [code, setCode] = useState("")
  const [discValue, setDiscValue] = useState("")
  const [days, setDays] = useState("30")
  const router = useRouter()

  useEffect(() => {
    fetch("https://api.stadione.pro/rest/v1/platform_discounts?select=*&order=created_at.desc", {
      headers: {"apikey":"eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc4NTI1MjYwMCwiZXhwIjo0OTQwOTI2MjAwLCJyb2xlIjoiYW5vbiJ9.WoeLAuy5jLAlVVQfKJKIIrb870Bt3ZwKtmyBvvksLBY"}
    }).then(r => r.json()).then(setDiscounts)
  }, [])

  async function create() {
    if (!code || !discValue) return
    const key = "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc4NTI1MjYwMCwiZXhwIjo0OTQwOTI2MjAwLCJyb2xlIjoic2VydmljZV9yb2xlIn0.oUao5PgOUj94c0DzF_5lmw5eudjaaN8dwjTe9GR9-1Q"
    const until = new Date(); until.setDate(until.getDate() + parseInt(days))
    await fetch("https://api.stadione.pro/rest/v1/platform_discounts", {
      method: "POST",
      headers: {"apikey":key,"Authorization":"Bearer "+key,"Content-Type":"application/json","Prefer":"return=representation"},
      body: JSON.stringify({name:code,code:code.toUpperCase(),discount_type:"percentage",discount_value:parseFloat(discValue),platform_share_pct:100,valid_until:until.toISOString(),is_active:true})
    })
    const r = await fetch("https://api.stadione.pro/rest/v1/platform_discounts?select=*", {
      headers: {"apikey":"eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc4NTI1MjYwMCwiZXhwIjo0OTQwOTI2MjAwLCJyb2xlIjoiYW5vbiJ9.WoeLAuy5jLAlVVQfKJKIIrb870Bt3ZwKtmyBvvksLBY"}
    }).then(r => r.json())
    setDiscounts(r)
    setShowForm(false); setCode(""); setDiscValue("")
  }

  return (
    <div>
      <TopBar title="Diskon platform" left={<ChevronLeft size={20} color={C.text} onClick={() => router.back()} style={{ cursor: "pointer" }} />} right={<Plus size={18} color={C.primaryLight} onClick={() => setShowForm(true)} style={{ cursor: "pointer" }} />} />
      <div style={{ padding: "0 16px 16px" }}>
        {showForm && (
          <div style={{ background: C.surface, borderRadius: 14, padding: 16, border: `1px solid ${C.border}`, marginBottom: 12 }}>
            <input placeholder="Kode promo" value={code} onChange={e => setCode(e.target.value.toUpperCase())} style={{ width: "100%", padding: "10px 12px", background: C.elevated, border: `1px solid ${C.border}`, borderRadius: 10, color: C.text, fontSize: 14, outline: "none", boxSizing: "border-box", marginBottom: 8 }} />
            <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
              <input type="number" placeholder="Diskon %" value={discValue} onChange={e => setDiscValue(e.target.value)} style={{ flex: 1, padding: "10px 12px", background: C.elevated, border: `1px solid ${C.border}`, borderRadius: 10, color: C.text, fontSize: 14, outline: "none", boxSizing: "border-box" }} />
              <input type="number" placeholder="Masa berlaku (hari)" value={days} onChange={e => setDays(e.target.value)} style={{ flex: 1, padding: "10px 12px", background: C.elevated, border: `1px solid ${C.border}`, borderRadius: 10, color: C.text, fontSize: 14, outline: "none", boxSizing: "border-box" }} />
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => setShowForm(false)} style={{ flex: 1, padding: "10px", borderRadius: 10, border: `1px solid ${C.border}`, background: "transparent", color: C.text, fontSize: 14, cursor: "pointer" }}>Batal</button>
              <button onClick={create} style={{ flex: 1, padding: "10px", borderRadius: 10, border: "none", background: C.primary, color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>Simpan</button>
            </div>
          </div>
        )}
        {discounts.map((d: any) => (
          <div key={d.id} style={{ background: C.surface, borderRadius: 14, padding: 16, border: `1px solid ${C.border}`, marginBottom: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}><Ticket size={16} color={C.primaryLight} /><span style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{d.code}</span></div>
            <div style={{ fontSize: 13, fontWeight: 600, color: C.accent }}>{d.discount_value}%</div>
            <div style={{ fontSize: 11, color: C.textMuted }}>Berlaku sampai {new Date(d.valid_until).toLocaleDateString("id-ID")} · {d.current_usage || 0}/{d.max_total_usage || "∞"} terpakai</div>
          </div>
        ))}
      </div>
    </div>
  )
}
