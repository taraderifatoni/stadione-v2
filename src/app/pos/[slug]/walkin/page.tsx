"use client"
import { useParams, useRouter } from "next/navigation"
import { C } from "@/lib/design"
import { ChevronLeft } from "lucide-react"

export default function PosWalkinPage() {
  const { slug } = useParams<{ slug: string }>()
  const router = useRouter()
  return (
    <div style={{ background: C.bg, minHeight: "100vh" }}>
      <div style={{ background: C.primary, padding: "12px 16px", display: "flex", alignItems: "center", gap: 8 }}>
        <ChevronLeft size={18} color="#fff" onClick={() => router.back()} style={{ cursor: "pointer" }} />
        <span style={{ color: "#fff", fontSize: 14, fontWeight: 600 }}>Walkin</span>
      </div>
      <div style={{ padding: "40px 16px", textAlign: "center", color: C.textMuted }}>Segera hadir</div>
    </div>
  )
}
