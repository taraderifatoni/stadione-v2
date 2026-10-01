import { NextResponse } from "next/server"

import { requirePlatformAdmin } from "@/lib/cms/auth"
import { createAdminClient } from "@/lib/supabase/admin"
import { getDailySportsPool, getSearchUsage } from "@/lib/cms/searchapi"

function jakartaDate() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta", year: "numeric", month: "2-digit", day: "2-digit",
  }).format(new Date())
}

export async function GET() {
  const auth = await requirePlatformAdmin()
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })
  const admin = createAdminClient()
  const [{ data: latest }, usage] = await Promise.all([
    admin.from("stadione_editorial_runs").select("*").eq("status", "COMPLETED").order("created_at", { ascending: false }).limit(1).maybeSingle(),
    getSearchUsage(),
  ])
  return NextResponse.json({ run: latest || null, usage })
}

export async function POST() {
  const auth = await requirePlatformAdmin()
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })
  const admin = createAdminClient()
  const { data: run, error } = await admin.from("stadione_editorial_runs").insert({
    run_date: jakartaDate(), status: "RUNNING", created_by: auth.actor.id,
  }).select("id").single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  try {
    const pool = await getDailySportsPool()
    await admin.from("stadione_editorial_runs").update({ status: "COMPLETED", pool, completed_at: new Date().toISOString() }).eq("id", run.id)
    return NextResponse.json({ run: { id: run.id, status: "COMPLETED", pool }, usage: await getSearchUsage() })
  } catch (caught) {
    const message = caught instanceof Error ? caught.message : "Pemindaian tren gagal."
    await admin.from("stadione_editorial_runs").update({ status: "FAILED", error_message: message, completed_at: new Date().toISOString() }).eq("id", run.id)
    return NextResponse.json({ error: message, usage: await getSearchUsage() }, { status: 503 })
  }
}
