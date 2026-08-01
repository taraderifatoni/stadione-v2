"use client"
import { TopBar } from "@/components/shared/TopBar"
import { C } from "@/lib/design"
import { useRouter } from "next/navigation"
import { ChevronLeft } from "lucide-react"

export default function ProfileAccountPage() {
  const router = useRouter()
  return (
    <div>
      <TopBar title="Account" left={<ChevronLeft size={20} color={C.text} onClick={() => router.back()} style={{ cursor: "pointer" }} />} />
      <div style={{ padding: "40px 16px", textAlign: "center", color: C.textMuted }}>
        Segera hadir
      </div>
    </div>
  )
}
