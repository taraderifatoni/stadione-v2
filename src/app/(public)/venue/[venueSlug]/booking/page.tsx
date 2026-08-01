"use client"

import { useParams, useRouter } from "next/navigation"
import { C } from "@/lib/design"
import { TopBar } from "@/components/shared/TopBar"
import { ChevronLeft, ChevronRight } from "lucide-react"

const courts = [
  { name: "Lap. Futsal A", type: "Futsal · Vinyl", price: "120" },
  { name: "Lap. Futsal B", type: "Futsal · Sintetis", price: "120" },
  { name: "Lap. Basket", type: "Basket · Indoor", price: "150" },
]

export default function VenueBookingPage() {
  const { venueSlug } = useParams<{ venueSlug: string }>()
  const router = useRouter()

  return (
    <div>
      <TopBar title="Booking lapangan" left={<ChevronLeft size={20} color={C.text} onClick={() => router.push(`/venue/${venueSlug}`)} style={{ cursor: "pointer" }} />} />
      <div style={{ padding: "0 16px 16px" }}>
        <div style={{ fontSize: 13, color: C.textMuted, marginBottom: 12 }}>Pilih lapangan</div>
        {courts.map((c, i) => (
          <div key={i} onClick={() => router.push("/booking")} style={{ background: C.surface, borderRadius: 14, padding: 16, border: `1px solid ${C.border}`, marginBottom: 10, cursor: "pointer" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{c.name}</div>
                <div style={{ fontSize: 12, color: C.textMuted, marginTop: 2 }}>{c.type}</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: C.accent, marginTop: 6 }}>Rp {c.price}.000<span style={{ fontWeight: 400, color: C.textMuted }}>/jam</span></div>
              </div>
              <ChevronRight size={18} color={C.textMuted} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
