import { createHash } from "node:crypto";

export const ENGINE = "STADIONE_SPORTS_DESK_V2";
export type Source = {
  id: string;
  url: string;
  publisher_group?: string;
  primary: boolean;
  published_at: string;
  retrieved_at: string;
  text: string;
  sha256: string;
};
export type Claim = {
  id: string;
  text: string;
  verified: boolean;
  evidence: { source_id: string; quote: string }[];
};
export type Slide = {
  role: string;
  headline: string;
  body: string;
  claim_ids: string[];
  layout?: "photo" | "full_text";
};
export type VideoSource = {
  id: string;
  platform: "PORTAL" | "YOUTUBE" | "TIKTOK" | "X" | "INSTAGRAM" | "OTHER";
  page_url: string;
  media_url: string;
  creator: string;
  published_at: string;
  transcript: string;
  credit: string;
  rights_status:
    | "OWNED"
    | "LICENSED"
    | "OFFICIAL_REUSE"
    | "EDITORIAL_REVIEW"
    | "EMBED_ONLY"
    | "BLOCKED";
  rights_evidence: string;
  scope: string;
  audio_rights: "CLEARED" | "PENDING" | "BLOCKED";
};
export type ReelScene = {
  source_id: string;
  source_start: number;
  source_end: number;
  text: string;
  claim_ids: string[];
};
export type Packet = {
  version: number;
  narrative_reviewed?: boolean;
  context?: Record<string, string>;
  event_status: string;
  event_at: string;
  assignment: { pillar: string; angle: string; why_now: string };
  sources: Source[];
  claims: Claim[];
  slides: Slide[];
  media: {
    url: string;
    type: string;
    credit: string;
    rights_evidence: string;
    scope: string;
    rights_status: string;
    video_sources?: VideoSource[];
    scenes?: ReelScene[];
  };
};
type Item = {
  title?: string;
  caption?: string;
  format?: string;
  category?: string;
  assets?: Record<string, unknown>[];
  editorial_meta?: Record<string, unknown>;
};
const domain = (url: string) => {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
};
// PostgreSQL jsonb reorders object keys; hashes must be invariant to key order.
export function canonicalJson(value: unknown): string {
  const sort = (v: unknown): unknown => {
    if (Array.isArray(v)) return v.map(sort);
    if (v && typeof v === "object") return Object.fromEntries(
      Object.entries(v as Record<string, unknown>)
        .filter(([, x]) => x !== undefined)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([k, x]) => [k, sort(x)]),
    );
    return v;
  };
  return JSON.stringify(sort(value));
}
export const packetDigest = (packet: unknown) =>
  createHash("sha256").update(canonicalJson(packet)).digest("hex");
const sha = (value: string) => createHash("sha256").update(value).digest("hex");
export function contentDigest(item: Item) {
  return sha(
    canonicalJson([
      item.title,
      item.caption,
      item.format,
      item.category,
      item.assets,
      item.editorial_meta?.engine_packet,
    ]),
  );
}
export function auditPacket(
  packet: Packet | undefined,
  format: string,
  now = Date.now(),
): string[] {
  const errors: string[] = [];
  if (!packet || packet.version !== 3)
    return [
      "Lengkapi source packet versi 3 untuk newsroom video multi-sumber.",
    ];
  const sources = Array.isArray(packet.sources) ? packet.sources : [];
  const verified = sources.filter(
    (s) =>
      /^https:\/\//.test(s.url || "") &&
      s.text?.length >= 80 &&
      sha(s.text) === s.sha256 &&
      !/pinterest|tiktok|google\./i.test(domain(s.url)),
  );
  if (new Set(verified.map((s) => domain(s.url))).size < 2)
    errors.push(
      "Butuh dua domain penerbit independen dengan teks bukti lengkap; media sosial bukan bukti fakta.",
    );
  if (new Set(verified.map((s) => s.publisher_group).filter(Boolean)).size < 2)
    errors.push(
      "Identifikasi dua kelompok penerbit independen; salinan sindikasi tidak dihitung.",
    );
  if (
    !packet.narrative_reviewed ||
    !["who", "what", "when", "where", "why", "how"].every(
      (k) => (packet.context?.[k] || "").trim().length >= 3,
    )
  )
    errors.push("Editor perlu audit 5W1H, kronologi, dan kesetiaan naskah.");
  if (!verified.some((s) => s.primary))
    errors.push("Konfirmasikan minimal satu sumber primer.");
  if (
    !packet.assignment?.pillar ||
    !packet.assignment?.angle ||
    (packet.assignment?.why_now || "").length < 20
  )
    errors.push("Lengkapi pilar, angle, dan alasan aktual.");
  if (
    !verified
      .map((s) => Date.parse(s.published_at))
      .some(
        (d) =>
          Number.isFinite(d) && d <= now + 300000 && now - d <= 48 * 3600000,
      )
  )
    errors.push("Belum ada sumber aktual terverifikasi dalam 48 jam.");
  const eventAt = Date.parse(packet.event_at);
  if (
    !Number.isFinite(eventAt) ||
    !["PREVIEW", "LIVE", "FINAL", "RUMOR", "HISTORICAL"].includes(
      packet.event_status,
    )
  )
    errors.push("Konfirmasikan tanggal dan status kejadian.");
  if (packet.event_status === "FINAL" && eventAt > now)
    errors.push("Hasil final dilarang untuk kejadian yang belum berlangsung.");
  const claims = Array.isArray(packet.claims) ? packet.claims : [];
  if (!claims.length) errors.push("Claim ledger belum diisi.");
  for (const claim of claims) {
    const matched = (claim.evidence || [])
      .map((e) =>
        verified.find(
          (s) =>
            s.id === e.source_id &&
            e.quote?.length >= 20 &&
            s.text.includes(e.quote),
        ),
      )
      .filter(Boolean) as Source[];
    if (
      !claim.verified ||
      !claim.text?.trim() ||
      new Set(matched.map((s) => domain(s.url))).size < 2 ||
      !matched.some((s) => s.primary)
    )
      errors.push(`Klaim ${claim.id}: butuh dua sumber termasuk primer.`);
  }
  const ids = new Set(claims.filter((c) => c.verified).map((c) => c.id)),
    numbers = new Set(
      claims
        .map((c) => c.text)
        .join(" ")
        .match(/\d+(?:[.,:]\d+)*/g) || [],
    );
  const slides = Array.isArray(packet.slides) ? packet.slides : [];
  if (slides.length < 5 || slides.length > 10)
    errors.push("Story perlu 5–10 bagian.");
  slides.forEach((s, i) => {
    if (
      (`${s.headline} ${s.body}`.match(/\d+(?:[.,:]\d+)*/g) || []).some(
        (n) => !numbers.has(n),
      )
    )
      errors.push(`Slide ${i + 1}: angka tidak ada di claim ledger.`);
    if (
      !s.headline?.trim() ||
      s.headline.length > 96 ||
      (s.body || "").length > (format === "CAROUSEL" ? 1200 : 360)
    )
      errors.push(`Slide ${i + 1}: teks melewati batas.`);
    if (!s.claim_ids?.length || s.claim_ids.some((id) => !ids.has(id)))
      errors.push(`Slide ${i + 1}: petakan ke klaim terverifikasi.`);
  });
  if (format === "REEL") {
    const clips = packet.media.video_sources || [],
      scenes = packet.media.scenes || [],
      clipIds = new Set(clips.map((c) => c.id));
    if (clips.length < 1)
      errors.push(
        "Reel perlu minimal satu video nyata dari portal/YouTube/TikTok/X/sumber resmi.",
      );
    clips.forEach((c, i) => {
      if (
        !c.id ||
        !/^https:\/\//.test(c.page_url) ||
        !/^https:\/\//.test(c.media_url) ||
        !c.creator ||
        !c.credit
      )
        errors.push(
          `Video sumber ${i + 1}: lengkapi URL halaman, URL media, kreator, dan kredit.`,
        );
      if (
        !["OWNED", "LICENSED", "OFFICIAL_REUSE"].includes(c.rights_status) ||
        !c.rights_evidence ||
        !c.scope
      )
        errors.push(`Video sumber ${i + 1}: hak penggunaan belum lolos.`);
      if (c.audio_rights !== "CLEARED")
        errors.push(`Video sumber ${i + 1}: hak audio belum lolos.`);
      if ((c.transcript || "").length < 40)
        errors.push(`Video sumber ${i + 1}: transkrip terlalu pendek.`);
    });
    if (scenes.length < 3 || scenes.length > 12)
      errors.push("Reel perlu 3–12 potongan dengan caption berubah.");
    scenes.forEach((s, i) => {
      if (
        !clipIds.has(s.source_id) ||
        !Number.isFinite(s.source_start) ||
        !Number.isFinite(s.source_end) ||
        s.source_start < 0 ||
        s.source_end <= s.source_start ||
        s.source_end - s.source_start > 20 ||
        !s.text ||
        s.text.length > 120 ||
        !s.claim_ids?.length ||
        s.claim_ids.some((id) => !ids.has(id))
      )
        errors.push(
          `Potongan ${i + 1}: periksa sumber, timestamp, caption, dan klaim.`,
        );
    });
    const total = scenes.reduce(
      (n, s) => n + (s.source_end - s.source_start),
      0,
    );
    if (total < 8 || total > 90)
      errors.push("Durasi montage Reel harus 8–90 detik.");
  } else {
    const m = packet.media;
    if (
      !/^https:\/\//.test(m.url || "") ||
      m.type !== "image" ||
      !m.credit ||
      !m.rights_evidence ||
      !m.scope ||
      m.rights_status !== "CLEARED"
    )
      errors.push("Feed perlu foto nyata berizin beserta kredit dan scope.");
  }
  return [...new Set(errors)];
}
export function enginePublicationIssues(item: Item, requireApproval = true) {
  const meta = item.editorial_meta || {};
  if (meta.standard !== ENGINE) return [];
  const issues = auditPacket(meta.engine_packet as Packet, String(item.format));
  if (meta.rendered_packet_digest !== packetDigest(meta.engine_packet))
    issues.push("Source packet berubah setelah render; buat preview baru.");
  if (
    meta.engine_state !== "READY_FOR_REVIEW" ||
    (meta.render_audit as { ok?: boolean })?.ok !== true
  )
    issues.push("Media belum lolos render.");
  const assets = item.assets || [];
  if (
    String(item.format) === "CAROUSEL" &&
    (assets.length < 5 || assets.length > 10)
  )
    issues.push("Carousel harus memiliki 5–10 aset.");
  if (
    !item.caption?.trim() ||
    /brief redaksi|belum untuk publikasi/i.test(item.caption)
  )
    issues.push("Caption belum siap publikasi.");
  if (
    requireApproval &&
    ((meta.engine_approval as { digest?: string; actor_id?: string })
      ?.digest !== contentDigest(item) ||
      !(meta.engine_approval as { actor_id?: string })?.actor_id)
  )
    issues.push(
      "Editor harus menyetujui versi ini; perubahan membatalkan approval.",
    );
  return issues;
}
