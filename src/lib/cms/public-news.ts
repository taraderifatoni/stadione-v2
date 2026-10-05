import "server-only"

import { createAdminClient } from "@/lib/supabase/admin"

export type PublicArticle = {
  id: string
  title: string
  slug: string
  excerpt: string | null
  body: string | null
  category: string | null
  assets: Array<{ url?: string; image_url?: string; credit?: string }> | null
  published_at: string | null
}

const articleFields = "id,title,slug,excerpt,body,category,assets,published_at"

export async function getPublishedArticles(limit = 20) {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from("stadione_content_items")
    .select(articleFields)
    .eq("kind", "ARTICLE")
    .eq("status", "PUBLISHED")
    .not("slug", "is", null)
    .order("published_at", { ascending: false })
    .limit(limit)

  if (error) throw new Error("Berita belum dapat dimuat.")
  return (data || []) as PublicArticle[]
}

export async function getPublishedArticle(slug: string) {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from("stadione_content_items")
    .select(articleFields)
    .eq("kind", "ARTICLE")
    .eq("status", "PUBLISHED")
    .eq("slug", slug)
    .maybeSingle()

  if (error) throw new Error("Berita belum dapat dimuat.")
  return data as PublicArticle | null
}

export function articleImage(article: Pick<PublicArticle, "assets">) {
  const first = Array.isArray(article.assets) ? article.assets[0] : null
  const url = first?.url || first?.image_url || ""
  return /^https:\/\//.test(url) ? url : null
}

export function formatNewsDate(value: string | null) {
  if (!value) return ""
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  }).format(new Date(value))
}

function decodeEntities(value: string) {
  return value
    .replace(/&nbsp;|&#160;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
}

function plainText(value: string) {
  return decodeEntities(value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim())
}

export function articleBlocks(body: string | null) {
  if (!body) return []
  const safe = body.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, "")
  const blocks: Array<{ type: "heading" | "paragraph"; text: string }> = []
  for (const match of safe.matchAll(/<(h[2-4]|p)\b[^>]*>([\s\S]*?)<\/\1>/gi)) {
    const text = plainText(match[2])
    if (text) blocks.push({ type: match[1].toLowerCase().startsWith("h") ? "heading" : "paragraph", text })
  }
  if (blocks.length) return blocks
  return safe.split(/\n{2,}/).map(plainText).filter(Boolean).map((text) => ({ type: "paragraph" as const, text }))
}
