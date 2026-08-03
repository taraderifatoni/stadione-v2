"use client"

import { TopBar } from "@/components/shared/TopBar"
import { C } from "@/lib/design"
import { ChevronLeft } from "lucide-react"
import { useRouter } from "next/navigation"

export default function Page() {
  const router = useRouter()
  return (
    <div>
      <TopBar title="Privasi & Keamanan" left={<ChevronLeft size={20} color={C.text} onClick={() => router.back()} style={{ cursor: "pointer" }} />} />
      <div style={{ padding: "0 16px 16px", textAlign: "center", paddingTop: 60 }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>📋</div>
        <div style={{ fontSize: 15, fontWeight: 600, color: C.text }}>Privasi & Keamanan</div>
        <div style={{ fontSize: 13, color: C.textMuted, marginTop: 8 }}>Fitur ini akan tersedia segera.</div>
      </div>
    </div>
  )
}
