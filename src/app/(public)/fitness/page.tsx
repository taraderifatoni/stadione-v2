"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { ChevronLeft, Bell, Check, Star, Activity, TrendingUp, Crown, ShoppingCart } from "lucide-react"
import { C } from "@/lib/design"
import { TopBar } from "@/components/shared/TopBar"

export default function FitnessPage() {
  const router = useRouter()
  const supabase = createClient()
  const [user, setUser] = useState<any>(null)
  const [member, setMember] = useState<any>(null)
  const [plans, setPlans] = useState<any[]>([])
  const [packages, setPackages] = useState<any[]>([])
  const [venues, setVenues] = useState<any[]>([])
  const [selectedVenue, setSelectedVenue] = useState<any>(null)
  const [tab, setTab] = useState("Plans")
  const [checkins, setCheckins] = useState<any[]>([])
  const [msg, setMsg] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setUser(data.user)
    })
    supabase.from("venues").select("id, name, slug").eq("status", "active").limit(20).then(({ data: v }: any) => {
      setVenues(v || [])
    })
  }, [])

  useEffect(() => {
    if (!selectedVenue) return
    supabase.from("membership_plans").select("*").eq("venue_id", selectedVenue.id).eq("is_active", true).order("tier_level").then(({ data }: any) => setPlans(data || []))
    supabase.from("visit_packages").select("*").eq("venue_id", selectedVenue.id).eq("is_active", true).order("visit_count").then(({ data }: any) => setPackages(data || []))
    if (user) loadMemberStatus(selectedVenue.id)
  }, [selectedVenue, user])

  async function loadMemberStatus(vid: string) {
    const { data: m } = await supabase.from("members").select("*, plans:plan_id(name, tier_level)").eq("user_id", user.id).eq("venue_id", vid).eq("status", "active").single()
    setMember(m || null)
    if (m) {
      const { data: ci } = await supabase.from("check_ins").select("*").eq("member_id", m.id).order("checked_in_at", { ascending: false }).limit(20)
      setCheckins(ci || [])
    }
  }

  async function registerMembership(planId: string) {
    if (!user || !selectedVenue) { setMsg("Login dulu ya"); return }
    setLoading(true)
    const plan = plans.find(p => p.id === planId)
    if (!plan) { setLoading(false); return }

    const endDate = new Date()
    if (plan.billing_cycle === "monthly") endDate.setMonth(endDate.getMonth() + 1)
    else if (plan.billing_cycle === "quarterly") endDate.setMonth(endDate.getMonth() + 3)
    else endDate.setFullYear(endDate.getFullYear() + 1)

    const { data: m, error } = await supabase.from("members").insert({
      user_id: user.id, venue_id: selectedVenue.id, plan_id: planId,
      start_date: new Date().toISOString().split("T")[0], end_date: endDate.toISOString().split("T")[0],
      status: "active",
    }).select().single()

    if (error) { setMsg("Gagal daftar: " + error.message); setLoading(false); return }

    // DOKU payment
    try {
      const res = await fetch("/api/payment/create", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: Number(plan.price), itemName: `Membership ${plan.name}`, userName: user.email, userEmail: user.email, referenceType: "membership", referenceId: m.id }),
      })
      const doku = await res.json()
      if (doku.payment_url) window.open(doku.payment_url, "_blank")
    } catch {}

    setMsg("Pendaftaran sukses! Arahkan ke halaman pembayaran.")
    loadMemberStatus(selectedVenue.id)
    setLoading(false)
  }

  async function buyPackage(pkgId: string) {
    if (!user || !selectedVenue) { setMsg("Login dulu ya"); return }
    setLoading(true)
    const pkg = packages.find(p => p.id === pkgId)
    if (!pkg) { setLoading(false); return }

    // If not yet a member, create member first
    let mid = member?.id
    if (!mid) {
      const endDate = new Date(); endDate.setFullYear(endDate.getFullYear() + 1)
      const { data: m } = await supabase.from("members").insert({
        user_id: user.id, venue_id: selectedVenue.id, start_date: new Date().toISOString().split("T")[0], end_date: endDate.toISOString().split("T")[0], status: "active",
      }).select().single()
      mid = m?.id
    }

    if (!mid) { setMsg("Gagal membuat member"); setLoading(false); return }

    await supabase.from("member_visit_packages").insert({
      member_id: mid, package_id: pkgId, remaining_visits: pkg.visit_count, expires_at: new Date(Date.now() + pkg.validity_days * 86400000).toISOString(),
    })

    setMsg(`Paket ${pkg.name} dibeli! (${pkg.visit_count}x kunjungan)`)
    loadMemberStatus(selectedVenue.id)
    setLoading(false)
  }

  const Card = ({ children, style, onClick }: any) => (
    <div onClick={onClick} style={{ background: C.surface, borderRadius: 14, padding: 16, border: `1px solid ${C.border}`, cursor: onClick ? "pointer" : "default", ...style }}>{children}</div>
  )
  const TabBar = ({ tabs, active, onChange }: { tabs: string[]; active: string; onChange: (t: string) => void }) => (
    <div style={{ display: "flex", gap: 0, borderBottom: `1px solid ${C.border}`, marginBottom: 16 }}>
      {tabs.map(t => (
        <button key={t} onClick={() => onChange(t)} style={{ flex: 1, padding: "10px 0", fontSize: 13, fontWeight: active === t ? 600 : 400, color: active === t ? C.text : C.textMuted, background: "none", border: "none", borderBottom: active === t ? `2px solid ${C.primaryLight}` : "2px solid transparent", cursor: "pointer" }}>{t}</button>
      ))}
    </div>
  )
  const Btn = ({ children, primary, full, onClick, style: s, disabled }: any) => (
    <button onClick={onClick} disabled={disabled} style={{ padding: "12px 20px", borderRadius: 10, border: primary ? "none" : `1px solid ${C.border}`, background: primary ? C.primary : "transparent", color: primary ? "#fff" : C.text, fontSize: 14, fontWeight: 600, cursor: disabled ? "not-allowed" : "pointer", width: full ? "100%" : "auto", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, opacity: disabled ? 0.5 : 1, ...s }}>{children}</button>
  )

  return (
    <div>
      <TopBar title="Fitness & Membership" left={<ChevronLeft size={20} color={C.text} onClick={() => router.push("/")} style={{ cursor: "pointer" }} />} right={<Bell size={20} color={C.textSec} onClick={() => router.push("/notifications")} style={{ cursor: "pointer" }} />} />
      <div style={{ padding: "0 16px 16px" }}>

        {/* Venue selector */}
        <div style={{ display: "flex", gap: 4, overflowX: "auto", padding: "0 0 12px" }}>
          {venues.map((v: any) => (
            <button key={v.id} onClick={() => setSelectedVenue(v)} style={{ padding: "8px 14px", borderRadius: 20, border: selectedVenue?.id === v.id ? "none" : `1px solid ${C.border}`, background: selectedVenue?.id === v.id ? C.primary : C.surface, color: selectedVenue?.id === v.id ? "#fff" : C.textSec, fontSize: 12, whiteSpace: "nowrap", cursor: "pointer" }}>{v.name}</button>
          ))}
        </div>

        {msg && <div style={{ background: C.successBg, color: "#4CAF50", padding: 10, borderRadius: 10, fontSize: 13, textAlign: "center", marginBottom: 12 }}>{msg}</div>}

        {!selectedVenue && <div style={{ textAlign: "center", padding: 40, color: C.textMuted }}>Pilih venue untuk lihat paket membership</div>}

        {selectedVenue && (
          <>
            {/* Member Status Banner */}
            {member && (
              <Card style={{ background: `linear-gradient(135deg, ${C.primary}44 0%, ${C.primaryDark}44 100%)`, border: `1px solid ${C.primary}44`, marginBottom: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 600, padding: "3px 8px", borderRadius: 6, background: C.successBg, color: "#4CAF50", display: "inline-block" }}>Aktif</div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: C.text, marginTop: 8 }}>{member.plans?.name || "Member"}</div>
                    <div style={{ fontSize: 12, color: C.textMuted, marginTop: 2 }}>Berlaku hingga {new Date(member.end_date).toLocaleDateString("id-ID")}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 11, color: C.textMuted }}>Check-in</div>
                    <div style={{ fontSize: 24, fontWeight: 800, color: C.accent }}>{checkins.length}</div>
                  </div>
                </div>
              </Card>
            )}

            <TabBar tabs={["Plans", "Kunjungan"]} active={tab} onChange={setTab} />

            {tab === "Plans" && (
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: C.textSec, marginBottom: 8 }}>Paket Membership</div>
                {plans.length === 0 ? <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 12 }}>Belum ada paket</div> :
                  plans.map((p: any) => (
                    <Card key={p.id} style={{ marginBottom: 10, border: member?.plan_id === p.id ? `2px solid ${C.primaryLight}` : `1px solid ${C.border}` }}>
                      {member?.plan_id === p.id && <div style={{ fontSize: 10, fontWeight: 700, color: C.primaryLight, marginBottom: 6 }}>PAKET AKTIF</div>}
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}><Crown size={14} color={C.accent} /><span style={{ fontSize: 15, fontWeight: 700, color: C.text }}>{p.name}</span></div>
                          <div style={{ fontSize: 11, color: C.textMuted, marginTop: 4 }}>
                            Tier {p.tier_level} · {p.billing_cycle === "monthly" ? "Bulanan" : p.billing_cycle === "quarterly" ? "3 Bulan" : "Tahunan"}
                          </div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <div style={{ fontSize: 18, fontWeight: 700, color: C.accent }}>Rp {Number(p.price).toLocaleString("id-ID")}</div>
                          {member?.plan_id !== p.id && <Btn primary onClick={() => registerMembership(p.id)} disabled={loading} style={{ marginTop: 4, padding: "6px 14px", fontSize: 12 }}>{loading ? "..." : "Daftar"}</Btn>}
                        </div>
                      </div>
                    </Card>
                  ))}
              </div>
            )}

            {tab === "Kunjungan" && (
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: C.textSec, marginBottom: 8 }}>Paket Kunjungan</div>
                {packages.length === 0 ? <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 12 }}>Belum ada paket kunjungan</div> :
                  packages.map((p: any) => (
                    <Card key={p.id} style={{ marginBottom: 10 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{p.name}</div>
                          <div style={{ fontSize: 11, color: C.textMuted, marginTop: 2 }}>{p.visit_count}x Kunjungan · {p.validity_days} hari</div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <div style={{ fontSize: 18, fontWeight: 700, color: C.accent }}>Rp {Number(p.price).toLocaleString("id-ID")}</div>
                          <Btn primary onClick={() => buyPackage(p.id)} disabled={loading} style={{ marginTop: 4, padding: "6px 14px", fontSize: 12 }}><ShoppingCart size={12} />Beli</Btn>
                        </div>
                      </div>
                    </Card>
                  ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
