"use client"

import { TopBar } from "@/components/shared/TopBar"
import { C } from "@/lib/design"
import { ChevronLeft } from "lucide-react"
import { useRouter } from "next/navigation"

export default function NotificationsPage() {
  const router = useRouter()

  const notifs = [
    { type: "booking", title: "Booking dikonfirmasi", body: "Lap. Futsal A, 15:00-16:00", time: "1m", unread: true },
    { type: "raport", title: "Raport Juli diterbitkan", body: "Ahmad — U-14 Elite", time: "2j", unread: true },
    { type: "membership", title: "Membership akan expired", body: "Gold — 3 hari lagi", time: "1h", unread: true },
    { type: "payment", title: "Pembayaran berhasil", body: "Booking #BK-2607 — Rp 120.000", time: "2h", unread: false },
    { type: "booking", title: "Reminder booking besok", body: "Lap. Basket, 10:00-12:00", time: "5h", unread: false },
  ]

  return (
    <div>
      <TopBar title="Notifikasi" left={<ChevronLeft size={20} color={C.text} onClick={() => router.back()} style={{ cursor: "pointer" }} />} right={<span style={{ fontSize: 12, color: C.primaryLight, cursor: "pointer" }}>Tandai semua</span>} />
      <div style={{ padding: "0 16px 16px" }}>
        {notifs.map((n, i) => (
          <div key={i} style={{ display: "flex", gap: 12, padding: "14px 0", borderBottom: `1px solid ${C.border}11`, opacity: n.unread ? 1 : 0.6 }}>
            {n.unread ? <div style={{ width: 8, height: 8, borderRadius: 4, background: C.primaryLight, marginTop: 6, flexShrink: 0 }} /> : <div style={{ width: 8, flexShrink: 0 }} />}
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ fontSize: 14, fontWeight: n.unread ? 600 : 400, color: C.text }}>{n.title}</span><span style={{ fontSize: 11, color: C.textMuted }}>{n.time}</span></div>
              <div style={{ fontSize: 12, color: C.textMuted, marginTop: 2 }}>{n.body}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
