"use client"
import { useEffect, useState } from "react"
import { TopBar } from "@/components/shared/TopBar"
import { C } from "@/lib/design"
import { ChevronLeft, Save, DollarSign, Trash2 } from "lucide-react"
import { useRouter } from "next/navigation"

export default function AdminFees() {
  const [pct, setPct] = useState("5")
  const [fees, setFees] = useState<any[]>([])
  const [msg, setMsg] = useState("")
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    fetch("https://api.stadione.pro/rest/v1/platform_fee_config?select=*&order=created_at.desc", {
      headers: {"apikey":"eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc4NTI1MjYwMCwiZXhwIjo0OTQwOTI2MjAwLCJyb2xlIjoiYW5vbiJ9.WoeLAuy5jLAlVVQfKJKIIrb870Bt3ZwKtmyBvvksLBY"}
    }).then(r => r.json()).then(setFees).finally(() => setLoading(false))
  }, [])

  async function save() {
    const key = "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc4NTI1MjYwMCwiZXhwIjo0OTQwOTI2MjAwLCJyb2xlIjoic2VydmljZV9yb2xlIn0.oUao5PgOUj94c0DzF_5lmw5eudjaaN8dwjTe9GR9-1Q"
    await fetch("https://api.stadione.pro/rest/v1/platform_fee_config", {
      method: "POST",
      headers: {"apikey":key,"Authorization":"Bearer "+key,"Content-Type":"application/json","Prefer":"resolution=merge-duplicates"},
      body: JSON.stringify({fee_pct:parseFloat(pct),is_active:true})
    })
    const r = await fetch("https://api.stadione.pro/rest/v1/platform_fee_config?select=*", {
      headers: {"apikey":"eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc4NTI1MjYwMCwiZXhwIjo0OTQwOTI2MjAwLCJyb2xlIjoiYW5vbiJ9.WoeLAuy5jLAlVVQfKJKIIrb870Bt3ZwKtmyBvvksLBY"}
    }).then(r => r.json())
    setFees(r)
    setMsg("Fee disimpan")
    setTimeout(() => setMsg(""), 3000)
  }

  return (
    <div>
      <TopBar title="Fee platform" left={<ChevronLeft size={20} color={C.text} onClick={() => router.back()} style={{ cursor: "pointer" }} />} />
      <div style={{ padding: "0 16px 16px" }}>
        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 12, color: C.textSec, marginBottom: 6, display: "block" }}>Komisi per transaksi (%)</label>
          <div style={{ display: "flex", gap: 8 }}>
            <input type="number" value={pct} onChange={e => setPct(e.target.value)} style={{ flex: 1, padding: "10px 12px", background: C.elevated, border: `1px solid ${C.border}`, borderRadius: 10, color: C.text, fontSize: 14, outline: "none", boxSizing: "border-box" }} />
            <button onClick={save} style={{ padding: "10px 16px", borderRadius: 10, border: "none", background: C.primary, color: "#fff", cursor: "pointer" }}><Save size={16} /></button>
          </div>
        </div>
        {msg && <div style={{ fontSize: 12, color: "#4CAF50", marginBottom: 12 }}>{msg}</div>}
        
        <div style={{ fontSize: 14, fontWeight: 600, color: C.text, marginBottom: 8 }}>Konfigurasi Aktif</div>
        {fees.map((f: any) => (
          <div key={f.id} style={{ background: C.surface, borderRadius: 14, padding: 12, border: `1px solid ${C.border}`, marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}><DollarSign size={14} color={C.accent} /><span style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{f.fee_pct}%</span></div>
              <div style={{ fontSize: 11, color: C.textMuted, marginTop: 2 }}>{f.venue_id ? "Per venue" : "Default global"}</div>
            </div>
            <span style={{ fontSize: 11, color: f.is_active ? "#4CAF50" : C.textMuted }}>{f.is_active ? "Aktif" : "Nonaktif"}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
