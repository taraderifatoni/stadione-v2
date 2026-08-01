"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ChevronLeft, Bell, Check, Star, Activity, TrendingUp } from "lucide-react"
import { C } from "@/lib/design"
import { TopBar } from "@/components/shared/TopBar"

const Badge = ({ children, color = C.primary, bg }: { children: React.ReactNode; color?: string; bg?: string }) => (
  <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 8px", borderRadius: 6, background: bg || color + "22", color: color === C.primary ? C.primaryLight : color, letterSpacing: 0.3 }}>{children}</span>
)

const Card = ({ children, style, onClick }: { children: React.ReactNode; style?: React.CSSProperties; onClick?: () => void }) => (
  <div onClick={onClick} style={{ background: C.surface, borderRadius: 14, padding: 16, border: `1px solid ${C.border}`, cursor: onClick ? "pointer" : "default", ...style }}>{children}</div>
)

const StatCard = ({ icon: Icon, label, value, color }: { icon: any; label: string; value: string; color?: string }) => (
  <Card style={{ flex: 1, minWidth: 0 }}>
    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
      <div style={{ width: 28, height: 28, borderRadius: 8, background: (color || C.primary) + "18", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Icon size={14} color={color || C.primaryLight} />
      </div>
      <span style={{ fontSize: 11, color: C.textMuted }}>{label}</span>
    </div>
    <div style={{ fontSize: 20, fontWeight: 700, color: C.text }}>{value}</div>
  </Card>
)

const Btn = ({ children, primary, full, small, onClick, style: s }: { children: React.ReactNode; primary?: boolean; full?: boolean; small?: boolean; onClick?: () => void; style?: React.CSSProperties }) => (
  <button onClick={onClick} style={{ padding: small ? "8px 14px" : "12px 20px", borderRadius: 10, border: primary ? "none" : `1px solid ${C.border}`, background: primary ? C.primary : "transparent", color: primary ? "#fff" : C.text, fontSize: small ? 12 : 14, fontWeight: 600, cursor: "pointer", width: full ? "100%" : "auto", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, ...s }}>{children}</button>
)

const TabBar = ({ tabs, active, onChange }: { tabs: string[]; active: string; onChange: (t: string) => void }) => (
  <div style={{ display: "flex", gap: 0, borderBottom: `1px solid ${C.border}`, marginBottom: 16 }}>
    {tabs.map(t => (
      <button key={t} onClick={() => onChange(t)} style={{ flex: 1, padding: "10px 0", fontSize: 13, fontWeight: active === t ? 600 : 400, color: active === t ? C.text : C.textMuted, background: "none", border: "none", borderBottom: active === t ? `2px solid ${C.primaryLight}` : "2px solid transparent", cursor: "pointer" }}>{t}</button>
    ))}
  </div>
)

export default function FitnessPage() {
  const router = useRouter()
  const [tab, setTab] = useState("Plans")

  const plans = [
    { name: "Bronze", price: "150", feat: ["Akses gym", "1 kelas/minggu"], color: "#CD7F32" },
    { name: "Silver", price: "300", feat: ["Akses gym", "Unlimited kelas", "10% diskon booking"], color: "#C0C0C0" },
    { name: "Gold", price: "500", feat: ["Semua Silver", "Guest pass/bulan", "20% diskon"], color: "#FFD700", current: true },
    { name: "Platinum", price: "800", feat: ["Semua Gold", "Priority booking", "Free treatment"], color: C.accent },
  ]

  const visits = [
    { date: "31 Jul", time: "07:15" },
    { date: "30 Jul", time: "16:30" },
    { date: "28 Jul", time: "08:00" },
    { date: "26 Jul", time: "07:45" },
  ]

  const rewards = [
    "Diskon booking 20% — 200 poin",
    "Upgrade tier 1 bulan — 500 poin",
    "Merchandise — 300 poin",
  ]

  return (
    <div>
      <TopBar
        title="Fitness & studio"
        left={<ChevronLeft size={20} color={C.text} onClick={() => router.push("/")} style={{ cursor: "pointer" }} />}
        right={<Bell size={20} color={C.textSec} onClick={() => router.push("/notifications")} style={{ cursor: "pointer" }} />}
      />
      <div style={{ padding: "0 16px 16px" }}>
        <Card style={{ background: `linear-gradient(135deg, ${C.primary}44 0%, ${C.primaryDark}44 100%)`, border: `1px solid ${C.primary}44`, marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <Badge color="#4CAF50" bg={C.successBg}>Aktif</Badge>
              <div style={{ fontSize: 16, fontWeight: 700, color: C.text, marginTop: 8 }}>Gold Member</div>
              <div style={{ fontSize: 12, color: C.textMuted, marginTop: 2 }}>Berlaku hingga 15 Agu 2026</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 11, color: C.textMuted }}>Visit tersisa</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: C.accent }}>18</div>
            </div>
          </div>
        </Card>

        <TabBar tabs={["Plans", "Kunjungan", "Reward"]} active={tab} onChange={setTab} />

        {tab === "Plans" && <>
          {plans.map((p, i) => (
            <Card key={i} onClick={() => router.push("/fitness/plans")} style={{ marginBottom: 10, border: p.current ? `2px solid ${C.primaryLight}` : `1px solid ${C.border}` }}>
              {p.current && <div style={{ fontSize: 10, fontWeight: 700, color: C.primaryLight, marginBottom: 6, letterSpacing: 1 }}>PAKET AKTIF</div>}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <div style={{ width: 10, height: 10, borderRadius: 5, background: p.color }} />
                    <span style={{ fontSize: 15, fontWeight: 700, color: C.text }}>{p.name}</span>
                  </div>
                  <div style={{ marginTop: 8 }}>
                    {p.feat.map((f, j) => <div key={j} style={{ fontSize: 12, color: C.textMuted, display: "flex", alignItems: "center", gap: 6, marginTop: 3 }}><Check size={12} color="#4CAF50" />{f}</div>)}
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 18, fontWeight: 700, color: C.accent }}>Rp {p.price}rb</div>
                  <div style={{ fontSize: 11, color: C.textMuted }}>/bulan</div>
                </div>
              </div>
            </Card>
          ))}
        </>}

        {tab === "Kunjungan" && <>
          <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
            <StatCard icon={Activity} label="Bulan ini" value="12" color="#4CAF50" />
            <StatCard icon={TrendingUp} label="Total" value="86" color={C.primaryLight} />
          </div>
          {visits.map((v, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: `1px solid ${C.border}11` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}><Check size={14} color="#4CAF50" /><span style={{ fontSize: 13, color: C.text }}>{v.date} 2026</span></div>
              <span style={{ fontSize: 13, color: C.textMuted }}>{v.time}</span>
            </div>
          ))}
        </>}

        {tab === "Reward" && <>
          <Card style={{ textAlign: "center", marginBottom: 16, background: C.elevated }}>
            <div style={{ fontSize: 11, color: C.textMuted }}>Total poin</div>
            <div style={{ fontSize: 32, fontWeight: 800, color: C.accent, margin: "4px 0" }}>860</div>
            <div style={{ fontSize: 12, color: C.textMuted }}>Tukar dengan reward</div>
          </Card>
          {rewards.map((r, i) => (
            <Card key={i} style={{ marginBottom: 8, padding: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 13, color: C.text }}>{r}</span>
                <Btn small primary>Tukar</Btn>
              </div>
            </Card>
          ))}
        </>}
      </div>
    </div>
  )
}
