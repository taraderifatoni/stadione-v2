"use client"
import { useRouter } from "next/navigation"
import { TopBar } from "@/components/shared/TopBar"
import { C } from "@/lib/design"
import { ChevronLeft, ChevronRight } from "lucide-react"

export default function AdminSettings() {
  const router = useRouter()
  const items = ["Informasi venue", "Metode pembayaran", "Jadwal operasional", "Integrasi DOKU", "Notifikasi", "Bahasa"]
  return <div>
    <TopBar title="Pengaturan" left={<ChevronLeft size={20} color={C.text} onClick={() => router.back()} style={{ cursor: "pointer" }} />} />
    <div style={{ padding: "0 16px 16px" }}>
      {items.map((item, i) => <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 0", borderBottom: `1px solid ${C.border}11`, cursor: "pointer" }}><span style={{ fontSize: 14, color: C.text }}>{item}</span><ChevronRight size={16} color={C.textMuted} /></div>)}
    </div>
  </div>
}
