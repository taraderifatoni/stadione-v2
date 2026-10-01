import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { requirePlatformAdmin } from "@/lib/cms/auth"

export const runtime = "nodejs"

export async function POST(request: NextRequest) {
  const auth = await requirePlatformAdmin()
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })
  const form = await request.formData()
  const itemId = String(form.get("itemId") || "")
  const role = String(form.get("role") || "cover")
  const credit = String(form.get("credit") || "").trim().slice(0, 200)
  const permissionScope = String(form.get("permissionScope") || "").trim().slice(0, 300)
  const permissionConfirmed = form.get("permissionConfirmed") === "true"
  const file = form.get("file")
  if (!itemId || !(file instanceof File)) return NextResponse.json({ error: "ID konten dan berkas foto wajib diisi." }, { status: 400 })
  if (!permissionConfirmed || !credit || !permissionScope) return NextResponse.json({ error: "Konfirmasi hak pakai, cakupan izin, dan kredit foto wajib dicatat." }, { status: 400 })
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 10 * 1024 * 1024) return NextResponse.json({ error: "Gunakan JPEG, PNG, atau WebP maksimal 10 MB." }, { status: 400 })
  const admin = createAdminClient()
  const { data: item, error: itemError } = await admin.from("stadione_content_items").select("id,assets,editorial_meta").eq("id", itemId).maybeSingle()
  if (itemError || !item) return NextResponse.json({ error: "Konten tidak ditemukan." }, { status: 404 })
  const extension = file.type === "image/jpeg" ? "jpg" : file.type.split("/")[1]
  const path = `${itemId}/${crypto.randomUUID()}.${extension}`
  const bucket = role === "original" ? "stadione-cms-originals" : "stadione-cms"
  const { error: uploadError } = await admin.storage.from(bucket).upload(path, Buffer.from(await file.arrayBuffer()), { contentType: file.type, upsert: false, cacheControl: "31536000" })
  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 })
  const { data: publicUrl } = admin.storage.from(bucket).getPublicUrl(path)
  const original = Array.isArray(item.assets) ? item.assets.find((existing: { role?: string }) => existing.role === "original") : null
  const asset = { role, type: "image", url: role === "original" ? null : publicUrl.publicUrl, bucket, path, credit, permission_scope: permissionScope, rights_status: "CLEARED", original_path: role === "cover" ? original?.path || null : null, created_by: auth.actor.id, created_at: new Date().toISOString() }
  const assets = Array.isArray(item.assets) ? item.assets.filter((existing: { role?: string }) => existing.role !== role) : []
  const meta = item.editorial_meta && typeof item.editorial_meta === "object" ? item.editorial_meta : {}
  const { error: updateError } = await admin.from("stadione_content_items").update({ assets: [...assets, asset], editorial_meta: { ...meta, rights_status: "CLEARED", image_credit: credit, image_permission_scope: permissionScope, cover_template: form.get("template") || "stadione-film-poster-v1" } }).eq("id", itemId)
  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 })
  return NextResponse.json({ asset })
}
