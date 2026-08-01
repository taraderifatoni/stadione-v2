"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { TopBar } from "@/components/shared/TopBar"
import { C } from "@/lib/design"
import { ChevronLeft, Bell, Building2, MapPin, Clock, Phone, Calendar, Dumbbell, GraduationCap } from "lucide-react"

const Card = ({ children, style }: any) => <div style={{ background: C.surface, borderRadius: 14, padding: 16, border: `1px solid ${C.border}`, ...style }}>{children}</div>
const Badge = ({ children, color, bg }: any) => <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 8px", borderRadius: 6, background: bg || (color || C.primary) + "22", color: color || C.primaryLight, letterSpacing: 0.3 }}>{children}</span>

const TabBar = ({ tabs, active, onChange }: { tabs: string[]; active: string; onChange: (t: string) => void }) => (
  <div style={{ display: "flex", gap: 0, borderBottom: `1px solid ${C.border}`, marginBottom: 16 }}>
    {tabs.map(t => (
      <button key={t} onClick={() => onChange(t)} style={{ flex: 1, padding: "10px 0", fontSize: 13, fontWeight: active === t ? 600 : 400, color: active === t ? C.text : C.textMuted, background: "none", border: "none", borderBottom: active === t ? `2px solid ${C.primaryLight}` : "2px solid transparent", cursor: "pointer" }}>{t}</button>
    ))}
  </div>
)

export default function VenuePublicPage() {
  const { venueSlug } = useParams<{ venueSlug: string }>()
  const [venue, setVenue] = useState<any>(null)
  const [tab, setTab] = useState("Info")
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    supabase.from("venues").select("*").eq("slug", venueSlug).single().then(({ data }) => setVenue(data))
  }, [venueSlug])

  if (!venue) return null
  const isBooking = venue.active_domains?.includes?.("booking")

  return (
    <div>
      <TopBar title={venue.name || "Detail Venue"} sub={venue.city} left={<ChevronLeft size={20} color={C.text} onClick={() => router.back()} style={{ cursor: "pointer" }} />} />
      <div style={{ padding: "0 16px 16px" }}>
        <div style={{ height: 160, borderRadius: 14, background: C.elevated, marginBottom: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Building2 size={40} color={C.textMuted} />
        </div>
        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          <button onClick={() => router.push(`/venue/${venueSlug}/booking`)} style={{ flex: 1, padding: "12px 20px", borderRadius: 10, border: "none", background: C.primary, color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
            <Calendar size={16} />Booking
          </button>
        </div>
        <TabBar tabs={["Info", "Fasilitas", "Ulasan"]} active={tab} onChange={setTab} />
        {tab === "Info" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}><MapPin size={16} color={C.primaryLight} /><span style={{ fontSize: 13, color: C.textSec }}>{venue.address || "Alamat venue"}</span></div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}><Clock size={16} color={C.primaryLight} /><span style={{ fontSize: 13, color: C.textSec }}>08:00 - 22:00 (Setiap hari)</span></div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}><Phone size={16} color={C.primaryLight} /><span style={{ fontSize: 13, color: C.textSec }}>{venue.phone || "Telepon venue"}</span></div>
            <div style={{ marginTop: 12 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: C.text, marginBottom: 8 }}>Lapangan tersedia</div>
              {["Lap. Futsal A (Vinyl)", "Lap. Futsal B (Sintetis)", "Lap. Basket (Indoor)"].map((c, i) => (
                <Card key={i} style={{ marginBottom: 8, padding: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div><div style={{ fontSize: 13, fontWeight: 500, color: C.text }}>{c}</div><div style={{ fontSize: 11, color: C.textMuted, marginTop: 2 }}>Rp 120.000/jam</div></div>
                    <Badge color="#4CAF50" bg={C.successBg}>Tersedia</Badge>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
