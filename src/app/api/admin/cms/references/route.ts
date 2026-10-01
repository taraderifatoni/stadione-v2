import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { requirePlatformAdmin } from "@/lib/cms/auth"

const currentJakartaMonth = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta", year: "numeric", month: "2-digit" }).format(new Date())
const validMonth = (value: string) => /^20\d{2}-(0[1-9]|1[0-2])$/.test(value)
function validPinterestUrl(value: string) {
  try {
    const url = new URL(value)
    const host = url.hostname.toLowerCase()
    return url.protocol === "https:" && (host === "pin.it" || host === "pinterest.com" || host.endsWith(".pinterest.com"))
  } catch { return false }
}

export async function GET(request: NextRequest) {
  const auth = await requirePlatformAdmin()
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })
  const month = request.nextUrl.searchParams.get("month") || currentJakartaMonth()
  if (!validMonth(month)) return NextResponse.json({ error: "Format bulan harus YYYY-MM." }, { status: 400 })
  const { data, error } = await createAdminClient().from("stadione_visual_references").select("*").eq("reference_month", month).order("created_at", { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ month, items: data || [] })
}

export async function POST(request: NextRequest) {
  const auth = await requirePlatformAdmin()
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })
  const input = await request.json().catch(() => ({}))
  const month = String(input.month || currentJakartaMonth())
  const url = String(input.url || "").trim()
  const note = String(input.note || "").trim().slice(0, 1000)
  if (!validMonth(month)) return NextResponse.json({ error: "Format bulan harus YYYY-MM." }, { status: 400 })
  if (!validPinterestUrl(url)) return NextResponse.json({ error: "Masukkan link Pin Pinterest yang diawali https://pinterest.com atau https://pin.it." }, { status: 400 })
  const { data, error } = await createAdminClient().from("stadione_visual_references").insert({ reference_month: month, source_platform: "PINTEREST", url, note, created_by: auth.actor.id }).select("*").single()
  if (error?.code === "23505") return NextResponse.json({ error: "Referensi ini sudah tersimpan untuk bulan tersebut." }, { status: 409 })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ item: data }, { status: 201 })
}

export async function DELETE(request: NextRequest) {
  const auth = await requirePlatformAdmin()
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })
  const id = request.nextUrl.searchParams.get("id")
  if (!id) return NextResponse.json({ error: "ID referensi wajib diisi." }, { status: 400 })
  const { error } = await createAdminClient().from("stadione_visual_references").delete().eq("id", id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
