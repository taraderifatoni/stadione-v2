import { createClient } from "@/lib/supabase/client"

export async function getVenueBySlug(slug: string) {
  const supabase = createClient()
  const { data } = await supabase.from("venues").select("*").eq("slug", slug).single()
  return data
}

export async function createVenue(input: {
  name: string
  slug: string
  address?: string
  city?: string
  phone?: string
}) {
  const supabase = createClient()
  const { data, error } = await supabase.from("venues").insert(input).select().single()
  return { data, error }
}

export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim()
}
