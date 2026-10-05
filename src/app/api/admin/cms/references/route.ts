import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { requirePlatformAdmin } from "@/lib/cms/auth"

const currentJakartaMonth = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta", year: "numeric", month: "2-digit" }).format(new Date())
const validMonth = (value: string) => /^20\d{2}-(0[1-9]|1[0-2])$/.test(value)
const PURPOSES = new Set(["MATCH_RESULT", "MEME", "NEWS_COVER", "STATISTICS", "REELS"])
function validReferenceUrl(value: string) {
  try {
    const url = new URL(value)
    return url.protocol === "https:"
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
  const form = await request.formData()
  const month = String(form.get("month") || currentJakartaMonth())
  const purpose = String(form.get("purpose") || "NEWS_COVER")
  const suppliedUrl = String(form.get("url") || "").trim()
  const note = String(form.get("note") || "").trim().slice(0, 1000)
  const file = form.get("file")
  if (!validMonth(month)) return NextResponse.json({ error: "Format bulan harus YYYY-MM." }, { status: 400 })
  if (!PURPOSES.has(purpose)) return NextResponse.json({ error: "Kegunaan referensi tidak valid." }, { status: 400 })
  const uploadedFile = file instanceof File && file.size > 0 ? file : null
  const hasFile = Boolean(uploadedFile)
  if (!hasFile && !validReferenceUrl(suppliedUrl)) return NextResponse.json({ error: "Isi URL HTTPS atau unggah satu gambar referensi." }, { status: 400 })
  if (uploadedFile && (!['image/jpeg', 'image/png', 'image/webp'].includes(uploadedFile.type) || uploadedFile.size > 10 * 1024 * 1024)) return NextResponse.json({ error: "Gunakan JPEG, PNG, atau WebP maksimal 10 MB." }, { status: 400 })
  const admin = createAdminClient()
  const { count, error: countError } = await admin.from("stadione_visual_references").select("id", { count: "exact", head: true }).eq("reference_month", month)
  if (countError) return NextResponse.json({ error: countError.message }, { status: 500 })
  if ((count || 0) >= 5) return NextResponse.json({ error: "Maksimal lima referensi untuk setiap bulan. Hapus salah satu sebelum menambah referensi baru." }, { status: 409 })
  let url = suppliedUrl, assetBucket: string | null = null, assetPath: string | null = null
  if (uploadedFile) {
    const extension = uploadedFile.type === "image/jpeg" ? "jpg" : uploadedFile.type.split("/")[1]
    assetBucket = "stadione-cms"
    assetPath = `references/${month}/${crypto.randomUUID()}.${extension}`
    const { error: uploadError } = await admin.storage.from(assetBucket).upload(assetPath, Buffer.from(await uploadedFile.arrayBuffer()), { contentType: uploadedFile.type, upsert: false, cacheControl: "31536000" })
    if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 })
    url = admin.storage.from(assetBucket).getPublicUrl(assetPath).data.publicUrl
  }
  const platform = hasFile ? "UPLOAD" : (() => { try { return new URL(url).hostname.replace(/^www\./, "").slice(0, 80).toUpperCase() } catch { return "WEB" } })()
  const { data, error } = await admin.from("stadione_visual_references").insert({ reference_month: month, source_platform: platform, purpose, url, note, asset_bucket: assetBucket, asset_path: assetPath, created_by: auth.actor.id }).select("*").single()
  if (error && assetBucket && assetPath) await admin.storage.from(assetBucket).remove([assetPath])
  if (error?.code === "23505") return NextResponse.json({ error: "Referensi ini sudah tersimpan untuk bulan tersebut." }, { status: 409 })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ item: data }, { status: 201 })
}

export async function DELETE(request: NextRequest) {
  const auth = await requirePlatformAdmin()
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })
  const id = request.nextUrl.searchParams.get("id")
  if (!id) return NextResponse.json({ error: "ID referensi wajib diisi." }, { status: 400 })
  const admin = createAdminClient()
  const { data: item } = await admin.from("stadione_visual_references").select("asset_bucket,asset_path").eq("id", id).maybeSingle()
  const { error } = await admin.from("stadione_visual_references").delete().eq("id", id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (item?.asset_bucket && item?.asset_path) await admin.storage.from(item.asset_bucket).remove([item.asset_path])
  return NextResponse.json({ ok: true })
}
