import Link from "next/link"
import { TopBar } from "@/components/shared/TopBar"
import { C } from "@/lib/design"
import { Search, MapPin, Star, Building2 } from "lucide-react"
import { createAdminClient } from "@/lib/supabase/admin"

export const dynamic = "force-dynamic"

const Card = ({ children, style, onClick }: { children: React.ReactNode; style?: React.CSSProperties; onClick?: () => void }) => (
  <div onClick={onClick} style={{ background: C.surface, borderRadius: 14, padding: 16, border: `1px solid ${C.border}`, cursor: onClick ? "pointer" : "default", ...style }}>{children}</div>
)

const Badge = ({ children, color }: { children: React.ReactNode; color?: string }) => (
  <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 8px", borderRadius: 6, background: (color || C.primary) + "22", color: color || C.primaryLight, letterSpacing: 0.3 }}>{children}</span>
)

export default async function HomePage() {
  const supabase = createAdminClient()
  const { data: venues } = await supabase.from("venues").select("*").eq("status", "active").order("created_at", { ascending: false }).limit(10)

  const venueList = venues?.length ? venues : [
    { id: "1", name: "Kenari Football Area", slug: "kenari-football-area", city: "Yogyakarta", active_domains: ["booking"], created_at: "" },
    { id: "2", name: "Iron Gym Sleman", slug: "iron-gym-jakarta", city: "Sleman", active_domains: ["membership"], created_at: "" },
    { id: "3", name: "Champion Badminton", slug: "champion-badminton", city: "Yogyakarta", active_domains: ["booking"], created_at: "" },
    { id: "4", name: "AquaSport Center", slug: "aquasport-center", city: "Sleman", active_domains: ["membership"], created_at: "" },
  ]

  const sportTypes = ["Semua", "Futsal", "Basket", "Badminton", "Gym", "Renang"]

  return (
    <div>
      <TopBar title="Stadione" />

      <div style={{ padding: "0 16px 16px" }}>
        {/* Hero card */}
        <div style={{ background: `linear-gradient(135deg, ${C.primary} 0%, ${C.primaryDark} 100%)`, borderRadius: 16, padding: 24, marginBottom: 20, position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: -20, right: -20, width: 100, height: 100, borderRadius: 50, background: "#fff08" }} />
          <div style={{ fontSize: 22, fontWeight: 800, color: "#fff", marginBottom: 6, lineHeight: 1.2 }}>Temukan venue{'\n'}olahraga terbaik</div>
          <div style={{ fontSize: 13, color: "#fff9", marginBottom: 16 }}>Booking, membership, dan akademi</div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#fff15", borderRadius: 10, padding: "10px 14px" }}>
            <Search size={16} color="#fff8" />
            <span style={{ fontSize: 13, color: "#fff6" }}>Cari venue atau olahraga...</span>
          </div>
        </div>

        {/* Sport filter pills */}
        <div style={{ display: "flex", gap: 8, marginBottom: 20, overflowX: "auto", paddingBottom: 4 }}>
          {sportTypes.map((t, i) => (
            <span key={t} style={{ padding: "8px 16px", borderRadius: 20, background: i === 0 ? C.primary : C.surface, color: i === 0 ? "#fff" : C.textSec, fontSize: 12, fontWeight: 500, whiteSpace: "nowrap", border: i === 0 ? "none" : `1px solid ${C.border}`, cursor: "pointer" }}>{t}</span>
          ))}
        </div>

        {/* Venue list header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: C.text }}>Venue terdekat</span>
          <span style={{ fontSize: 12, color: C.primaryLight, cursor: "pointer" }}>Lihat semua</span>
        </div>

        {/* Venue cards */}
        {venueList.map((v: any, i: number) => (
          <Link key={v.id} href={`/venue/${v.slug}`} style={{ textDecoration: "none" }}>
            <Card style={{ marginBottom: 10, background: C.surface, borderRadius: 14, padding: 16, border: `1px solid ${C.border}` }}>
              <div style={{ display: "flex", gap: 12 }}>
                <div style={{ width: 72, height: 72, borderRadius: 12, background: C.elevated, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Building2 size={24} color={C.textMuted} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{v.name}</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
                      <Star size={12} color="#FFB300" fill="#FFB300" />
                      <span style={{ fontSize: 12, fontWeight: 600, color: C.accent }}>{v.rating || "4.5"}</span>
                    </div>
                  </div>
                  <div style={{ fontSize: 12, color: C.textMuted, marginTop: 3, display: "flex", alignItems: "center", gap: 4 }}>
                    <MapPin size={11} />{v.city || "Yogyakarta"}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 8 }}>
                    <Badge>{(v.active_domains?.[0] || "booking") === "booking" ? "Futsal" : "Gym"}</Badge>
                  </div>
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
