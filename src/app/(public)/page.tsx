import Link from "next/link"
import { TopBar } from "@/components/shared/TopBar"
import { C } from "@/lib/design"
import { Search, MapPin, Star, Building2, Calendar, Dumbbell, GraduationCap, ChevronRight, Shield, Zap, CreditCard } from "lucide-react"
import { createAdminClient } from "@/lib/supabase/admin"

export const dynamic = "force-dynamic"

export default async function HomePage() {
  const supabase = createAdminClient()
  const { data: venues } = await supabase.from("venues").select("id, name, slug, city").eq("status", "active").limit(6)

  const venueList = venues?.length ? venues : []

  return (
    <div>
      <TopBar title="Stadione" />

      <div style={{ padding: "0 16px 16px" }}>
        {/* HERO */}
        <div style={{ background: `linear-gradient(135deg, ${C.primary} 0%, ${C.primaryDark} 100%)`, borderRadius: 20, padding: "28px 24px", marginBottom: 24, position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: -30, right: -30, width: 140, height: 140, borderRadius: 70, background: "#ffffff10" }} />
          <div style={{ position: "absolute", bottom: -40, left: -20, width: 100, height: 100, borderRadius: 50, background: "#ffffff08" }} />
          <div style={{ position: "relative", zIndex: 1 }}>
            <div style={{ fontSize: 24, fontWeight: 900, color: "#fff", marginBottom: 6, letterSpacing: -0.5 }}>Platform Olahraga{'\n'}Terlengkap</div>
            <div style={{ fontSize: 14, color: "#ffffffcc", marginBottom: 20 }}>Booking, membership, akademi — satu platform</div>
            <Link href="/venues" style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#ffffff20", borderRadius: 12, padding: "12px 18px", textDecoration: "none" }}>
              <Search size={18} color="#fff" />
              <span style={{ fontSize: 14, color: "#fff" }}>Cari venue olahraga</span>
            </Link>
          </div>
        </div>

        {/* 3 CTA CARDS */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 24 }}>
          {[
            { icon: Calendar, label: "Booking", href: "/booking", color: C.primaryLight, desc: "Lapangan" },
            { icon: Dumbbell, label: "Fitness", href: "/fitness", color: "#4CAF50", desc: "Membership" },
            { icon: GraduationCap, label: "Akademi", href: "/academy", color: "#FFB300", desc: "Program" },
          ].map((item, i) => (
            <Link key={i} href={item.href} style={{ textDecoration: "none" }}>
              <div style={{ background: C.surface, borderRadius: 14, padding: "16px 12px", border: `1px solid ${C.border}`, textAlign: "center" }}>
                <div style={{ width: 44, height: 44, borderRadius: 14, background: item.color + "18", margin: "0 auto 10px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <item.icon size={22} color={item.color} />
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{item.label}</div>
                <div style={{ fontSize: 11, color: C.textMuted, marginTop: 2 }}>{item.desc}</div>
              </div>
            </Link>
          ))}
        </div>

        {/* POPULAR VENUES */}
        {venueList.length > 0 && (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <span style={{ fontSize: 16, fontWeight: 700, color: C.text }}>Venue Populer</span>
              <Link href="/venues" style={{ fontSize: 13, color: C.primaryLight, textDecoration: "none", display: "flex", alignItems: "center", gap: 2 }}>Semua <ChevronRight size={14} /></Link>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
              {venueList.map((v: any) => (
                <Link key={v.id} href={`/venue/${v.slug}`} style={{ textDecoration: "none" }}>
                  <div style={{ background: C.surface, borderRadius: 14, padding: 16, border: `1px solid ${C.border}`, display: "flex", gap: 12 }}>
                    <div style={{ width: 64, height: 64, borderRadius: 12, background: C.elevated, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <Building2 size={22} color={C.primaryLight} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: C.text, marginBottom: 4 }}>{v.name}</div>
                      <div style={{ fontSize: 12, color: C.textMuted, display: "flex", alignItems: "center", gap: 4 }}>
                        <MapPin size={11} />{v.city || "Indonesia"}
                      </div>
                    </div>
                    <ChevronRight size={16} color={C.textMuted} style={{ alignSelf: "center" }} />
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}

        {/* BENEFITS */}
        <div style={{ background: C.surface, borderRadius: 16, padding: 20, border: `1px solid ${C.border}` }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: C.text, marginBottom: 16 }}>Kenapa Stadione?</div>
          {[
            { icon: Zap, title: "Booking Real-time", desc: "Lihat slot tersedia langsung, booking dalam hitungan detik" },
            { icon: CreditCard, title: "Bayar Mudah", desc: "VA, QRIS, e-Wallet, transfer — semua metode tersedia" },
            { icon: Shield, title: "Aman & Terpercaya", desc: "Pembayaran dengan DOKU, partner resmi Bank Indonesia" },
          ].map((b, i) => (
            <div key={i} style={{ display: "flex", gap: 12, marginBottom: i < 2 ? 14 : 0 }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: C.primary + "14", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <b.icon size={18} color={C.primaryLight} />
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{b.title}</div>
                <div style={{ fontSize: 12, color: C.textMuted, marginTop: 2 }}>{b.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
