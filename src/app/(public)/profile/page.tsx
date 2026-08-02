"use client"

import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { CreditCard, Calendar, Users, Bell, Settings, Shield, LogOut, ChevronRight } from "lucide-react"
import { C } from "@/lib/design"
import { TopBar } from "@/components/shared/TopBar"

const Card = ({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) => (
  <div style={{ background: C.surface, borderRadius: 14, padding: 16, border: `1px solid ${C.border}`, ...style }}>{children}</div>
)

const ListItem = ({ icon: Icon, title, onClick }: { icon: any; title: string; onClick?: () => void }) => (
  <div onClick={onClick} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 0", borderBottom: `1px solid ${C.border}11`, cursor: onClick ? "pointer" : "default" }}>
    <div style={{ width: 40, height: 40, borderRadius: 12, background: C.primary + "18", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
      <Icon size={18} color={C.primaryLight} />
    </div>
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ fontSize: 14, fontWeight: 500, color: C.text }}>{title}</div>
    </div>
    <ChevronRight size={16} color={C.textMuted} />
  </div>
)

const Btn = ({ children, full, onClick, style: s }: { children: React.ReactNode; full?: boolean; onClick?: () => void; style?: React.CSSProperties }) => (
  <button onClick={onClick} style={{ padding: "12px 20px", borderRadius: 10, border: `1px solid ${C.border}`, background: "transparent", color: C.text, fontSize: 14, fontWeight: 600, cursor: "pointer", width: full ? "100%" : "auto", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, ...s }}>{children}</button>
)

const menuItems = [
  { icon: CreditCard, label: "Riwayat pembayaran" },
  { icon: Calendar, label: "Booking aktif" },
  { icon: Users, label: "Anak saya (akademi)" },
  { icon: Bell, label: "Pengaturan notifikasi" },
  { icon: Settings, label: "Pengaturan akun" },
  { icon: Shield, label: "Privasi & keamanan" },
]

export default function ProfilePage() {
  const router = useRouter()
  const supabase = createClient()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push("/login")
    router.refresh()
  }

  return (
    <div>
      <TopBar title="Profil" />
      <div style={{ padding: "0 16px 16px" }}>
        <div style={{ textAlign: "center", padding: "20px 0" }}>
          <div style={{ width: 72, height: 72, borderRadius: 24, background: C.primary, margin: "0 auto 12px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, fontWeight: 800, color: "#fff" }}>T</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: C.text }}>Tara Derifatoni</div>
          <div style={{ fontSize: 13, color: C.textMuted }}>tara@example.com</div>
        </div>

        <Card style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-around", textAlign: "center" }}>
            <div><div style={{ fontSize: 20, fontWeight: 700, color: C.accent }}>24</div><div style={{ fontSize: 11, color: C.textMuted }}>Booking</div></div>
            <div style={{ width: 1, background: C.border }} />
            <div><div style={{ fontSize: 20, fontWeight: 700, color: C.accent }}>86</div><div style={{ fontSize: 11, color: C.textMuted }}>Check-in</div></div>
            <div style={{ width: 1, background: C.border }} />
            <div><div style={{ fontSize: 20, fontWeight: 700, color: C.accent }}>860</div><div style={{ fontSize: 11, color: C.textMuted }}>Poin</div></div>
          </div>
        </Card>

        {menuItems.map((item, i) => (
          <ListItem key={i} icon={item.icon} title={item.label} />
        ))}

        <div style={{ marginTop: 16 }}>
          <Btn full onClick={handleLogout} style={{ color: C.danger, borderColor: C.danger + "44" }}><LogOut size={16} />Keluar</Btn>
        </div>
      </div>
    </div>
  )
}
