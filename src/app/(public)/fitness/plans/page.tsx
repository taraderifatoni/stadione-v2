"use client"

import { useRouter } from "next/navigation"
import { ChevronLeft, Star, Check } from "lucide-react"
import { C } from "@/lib/design"
import { TopBar } from "@/components/shared/TopBar"

const Card = ({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) => (
  <div style={{ background: C.surface, borderRadius: 14, padding: 16, border: `1px solid ${C.border}`, ...style }}>{children}</div>
)

const Btn = ({ children, primary, full, onClick, style: s }: { children: React.ReactNode; primary?: boolean; full?: boolean; onClick?: () => void; style?: React.CSSProperties }) => (
  <button onClick={onClick} style={{ padding: "12px 20px", borderRadius: 10, border: primary ? "none" : `1px solid ${C.border}`, background: primary ? C.primary : "transparent", color: primary ? "#fff" : C.text, fontSize: 14, fontWeight: 600, cursor: "pointer", width: full ? "100%" : "auto", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, ...s }}>{children}</button>
)

export default function FitnessPlanPage() {
  const router = useRouter()
  const benefits = [
    "Akses gym unlimited",
    "Unlimited kelas group",
    "1 guest pass/bulan",
    "20% diskon booking lapangan",
    "Prioritas antrian",
  ]

  return (
    <div>
      <TopBar
        title="Gold membership"
        left={<ChevronLeft size={20} color={C.text} onClick={() => router.back()} style={{ cursor: "pointer" }} />}
      />
      <div style={{ padding: "0 16px 16px" }}>
        <div style={{ textAlign: "center", padding: "24px 0" }}>
          <div style={{ width: 56, height: 56, borderRadius: 28, background: "#FFD70033", margin: "0 auto 12px", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Star size={24} color="#FFD700" fill="#FFD700" />
          </div>
          <div style={{ fontSize: 22, fontWeight: 800, color: C.text }}>Gold</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: C.accent, marginTop: 4 }}>Rp 500.000<span style={{ fontSize: 14, fontWeight: 400, color: C.textMuted }}>/bulan</span></div>
        </div>
        <Card style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 10 }}>Benefit</div>
          {benefits.map((b, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0" }}>
              <Check size={14} color="#4CAF50" />
              <span style={{ fontSize: 13, color: C.textSec }}>{b}</span>
            </div>
          ))}
        </Card>
        <Btn primary full>Daftar sekarang</Btn>
        <div style={{ textAlign: "center", fontSize: 12, color: C.textMuted, marginTop: 10 }}>Pembayaran melalui DOKU</div>
      </div>
    </div>
  )
}
