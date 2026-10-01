import "server-only"

import { createHash } from "node:crypto"
import { createAdminClient } from "@/lib/supabase/admin"
import type { EditorialCandidate } from "@/lib/cms/editorial"

const SEARCHAPI_URL = "https://www.searchapi.io/api/v1/search"
export const MONTHLY_SEARCH_LIMIT = 100
export const AUTOMATED_SEARCH_LIMIT = 93

type SearchEngine = "google_trends_trending_now" | "google_news" | "tiktok_search"

type DailyPool = {
  date: string
  fetchedAt: string
  sources: Record<SearchEngine, { cached: boolean; items: EditorialCandidate[] }>
}

type JsonRecord = Record<string, unknown>
const record = (value: unknown): JsonRecord => value && typeof value === "object" && !Array.isArray(value) ? value as JsonRecord : {}
const rows = (value: unknown): JsonRecord[] => Array.isArray(value) ? value.filter((item): item is JsonRecord => Boolean(item) && typeof item === "object" && !Array.isArray(item)) : []
const textValue = (value: unknown) => typeof value === "string" ? value : ""
const numberValue = (value: unknown) => typeof value === "number" ? value : Number(value || 0)

function jakartaDate(date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta", year: "numeric", month: "2-digit", day: "2-digit",
  }).format(date)
}

function monthStartIso() {
  const parts = jakartaDate().split("-")
  return `${parts[0]}-${parts[1]}-01T00:00:00+07:00`
}

function requestHash(engine: string, params: Record<string, string>) {
  return createHash("sha256").update(JSON.stringify([engine, Object.entries(params).sort()])).digest("hex")
}

async function usageCount() {
  const admin = createAdminClient()
  const { count } = await admin
    .from("stadione_api_usage")
    .select("id", { count: "exact", head: true })
    .eq("provider", "SEARCHAPI_IO")
    .gte("created_at", monthStartIso())
  return count || 0
}

async function cachedResult(key: string) {
  const admin = createAdminClient()
  const { data } = await admin
    .from("stadione_trend_snapshots")
    .select("payload,expires_at")
    .eq("cache_key", key)
    .gt("expires_at", new Date().toISOString())
    .maybeSingle()
  return data?.payload || null
}

async function saveCache(key: string, engine: SearchEngine, params: Record<string, string>, payload: unknown) {
  const admin = createAdminClient()
  const expiresAt = new Date(Date.now() + 26 * 60 * 60 * 1000).toISOString()
  await admin.from("stadione_trend_snapshots").upsert({
    cache_key: key,
    engine,
    query: params.q || params.category || "sports",
    payload,
    expires_at: expiresAt,
    updated_at: new Date().toISOString(),
  }, { onConflict: "cache_key" })
}

async function search(engine: SearchEngine, params: Record<string, string>) {
  const key = `${jakartaDate()}:${engine}:${requestHash(engine, params).slice(0, 16)}`
  const cached = await cachedResult(key)
  if (cached) return { payload: cached, cached: true }

  const used = await usageCount()
  if (used >= AUTOMATED_SEARCH_LIMIT) {
    throw new Error(`Batas aman SearchAPI bulan ini tercapai (${used}/${MONTHLY_SEARCH_LIMIT}).`)
  }

  const apiKey = process.env.SEARCHAPI_IO_KEY
  if (!apiKey) throw new Error("SEARCHAPI_IO_KEY belum dipasang di server Stadione.")

  const url = new URL(SEARCHAPI_URL)
  url.searchParams.set("engine", engine)
  Object.entries(params).forEach(([name, value]) => url.searchParams.set(name, value))
  const startedAt = Date.now()
  let success = false
  let statusCode = 0
  let payload: unknown = null
  let errorMessage: string | null = null

  try {
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${apiKey}`, Accept: "application/json" },
      cache: "no-store",
    })
    statusCode = response.status
    payload = await response.json()
    success = response.ok
    if (!response.ok) throw new Error(`SearchAPI ${engine} gagal (${response.status}).`)
    await saveCache(key, engine, params, payload)
    return { payload, cached: false }
  } catch (error) {
    errorMessage = error instanceof Error ? error.message : "SearchAPI gagal"
    throw error
  } finally {
    const admin = createAdminClient()
    await admin.from("stadione_api_usage").insert({
      provider: "SEARCHAPI_IO",
      engine,
      request_key: key,
      success,
      status_code: statusCode || null,
      duration_ms: Date.now() - startedAt,
      error_message: errorMessage,
    })
  }
}

function trendItems(payload: unknown): EditorialCandidate[] {
  return rows(record(payload).trends).slice(0, 12).map((item, index) => ({
    id: `trend-${index}-${textValue(item.query).slice(0, 30)}`,
    title: textValue(item.query).trim(),
    snippet: Array.isArray(item.trend_breakdown) ? item.trend_breakdown.map(textValue).filter(Boolean).join(", ") : null,
    source: "Google Trends",
    sourceUrl: null,
    imageUrl: null,
    engine: "google_trends_trending_now",
    metrics: { searchVolume: numberValue(item.search_volume), increase: numberValue(item.percentage_increase) },
  })).filter((item: EditorialCandidate) => item.title)
}

function newsItems(payload: unknown): EditorialCandidate[] {
  const source = record(payload)
  const newsRows = [...rows(source.top_stories), ...rows(source.organic_results)]
  const seen = new Set<string>()
  return newsRows.filter((item) => {
    const key = textValue(item.link) || textValue(item.title)
    if (!key || seen.has(key)) return false
    seen.add(key)
    return true
  }).slice(0, 15).map((item, index) => ({
    id: `news-${index}-${textValue(item.title).slice(0, 30)}`,
    title: textValue(item.title).trim(),
    snippet: textValue(item.snippet) || null,
    source: textValue(item.source) || "Google News",
    sourceUrl: textValue(item.link) || null,
    imageUrl: textValue(item.thumbnail) || null,
    publishedAt: textValue(item.date) || null,
    engine: "google_news",
  })).filter((item: EditorialCandidate) => item.title)
}

function tiktokItems(payload: unknown): EditorialCandidate[] {
  return rows(record(payload).videos).slice(0, 15).map((item, index) => {
    const author = record(item.author)
    return {
    id: `tiktok-${index}-${textValue(item.id)}`,
    title: (textValue(item.caption) || "Video olahraga TikTok").trim(),
    snippet: textValue(author.name) ? `Video oleh ${textValue(author.name)}` : null,
    source: textValue(author.username) ? `TikTok @${textValue(author.username)}` : "TikTok",
    sourceUrl: textValue(item.link) || null,
    imageUrl: textValue(item.thumbnail) || null,
    publishedAt: textValue(item.iso_date) || null,
    engine: "tiktok_search",
    metrics: { views: numberValue(item.views), likes: numberValue(item.likes), shares: numberValue(item.shares) },
  }}).filter((item: EditorialCandidate) => item.title)
}

export async function getSearchUsage() {
  return { used: await usageCount(), limit: MONTHLY_SEARCH_LIMIT, automatedLimit: AUTOMATED_SEARCH_LIMIT, configured: Boolean(process.env.SEARCHAPI_IO_KEY) }
}

export async function getDailySportsPool(): Promise<DailyPool> {
  const [trends, news, tiktok] = await Promise.all([
    search("google_trends_trending_now", { geo: "ID", time: "past_24_hours", category: "sports" }),
    search("google_news", { q: "olahraga Indonesia", gl: "id", hl: "id", time_period: "last_day", sort_by: "most_recent", link: "resolved" }),
    search("tiktok_search", { q: "olahraga indonesia", filter_by: "videos" }),
  ])

  return {
    date: jakartaDate(),
    fetchedAt: new Date().toISOString(),
    sources: {
      google_trends_trending_now: { cached: trends.cached, items: trendItems(trends.payload) },
      google_news: { cached: news.cached, items: newsItems(news.payload) },
      tiktok_search: { cached: tiktok.cached, items: tiktokItems(tiktok.payload) },
    },
  }
}
