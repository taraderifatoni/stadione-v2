"use client"

import { useEffect, useState } from "react"
import { TopBar } from "@/components/shared/TopBar"
import { C } from "@/lib/design"
import { Search, MapPin, Building2, Star } from "lucide-react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"

export default function VenuesPage() {
  const [venues, setVenues] = useState<any[]>([])
  const supabase = createClient()

  useEffect(() => {
    supabase.from("venues").select("*").eq("status", "active").order("created_at", { ascending: false }).limit(50).then(({ data }: any) => setVenues(data || []))
  }, [])

  return (
    <div>
      <TopBar title="Semua venue" sub="Temukan venue olahraga terdekat" />
      <div style={{ padding: "0 16px 16px" }}>
        <div style={{ position: "relative", marginBottom: 14 }}>
          <Search size={16} color={C.textMuted} style={{ position: "absolute", left: 12, top: 12 }} />
          <input placeholder="Cari venue..." style={{ width: "100%", padding: "10px 12px 10px 36px", background: C.elevated, border: `1px solid ${C.border}`, borderRadius: 10, color: C.text, fontSize: 14, outline: "none", boxSizing: "border-box" }} />
        </div>
        {venues.map((v: any) => (
          <Link key={v.id} href={`/venue/${v.slug}`} style={{ textDecoration: "none" }}>
            <div style={{ background: C.surface, borderRadius: 14, padding: 16, border: `1px solid ${C.border}`, marginBottom: 10 }}>
              <div style={{ display: "flex", gap: 12 }}>
                <div style={{ width: 64, height: 64, borderRadius: 12, background: C.elevated, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Building2 size={22} color={C.textMuted} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{v.name}</div>
                  <div style={{ fontSize: 12, color: C.textMuted, marginTop: 3, display: "flex", alignItems: "center", gap: 4 }}><MapPin size={11} />{v.city || "Yogyakarta"}</div>
                  <div style={{ display: "flex", gap: 4, marginTop: 6 }}>
                    {(typeof v.active_domains === "string" ? JSON.parse(v.active_domains) : v.active_domains || ["booking"]).map((d: string) => (
                      <span key={d} style={{ fontSize: 10, fontWeight: 600, padding: "2px 6px", borderRadius: 4, background: C.primary + "22", color: C.primaryLight }}>{d === "booking" ? "Lapangan" : d === "membership" ? "Fitness" : d === "academy" ? "Akademi" : d}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
