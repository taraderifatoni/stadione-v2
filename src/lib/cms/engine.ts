import { createHash } from "node:crypto"

export const ENGINE = "STADIONE_SPORTS_DESK_V2"
export type Source = { id: string; url: string; publisher_group?: string; primary: boolean; published_at: string; retrieved_at: string; text: string; sha256: string }
export type Claim = { id: string; text: string; verified: boolean; evidence: { source_id: string; quote: string }[] }
export type Slide = { role: string; headline: string; body: string; claim_ids: string[] }
export type Packet = { version: number; narrative_reviewed?: boolean; context?: Record<string,string>; event_status: string; event_at: string; assignment: { pillar: string; angle: string; why_now: string }; sources: Source[]; claims: Claim[]; slides: Slide[]; media: { url: string; type: string; credit: string; rights_evidence: string; scope: string; rights_status: string; transcript?: string; audio_rights?: string; scenes?: { start: number; end: number; text: string; claim_ids: string[] }[] }; }
type Item = { title?: string; caption?: string; format?: string; category?: string; assets?: Record<string, unknown>[]; editorial_meta?: Record<string, unknown> }
const domain = (url: string) => { try { return new URL(url).hostname.replace(/^www\./, "") } catch { return "" } }
export const packetDigest = (packet: unknown) => createHash("sha256").update(JSON.stringify(packet)).digest("hex")
const sha = (value: string) => createHash("sha256").update(value).digest("hex")
export function contentDigest(item: Item) {
  return sha(JSON.stringify([item.title, item.caption, item.format, item.category, item.assets, item.editorial_meta?.engine_packet]))
}
export function auditPacket(packet: Packet | undefined, format: string, now = Date.now()): string[] {
  const errors: string[] = []
  if (!packet || packet.version !== 2) return ["Lengkapi source packet versi 2 sebelum membuat media."]
  const sources = Array.isArray(packet.sources) ? packet.sources : []
  const verifiedSources = sources.filter(s => /^https:\/\//.test(s.url || "") && s.text?.length >= 80 && sha(s.text) === s.sha256 && !/pinterest|tiktok|google\./i.test(domain(s.url)))
  if (new Set(verifiedSources.map(s => domain(s.url))).size < 2) errors.push("Butuh dua domain penerbit independen dengan teks bukti lengkap; Pinterest/TikTok bukan bukti fakta.")
  if (new Set(verifiedSources.map(s=>s.publisher_group).filter(Boolean)).size < 2) errors.push("Identifikasi dua kelompok penerbit independen; salinan sindikasi tidak dihitung sebagai konfirmasi baru.")
  if (!packet.narrative_reviewed || !["who","what","when","where","why","how"].every(k=>(packet.context?.[k] || "").trim().length >= 3)) errors.push("Editor perlu audit alur 5W1H, kronologi, dan kesetiaan naskah kepada sumber.")
  if (!verifiedSources.some(s => s.primary)) errors.push("Konfirmasikan setidaknya satu sumber primer (federasi, klub, penyelenggara, atau pejabat resmi).")
  if (!packet.assignment?.pillar || !packet.assignment?.angle || (packet.assignment?.why_now || "").length < 20) errors.push("Lengkapi pilar, sudut pandang, dan alasan aktual sesuai matrix.")
  const dates = verifiedSources.map(s => Date.parse(s.published_at))
  if (!dates.some(d => Number.isFinite(d) && d <= now + 300000 && now - d <= 48 * 3600000)) errors.push("Belum ada tanggal sumber aktual yang terverifikasi dalam 48 jam terakhir.")
  const eventAt = Date.parse(packet.event_at)
  if (!Number.isFinite(eventAt) || !["PREVIEW", "LIVE", "FINAL", "RUMOR", "HISTORICAL"].includes(packet.event_status)) errors.push("Konfirmasikan tanggal dan status kejadian: preview/live/final/rumor/historical.")
  if (packet.event_status === "FINAL" && eventAt > now) errors.push("Hasil final dilarang untuk kejadian yang belum berlangsung.")
  if (packet.event_status === "LIVE" && now - eventAt > 2 * 3600000) errors.push("Snapshot live sudah lewat dua jam; perbarui status pertandingan.")
  const claims = Array.isArray(packet.claims) ? packet.claims : []
  if (!claims.length) errors.push("Claim ledger belum diisi.")
  for (const claim of claims) {
    const evidence = Array.isArray(claim.evidence) ? claim.evidence : []
    const matched = evidence.map(e => verifiedSources.find(s => s.id === e.source_id && e.quote?.length >= 20 && s.text.includes(e.quote))).filter(Boolean) as Source[]
    if (!claim.verified || !claim.text?.trim() || new Set(matched.map(s=>domain(s.url))).size < 2 || !matched.some(s=>s.primary)) errors.push(`Klaim ${claim.id}: butuh konfirmasi editor dan kutipan pendukung dari dua domain, termasuk primer.`)
  }
  const ledgerText = claims.map(c=>c.text).join(" ")
  const numericFacts = new Set(ledgerText.match(/\d+(?:[.,:]\d+)*/g) || [])
  const ids = new Set(claims.filter(c=>c.verified).map(c=>c.id))
  const slides = Array.isArray(packet.slides) ? packet.slides : []
  if (slides.length < 5 || slides.length > 10) errors.push("Carousel/story perlu 5–10 slide: hook, fakta, kronologi, konteks, pertanyaan penutup.")
  slides.forEach((s,i)=> {
    if ((`${s.headline} ${s.body}`.match(/\d+(?:[.,:]\d+)*/g) || []).some(n=>!numericFacts.has(n))) errors.push(`Slide ${i+1}: angka tidak tercantum dalam claim ledger.`)
    if (!s.headline?.trim() || s.headline.length > 96 || (s.body || "").length > 360) errors.push(`Slide ${i+1}: ringkas headline (96) dan isi (360), tanpa memotong fakta.`)
    if (!Array.isArray(s.claim_ids) || !s.claim_ids.length || s.claim_ids.some(id=>!ids.has(id))) errors.push(`Slide ${i+1}: petakan naskah ke claim ledger terverifikasi.`)
    if (/brief redaksi|belum untuk publikasi|mengejutkan dunia|tak disangka|unbelievable/i.test(`${s.headline} ${s.body}`)) errors.push(`Slide ${i+1}: gunakan bahasa olahraga langsung dan konkret, hapus template/clickbait.`)
  })
  const media = packet.media || {} as Packet["media"]
  if (!/^https:\/\//.test(media.url || "") || !media.credit || !media.rights_evidence || !media.scope || media.rights_status !== "CLEARED") errors.push("Catat URL media asli, kredit, bukti izin, dan cakupan hak publikasi.")
  if (format === "REEL") {
    if (media.type !== "video" || (media.transcript || "").length < 40 || media.audio_rights !== "CLEARED") errors.push("Reel perlu video asli, transkrip, dan hak audio; tidak ada fallback gambar statis.")
    const scenes = media.scenes || []
    if (scenes.length < 3 || scenes.length > 10) errors.push("Reel perlu 3–10 adegan dengan caption yang berubah.")
    scenes.forEach((s,i)=> { if (!Number.isFinite(s.start) || !Number.isFinite(s.end) || s.start < 0 || s.end <= s.start || s.end > 90 || !s.text || s.text.length > 120 || !s.claim_ids?.length || s.claim_ids.some(id=>!ids.has(id)) || (i>0 && s.start < scenes[i-1].end)) errors.push(`Adegan ${i+1}: periksa durasi, urutan, caption, dan sumber klaim.`) })
  } else if (media.type !== "image") errors.push("Feed perlu foto asli berizin yang sesuai kejadian.")
  return [...new Set(errors)]
}
export function enginePublicationIssues(item: Item, requireApproval = true) {
  const meta = item.editorial_meta || {}
  if (meta.standard !== ENGINE) return []
  const issues = auditPacket(meta.engine_packet as Packet, String(item.format))
  if (meta.rendered_packet_digest !== packetDigest(meta.engine_packet)) issues.push("Source packet berubah setelah render; buat preview baru.")
  if (meta.engine_state !== "READY_FOR_REVIEW" || (meta.render_audit as { ok?: boolean })?.ok !== true) issues.push("Media belum lolos pengukuran render; jalankan Buat preview engine.")
  const assets = item.assets || []
  if (String(item.format) === "CAROUSEL" && (assets.length < 5 || assets.length > 10)) issues.push("Render carousel harus menghasilkan 5–10 aset.")
  if (!item.caption?.trim() || /brief redaksi|belum untuk publikasi/i.test(item.caption)) issues.push("Caption belum menjadi naskah publikasi.")
  if (requireApproval && ((meta.engine_approval as { digest?: string; actor_id?: string })?.digest !== contentDigest(item) || !(meta.engine_approval as { actor_id?: string })?.actor_id)) issues.push("Editor harus menyetujui versi preview ini. Perubahan naskah/aset membatalkan persetujuan.")
  return issues
}
