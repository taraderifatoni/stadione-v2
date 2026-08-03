"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { ChevronLeft, Star, Check, Crown } from "lucide-react"
import { C } from "@/lib/design"
import { TopBar } from "@/components/shared/TopBar"
import Link from "next/link"

const Card = ({ children, style }: any) => <div style={{ background: C.surface, borderRadius: 14, padding: 16, border: `1px solid ${C.border}`, ...style }}>{children}</div>

export default function FitnessPlanPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const planId = searchParams.get("id")
  const supabase = createClient()
  const [plans, setPlans] = useState<any[]>([])
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user || null))
    if (planId) {
      supabase.from("membership_plans").select("*, venues(name, slug)").eq("id", planId).single().then(({ data }: any) => setPlans(data ? [data] : []))
    } else {
      supabase.from("membership_plans").select("*, venues(name, slug)").eq("is_active", true).order("tier_level").limit(10).then(({ data }: any) => setPlans(data || []))
    }
  }, [planId])

  async function register(plan: any) {
    if (!user) { router.push("/login"); return }
    const endDate = new Date()
    if (plan.billing_cycle === "monthly") endDate.setMonth(endDate.getMonth() + 1)
    else if (plan.billing_cycle === "quarterly") endDate.setMonth(endDate.getMonth() + 3)
    else endDate.setFullYear(endDate.getFullYear() + 1)

    await supabase.from("members").insert({
      user_id: user.id, venue_id: plan.venue_id, plan_id: plan.id,
      start_date: new Date().toISOString().split("T")[0], end_date: endDate.toISOString().split("T")[0], status: "active",
    })
    alert("Pendaftaran sukses!")
    router.push("/fitness")
  }

  return (
    <div>
      <TopBar title="Paket Membership" left={<ChevronLeft size={20} color={C.text} onClick={() => router.back()} style={{ cursor: "pointer" }} />} />
      <div style={{ padding: "0 16px 16px" }}>
        {plans.length === 0 && <div style={{ textAlign: "center", padding: 40, color: C.textMuted }}>Belum ada paket</div>}
        {plans.map((p: any) => {
          const benefits = typeof p.benefits === "string" ? JSON.parse(p.benefits) : (p.benefits || [])
          return (
            <Card key={p.id} style={{ marginBottom: 12 }}>
              <div style={{ textAlign: "center", padding: "16px 0" }}>
                <Crown size={24} color={p.tier_level >= 4 ? "#FFD700" : C.accent} style={{ margin: "0 auto 8px", display: "block" }} />
                <div style={{ fontSize: 20, fontWeight: 800, color: C.text }}>{p.name}</div>
                <div style={{ fontSize: 24, fontWeight: 800, color: C.accent, marginTop: 4 }}>Rp {Number(p.price).toLocaleString("id-ID")}<span style={{ fontSize: 14, fontWeight: 400, color: C.textMuted }}>/{p.billing_cycle === "monthly" ? "bulan" : p.billing_cycle === "quarterly" ? "3 bulan" : "tahun"}</span></div>
                <div style={{ fontSize: 11, color: C.textMuted, marginTop: 2 }}>{p.venues?.name}</div>
              </div>
              {benefits.length > 0 && (
                <div style={{ marginBottom: 12 }}>
                  {benefits.map((b: any, i: number) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0" }}>
                      <Check size={14} color="#4CAF50" />
                      <span style={{ fontSize: 13, color: C.textSec }}>{typeof b === "string" ? b : b.label || b}</span>
                    </div>
                  ))}
                </div>
              )}
              <button onClick={() => register(p)} style={{ width: "100%", padding: "12px", borderRadius: 10, border: "none", background: C.primary, color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>Daftar sekarang</button>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
