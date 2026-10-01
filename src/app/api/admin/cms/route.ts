import { NextRequest, NextResponse } from "next/server"

import { createAdminClient } from "@/lib/supabase/admin"
import { requirePlatformAdmin } from "@/lib/cms/auth"
import { buildEditorialPackage, slugifyCms, type EditorialCandidate } from "@/lib/cms/editorial"
import { getSearchUsage } from "@/lib/cms/searchapi"

const editableFields = ["title", "excerpt", "body", "caption", "category", "source_url", "source_name", "external_url"] as const

async function uniqueSlug(base: string) {
  const admin = createAdminClient()
  const root = slugifyCms(base)
  const { data } = await admin.from("stadione_content_items").select("slug").like("slug", `${root}%`).limit(100)
  const existing = new Set((data || []).map((row) => row.slug))
  if (!existing.has(root)) return root
  let number = 2
  while (existing.has(`${root}-${number}`)) number += 1
  return `${root}-${number}`
}

async function logActivity(contentId: string, action: string, actorId: string, fromStatus?: string | null, toStatus?: string | null, metadata: Record<string, unknown> = {}) {
  const admin = createAdminClient()
  await admin.from("stadione_content_activity").insert({
    content_id: contentId, action, actor_id: actorId, from_status: fromStatus || null, to_status: toStatus || null, metadata,
  })
}

export async function GET() {
  const auth = await requirePlatformAdmin()
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const admin = createAdminClient()
  const [{ data: items, error }, { data: activities }, usage] = await Promise.all([
    admin.from("stadione_content_items").select("*").order("updated_at", { ascending: false }).limit(300),
    admin.from("stadione_content_activity").select("*").order("created_at", { ascending: false }).limit(300),
    getSearchUsage(),
  ])

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ items: items || [], activities: activities || [], usage })
}

export async function POST(request: NextRequest) {
  const auth = await requirePlatformAdmin()
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })
  const input = await request.json().catch(() => ({}))
  const admin = createAdminClient()

  if (input.action === "create_manual") {
    const title = String(input.title || "").trim()
    if (title.length < 8) return NextResponse.json({ error: "Judul minimal 8 karakter." }, { status: 400 })
    const kind = input.kind === "SOCIAL" ? "SOCIAL" : "ARTICLE"
    const format = kind === "ARTICLE" ? "ARTICLE" : (["CAROUSEL", "REEL", "SINGLE_IMAGE", "STORY", "VIDEO"].includes(input.format) ? input.format : "CAROUSEL")
    const { data, error } = await admin.from("stadione_content_items").insert({
      kind,
      format,
      title,
      slug: kind === "ARTICLE" ? await uniqueSlug(title) : null,
      status: "DRAFT",
      platforms: kind === "SOCIAL" ? [String(input.platform || "INSTAGRAM")] : ["WEBSITE"],
      created_by: auth.actor.id,
      editorial_meta: { origin: "MANUAL", standard: "STADIONE_SPORTS_DESK_V1" },
    }).select("*").single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    await logActivity(data.id, "create", auth.actor.id, null, "DRAFT")
    return NextResponse.json({ item: data })
  }

  if (input.action === "create_from_trend") {
    const candidate = input.candidate as EditorialCandidate
    if (!candidate?.title || String(candidate.title).trim().length < 4) {
      return NextResponse.json({ error: "Kandidat tren tidak valid." }, { status: 400 })
    }
    const pack = buildEditorialPackage(candidate)
    const { data: article, error: articleError } = await admin.from("stadione_content_items").insert({
      kind: "ARTICLE",
      format: "ARTICLE",
      title: pack.article.title,
      slug: await uniqueSlug(pack.article.slug),
      excerpt: pack.article.excerpt,
      body: pack.article.body,
      category: String(input.category || "Sports Update"),
      status: "PENDING_REVIEW",
      platforms: ["WEBSITE"],
      source_url: candidate.sourceUrl || null,
      source_name: candidate.source || null,
      source_snapshot: candidate,
      assets: candidate.imageUrl ? [{ role: "cover", type: "image", url: candidate.imageUrl, source_url: candidate.sourceUrl || null }] : [],
      editorial_meta: { origin: "SEARCHAPI_IO", engine: candidate.engine || null, standard: "STADIONE_SPORTS_DESK_V1", verification_required: true },
      created_by: auth.actor.id,
    }).select("*").single()
    if (articleError) return NextResponse.json({ error: articleError.message }, { status: 500 })

    const socialRows = ["INSTAGRAM", "FACEBOOK"].map((platform) => ({
      parent_id: article.id,
      kind: "SOCIAL",
      format: "CAROUSEL",
      title: pack.social.title,
      caption: pack.social.caption,
      hashtags: pack.social.hashtags,
      platforms: [platform],
      category: article.category,
      status: "PENDING_REVIEW",
      source_url: candidate.sourceUrl || null,
      source_name: candidate.source || null,
      source_snapshot: candidate,
      assets: pack.social.slides,
      editorial_meta: { origin: "ARTICLE_PACKAGE", standard: "STADIONE_SPORTS_DESK_V1", meta_adapter: "PENDING_CREDENTIALS" },
      created_by: auth.actor.id,
    }))
    const { data: socials, error: socialError } = await admin.from("stadione_content_items").insert(socialRows).select("*")
    if (socialError) {
      await admin.from("stadione_content_items").delete().eq("id", article.id)
      return NextResponse.json({ error: socialError.message }, { status: 500 })
    }
    await Promise.all([
      logActivity(article.id, "create_from_trend", auth.actor.id, null, "PENDING_REVIEW", { engine: candidate.engine }),
      ...(socials || []).map((social) => logActivity(social.id, "create_from_article", auth.actor.id, null, "PENDING_REVIEW", { article_id: article.id })),
    ])
    return NextResponse.json({ article, socials: socials || [] })
  }

  return NextResponse.json({ error: "Aksi tidak dikenali." }, { status: 400 })
}

export async function PATCH(request: NextRequest) {
  const auth = await requirePlatformAdmin()
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })
  const input = await request.json().catch(() => ({}))
  const id = String(input.id || "")
  if (!id) return NextResponse.json({ error: "ID konten wajib diisi." }, { status: 400 })

  const admin = createAdminClient()
  const { data: current, error: findError } = await admin.from("stadione_content_items").select("*").eq("id", id).single()
  if (findError || !current) return NextResponse.json({ error: "Konten tidak ditemukan." }, { status: 404 })

  const update: Record<string, unknown> = {}
  for (const field of editableFields) if (field in input) update[field] = String(input[field] || "").trim() || null
  if (Array.isArray(input.hashtags)) update.hashtags = input.hashtags.map((tag: unknown) => String(tag).replace(/^#/, "").trim()).filter(Boolean).slice(0, 20)
  if (Array.isArray(input.assets)) update.assets = input.assets

  const action = String(input.action || "save")
  let nextStatus = current.status
  if (action === "review") nextStatus = "PENDING_REVIEW"
  if (action === "draft") nextStatus = "DRAFT"
  if (action === "archive") { nextStatus = "ARCHIVED"; update.archived_at = new Date().toISOString() }
  if (action === "publish") {
    if (current.kind === "SOCIAL") return NextResponse.json({ error: "Meta API belum dihubungkan. Simpan atau jadwalkan draf sosial terlebih dahulu." }, { status: 409 })
    nextStatus = "PUBLISHED"
    update.published_at = new Date().toISOString()
    update.scheduled_at = null
  }
  if (action === "schedule") {
    const scheduledAt = new Date(String(input.scheduled_at || ""))
    if (Number.isNaN(scheduledAt.getTime()) || scheduledAt.getTime() <= Date.now()) {
      return NextResponse.json({ error: "Jadwal tayang harus berada di masa depan." }, { status: 400 })
    }
    nextStatus = "SCHEDULED"
    update.scheduled_at = scheduledAt.toISOString()
  }
  update.status = nextStatus
  if (current.kind === "ARTICLE" && typeof update.title === "string" && update.title !== current.title && !input.keep_slug) {
    update.slug = await uniqueSlug(update.title)
  }

  const { data, error } = await admin.from("stadione_content_items").update(update).eq("id", id).select("*").single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  await logActivity(id, action, auth.actor.id, current.status, nextStatus)
  return NextResponse.json({ item: data })
}
