// One owner-approved contract shared by rendering, CMS and every publish path.
export const CAROUSEL_STYLE = "STADIONE_NEWSPAPER_COLLAGE_V1";
export const CAROUSEL_DESIGN_BRIEF =
  "Cover: foto atlet asli sebagai acuan; subjek menyatu dengan kolase stadion, sobekan koran hangat, charcoal dan merah Stadione #84102d; modern sans, judul compact, sumber singkat. Halaman berikutnya: artikel utuh, cream #eee9dd, teks-only, wrapping aman. Tanpa EDISI DIGITAL, footer promosi, template burgundy atau foto rectangle. Jangan mengarang identitas/fakta. Siapkan dan periksa cover editorial sebelum render; jangan fallback ke foto mentah.";
export type EditorialCover = {
  url: string;
  sha256: string;
  style_version: typeof CAROUSEL_STYLE;
  source_photo_url: string;
  headline: string;
  dek: string;
  source_label: string;
  reviewed_at: string;
  reviewed_by: string;
  safe_wrap: boolean;
  authentic_subject: boolean;
  editorial_background: boolean;
  no_edition_label: boolean;
  no_promotional_footer: boolean;
};
export const imageDigestValid = (s: unknown): s is string =>
  typeof s === "string" && /^[a-f0-9]{64}$/.test(s);
export function editorialCoverIssues(packet: {
  media: { url: string; editorial_cover?: EditorialCover };
  slides: { headline: string; body: string }[];
  sources: { primary: boolean; url: string }[];
}) {
  const c = packet.media?.editorial_cover;
  if (!c) return ["Siapkan cover kolase editorial sesuai gaya Stadione; foto mentah bukan cover siap publikasi."];
  let source = "";
  try { source = new URL(packet.sources.find(s => s.primary)?.url || packet.sources[0]?.url).hostname.replace(/^www\./, "").toUpperCase(); } catch { /* Source audit reports the invalid URL. */ }
  const ok = c.style_version === CAROUSEL_STYLE && /^https:\/\//.test(c.url || "") &&
    imageDigestValid(c.sha256) && c.source_photo_url === packet.media.url &&
    c.headline === packet.slides[0]?.headline && c.dek === packet.slides[0]?.body && c.source_label === source &&
    Number.isFinite(Date.parse(c.reviewed_at)) && !!c.reviewed_by?.trim() &&
    [c.safe_wrap, c.authentic_subject, c.editorial_background, c.no_edition_label, c.no_promotional_footer].every(v => v === true);
  return ok ? [] : ["Cover editorial berubah/belum diperiksa atau tidak sesuai foto, judul, naskah, sumber, dan gaya yang dikunci."];
}
export function carouselStyleIssues(assets: Record<string, unknown>[]) {
  if (assets.length < 5 || assets.length > 10) return ["Carousel koran memerlukan 5–10 halaman artikel."];
  const valid = assets.every((asset, i) => {
    const a = asset.render_audit as Record<string, unknown> | undefined;
    return a?.style_version === CAROUSEL_STYLE && a.width === 1080 && a.height === 1350 &&
      a.ok === true && a.safe_wrap === true && a.no_edition_label === true && a.no_promotional_footer === true &&
      imageDigestValid(a.output_sha256) && (i === 0 ?
        a.layout === "newspaper_collage_cover" && a.authentic_photo === true && a.editorial_background === true &&
        imageDigestValid(a.cover_input_sha256) && typeof a.source_label === "string" && !!a.source_label :
        a.layout === "newspaper_article" && a.paper_tone === "#eee9dd" && a.source_label === null &&
        typeof a.body_font_size === "number" && a.body_font_size >= 32 &&
        typeof a.body_height === "number" && a.body_height > 0);
  });
  return valid ? [] : ["Carousel belum memakai gaya koran/cover kolase yang dikunci. Render ulang melalui engine yang sama; template lama tidak boleh diterbitkan."];
}
