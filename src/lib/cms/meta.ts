import "server-only"

const graphVersion = "v25.0"
const graph = `https://graph.facebook.com/${graphVersion}`

export function metaConfigured() {
  return Boolean(process.env.META_ACCESS_TOKEN && process.env.INSTAGRAM_USER_ID && process.env.FACEBOOK_PAGE_ID)
}

export async function metaConnectionStatus() {
  if (!metaConfigured()) return { configured: false, connected: false, account: null }
  try {
    const { token, igId } = credentials()
    const url = new URL(`${graph}/${igId}`)
    url.searchParams.set("fields", "id,username")
    const response = await fetch(url, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store", signal: AbortSignal.timeout(6000) })
    const result = await response.json() as { id?: string; username?: string }
    return { configured: true, connected: response.ok && result.id === igId, account: response.ok ? result.username || null : null }
  } catch { return { configured: true, connected: false, account: null } }
}

function credentials() {
  if (!metaConfigured()) throw new Error("Koneksi Meta belum dikonfigurasi di server.")
  return { token: process.env.META_ACCESS_TOKEN!, igId: process.env.INSTAGRAM_USER_ID! }
}

async function graphRequest(path: string, params?: Record<string, string>) {
  const { token } = credentials()
  const url = new URL(`${graph}/${path}`)
  if (!params) url.searchParams.set("fields", "id,status_code")
  const response = await fetch(url, {
    method: params ? "POST" : "GET",
    headers: { Authorization: `Bearer ${token}`, ...(params ? { "Content-Type": "application/x-www-form-urlencoded" } : {}) },
    body: params ? new URLSearchParams(params) : undefined,
    cache: "no-store",
    signal: AbortSignal.timeout(20000),
  })
  const result = await response.json().catch(() => ({})) as { id?: string; status_code?: string; error?: { message?: string; code?: number; error_subcode?: number } }
  if (!response.ok || result.error) throw new Error(`Meta API: ${result.error?.message || `HTTP ${response.status}`} (${result.error?.code || response.status}${result.error?.error_subcode ? `/${result.error.error_subcode}` : ""})`)
  return result
}

export function publicMediaUrl(value: unknown, label: string) {
  if (typeof value !== "string") throw new Error(`${label}: URL media publik wajib diisi.`)
  let url: URL
  try { url = new URL(value) } catch { throw new Error(`${label}: URL media tidak valid.`) }
  if (url.protocol !== "https:" || url.username || url.password || !url.hostname.includes(".") ||
    /^(localhost|.*\.localhost|.*\.local|.*\.internal|127\..*|10\..*|192\.168\..*|169\.254\..*)$/i.test(url.hostname)) {
    throw new Error(`${label}: gunakan URL HTTPS publik langsung ke berkas media.`)
  }
  return url.toString()
}

export async function createImage(url: string, carouselChild = false, caption?: string) {
  const { igId } = credentials()
  const result = await graphRequest(`${igId}/media`, { image_url: url, ...(carouselChild ? { is_carousel_item: "true" } : { caption: caption || "" }) })
  if (!result.id) throw new Error("Meta tidak mengembalikan ID kontainer gambar.")
  return result.id
}

export async function createReel(url: string, caption: string) {
  const { igId } = credentials()
  const result = await graphRequest(`${igId}/media`, { media_type: "REELS", video_url: url, caption, share_to_feed: "true" })
  if (!result.id) throw new Error("Meta tidak mengembalikan ID kontainer Reels.")
  return result.id
}

export async function createCarousel(children: string[], caption: string) {
  const { igId } = credentials()
  const result = await graphRequest(`${igId}/media`, { media_type: "CAROUSEL", children: children.join(","), caption })
  if (!result.id) throw new Error("Meta tidak mengembalikan ID kontainer carousel.")
  return result.id
}

export async function containerStatus(id: string) {
  return (await graphRequest(id)).status_code || "IN_PROGRESS"
}

export async function publishContainer(id: string) {
  const { igId } = credentials()
  const result = await graphRequest(`${igId}/media_publish`, { creation_id: id })
  if (!result.id) throw new Error("Meta tidak mengembalikan ID media yang diterbitkan.")
  return result.id
}
