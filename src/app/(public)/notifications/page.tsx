"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { TopBar } from "@/components/shared/TopBar"
import { C } from "@/lib/design"
import { ChevronLeft } from "lucide-react"
import { useRouter } from "next/navigation"

const ICONS: Record<string, string> = { booking: "📅", payment: "💳", membership: "👤", raport: "📊", shift: "🏪", default: "🔔" }

export default function NotificationsPage() {
  const router = useRouter()
  const supabase = createClient()
  const [notifs, setNotifs] = useState<any[]>([])
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) return
      setUser(data.user)
      supabase.from("notifications").select("*").eq("user_id", data.user.id).order("created_at", { ascending: false }).limit(50).then(({ data: n }: any) => setNotifs(n || []))
    })
  }, [])

  async function markRead(id: string) {
    await supabase.from("notifications").update({ is_read: true }).eq("id", id)
    setNotifs(notifs.map(n => n.id === id ? { ...n, is_read: true } : n))
  }

  async function markAllRead() {
    if (!user) return
    await supabase.from("notifications").update({ is_read: true }).eq("user_id", user.id).eq("is_read", false)
    setNotifs(notifs.map(n => ({ ...n, is_read: true })))
  }

  return (
    <div>
      <TopBar title="Notifikasi" left={<ChevronLeft size={20} color={C.text} onClick={() => router.back()} style={{ cursor: "pointer" }} />} right={<span onClick={markAllRead} style={{ fontSize: 12, color: C.primaryLight, cursor: "pointer" }}>Tandai semua</span>} />
      <div style={{ padding: "0 16px 16px" }}>
        {notifs.length === 0 ? <div style={{ textAlign: "center", padding: 60, color: C.textMuted, fontSize: 14 }}>Belum ada notifikasi</div> :
          notifs.map((n: any) => (
            <div key={n.id} onClick={() => !n.is_read && markRead(n.id)} style={{ display: "flex", gap: 12, padding: "14px 0", borderBottom: `1px solid ${C.border}11`, opacity: n.is_read ? 0.5 : 1, cursor: n.is_read ? "default" : "pointer" }}>
              <div style={{ fontSize: 20, flexShrink: 0, marginTop: 2 }}>{ICONS[n.type] || ICONS.default}</div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 14, fontWeight: n.is_read ? 400 : 600, color: C.text }}>{n.title}</span>
                  <span style={{ fontSize: 11, color: C.textMuted }}>{new Date(n.created_at).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}</span>
                </div>
                <div style={{ fontSize: 12, color: C.textMuted, marginTop: 2 }}>{n.body}</div>
              </div>
              {!n.is_read && <div style={{ width: 8, height: 8, borderRadius: 4, background: C.primaryLight, marginTop: 6, flexShrink: 0 }} />}
            </div>
          ))}
      </div>
    </div>
  )
}
