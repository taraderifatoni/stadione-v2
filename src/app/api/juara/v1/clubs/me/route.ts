import { createClient } from "@/lib/supabase/server"
import { getJuaraMembership } from "@/lib/juara/server-auth"

export async function GET() {
  const res = await getJuaraMembership()
  if (!res.ok) {
    if (res.status === 403 && res.code === "NO_CLUB") {
      return Response.json({ ok: true, membership: null })
    }
    return Response.json({ error: res.error, code: res.code }, { status: res.status })
  }

  const supabase = await createClient()
  const { data: club } = await supabase
    .from("juara_clubs")
    .select("name, league_tier, fiscal_year_start_month")
    .eq("id", res.membership.clubId)
    .maybeSingle()

  return Response.json({
    ok: true,
    membership: {
      ...res.membership,
      clubName: club?.name ?? "Klub",
      leagueTier: club?.league_tier ?? null,
      fiscalYearStartMonth: club?.fiscal_year_start_month ?? null,
    },
  })
}
