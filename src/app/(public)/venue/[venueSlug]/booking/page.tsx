"use client"

import { useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { TopBar } from "@/components/shared/TopBar"
import { C } from "@/lib/design"

export default function VenueBookingPage() {
  const { venueSlug } = useParams<{ venueSlug: string }>()
  const router = useRouter()

  useEffect(() => {
    router.replace("/booking")
  }, [])

  return (
    <div>
      <TopBar title="Booking lapangan" />
      <div style={{ padding: "40px 16px", textAlign: "center", color: C.textMuted }}>
        Mengarahkan ke halaman booking...
      </div>
    </div>
  )
}
