"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function VenueBookingPage() {
  const router = useRouter()
  useEffect(() => { router.replace("/booking") }, [])
  return null
}
