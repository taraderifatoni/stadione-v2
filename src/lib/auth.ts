import "server-only"
import { createClient as createServerClient } from "@/lib/supabase/server"
import type { User } from "@supabase/supabase-js"
import type { VenueRole, GlobalRole } from "@/types"

export async function getSessionUser(): Promise<User | null> {
  const supabase = await createServerClient()
  const { data } = await supabase.auth.getUser()
  return data.user ?? null
}

export async function getUserVenueRoles(userId: string): Promise<
  { venue_id: string; role: VenueRole }[]
> {
  const supabase = await createServerClient()
  const { data } = await supabase
    .from("venue_roles")
    .select("venue_id, role")
    .eq("user_id", userId)

  return data ?? []
}

export async function getUserVenueRole(
  userId: string,
  venueId: string
): Promise<VenueRole | null> {
  const supabase = await createServerClient()
  const { data } = await supabase
    .from("venue_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("venue_id", venueId)
    .single()

  return data?.role ?? null
}

export async function hasGlobalRole(userId: string, role: string): Promise<boolean> {
  const supabase = await createServerClient()
  const { data } = await supabase
    .from("venue_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", role)
    .single()

  return !!data
}
