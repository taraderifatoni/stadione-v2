import type { Metadata } from "next"
import { createAdminClient } from "@/lib/supabase/admin"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ venueSlug: string }>
}): Promise<Metadata> {
  const { venueSlug } = await params
  const supabase = createAdminClient()
  const { data } = await supabase.from("venues").select("name, city, address").eq("slug", venueSlug).single()

  if (!data) return { title: "Venue tidak ditemukan" }

  return {
    title: `${data.name} — Stadione`,
    description: `Booking lapangan olahraga di ${data.name}${data.city ? `, ${data.city}` : ""}. ${data.address || ""}`,
    openGraph: {
      title: `${data.name} — Stadione`,
      description: `Booking lapangan olahraga di ${data.name}`,
      type: "website",
    },
  }
}

export default function VenuePageLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
