"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { CreditCard, Calendar, Users, Bell, Settings, Shield, LogOut, ChevronRight } from "lucide-react"
import { C } from "@/lib/design"
import { TopBar } from "@/components/shared/TopBar"

const Card = ({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) => (
  <div style={{ background: C.surface, borderRadius: 14, padding: 16, border: `1px solid ${C.border}`, ...style }}>{children}</div>
)

const ListItem = ({ icon: Icon, title, subtitle, onClick }: { icon: any; title: string; subtitle?: string; onClick?: () => void }) => (
  <div onClick={onClick} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 0", borderBottom: `1px solid ${C.border}11`, cursor: onClick ? "pointer" : "default" }}>
    <div style={{ width: 40, height: 40, borderRadius: 12, background: C.primary + "18", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
      <Icon size={18} color={C.primaryLight} />
    </div>
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ fontSize: 14, fontWeight: 500, color: C.text }}>{title}</div>
      {subtitle && <div style={{ fontSize: 11, color: C.textMuted }}>{subtitle}</div>}
    </div>
    <ChevronRight size={16} color={C.textMuted} />
  </div>
)

const Btn = ({ children, full, onClick, style: s }: { children: React.ReactNode; full?: boolean; onClick?: () => void; style?: React.CSSProperties }) => (
  <button onClick={onClick} style={{ padding: "12px 20px", borderRadius: 10, border: `1px solid ${C.border}`, background: "transparent", color: C.text, fontSize: 14, fontWeight: 600, cursor: "pointer", width: full ? "100%" : "auto", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, ...s }}>{children}</button>
)

export default function ProfilePage() {
  const router = useRouter()
  const supabase = createClient()
  const [user, setUser] = useState<any>(null)
  const [stats, setStats] = useState({ bookings: 0, checkins: 0 })

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setUser(data.user)
        supabase.from("bookings").select("id", { count: "exact", head: true }).eq("user_id", data.user.id).then(({ count }) => setStats(s => ({ ...s, bookings: count || 0 })))
        supabase.from("members").select("id").eq("user_id", data.user.id).eq("status", "active").then(({ data: m }) => {
          if (m?.length) {
            supabase.from("check_ins").select("id", { count: "exact", head: true }).in("member_id", m.map(x => x.id)).then(({ count }) => setStats(s => ({ ...s, checkins: count || 0 })))
          }
        })
      }
    })
  }, [])

  async function handleLogout() {
    await supabase.auth.signOut()
    setUser(null)
    router.push("/login")
    router.refresh()
  }

  const initial = user?.email?.[0]?.toUpperCase() || user?.user_metadata?.name?.[0]?.toUpperCase() || "?"

  if (!user) {
    return (
      <div>
        <TopBar title="Profil" />
        <div style={{ padding: "60px 16px", textAlign: "center" }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>👤</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: C.text, marginBottom: 8 }}>Belum login</div>
          <div style={{ fontSize: 13, color: C.textMuted, marginBottom: 20 }}>Login untuk melihat profil dan riwayat booking Anda.</div>
          <button onClick={() => router.push("/login")} style={{ padding: "12px 28px", borderRadius: 10, border: "none", background: C.primary, color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>Login</button>
        </div>
      </div>
    )
  }

  return (
    <div>
      <TopBar title="Profil" />
      <div style={{ padding: "0 16px 16px" }}>
        <div style={{ textAlign: "center", padding: "20px 0" }}>
          <div style={{ width: 72, height: 72, borderRadius: 24, background: C.primary, margin: "0 auto 12px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, fontWeight: 800, color: "#fff" }}>{initial}</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: C.text }}>{user?.user_metadata?.name || user?.email?.split("@")[0] || "User"}</div>
          <div style={{ fontSize: 13, color: C.textMuted }}>{user?.email || ""}</div>
        </div>

        <Card style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-around", textAlign: "center" }}>
            <div><div style={{ fontSize: 20, fontWeight: 700, color: C.accent }}>{stats.bookings}</div><div style={{ fontSize: 11, color: C.textMuted }}>Booking</div></div>
            <div style={{ width: 1, background: C.border }} />
            <div><div style={{ fontSize: 20, fontWeight: 700, color: C.accent }}>{stats.checkins}</div><div style={{ fontSize: 11, color: C.textMuted }}>Check-in</div></div>
          </div>
        </Card>

        <ListItem icon={Calendar} title="Booking Saya" subtitle="Lihat riwayat & batalkan" onClick={() => router.push("/my-bookings")} />
        <ListItem icon={CreditCard} title="Riwayat pembayaran" />
        <ListItem icon={Bell} title="Pengaturan notifikasi" onClick={() => router.push("/notifications")} />
        <ListItem icon={Settings} title="Pengaturan akun" />

        <div style={{ marginTop: 16 }}>
          <Btn full onClick={handleLogout} style={{ color: C.danger, borderColor: C.danger + "44" }}><LogOut size={16} />Keluar</Btn>
        </div>
      </div>
    </div>
  )
}
