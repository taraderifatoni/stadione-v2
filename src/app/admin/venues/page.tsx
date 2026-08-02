"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { TopBar } from "@/components/shared/TopBar"
import { C } from "@/lib/design"
import { ChevronLeft, Plus, Search } from "lucide-react"

const StatusDot = ({ color }: any) => <span style={{ width: 8, height: 8, borderRadius: 4, background: color, display: "inline-block" }} />
const Badge = ({ children }: any) => <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 8px", borderRadius: 6, background: C.primary + "22", color: C.primaryLight }}>{children}</span>

export default function AdminVenues() {
  const router = useRouter()
  const [venues, setVenues] = useState<any[]>([])

  useEffect(() => {
    fetch("https://api.stadione.pro/rest/v1/venues?select=*&order=created_at.desc&limit=50", {
      headers: {"apikey":"eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc4NTI1MjYwMCwiZXhwIjo0OTQwOTI2MjAwLCJyb2xlIjoiYW5vbiJ9.WoeLAuy5jLAlVVQfKJKIIrb870Bt3ZwKtmyBvvksLBY"}
    }).then(r => r.json()).then(setVenues)
  }, [])

  return <div>
    <TopBar title="Kelola venue" left={<ChevronLeft size={20} color={C.text} onClick={() => router.back()} style={{ cursor: "pointer" }} />} right={<Plus size={20} color={C.primaryLight} />} />
    <div style={{ padding: "0 16px 16px" }}>
      <div style={{ position: "relative", marginBottom: 14 }}>
        <Search size={16} color={C.textMuted} style={{ position: "absolute", left: 12, top: 12 }} />
        <input placeholder="Cari venue..." style={{ width: "100%", padding: "10px 12px 10px 36px", background: C.elevated, border: `1px solid ${C.border}`, borderRadius: 10, color: C.text, fontSize: 14, outline: "none", boxSizing: "border-box" }} />
      </div>
      {venues.length === 0 ? (
        <div style={{ textAlign: "center", padding: 40, color: C.textMuted }}>Memuat venue...</div>
      ) : venues.map((v: any) => (
        <div key={v.id} onClick={() => router.push(`/admin/w/${v.slug}`)} style={{ background: C.surface, borderRadius: 14, padding: 16, border: `1px solid ${C.border}`, marginBottom: 10, cursor: "pointer" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: 8 }}>
            <div><div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{v.name}</div><div style={{ fontSize: 12, color: C.textMuted, marginTop: 2 }}>{v.city || "Yogyakarta"}</div></div>
            <StatusDot color={v.status === "active" ? "#4CAF50" : "#FFB300"} />
          </div>
          <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>{(typeof v.active_domains === "string" ? JSON.parse(v.active_domains) : v.active_domains || ["booking"]).map((d: string) => <Badge key={d}>{d}</Badge>)}</div>
        </div>
      ))}
    </div>
  </div>
}
