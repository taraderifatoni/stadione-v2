import { createClient } from "@/lib/supabase/client"
import type { CourtType } from "@/types"

export interface Court {
  id: string
  venue_id: string
  name: string
  court_type: CourtType
  is_splittable: boolean
  split_count: number
  is_active: boolean
  created_at: string
}

export async function getCourts(venueId: string) {
  const supabase = createClient()
  const { data } = await supabase
    .from("courts")
    .select("*")
    .eq("venue_id", venueId)
    .eq("is_active", true)
    .order("name")
  return (data as Court[]) || []
}

export async function getCourt(courtId: string) {
  const supabase = createClient()
  const { data } = await supabase
    .from("courts")
    .select("*")
    .eq("id", courtId)
    .single()
  return data as Court | null
}

export async function createCourt(court: Omit<Court, "id" | "created_at">) {
  const supabase = createClient()
  const { data, error } = await supabase.from("courts").insert(court).select().single()
  return { data: data as Court | null, error }
}

export async function updateCourt(id: string, updates: Partial<Court>) {
  const supabase = createClient()
  const { error } = await supabase.from("courts").update(updates).eq("id", id)
  return { error }
}

export async function toggleCourtActive(id: string, isActive: boolean) {
  const supabase = createClient()
  const { error } = await supabase.from("courts").update({ is_active: isActive }).eq("id", id)
  return { error }
}
