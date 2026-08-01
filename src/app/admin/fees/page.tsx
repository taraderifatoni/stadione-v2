"use client"
import { useState } from "react"
import { TopBar } from "@/components/shared/TopBar"
import { C } from "@/lib/design"
import { ChevronLeft, Save, DollarSign } from "lucide-react"
import { useRouter } from "next/navigation"

export default function AdminFees() {
  const [pct, setPct] = useState("5")
  const [msg, setMsg] = useState("")
  const router = useRouter()

  function save() {
    setMsg("Fee platform disimpan")
    setTimeout(() => setMsg(""), 3000)
  }

  return (
    <div>
      <TopBar title="Fee platform" left={<ChevronLeft size={20} color={C.text} onClick={() => router.back()} style={{ cursor: "pointer" }} />} />
      <div style={{ padding: "0 16px 16px" }}>
        <div style={{ marginBottom: 14 }}><label style={{ fontSize: 12, color: C.textSec, marginBottom: 6, display: "block" }}>Komisi per transaksi (%)</label>
          <div style={{ display: "flex", gap: 8 }}>
            <input type="number" value={pct} onChange={e => setPct(e.target.value)} style={{ flex: 1, padding: "10px 12px", background: C.elevated, border: `1px solid ${C.border}`, borderRadius: 10, color: C.text, fontSize: 14, outline: "none", boxSizing: "border-box" }} />
            <button onClick={save} style={{ padding: "10px 16px", borderRadius: 10, border: "none", background: C.primary, color: "#fff", cursor: "pointer" }}><Save size={16} /></button>
          </div>
        </div>
        {msg && <div style={{ fontSize: 12, color: "#4CAF50" }}>{msg}</div>}
        <div style={{ marginTop: 20, padding: 16, background: C.surface, borderRadius: 14, border: `1px solid ${C.border}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}><DollarSign size={16} color={C.accent} /><span style={{ fontSize: 13, color: C.text }}>Fee global</span></div>
          <div style={{ fontSize: 11, color: C.textMuted }}>Diterapkan ke semua venue yang tidak punya override khusus</div>
        </div>
      </div>
    </div>
  )
}
