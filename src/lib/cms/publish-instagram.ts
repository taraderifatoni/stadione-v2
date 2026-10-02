import "server-only"
import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { containerStatus, createCarousel, createImage, createReel, metaConfigured, publicMediaUrl, publishContainer } from "@/lib/cms/meta"

type Attempt = { state: string; child_ids: string[]; creation_id: string | null; media_id: string | null; error_message: string | null }

// Can be called by an authenticated admin request or a trusted server task. Never retries media_publish.
export async function publishInstagramContent(id: string, actorId: string | null) {
  if (!/^[a-f0-9-]{36}$/i.test(id)) return NextResponse.json({ error: "ID konten tidak valid." }, { status: 400 })
  const admin = createAdminClient()
  const { data: item, error: itemError } = await admin.from("stadione_content_items").select("*").eq("id", id).single()
  if (itemError || !item) return NextResponse.json({ error: "Konten tidak ditemukan." }, { status: 404 })
  if (item.kind !== "SOCIAL" || !(item.platforms || []).includes("INSTAGRAM") || !(item.platforms || []).every((p: string) => p === "INSTAGRAM") || !["SINGLE_IMAGE", "CAROUSEL", "REEL"].includes(item.format)) {
    return NextResponse.json({ error: "Hanya gambar tunggal, carousel, dan Reel Instagram yang dapat diterbitkan dari sini." }, { status: 409 })
  }
  if (item.status === "PUBLISHED") return NextResponse.json({ state: "PUBLISHED", mediaId: item.external_post_id })
  const { data: previous } = await admin.from("stadione_ig_publish_attempts").select("*").eq("content_id", id).maybeSingle()
  if (previous?.state === "PUBLISHED" && previous.media_id) {
    await admin.from("stadione_content_items").update({ status: "PUBLISHED", external_post_id: previous.media_id, published_at: new Date().toISOString(), scheduled_at: null, publish_error: null }).eq("id", id)
    return NextResponse.json({ state: "PUBLISHED", mediaId: previous.media_id })
  }
  if (previous?.state === "PUBLISHING" || previous?.state === "UNCERTAIN") {
    return NextResponse.json({ error: "Permintaan publikasi sudah dikirim ke Meta, tetapi hasilnya belum pasti. Periksa akun Instagram dan ID kontainer sebelum rekonsiliasi manual; sistem tidak akan mengirim ulang.", state: previous.state, creationId: previous.creation_id }, { status: 409 })
  }
  if (!metaConfigured()) return NextResponse.json({ error: "Koneksi Meta belum tersedia di server." }, { status: 503 })
  const editorial = item.editorial_meta || {}
  if (editorial.fact_check_status !== "VERIFIED" || editorial.rights_status !== "CLEARED" || !item.source_url) {
    return NextResponse.json({ error: "Verifikasi fakta, sumber primer, dan hak pakai aset harus diselesaikan dan disimpan sebelum publikasi." }, { status: 409 })
  }
  if (!["DRAFT", "PENDING_REVIEW", "SCHEDULED"].includes(item.status)) return NextResponse.json({ error: "Status konten tidak dapat diterbitkan." }, { status: 409 })
  const assets = Array.isArray(item.assets) ? item.assets : []
  let urls: string[]
  try {
    urls = assets.map((asset: { url?: string; image_url?: string; video_url?: string }, i: number) => publicMediaUrl(item.format === "REEL" ? asset.video_url || asset.url : asset.url || asset.image_url, `Aset ${i + 1}`))
    if ((item.format === "CAROUSEL" && (urls.length < 2 || urls.length > 10)) || (item.format !== "CAROUSEL" && urls.length !== 1)) throw new Error(item.format === "CAROUSEL" ? "Carousel perlu 2–10 URL gambar publik." : "Format ini perlu tepat satu URL media publik.")
    if (!String(item.caption || "").trim()) throw new Error("Caption harus diisi sebelum publikasi.")
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Aset tidak valid." }, { status: 400 }) }

  const token = crypto.randomUUID()
  const { data: claimed, error: claimError } = await admin.rpc("claim_stadione_ig_publish", { p_content_id: id, p_token: token })
  if (claimError) return NextResponse.json({ error: `Klaim publikasi gagal: ${claimError.message}` }, { status: 500 })
  if (!claimed) return NextResponse.json({ error: "Publikasi sedang berjalan atau sudah dikirim ke Meta. Muat ulang status sebelum melanjutkan." }, { status: 409 })
  const { data: attempt } = await admin.from("stadione_ig_publish_attempts").select("*").eq("content_id", id).single()
  if (!attempt) return NextResponse.json({ error: "Status publikasi tidak tersedia." }, { status: 500 })
  const { data: freshItem } = await admin.from("stadione_content_items").select("updated_at").eq("id", id).single()
  if (!freshItem || freshItem.updated_at !== item.updated_at) {
    await admin.from("stadione_ig_publish_attempts").update({ leased_until: null, lease_token: null }).eq("content_id", id).eq("lease_token", token)
    return NextResponse.json({ error: "Konten berubah saat publikasi dimulai. Muat ulang dan periksa kembali sebelum melanjutkan." }, { status: 409 })
  }
  const save = async (fields: Record<string, unknown>) => {
    const { error } = await admin.from("stadione_ig_publish_attempts").update({ ...fields, updated_at: new Date().toISOString() }).eq("content_id", id).eq("lease_token", token).select("content_id").single()
    if (error) throw error
  }
  const heartbeat = () => save({ leased_until: new Date(Date.now() + 90_000).toISOString() })
  let state: Attempt = attempt
  let publishSent = false
  try {
    const caption = `${item.caption.trim()}${(item.hashtags || []).length ? `\n\n${item.hashtags.map((tag: string) => `#${tag.replace(/^#/, "")}`).join(" ")}` : ""}`
    if (item.format === "CAROUSEL") {
      for (let index = state.child_ids.length; index < urls.length; index++) {
        await heartbeat()
        const child = await createImage(urls[index], true)
        state = { ...state, child_ids: [...state.child_ids, child] }
        await save({ child_ids: state.child_ids, state: "PROCESSING", error_message: null })
      }
      for (const child of state.child_ids) {
        await heartbeat()
        const status = await containerStatus(child)
        if (status === "ERROR" || status === "EXPIRED") throw new Error(`Kontainer gambar ${child} berstatus ${status}.`)
        if (status !== "FINISHED") { await save({ state: "PROCESSING", leased_until: null, lease_token: null }); return NextResponse.json({ state: "PROCESSING", message: "Gambar sedang diproses Meta. Klik Lanjutkan publikasi beberapa saat lagi." }, { status: 202 }) }
      }
    }
    if (!state.creation_id) {
      await heartbeat()
      const creationId = item.format === "CAROUSEL" ? await createCarousel(state.child_ids, caption) : item.format === "REEL" ? await createReel(urls[0], caption) : await createImage(urls[0], false, caption)
      state = { ...state, creation_id: creationId }
      await save({ creation_id: creationId, state: "PROCESSING", error_message: null })
    }
    await heartbeat()
    const status = await containerStatus(state.creation_id!)
    if (status === "ERROR" || status === "EXPIRED") throw new Error(`Kontainer ${state.creation_id} berstatus ${status}. Periksa URL dan format media.`)
    if (status !== "FINISHED") { await save({ state: "PROCESSING", leased_until: null, lease_token: null }); return NextResponse.json({ state: "PROCESSING", message: "Media sedang diproses Meta. Klik Lanjutkan publikasi beberapa saat lagi." }, { status: 202 }) }

    // Persist this transition before the non-idempotent publish request. A lost response requires human reconciliation.
    await save({ state: "PUBLISHING", leased_until: null, lease_token: null, error_message: null })
    publishSent = true
    const mediaId = await publishContainer(state.creation_id!)
    await admin.from("stadione_ig_publish_attempts").update({ state: "PUBLISHED", media_id: mediaId, updated_at: new Date().toISOString() }).eq("content_id", id)
    const { error: finishError } = await admin.from("stadione_content_items").update({ status: "PUBLISHED", external_post_id: mediaId, published_at: new Date().toISOString(), scheduled_at: null, publish_error: null }).eq("id", id)
    if (finishError) throw finishError
    await admin.from("stadione_content_activity").insert({ content_id: id, action: "publish_instagram", actor_id: actorId, from_status: item.status, to_status: "PUBLISHED", metadata: { media_id: mediaId, creation_id: state.creation_id } })
    return NextResponse.json({ state: "PUBLISHED", mediaId })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Meta API gagal."
    if (publishSent) {
      await admin.from("stadione_ig_publish_attempts").update({ state: "UNCERTAIN", error_message: message, leased_until: null, lease_token: null }).eq("content_id", id).eq("state", "PUBLISHING")
    } else await save({ state: "FAILED", error_message: message, leased_until: null, lease_token: null })
    await admin.from("stadione_content_items").update({ publish_error: message }).eq("id", id)
    return NextResponse.json({ error: message, state: publishSent ? "UNCERTAIN" : "FAILED", creationId: state.creation_id }, { status: 502 })
  }
}
