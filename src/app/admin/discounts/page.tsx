"use client"
import { useState } from "react"
import { TopBar } from "@/components/shared/TopBar"
import { C } from "@/lib/design"
import { ChevronLeft, Ticket } from "lucide-react"
import { useRouter } from "next/navigation"

export default function AdminDiscounts() {
  const router = useRouter()
  const promos = [{ code: "HARBOLNAS", discount: "20%", valid: "31 Des 2026" }, { code: "NEWUSER", discount: "10%", valid: "30 Sep 2026" }]

  return (
    <div>
      <TopBar title="Diskon platform" left={<ChevronLeft size={20} color={C.text} onClick={() => router.back()} style={{ cursor: "pointer" }} />} />
      <div style={{ padding: "0 16px 16px" }}>
        {promos.map((p, i) => (
          <div key={i} style={{ background: C.surface, borderRadius: 14, padding: 16, border: `1px solid ${C.border}`, marginBottom: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}><Ticket size={16} color={C.primaryLight} /><span style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{p.code}</span></div>
            <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
              <span style={{ fontSize: 12, color: C.accent, fontWeight: 600 }}>{p.discount}</span>
              <span style={{ fontSize: 11, color: C.textMuted }}>Berlaku sampai {p.valid}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
