"use client"

import { useParams, useRouter } from "next/navigation"
import { TopBar } from "@/components/shared/TopBar"
import { C } from "@/lib/design"
import { ChevronLeft } from "lucide-react"

export default function VenueAcademyPage() {
  const { venueSlug } = useParams<{ venueSlug: string }>()
  const router = useRouter()

  return (
    <div>
      <TopBar title="Akademi" left={<ChevronLeft size={20} color={C.text} onClick={() => router.push(`/venue/${venueSlug}`)} style={{ cursor: "pointer" }} />} />
      <div style={{ padding: "0 16px 16px" }}>
        <div style={{ textAlign: "center", padding: 60, color: C.textMuted }}>
          <p style={{ fontSize: 14 }}>Akademi Olahraga</p>
          <p style={{ fontSize: 12, marginTop: 4 }}>Segera hadir</p>
          <button onClick={() => router.push("/academy")} style={{ marginTop: 16, padding: "10px 20px", borderRadius: 10, border: "none", background: C.primary, color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Lihat Program Akademi</button>
        </div>
      </div>
    </div>
  )
}
