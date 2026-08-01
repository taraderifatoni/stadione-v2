"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { TopBar } from "@/components/shared/TopBar"
import { C } from "@/lib/design"
import { ChevronLeft, ChevronRight } from "lucide-react"

const Card = ({ children, style, onClick }: any) => <div onClick={onClick} style={{ background: C.surface, borderRadius: 14, padding: 16, border: `1px solid ${C.border}`, cursor: onClick ? "pointer" : "default", ...style }}>{children}</div>
const Btn = ({ children, primary, full, onClick }: any) => <button onClick={onClick} style={{ padding: "12px 20px", borderRadius: 10, border: primary ? "none" : `1px solid ${C.border}`, background: primary ? C.primary : "transparent", color: primary ? "#fff" : C.text, fontSize: 14, fontWeight: 600, cursor: "pointer", width: full ? "100%" : "auto", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>{children}</button>

export default function BookingPage() {
  const router = useRouter()
  const [step, setStep] = useState<"court" | "slot">("court")
  const [sel, setSel] = useState<number | null>(null)

  const courts = [
    { name: "Lap. Futsal A", type: "Futsal · Vinyl", price: "120" },
    { name: "Lap. Futsal B", type: "Futsal · Sintetis", price: "120" },
    { name: "Lap. Basket", type: "Basket · Indoor", price: "150" },
  ]
  const days = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"]
  const dates = [28, 29, 30, 31, 1, 2, 3]
  const slots = ["08:00", "09:00", "10:00", "11:00", "13:00", "14:00", "15:00", "16:00", "17:00", "19:00", "20:00", "21:00"]
  const booked = [2, 4, 7, 9]

  return (
    <div>
      {step === "court" ? <>
        <TopBar title="Booking lapangan" left={<ChevronLeft size={20} color={C.text} onClick={() => router.push("/")} style={{ cursor: "pointer" }} />} />
        <div style={{ padding: "0 16px 16px" }}>
          <div style={{ fontSize: 13, color: C.textMuted, marginBottom: 12 }}>Pilih lapangan</div>
          {courts.map((c, i) => (
            <Card key={i} onClick={() => setStep("slot")} style={{ marginBottom: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{c.name}</div>
                  <div style={{ fontSize: 12, color: C.textMuted, marginTop: 2 }}>{c.type}</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: C.accent, marginTop: 6 }}>Rp {c.price}.000<span style={{ fontWeight: 400, color: C.textMuted }}>/jam</span></div>
                </div>
                <ChevronRight size={18} color={C.textMuted} />
              </div>
            </Card>
          ))}
        </div>
      </> : <>
        <TopBar title="Pilih slot" sub="Lap. Futsal A" left={<ChevronLeft size={20} color={C.text} onClick={() => setStep("court")} style={{ cursor: "pointer" }} />} />
        <div style={{ padding: "0 16px 16px" }}>
          <div style={{ display: "flex", gap: 0, marginBottom: 16 }}>
            {days.map((d, i) => (
              <button key={i} style={{ flex: 1, padding: "8px 0", display: "flex", flexDirection: "column", alignItems: "center", gap: 4, background: i === 3 ? C.primary : "transparent", borderRadius: 10, border: "none", cursor: "pointer" }}>
                <span style={{ fontSize: 11, color: i === 3 ? "#fff9" : C.textMuted }}>{d}</span>
                <span style={{ fontSize: 15, fontWeight: i === 3 ? 700 : 400, color: i === 3 ? "#fff" : C.text }}>{dates[i]}</span>
              </button>
            ))}
          </div>
          <div style={{ fontSize: 13, color: C.textMuted, marginBottom: 10 }}>Slot tersedia — 31 Juli 2026</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
            {slots.map((s, i) => {
              const isBooked = booked.includes(i); const isSel = sel === i
              return <button key={i} disabled={isBooked} onClick={() => setSel(i)} style={{ padding: "12px 8px", borderRadius: 10, border: isSel ? `2px solid ${C.primaryLight}` : `1px solid ${isBooked ? C.border + "44" : C.border}`, background: isSel ? C.primary + "22" : isBooked ? C.elevated + "44" : "transparent", color: isBooked ? C.textMuted + "66" : isSel ? C.primaryLight : C.text, fontSize: 13, fontWeight: isSel ? 600 : 400, cursor: isBooked ? "not-allowed" : "pointer", opacity: isBooked ? 0.4 : 1 }}>{s}</button>
            })}
          </div>
          {sel !== null && (
            <div style={{ marginTop: 20 }}>
              <Card style={{ background: C.elevated }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}><span style={{ fontSize: 13, color: C.textMuted }}>Lapangan</span><span style={{ fontSize: 13, color: C.text }}>Futsal A</span></div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}><span style={{ fontSize: 13, color: C.textMuted }}>Waktu</span><span style={{ fontSize: 13, color: C.text }}>{slots[sel]} - {slots[sel]?.replace(/(\d+)/, (m: string) => String(+m + 1))}:00</span></div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14 }}><span style={{ fontSize: 13, color: C.textMuted }}>Total</span><span style={{ fontSize: 15, fontWeight: 700, color: C.accent }}>Rp 120.000</span></div>
                <Btn primary full>Bayar sekarang</Btn>
              </Card>
            </div>
          )}
        </div>
      </>}
    </div>
  )
}
